from sqlalchemy.orm import Session
from app.audit.ledger import verify_audit_chain
from app.results.verification import verify_candidate_integrity, verify_evaluation_integrity
from app.models import (
    Candidate, AuditLog, IncidentReport, ExamState, ExamCenter, CenterAssignment,
    InstitutionKey, AuditNamespace, TenantSecurityViolation, SeatAssignment,
    ResultVersion, Result, ResultCertificate, Dispute, InstitutionReport, ReportSection,
    OpsIncident, DeploymentConfig, BackgroundJob, BackupManifest, AbuseEvent, RestoreDryRun,
    ThreatModel, SecurityIncident, AccessReviewCycle, SecurityHardeningCheck, ComplianceReport
)
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
    
    # 7. Evaluation & Marks Integrity (v0.5)
    eval_penalty = 0.0
    
    # Check missing written pages
    from app.models import WrittenBooklet, WrittenPage
    from app.written.page_ingestion import detect_missing_pages
    booklets = db.query(WrittenBooklet).filter(WrittenBooklet.exam_id == exam_id).all()
    missing_pages_count = 0
    for b in booklets:
        missing = detect_missing_pages(db, b.id)
        if missing:
            missing_pages_count += len(missing)
            critical_issues.append({
                "code": "WRITTEN_PAGE_MISSING",
                "message": f"Written booklet {b.id} has missing page numbers {missing}.",
                "details": f"Missing pages: {len(missing)}."
            })
    eval_penalty += missing_pages_count * 20.0
    
    # Check page hash mismatches
    from app.written.page_hashing import compute_booklet_hash
    for b in booklets:
        pages = db.query(WrittenPage).filter(WrittenPage.booklet_id == b.id).order_by(WrittenPage.page_number).all()
        page_hashes = [p.page_hash for p in pages if p.page_hash]
        if page_hashes:
            current_hash = compute_booklet_hash(page_hashes)
            if current_hash != b.booklet_hash and b.status == "LOCKED":
                eval_penalty += 40.0
                critical_issues.append({
                    "code": "WRITTEN_BOOKLET_HASH_MISMATCH",
                    "message": f"Written booklet {b.id} integrity verification failed: hash mismatch.",
                    "details": f"Stored: {b.booklet_hash[:16]}... Recalculated: {current_hash[:16]}..."
                })
                
    # Check evaluator unassigned copy access
    unauth_copy_access = sum(1 for l in logs if l.action == "UNAUTHORIZED_ACCESS_ATTEMPT" and l.resource_type == "AnonymousCopy")
    eval_penalty += unauth_copy_access * 25.0
    if unauth_copy_access > 0:
        critical_issues.append({
            "code": "EVALUATOR_UNAUTHORIZED_ACCESS",
            "message": f"Security warning: {unauth_copy_access} evaluator unauthorized accesses to unassigned copies detected.",
            "details": "Evaluator attempted to grade/view booklets not assigned to them."
        })
        
    # Check candidate identity exposed
    identity_exposed = sum(1 for l in logs if l.action == "IDENTITY_EXPOSED")
    eval_penalty += identity_exposed * 50.0
    if identity_exposed > 0:
        critical_issues.append({
            "code": "CANDIDATE_IDENTITY_EXPOSED",
            "message": f"Anonymity warning: {identity_exposed} candidate identity exposure events logged in ledger.",
            "details": "Candidate identity was exposed to evaluators."
        })
        
    # Check rubric edited after lock
    rubric_edit_after_lock = sum(1 for l in logs if l.action == "RUBRIC_EDIT_AFTER_LOCK")
    eval_penalty += rubric_edit_after_lock * 30.0
    if rubric_edit_after_lock > 0:
        critical_issues.append({
            "code": "RUBRIC_LOCK_VIOLATION",
            "message": f"Rubric warning: {rubric_edit_after_lock} rubric edits after lock detected.",
            "details": "Rubrics cannot be mutated after locking."
        })
        
    # Check marks changed after lock
    marks_edit_after_lock = sum(1 for l in logs if l.action == "MARKS_EDIT_AFTER_LOCK")
    eval_penalty += marks_edit_after_lock * 50.0
    if marks_edit_after_lock > 0:
        critical_issues.append({
            "code": "MARKS_LOCK_VIOLATION",
            "message": f"Marks tampering: {marks_edit_after_lock} locked marks edit attempts detected.",
            "details": "Marks locked cannot be changed."
        })
        
    # Check unresolved conflicts
    from app.models import EvaluationConflict, OMRManualReview
    open_conflicts = db.query(EvaluationConflict).filter(
        EvaluationConflict.status == "OPEN",
        EvaluationConflict.resolution_required == True
    ).all()
    eval_penalty += len(open_conflicts) * 20.0
    for c in open_conflicts:
        critical_issues.append({
            "code": f"CONFLICT_UNRESOLVED_{c.id}",
            "message": f"Unresolved evaluator conflict for copy {c.anonymous_id} on question {c.question_id}.",
            "details": f"Variance: {c.variance}. Evaluator A: {c.marks_a}, Evaluator B: {c.marks_b}."
        })
        
    # Check high variance conflicts
    high_variance_conflicts = db.query(EvaluationConflict).filter(
        EvaluationConflict.status == "SENIOR_REVIEW",
        EvaluationConflict.variance > 5.0
    ).all()
    eval_penalty += len(high_variance_conflicts) * 30.0
    for c in high_variance_conflicts:
        critical_issues.append({
            "code": f"CONFLICT_HIGH_VARIANCE_{c.id}",
            "message": f"High variance conflict (>5 marks) requiring senior review for copy {c.anonymous_id}.",
            "details": f"Variance: {c.variance}. Evaluator A: {c.marks_a}, Evaluator B: {c.marks_b}."
        })
        
    # Check OMR manual reviews pending
    pending_omr = db.query(OMRManualReview).filter(
        OMRManualReview.review_status == "PENDING"
    ).all()
    eval_penalty += len(pending_omr) * 10.0
    for r in pending_omr:
        critical_issues.append({
            "code": f"OMR_REVIEW_PENDING_{r.id}",
            "message": f"OMR manual review pending for scan {r.scan_id} question {r.question_no}.",
            "details": f"Confidence: {int(r.confidence * 100)}%."
        })
        
    # Check OMR review edited after lock
    omr_edit_after_lock = sum(1 for l in logs if l.action == "OMR_REVIEW_EDIT_AFTER_LOCK")
    eval_penalty += omr_edit_after_lock * 40.0
    if omr_edit_after_lock > 0:
        critical_issues.append({
            "code": "OMR_REVIEW_LOCK_VIOLATION",
            "message": f"OMR review warning: {omr_edit_after_lock} OMR reviews modified after lock.",
            "details": "OMR review decisions locked cannot be mutated."
        })
        
    # Check evaluator speed and conflict rate warnings
    from app.evaluation_analytics.service import get_all_evaluator_analytics
    try:
        eval_analytics = get_all_evaluator_analytics(db)
        susp_speed = 0
        abn_rate = 0
        for ev in eval_analytics:
            for w in ev["warnings"]:
                if w["code"] == "ABNORMAL_EVALUATION_SPEED":
                    susp_speed += 1
                elif w["code"] == "ABNORMAL_CONFLICT_RATE":
                    abn_rate += 1
        eval_penalty += susp_speed * 10.0
        if susp_speed > 0:
            warnings.append({
                "code": "ABNORMAL_EVALUATION_SPEED",
                "message": f"Performance alert: {susp_speed} evaluators checking booklets with abnormal speed.",
                "details": "Evaluators checking faster than 10 seconds per booklet."
            })
        if abn_rate > 0:
            warnings.append({
                "code": "ABNORMAL_CONFLICT_RATE",
                "message": f"Leniency alert: {abn_rate} evaluators with abnormal conflict rate (>30%).",
                "details": "Evaluators whose conflict rate exceeds 30% threshold."
            })
    except Exception as e:
        pass
        
    eval_penalty = min(75.0, eval_penalty)
    
    # 8. DisputeOps & Transparency (v0.6)
    from app.models import (
        ResultCertificate, EvidencePacket, EvidencePacketSection, 
        Dispute, DisputeEvent, ResultVersion, InstitutionReport, ReportSection, Result, CandidateAnswerEvent
    )
    from app.certificates.certificate_signer import verify_certificate_signature
    import json
    from app.security import calculate_sha256
    
    cert_sig_penalty = 0.0
    evidence_hash_penalty = 0.0
    version_hash_penalty = 0.0
    dispute_sig_penalty = 0.0
    update_reason_penalty = 0.0
    receipt_mismatch_penalty = 0.0
    cert_mismatch_penalty = 0.0
    report_hash_penalty = 0.0
    unresolved_dispute_penalty = 0.0
    gate_not_rerun_penalty = 0.0
    
    # 1. Invalid certificate signatures -> -50
    certs = db.query(ResultCertificate).filter(ResultCertificate.exam_id == exam_id).all()
    for cert in certs:
        payload = f"{cert.result_id}|{cert.candidate_anonymous_id}|{cert.exam_id}|{cert.result_hash}"
        recalc_hash = calculate_sha256(payload)
        if not verify_certificate_signature(recalc_hash, cert.signature):
            cert_sig_penalty += 50.0
            critical_issues.append({
                "code": "CERTIFICATE_SIGNATURE_INVALID",
                "message": f"Certificate signature verification failed for result certificate {cert.id}.",
                "details": f"Stored signature: {cert.signature[:16]}..."
            })
            
    # 2. Evidence packet hash mismatches -> -40
    packets = db.query(EvidencePacket).filter(EvidencePacket.exam_id == exam_id).all()
    for packet in packets:
        sections = db.query(EvidencePacketSection).filter(EvidencePacketSection.packet_id == packet.id).all()
        sections_map = {}
        for s in sections:
            sections_map[s.section_name] = json.loads(s.content)
        sections_str = json.dumps(sections_map, sort_keys=True)
        recalc_hash = calculate_sha256(sections_str)
        if recalc_hash != packet.packet_hash:
            evidence_hash_penalty += 40.0
            critical_issues.append({
                "code": "EVIDENCE_PACKET_HASH_MISMATCH",
                "message": f"Evidence packet hash integrity check failed for packet {packet.id}.",
                "details": f"Stored hash: {packet.packet_hash[:16]}... Recalculated: {recalc_hash[:16]}..."
            })
            
    # 3. Result versions lacking previous hashes -> -40
    versions = db.query(ResultVersion).join(Result).filter(Result.exam_id == exam_id).all()
    for v in versions:
        if v.version_number > 1 and not v.previous_result_hash:
            version_hash_penalty += 40.0
            critical_issues.append({
                "code": "RESULT_VERSION_PREVIOUS_HASH_MISSING",
                "message": f"Result version {v.version_number} of result {v.result_id} lacks a reference to the previous result hash.",
                "details": f"Version number: {v.version_number}."
            })
            
    # 4. Dispute decisions lacking officer signatures -> -30
    disputes = db.query(Dispute).filter(Dispute.exam_id == exam_id).all()
    for d in disputes:
        if d.status in ("RESOLVED_CONFIRMED", "RESOLVED_UPDATED", "REJECTED"):
            event = db.query(DisputeEvent).filter(
                DisputeEvent.dispute_id == d.id,
                DisputeEvent.action == "DECISION_RECORDED"
            ).first()
            if not event or "Signed:" not in event.notes or event.notes.endswith("Signed:"):
                dispute_sig_penalty += 30.0
                critical_issues.append({
                    "code": "DISPUTE_DECISION_SIGNATURE_MISSING",
                    "message": f"Dispute {d.id} finalized without a valid officer digital signature.",
                    "details": f"Status: {d.status}."
                })
                
    # 5. Results updated without linked disputes/reasons -> -50
    for v in versions:
        if v.version_number > 1 and (not v.linked_dispute_id or not v.change_reason or v.change_reason.strip() == ""):
            update_reason_penalty += 50.0
            critical_issues.append({
                "code": "RESULT_UPDATED_WITHOUT_DISPUTE_OR_REASON",
                "message": f"Result {v.result_id} was updated to version {v.version_number} without a linked dispute or reason.",
                "details": f"Changed by: {v.changed_by}."
            })
            
    # 6. Candidate receipt mismatches -> -35
    receipt_mismatches_log = sum(1 for l in logs if l.action == "CANDIDATE_RECEIPT_MISMATCH" or l.action == "RECEIPT_MISMATCH")
    receipt_mismatch_penalty += receipt_mismatches_log * 35.0
    for cand in candidates:
        latest_event = db.query(CandidateAnswerEvent).filter(
            CandidateAnswerEvent.candidate_id == cand.id
        ).order_by(CandidateAnswerEvent.created_at.desc()).first()
        session_digest = latest_event.current_event_hash if latest_event else calculate_sha256(f"EMPTY_SESSION_{cand.id}")
        recalc_receipt = calculate_sha256(f"{session_digest}|{cand.anonymous_id}")
        
        submit_log = db.query(AuditLog).filter(
            AuditLog.actor_id == cand.id,
            AuditLog.action == "ANSWER_SUBMITTED"
        ).first()
        if submit_log:
            try:
                payload = json.loads(submit_log.payload_hash) # AuditLog has payload_hash, but let's check both
            except Exception:
                pass
    if receipt_mismatch_penalty > 0:
        critical_issues.append({
            "code": "CANDIDATE_RECEIPT_HASH_MISMATCH",
            "message": "Candidate receipt hash mismatch detected in audit log.",
            "details": f"Count: {receipt_mismatches_log}"
        })
                
    # 7. Public certificate mismatches -> -25
    valid_certs = db.query(ResultCertificate).filter(
        ResultCertificate.exam_id == exam_id,
        ResultCertificate.status == "VALID"
    ).all()
    for cert in valid_certs:
        res = db.query(Result).filter(Result.id == cert.result_id).first()
        if res and res.result_hash != cert.result_hash:
            cert_mismatch_penalty += 25.0
            warnings.append({
                "code": "CERTIFICATE_RESULT_HASH_MISMATCH",
                "message": f"Public certificate {cert.id} result hash does not match current result hash.",
                "details": f"Cert: {cert.result_hash[:16]}... Current: {res.result_hash[:16]}..."
            })
            
    # 8. Audit report hash failures -> -40
    reports = db.query(InstitutionReport).filter(InstitutionReport.exam_id == exam_id).all()
    for rep in reports:
        sections = db.query(ReportSection).filter(ReportSection.report_id == rep.id).all()
        sections_map = {}
        for s in sections:
            sections_map[s.section_name] = json.loads(s.content)
        sections_str = json.dumps(sections_map, sort_keys=True)
        recalc_hash = calculate_sha256(sections_str)
        if recalc_hash != rep.report_hash or not verify_certificate_signature(recalc_hash, rep.signature):
            report_hash_penalty += 40.0
            critical_issues.append({
                "code": "REPORT_HASH_SIGNATURE_INVALID",
                "message": f"Audit report integrity check failed for report {rep.id}.",
                "details": f"Signature valid: {verify_certificate_signature(recalc_hash, rep.signature)}"
            })
            
    # 9. Unresolved disputes after deadline -> -10
    unresolved_disputes = db.query(Dispute).filter(
        Dispute.exam_id == exam_id,
        Dispute.status.in_(["SUBMITTED", "UNDER_REVIEW", "RECHECK_ASSIGNED", "RECHECK_IN_PROGRESS"])
    ).all()
    if unresolved_disputes:
        unresolved_dispute_penalty = 10.0 * len(unresolved_disputes)
        for d in unresolved_disputes:
            warnings.append({
                "code": "UNRESOLVED_DISPUTE",
                "message": f"Dispute {d.id} remains unresolved.",
                "details": f"Type: {d.dispute_type}. Status: {d.status}."
            })
            
    # 10. Marks changed but gate not rerun -> -50
    gate_log = db.query(AuditLog).filter(
        AuditLog.action == "PUBLICATION_GATE_CHECK"
    ).order_by(AuditLog.created_at.desc()).first()
    if gate_log:
        new_versions = db.query(ResultVersion).join(Result).filter(
            Result.exam_id == exam_id,
            ResultVersion.created_at > gate_log.created_at
        ).count()
        if new_versions > 0:
            gate_not_rerun_penalty += 50.0
            critical_issues.append({
                "code": "MARKS_CHANGED_GATE_NOT_RERUN",
                "message": f"Result marks were modified after the last publication gate verification.",
                "details": f"Modified versions count: {new_versions}."
            })

    # === Version 0.7 Multi-Tenant & Institution penalties ===
    tenant_violation_penalty = 0.0
    policy_edit_penalty = 0.0
    missing_policy_penalty = 0.0
    suspended_center_penalty = 0.0
    capacity_exceeded_penalty = 0.0
    missing_key_penalty = 0.0
    revoked_key_penalty = 0.0
    missing_namespace_penalty = 0.0
    invalid_namespace_penalty = 0.0

    # === Version 0.8: DeploymentOps & Reliability Upgrade ===
    db_migration_penalty = 0.0
    redis_lock_penalty = 0.0
    job_failed_penalty = 0.0
    storage_hash_penalty = 0.0
    audit_write_penalty = 0.0
    backup_verify_penalty = 0.0
    worker_queue_penalty = 0.0
    health_degraded_penalty = 0.0
    abuse_spike_penalty = 0.0
    missing_secret_penalty = 0.0
    storage_unavail_penalty = 0.0
    restore_fail_penalty = 0.0

    # === Version 0.9: SecurityHardening & Compliance Upgrade ===
    unmitigated_critical_threat_penalty = 0.0
    pii_unsafe_export_penalty = 0.0
    unapproved_privileged_action_penalty = 0.0
    compromised_key_penalty = 0.0
    incomplete_access_review_penalty = 0.0
    legal_hold_deletion_attempt_penalty = 0.0
    unresolved_p0_security_incident_penalty = 0.0
    unsafe_upload_accepted_penalty = 0.0
    missing_security_headers_penalty = 0.0
    unresolved_cross_tenant_incident_penalty = 0.0
    compliance_report_failed_penalty = 0.0

    exam_state = db.query(ExamState).filter(ExamState.exam_id == exam_id).first()
    inst_id = exam_state.institution_id if exam_state else None

    # Only apply Version 0.7 rules if we have a real non-default institution
    if inst_id and inst_id != "INS-GENESIS":
        # 1. Exam run without policy -> -30
        if not exam_state or not exam_state.policy_id:
            missing_policy_penalty = 30.0
            critical_issues.append({
                "code": "MISSING_EXAM_POLICY",
                "message": "Exam run without an active institution policy.",
                "details": "No policy applied in ExamState."
            })

        # 2. Cross-tenant access attempt -> -50
        violations = db.query(TenantSecurityViolation).filter(
            TenantSecurityViolation.institution_id == inst_id
        ).count()
        if violations > 0:
            tenant_violation_penalty = 50.0
            critical_issues.append({
                "code": "TENANT_BOUNDARY_VIOLATION",
                "message": "Tenant security boundary violations detected.",
                "details": f"Total violations: {violations}."
            })

        # 3. Suspended center assigned to exam -> -40
        center_assignments = db.query(CenterAssignment).filter(CenterAssignment.exam_id == exam_id).all()
        for ca in center_assignments:
            center = db.query(ExamCenter).filter(ExamCenter.id == ca.center_id).first()
            if center and center.status in ["SUSPENDED", "BLACKLISTED"]:
                suspended_center_penalty = 40.0
                critical_issues.append({
                    "code": "SUSPENDED_CENTER_ASSIGNED",
                    "message": f"Suspended center {center.name} is assigned to this exam.",
                    "details": f"Center ID: {center.id}. Status: {center.status}."
                })

        # 4. Center capacity exceeded -> -20
        for ca in center_assignments:
            center = db.query(ExamCenter).filter(ExamCenter.id == ca.center_id).first()
            if center:
                assigned_seats = db.query(SeatAssignment).filter(
                    SeatAssignment.center_id == center.id,
                    SeatAssignment.exam_id == exam_id
                ).count()
                if assigned_seats > center.capacity:
                    capacity_exceeded_penalty = 20.0
                    warnings.append({
                        "code": "CENTER_CAPACITY_EXCEEDED",
                        "message": f"Center {center.name} capacity exceeded.",
                        "details": f"Assigned: {assigned_seats}. Max capacity: {center.capacity}."
                    })

        # 5. Institution key missing -> -50
        key_count = db.query(InstitutionKey).filter(
            InstitutionKey.institution_id == inst_id,
            InstitutionKey.status == "ACTIVE"
        ).count()
        if key_count == 0:
            missing_key_penalty = 50.0
            critical_issues.append({
                "code": "INSTITUTION_KEY_MISSING",
                "message": "Institution signing keyspace is not initialized.",
                "details": "No active signing keys found."
            })

        # 6. Revoked key used for signing -> -50
        revoked_keys = db.query(InstitutionKey).filter(
            InstitutionKey.institution_id == inst_id,
            InstitutionKey.status == "REVOKED"
        ).count()
        if revoked_keys > 0:
            revoked_key_penalty = 50.0
            critical_issues.append({
                "code": "REVOKED_KEY_DETECTED",
                "message": "Revoked keys detected in institution keyspace.",
                "details": f"Revoked keys count: {revoked_keys}."
            })

        # 7. Tenant audit namespace invalid -> -50
        ns = db.query(AuditNamespace).filter(AuditNamespace.institution_id == inst_id).first()
        if ns and ns.status != "VALID":
            invalid_namespace_penalty = 50.0
            critical_issues.append({
                "code": "INVALID_AUDIT_NAMESPACE",
                "message": "Institution audit namespace status is INVALID.",
                "details": "Namespace validation failed."
            })


        # ==========================================
        # Version 0.8: DeploymentOps & Reliability Upgrade
        # ==========================================
        db_migration_penalty = 0.0
        redis_lock_penalty = 0.0
        job_failed_penalty = 0.0
        storage_hash_penalty = 0.0
        audit_write_penalty = 0.0
        backup_verify_penalty = 0.0
        worker_queue_penalty = 0.0
        health_degraded_penalty = 0.0
        abuse_spike_penalty = 0.0
        missing_secret_penalty = 0.0
        storage_unavail_penalty = 0.0
        restore_fail_penalty = 0.0

        if inst_id and inst_id != "INS-GENESIS":
            # 1. DB Migration check (verify if migration status is current)
            from app.db.migrations import check_migrations_current
            if not check_migrations_current():
                db_migration_penalty = 50.0
                critical_issues.append({
                    "code": "DB_MIGRATION_MISMATCH",
                    "message": "Database migration schema mismatch detected.",
                    "details": "Schema state is out of sync."
                })

            # 2. Redis lock unavailable during package release (incident type REDIS_LOCK_FAILURE)
            redis_incidents = db.query(OpsIncident).filter(
                OpsIncident.incident_type == "REDIS_LOCK_FAILURE",
                OpsIncident.status == "OPEN"
            ).count()
            if redis_incidents > 0:
                redis_lock_penalty = 40.0
                critical_issues.append({
                    "code": "REDIS_LOCK_UNAVAILABLE",
                    "message": "Redis lock layer was unavailable during package release.",
                    "details": f"Active failures: {redis_incidents}."
                })

            # 3. Background job failed (job status is FAILED)
            failed_jobs = db.query(BackgroundJob).filter(
                BackgroundJob.institution_id == inst_id,
                BackgroundJob.status == "FAILED"
            ).count()
            if failed_jobs > 0:
                job_failed_penalty = 25.0
                critical_issues.append({
                    "code": "BACKGROUND_JOB_FAILED",
                    "message": "Background job failed for a critical task.",
                    "details": f"Failed jobs: {failed_jobs}."
                })

            # 4. Storage object hash mismatch (incident type STORAGE_HASH_MISMATCH)
            storage_hash_incidents = db.query(OpsIncident).filter(
                OpsIncident.incident_type == "STORAGE_HASH_MISMATCH",
                OpsIncident.status == "OPEN"
            ).count()
            if storage_hash_incidents > 0:
                storage_hash_penalty = 50.0
                critical_issues.append({
                    "code": "STORAGE_OBJECT_HASH_MISMATCH",
                    "message": "Storage object hash mismatch detected.",
                    "details": f"Active incidents: {storage_hash_incidents}."
                })

            # 5. Audit write failure (incident type AUDIT_WRITE_FAILURE)
            audit_write_incidents = db.query(OpsIncident).filter(
                OpsIncident.incident_type == "AUDIT_WRITE_FAILURE",
                OpsIncident.status == "OPEN"
            ).count()
            if audit_write_incidents > 0:
                audit_write_penalty = 50.0
                critical_issues.append({
                    "code": "AUDIT_WRITE_FAILURE",
                    "message": "Audit log write failure detected.",
                    "details": f"Active incidents: {audit_write_incidents}."
                })

            # 6. Backup verification failed (backup status is FAILED)
            failed_backups = db.query(BackupManifest).filter(
                BackupManifest.institution_id == inst_id,
                BackupManifest.status == "FAILED"
            ).count()
            if failed_backups > 0:
                backup_verify_penalty = 35.0
                critical_issues.append({
                    "code": "BACKUP_VERIFICATION_FAILED",
                    "message": "Backup verification failed.",
                    "details": f"Failed manifests: {failed_backups}."
                })

            # 7. Worker queue stuck (config worker_queue_stuck == True)
            queue_config = db.query(DeploymentConfig).filter(DeploymentConfig.config_key == "worker_queue_stuck").first()
            if queue_config and queue_config.config_value == "True":
                worker_queue_penalty = 20.0
                critical_issues.append({
                    "code": "WORKER_QUEUE_STUCK",
                    "message": "Background job worker queue is stuck.",
                    "details": "Queue health degraded."
                })

            # 8. Health check degraded during exam
            health_incidents = db.query(OpsIncident).filter(
                OpsIncident.incident_type == "HEALTH_DEGRADED",
                OpsIncident.status == "OPEN"
            ).count()
            if health_incidents > 0:
                health_degraded_penalty = 20.0
                critical_issues.append({
                    "code": "HEALTH_DEGRADED_DURING_EXAM",
                    "message": "System health check degraded during active examination.",
                    "details": "Component outages reported."
                })

            # 9. Rate limit abuse spike (AbuseEvent count in last 1 hour)
            abuse_spikes = db.query(AbuseEvent).count()
            if abuse_spikes > 0:
                abuse_spike_penalty = 10.0
                warnings.append({
                    "code": "RATE_LIMIT_ABUSE_SPIKE",
                    "message": "Abuse events detected on public endpoints.",
                    "details": f"Abuse alerts triggered: {abuse_spikes}."
                })

            # 10. Production secret missing (DeploymentConfig missing or placeholder value)
            missing_sec = db.query(DeploymentConfig).filter(
                DeploymentConfig.config_key == "production_secret_missing",
                DeploymentConfig.config_value == "True"
            ).first()
            if missing_sec:
                missing_secret_penalty = 50.0
                critical_issues.append({
                    "code": "PRODUCTION_SECRET_MISSING",
                    "message": "Critical production security secrets are missing from environment.",
                    "details": "System running on default development placeholders."
                })

            # 11. Object storage unavailable (incident type STORAGE_UNAVAILABLE)
            storage_unavail_incidents = db.query(OpsIncident).filter(
                OpsIncident.incident_type == "STORAGE_UNAVAILABLE",
                OpsIncident.status == "OPEN"
            ).count()
            if storage_unavail_incidents > 0:
                storage_unavail_penalty = 30.0
                critical_issues.append({
                    "code": "OBJECT_STORAGE_UNAVAILABLE",
                    "message": "Object storage backend is unavailable.",
                    "details": "Failed to connect to MinIO/S3."
                })

            # 12. Restore dry-run failed (RestoreDryRun status is FAILED)
            failed_restores = db.query(RestoreDryRun).filter(RestoreDryRun.status == "FAILED").count()
            if failed_restores > 0:
                restore_fail_penalty = 35.0
                critical_issues.append({
                    "code": "RESTORE_DRY_RUN_FAILED",
                    "message": "Backup restore dry-run validation failed.",
                    "details": f"Failed dry-runs: {failed_restores}."
                })

            # === Version 0.9 Security & Compliance Penalties ===
            # 1. Unmitigated critical threats -> -50
            unmitigated_threats_count = db.query(ThreatModel).filter(
                ThreatModel.institution_id == inst_id,
                ThreatModel.impact == "CRITICAL",
                ThreatModel.status != "MITIGATED"
            ).count()
            if unmitigated_threats_count > 0:
                unmitigated_critical_threat_penalty = 50.0
                critical_issues.append({
                    "code": "UNMITIGATED_CRITICAL_THREAT",
                    "message": "Threat model contains unmitigated critical threats.",
                    "details": f"Unmitigated critical threats: {unmitigated_threats_count}."
                })

            # 2. PII export without redaction -> -50
            pii_export_incidents = db.query(SecurityIncident).filter(
                SecurityIncident.institution_id == inst_id,
                SecurityIncident.incident_type == "PII_EXPORT_ATTEMPT"
            ).count()
            if pii_export_incidents > 0:
                pii_unsafe_export_penalty = 50.0
                critical_issues.append({
                    "code": "UNSAFE_PII_EXPORT",
                    "message": "Unsafe PII export attempts detected.",
                    "details": f"Export violations: {pii_export_incidents}."
                })

            # 3. Privileged action without approval -> -50
            unapproved_violations = db.query(TenantSecurityViolation).filter(
                TenantSecurityViolation.institution_id == inst_id,
                TenantSecurityViolation.violation_type.like("%UNAPPROVED%")
            ).count()
            if unapproved_violations > 0:
                unapproved_privileged_action_penalty = 50.0
                critical_issues.append({
                    "code": "UNAPPROVED_PRIVILEGED_ACTION",
                    "message": "Privileged actions executed without approvals.",
                    "details": f"Unapproved actions: {unapproved_violations}."
                })

            # 4. Key marked compromised -> -60
            compromised_keys_count = db.query(InstitutionKey).filter(
                InstitutionKey.institution_id == inst_id,
                InstitutionKey.status == "COMPROMISED"
            ).count()
            if compromised_keys_count > 0:
                compromised_key_penalty = 60.0
                critical_issues.append({
                    "code": "COMPROMISED_SIGNING_KEY",
                    "message": "Active certificate signing key is marked COMPROMISED.",
                    "details": "Signing operations blocked."
                })

            # 5. Incomplete access review for high-risk exam -> -25
            incomplete_reviews = db.query(AccessReviewCycle).filter(
                AccessReviewCycle.institution_id == inst_id,
                AccessReviewCycle.status == "OPEN"
            ).count()
            if incomplete_reviews > 0:
                incomplete_access_review_penalty = 25.0
                critical_issues.append({
                    "code": "ACCESS_REVIEW_INCOMPLETE",
                    "message": "Privileged user access review cycle is incomplete.",
                    "details": "Active cycles found: 1."
                })

            # 6. Legal hold deletion attempt -> -40
            deletion_holds = db.query(TenantSecurityViolation).filter(
                TenantSecurityViolation.institution_id == inst_id,
                TenantSecurityViolation.violation_type == "LEGAL_HOLD_DELETION_ATTEMPT"
            ).count()
            if deletion_holds > 0:
                legal_hold_deletion_attempt_penalty = 40.0
                critical_issues.append({
                    "code": "LEGAL_HOLD_DELETION_ATTEMPT",
                    "message": "Unauthorized attempt to delete records under active Legal Hold.",
                    "details": f"Attempts: {deletion_holds}."
                })

            # 7. Security incident unresolved P0 -> -50
            unresolved_p0s = db.query(SecurityIncident).filter(
                SecurityIncident.institution_id == inst_id,
                SecurityIncident.severity == "P0",
                SecurityIncident.status != "RESOLVED"
            ).count()
            if unresolved_p0s > 0:
                unresolved_p0_security_incident_penalty = 50.0
                critical_issues.append({
                    "code": "UNRESOLVED_P0_SECURITY_INCIDENT",
                    "message": "Unresolved P0 platform security incidents active.",
                    "details": f"Active P0 incidents: {unresolved_p0s}."
                })

            # 8. Unsafe upload accepted -> -35
            unsafe_uploads = db.query(SecurityIncident).filter(
                SecurityIncident.institution_id == inst_id,
                SecurityIncident.incident_type == "MALICIOUS_FILE_UPLOAD"
            ).count()
            if unsafe_uploads > 0:
                unsafe_upload_accepted_penalty = 35.0
                critical_issues.append({
                    "code": "UNSAFE_UPLOAD_ACCEPTED",
                    "message": "Unsafe or malicious file upload attempt recorded.",
                    "details": f"Incidents: {unsafe_uploads}."
                })

            # 9. Missing security headers -> -15
            failing_headers = db.query(SecurityHardeningCheck).filter(
                SecurityHardeningCheck.institution_id == inst_id,
                SecurityHardeningCheck.check_type == "SECURE_HEADERS",
                SecurityHardeningCheck.status == "FAILED"
            ).count()
            if failing_headers > 0:
                missing_security_headers_penalty = 15.0
                warnings.append({
                    "code": "MISSING_SECURITY_HEADERS",
                    "message": "API server is missing recommended security headers.",
                    "details": "Failing checks: SECURE_HEADERS."
                })

            # 10. Cross-tenant violation unresolved -> -50
            cross_tenant_incidents = db.query(SecurityIncident).filter(
                SecurityIncident.institution_id == inst_id,
                SecurityIncident.incident_type == "CROSS_TENANT_VIOLATION",
                SecurityIncident.status != "RESOLVED"
            ).count()
            if cross_tenant_incidents > 0:
                unresolved_cross_tenant_incident_penalty = 50.0
                critical_issues.append({
                    "code": "UNRESOLVED_CROSS_TENANT_VIOLATION",
                    "message": "Unresolved cross-tenant database isolation violation incident exists.",
                    "details": f"Active violations: {cross_tenant_incidents}."
                })

            # 11. Compliance report readiness failed -> -40
            failing_compliance = db.query(ComplianceReport).filter(
                ComplianceReport.institution_id == inst_id,
                ComplianceReport.verdict == "FAIL"
            ).count()
            if failing_compliance > 0:
                compliance_report_failed_penalty = 40.0
                critical_issues.append({
                    "code": "COMPLIANCE_REPORT_FAILED",
                    "message": "Compliance report readiness verification failed.",
                    "details": f"Failed reports: {failing_compliance}."
                })

    # Calculate composite score
    total_penalty = (
        audit_penalty + candidate_penalty + conflict_penalty + omr_penalty + 
        anomaly_penalty + ops_penalty + eval_penalty +
        cert_sig_penalty + evidence_hash_penalty + version_hash_penalty + 
        dispute_sig_penalty + update_reason_penalty + receipt_mismatch_penalty + 
        cert_mismatch_penalty + report_hash_penalty + unresolved_dispute_penalty + 
        gate_not_rerun_penalty +
        tenant_violation_penalty + policy_edit_penalty + missing_policy_penalty +
        suspended_center_penalty + capacity_exceeded_penalty + missing_key_penalty +
        revoked_key_penalty + missing_namespace_penalty + invalid_namespace_penalty +
        db_migration_penalty + redis_lock_penalty + job_failed_penalty +
        storage_hash_penalty + audit_write_penalty + backup_verify_penalty +
        worker_queue_penalty + health_degraded_penalty + abuse_spike_penalty +
        missing_secret_penalty + storage_unavail_penalty + restore_fail_penalty +
        unmitigated_critical_threat_penalty + pii_unsafe_export_penalty +
        unapproved_privileged_action_penalty + compromised_key_penalty +
        incomplete_access_review_penalty + legal_hold_deletion_attempt_penalty +
        unresolved_p0_security_incident_penalty + unsafe_upload_accepted_penalty +
        missing_security_headers_penalty + unresolved_cross_tenant_incident_penalty +
        compliance_report_failed_penalty
    )

    composite_score = 100.0 - total_penalty
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
            "center_operations": ops_penalty,
            "evaluation_integrity": eval_penalty,
            "certificate_signatures": cert_sig_penalty,
            "evidence_hash_mismatch": evidence_hash_penalty,
            "version_missing_hash": version_hash_penalty,
            "dispute_signature_missing": dispute_sig_penalty,
            "unauthorized_result_update": update_reason_penalty,
            "candidate_receipt_mismatch": receipt_mismatch_penalty,
            "public_certificate_mismatch": cert_mismatch_penalty,
            "audit_report_failure": report_hash_penalty,
            "unresolved_disputes": unresolved_dispute_penalty,
            "marks_changed_gate_pending": gate_not_rerun_penalty,
            "tenant_boundary_violation": tenant_violation_penalty,
            "policy_edit": policy_edit_penalty,
            "missing_policy": missing_policy_penalty,
            "suspended_center": suspended_center_penalty,
            "capacity_exceeded": capacity_exceeded_penalty,
            "missing_key": missing_key_penalty,
            "revoked_key": revoked_key_penalty,
            "missing_namespace": missing_namespace_penalty,
            "invalid_namespace": invalid_namespace_penalty,
            
            # v0.8 penalties
            "db_migration_mismatch": db_migration_penalty,
            "redis_lock_unavailable": redis_lock_penalty,
            "background_job_failed": job_failed_penalty,
            "storage_object_hash_mismatch": storage_hash_penalty,
            "audit_write_failure": audit_write_penalty,
            "backup_verification_failed": backup_verify_penalty,
            "worker_queue_stuck": worker_queue_penalty,
            "health_degraded_during_exam": health_degraded_penalty,
            "rate_limit_abuse_spike": abuse_spike_penalty,
            "production_secret_missing": missing_secret_penalty,
            "object_storage_unavailable": storage_unavail_penalty,
            "restore_dry_run_failed": restore_fail_penalty,

            # v0.9 penalties
            "unmitigated_critical_threat": unmitigated_critical_threat_penalty,
            "pii_unsafe_export": pii_unsafe_export_penalty,
            "unapproved_privileged_action": unapproved_privileged_action_penalty,
            "compromised_signing_key": compromised_key_penalty,
            "access_review_incomplete": incomplete_access_review_penalty,
            "legal_hold_deletion_attempt": legal_hold_deletion_attempt_penalty,
            "unresolved_p0_security_incident": unresolved_p0_security_incident_penalty,
            "unsafe_upload_accepted": unsafe_upload_accepted_penalty,
            "missing_security_headers": missing_security_headers_penalty,
            "unresolved_cross_tenant_violation": unresolved_cross_tenant_incident_penalty,
            "compliance_report_failed": compliance_report_failed_penalty
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
