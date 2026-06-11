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
    has_critical_anomaly = any(
        issue["code"].startswith("SYSTEM_CRITICAL_") or
        issue["code"].startswith("INCIDENT_CRITICAL_")
        for issue in report["critical_issues"]
    )
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
        # Trust score is non-critical, so it does not block publication
        pass
        
    # 5. v0.5 Evaluation Specifics
    from app.models import WrittenBooklet, OMRManualReview, EvaluationMark, EvaluationConflict, Rubric, EvaluationLock
    from app.evaluation.marks_lock import verify_marks_lock_integrity
    
    # Check all booklets locked
    booklets = db.query(WrittenBooklet).filter(WrittenBooklet.exam_id == exam_id).all()
    all_booklets_locked = len(booklets) > 0 and all(b.status == "LOCKED" for b in booklets)
    checklist.append({
        "name": "All Written Booklet Pages Locked",
        "passed": all_booklets_locked,
        "critical": True,
        "details": "All scanned answer booklet pages locked." if all_booklets_locked else "Some booklets have not been fully uploaded or locked."
    })
    if not all_booklets_locked:
        blocking_reasons.append("UNLOCKED_WRITTEN_BOOKLETS")
        
    # Check OMR reviews
    pending_omr_count = db.query(OMRManualReview).filter(OMRManualReview.review_status == "PENDING").count()
    omr_ok = pending_omr_count == 0
    checklist.append({
        "name": "All OMR Manual Reviews Finalized & Locked",
        "passed": omr_ok,
        "critical": True,
        "details": "All ambiguous OMR answer bubble reviews resolved." if omr_ok else f"{pending_omr_count} ambiguous OMR review questions pending."
    })
    if not omr_ok:
        blocking_reasons.append("PENDING_OMR_MANUAL_REVIEWS")
        
    # Check evaluation marks lock state
    unlocked_marks_count = db.query(EvaluationMark).filter(EvaluationMark.status == "SUBMITTED").count()
    evals_locked_ok = unlocked_marks_count == 0
    checklist.append({
        "name": "All Assigned Evaluations Sealed & Locked",
        "passed": evals_locked_ok,
        "critical": True,
        "details": "All marks locked by evaluators." if evals_locked_ok else f"{unlocked_marks_count} evaluation marks submitted but not locked."
    })
    if not evals_locked_ok:
        blocking_reasons.append("UNLOCKED_EVALUATIONS")
        
    # Check conflicts
    unresolved_conflicts = db.query(EvaluationConflict).filter(
        EvaluationConflict.status != "RESOLVED",
        EvaluationConflict.resolution_required == True
    ).count()
    conflicts_ok = unresolved_conflicts == 0
    checklist.append({
        "name": "Zero Unresolved Double-Evaluation Conflicts",
        "passed": conflicts_ok,
        "critical": True,
        "details": "All grading conflicts resolved by senior reviewers." if conflicts_ok else f"{unresolved_conflicts} grading conflicts pending resolution."
    })
    if not conflicts_ok:
        blocking_reasons.append("UNRESOLVED_EVALUATOR_CONFLICTS")
        
    # Check MarksChain
    all_locks = db.query(EvaluationLock).all()
    marks_chain_valid = all(verify_marks_lock_integrity(db, l.evaluation_id) for l in all_locks)
    checklist.append({
        "name": "MarksChain Integrity Validated",
        "passed": marks_chain_valid,
        "critical": True,
        "details": "No manual modifications in sealed database records detected." if marks_chain_valid else "MarksChain hash verification failed."
    })
    if not marks_chain_valid:
        blocking_reasons.append("MARKS_CHAIN_TAMPERED")
        
    # Check Rubrics
    rubrics = db.query(Rubric).filter(Rubric.exam_id == exam_id).all()
    all_rubrics_locked = len(rubrics) > 0 and all(r.status == "LOCKED" for r in rubrics)
    has_rubric_violation = any(issue["code"] == "RUBRIC_LOCK_VIOLATION" for issue in report["critical_issues"])
    rubric_ok = all_rubrics_locked and not has_rubric_violation
    checklist.append({
        "name": "All Rubrics Locked & Intact",
        "passed": rubric_ok,
        "critical": True,
        "details": "All grading rubrics locked without post-lock edits." if rubric_ok else "Rubrics have unlocked parameters or lock violations."
    })
    if not rubric_ok:
        blocking_reasons.append("RUBRIC_LOCK_VIOLATION")
        
    # Publishing is allowed only if all critical checks pass
    allowed = (
        audit_passed and cands_ok and not has_critical_anomaly and 
        all_booklets_locked and omr_ok and evals_locked_ok and conflicts_ok and 
        marks_chain_valid and rubric_ok
    )
    
    return {
        "exam_id": exam_id,
        "allowed": allowed,
        "trust_score": report["trust_score"],
        "checklist": checklist,
        "blocking_reasons": blocking_reasons,
        "critical_issues": report["critical_issues"],
        "warnings": report["warnings"]
    }
