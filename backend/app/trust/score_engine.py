from sqlalchemy.orm import Session
from app.audit.ledger import verify_audit_chain
from app.results.verification import verify_candidate_integrity, verify_evaluation_integrity
from app.models import Candidate, AuditLog, IncidentReport
from app.risk.center_risk import (
    detect_evaluator_conflicts, 
    get_omr_scans_by_band, 
    scan_system_anomalies
)

def calculate_exam_trust_score(db: Session, exam_id: str) -> dict:
    """
    Computes a composite Trust/Integrity Score (0-100) for an exam
    by evaluating audit trails, grading conflicts, scan quality, system anomalies,
    and center operations indicators.
    """
    critical_issues = []
    warnings = []
    manual_reviews = []
    
    # 1. Audit Chain Health
    audit_penalty = 0.0
    chain_intact, failing_idx, chain_msg = verify_audit_chain(db)
    if not chain_intact:
        audit_penalty = 50.0
        critical_issues.append({
            "code": "AUDIT_LEDGER_BROKEN",
            "message": "The append-only audit trail integrity verification failed.",
            "details": chain_msg
        })
        
    # 2. Candidate Integrity Check
    candidate_penalty = 0.0
    candidates = db.query(Candidate).filter(Candidate.exam_id == exam_id).all()
    tampered_cands_count = 0
    
    for cand in candidates:
        ans_ok, ans_msg = verify_candidate_integrity(db, cand.id)
        eval_ok, eval_msg = verify_evaluation_integrity(db, cand.anonymous_id)
        
        if not ans_ok or not eval_ok:
            tampered_cands_count += 1
            if not ans_ok:
                critical_issues.append({
                    "code": "CANDIDATE_MCQ_TAMPERED",
                    "message": f"Candidate answer event hash chain broken for registration {cand.registration_number}.",
                    "details": ans_msg
                })
            if not eval_ok:
                critical_issues.append({
                    "code": "CANDIDATE_MARKS_TAMPERED",
                    "message": f"Evaluations signature mismatch for candidate anonymous ID {cand.anonymous_id}.",
                    "details": eval_msg
                })
                
    if tampered_cands_count > 0:
        candidate_penalty = min(30.0, tampered_cands_count * 15.0)
        
    # 3. Evaluator Conflicts
    conflicts = detect_evaluator_conflicts(db, exam_id)
    conflict_penalty = 0.0
    if conflicts:
        conflict_penalty = min(20.0, len(conflicts) * 5.0)
        for c in conflicts:
            warnings.append({
                "code": "EVALUATION_CONFLICT",
                "message": f"Grading discrepancy of {c['difference']} marks on question {c['question_id']} for candidate {c['candidate_anonymous_id']}.",
                "details": f"Evaluator A: {c['marks_1']} marks, Evaluator B: {c['marks_2']} marks."
            })
            manual_reviews.append({
                "type": "EVALUATOR_DISCREPANCY",
                "item_id": f"{c['candidate_anonymous_id']}-{c['question_id']}",
                "description": f"Resolve marks variance between evaluator {c['evaluator_1']} and {c['evaluator_2']}."
            })
            
    # 4. OMR Confidence Review Queue
    omr_report = get_omr_scans_by_band(db, exam_id)
    omr_penalty = 0.0
    low_conf_count = len(omr_report["MANUAL_REVIEW"])
    if low_conf_count > 0:
        omr_penalty = min(15.0, low_conf_count * 5.0)
        for s in omr_report["MANUAL_REVIEW"]:
            warnings.append({
                "code": "OMR_LOW_CONFIDENCE",
                "message": f"OMR sheet scan for candidate {s['candidate_anonymous_id']} has ambiguous bubble fillings or low scan confidence.",
                "details": f"Lowest confidence detected: {int(s['lowest_confidence'] * 100)}%. has_ambiguous: {s['has_ambiguous']}."
            })
            manual_reviews.append({
                "type": "OMR_BUBBLE_VERIFY",
                "item_id": s["scan_id"],
                "description": f"Manually verify OMR bubbles mapping for candidate {s['candidate_anonymous_id']}."
            })
            
    # 5. System anomalies
    anomalies = scan_system_anomalies(db, exam_id)
    anomaly_penalty = 0.0
    for a in anomalies:
        if a["severity"] == "CRITICAL":
            anomaly_penalty += 30.0
            critical_issues.append({
                "code": f"SYSTEM_CRITICAL_{a['type']}",
                "message": a["message"],
                "details": a.get("details", "")
            })
        else:
            anomaly_penalty += 10.0
            warnings.append({
                "code": f"SYSTEM_WARNING_{a['type']}",
                "message": a["message"],
                "details": a.get("details", "")
            })
            
    anomaly_penalty = min(60.0, anomaly_penalty)
    
    # 6. Center Operations & Incident Risks (v0.4)
    ops_penalty = 0.0
    
    # Check unresolved incidents
    open_incidents = db.query(IncidentReport).filter(IncidentReport.exam_id == exam_id, IncidentReport.status == "OPEN").all()
    for inc in open_incidents:
        if inc.severity == "P0_CRITICAL":
            ops_penalty += 50.0
            critical_issues.append({
                "code": f"INCIDENT_CRITICAL_{inc.incident_type}",
                "message": f"Unresolved P0 Critical incident reported: {inc.description}",
                "details": f"Reported at center {inc.center_id}."
            })
        elif inc.severity == "HIGH":
            ops_penalty += 15.0
            critical_issues.append({
                "code": f"INCIDENT_HIGH_{inc.incident_type}",
                "message": f"Unresolved High incident reported: {inc.description}",
                "details": f"Reported at center {inc.center_id}."
            })
        elif inc.severity == "MEDIUM":
            ops_penalty += 5.0
            warnings.append({
                "code": f"INCIDENT_MEDIUM_{inc.incident_type}",
                "message": f"Unresolved Medium incident reported: {inc.description}",
                "details": f"Reported at center {inc.center_id}."
            })
            
    # Scan Audit Ledger for specific operational threats
    logs = db.query(AuditLog).all()
    early_attempts = sum(1 for l in logs if l.action == "EARLY_PACKAGE_DECRYPTION_ATTEMPT")
    wrong_access = sum(1 for l in logs if l.action == "WRONG_CENTER_PACKAGE_ACCESS")
    unauth_seat = sum(1 for l in logs if l.action == "UNAUTHORIZED_SEAT_CHANGE")
    unauth_role = sum(1 for l in logs if l.action == "UNAUTHORIZED_ACCESS_ATTEMPT")
    sig_mismatch = sum(1 for l in logs if l.action == "ADMIT_CARD_SIGNATURE_MISMATCH")
    
    ops_penalty += (early_attempts * 40.0) + (wrong_access * 35.0) + (unauth_seat * 25.0) + (unauth_role * 10.0) + (sig_mismatch * 10.0)
    
    if early_attempts > 0:
        critical_issues.append({
            "code": "EARLY_PACKAGE_DECRYPTION",
            "message": f"Suspicious activity: {early_attempts} early package decryption attempts detected.",
            "details": "Time-lock release policies violated."
        })
    if wrong_access > 0:
        critical_issues.append({
            "code": "WRONG_CENTER_ACCESS",
            "message": f"Suspicious activity: {wrong_access} wrong center package accesses detected.",
            "details": "Authorized keys tried to open foreign packages."
        })
    if unauth_seat > 0:
        critical_issues.append({
            "code": "UNAUTHORIZED_SEAT_TAMPER",
            "message": f"Anomaly detected: {unauth_seat} unauthorized seat modifications after layout lock.",
            "details": "Post-session seat mapping edits detected in audit trail."
        })
    if unauth_role > 0:
        warnings.append({
            "code": "UNAUTHORIZED_API_ATTEMPT",
            "message": f"Access warnings: {unauth_role} unauthorized API guard denials registered in ledger.",
            "details": "Users attempted restricted role actions."
        })
    if sig_mismatch > 0:
        warnings.append({
            "code": "ADMIT_CARD_VERIFY_FAILURE",
            "message": f"Verification alert: {sig_mismatch} candidate admit card signature mismatches detected.",
            "details": "Check-in checks rejected forged card templates."
        })
        
    ops_penalty = min(75.0, ops_penalty)
    
    # Calculate composite score
    composite_score = 100.0 - (audit_penalty + candidate_penalty + conflict_penalty + omr_penalty + anomaly_penalty + ops_penalty)
    composite_score = max(0.0, min(100.0, composite_score))
    
    return {
        "exam_id": exam_id,
        "trust_score": composite_score,
        "audit_chain_intact": chain_intact,
        "penalties": {
            "audit_ledger": audit_penalty,
            "candidate_chains": candidate_penalty,
            "evaluator_conflicts": conflict_penalty,
            "omr_confidence": omr_penalty,
            "system_anomalies": anomaly_penalty,
            "center_operations": ops_penalty
        },
        "critical_issues": critical_issues,
        "warnings": warnings,
        "manual_reviews": manual_reviews,
        "stats": {
            "total_candidates": len(candidates),
            "tampered_candidates": tampered_cands_count,
            "grading_conflicts": len(conflicts),
            "omr_review_required": len(omr_report["MANUAL_REVIEW"]) + len(omr_report["LOW_CONFIDENCE"]),
            "system_anomalies_count": len(anomalies) + len(open_incidents) + early_attempts + wrong_access + unauth_seat
        }
    }
