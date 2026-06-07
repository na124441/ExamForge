from sqlalchemy.orm import Session
from app.trust.score_engine import calculate_exam_trust_score

def verify_publication_gate(db: Session, exam_id: str) -> dict:
    """
    Decoupled verification check list. Results publication is only allowed if:
    - Audit Ledger is intact (P0)
    - No direct database marks edits/tampering detected (P0)
    - No candidate MCQ answer chain broken (P0)
    - Composite trust score >= 90.0
    """
    report = calculate_exam_trust_score(db, exam_id)
    
    checklist = []
    blocking_reasons = []
    
    # 1. Audit Ledger
    audit_passed = report["audit_chain_intact"]
    checklist.append({
        "name": "Audit Ledger Integrity",
        "passed": audit_passed,
        "critical": True,
        "details": "Chained log hashes verified successfully." if audit_passed else "Audit trail chain is broken."
    })
    if not audit_passed:
        blocking_reasons.append("AUDIT_LEDGER_BROKEN")
        
    # 2. Candidate Chain Integrity
    cands_ok = report["stats"]["tampered_candidates"] == 0
    checklist.append({
        "name": "Candidate Session Chain Validation",
        "passed": cands_ok,
        "critical": True,
        "details": "All candidate answer events and evaluator marks match signature hashes." if cands_ok else f"{report['stats']['tampered_candidates']} candidates failed signature verification."
    })
    if not cands_ok:
        blocking_reasons.append("CANDIDATE_DATA_TAMPERED")
        
    # 3. Critical System Anomalies
    # Find if there are critical anomalies in critical issues
    has_critical_anomaly = any(issue["code"].startswith("SYSTEM_CRITICAL_") for issue in report["critical_issues"])
    checklist.append({
        "name": "Zero System Intrusion Signatures",
        "passed": not has_critical_anomaly,
        "critical": True,
        "details": "No system-level tamper signatures found." if not has_critical_anomaly else "Critical intrusion or package anomaly signature detected."
    })
    if has_critical_anomaly:
        blocking_reasons.append("SYSTEM_INTRUSION_DETECTED")
        
    # 4. Composite Trust Score
    score_passed = report["trust_score"] >= 90.0
    checklist.append({
        "name": "Composite Trust Score Threshold (>= 90/100)",
        "passed": score_passed,
        "critical": False,
        "details": f"Current Exam Integrity Trust Score is {report['trust_score']}/100."
    })
    if not score_passed:
        blocking_reasons.append("TRUST_SCORE_BELOW_THRESHOLD")
        
    # Publishing is allowed only if all critical checks pass and the trust score meets threshold
    allowed = (audit_passed and cands_ok and not has_critical_anomaly and score_passed)
    
    return {
        "exam_id": exam_id,
        "allowed": allowed,
        "trust_score": report["trust_score"],
        "checklist": checklist,
        "blocking_reasons": blocking_reasons,
        "critical_issues": report["critical_issues"],
        "warnings": report["warnings"]
    }
