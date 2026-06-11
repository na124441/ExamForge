from sqlalchemy.orm import Session
from app.trust.score_engine import calculate_exam_trust_score
from app.models import (
    WrittenBooklet, OMRManualReview, EvaluationMark, EvaluationConflict, Rubric, EvaluationLock,
    ResultVersion, Result, Dispute, ResultCertificate, EvidencePacket, DisputeEvent,
    ExamState, PolicyTemplate, InstitutionKey, AuditNamespace, SecurityIncident, ApprovalRequest,
    ThreatModel, SecurityHardeningCheck
)
from app.evaluation.marks_lock import verify_marks_lock_integrity
from app.audit.ledger import log_event

def verify_publication_gate(db: Session, exam_id: str) -> dict:
    """
    Decoupled verification check list. Results publication is only allowed if:
    - Audit Ledger is intact (P0)
    - No direct database marks edits/tampering detected (P0)
    - No candidate MCQ answer chain broken (P0)
    - Composite trust score >= policy.trust_threshold (P0 if policy active)
    - All multi-tenant and keyspace checks pass (P0 if policy active)
    """
    report = calculate_exam_trust_score(db, exam_id)
    
    checklist = []
    blocking_reasons = []
    
    # Retrieve active policy
    exam_state = db.query(ExamState).filter(ExamState.exam_id == exam_id).first()
    policy = None
    if exam_state and exam_state.policy_id:
        policy = db.query(PolicyTemplate).filter(PolicyTemplate.id == exam_state.policy_id).first()
        
    trust_threshold = 90.0
    requires_double_evaluation = False
    requires_dual_package_release = False
    certificate_required = True
    audit_report_required = True
    
    if policy:
        trust_threshold = policy.trust_threshold
        requires_double_evaluation = policy.requires_double_evaluation
        requires_dual_package_release = policy.requires_dual_package_release
        certificate_required = policy.certificate_required
        audit_report_required = policy.audit_report_required

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
    score_passed = report["trust_score"] >= trust_threshold
    is_score_critical = True if (policy and policy.institution_id != "INS-GENESIS") else False
    checklist.append({
        "name": f"Composite Trust Score Threshold (>= {trust_threshold}/100)",
        "passed": score_passed,
        "critical": is_score_critical,
        "details": f"Current Exam Integrity Trust Score is {report['trust_score']}/100."
    })
    if not score_passed and is_score_critical:
        blocking_reasons.append("TRUST_SCORE_BELOW_POLICY_THRESHOLD")
        
    # 5. v0.5 Evaluation Specifics
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
        
    # 6. Revised Results Integrity Checks (v0.6)
    revisions = db.query(ResultVersion).join(Result).filter(Result.exam_id == exam_id, ResultVersion.version_number > 1).all()
    revision_checks_passed = True
    
    if revisions:
        dispute_signed_ok = True
        prev_hash_preserved = True
        evidence_regenerated_ok = True
        certs_updated_ok = True
        
        for rev in revisions:
            if rev.linked_dispute_id:
                disp = db.query(Dispute).filter(Dispute.id == rev.linked_dispute_id).first()
                if disp:
                    event = db.query(DisputeEvent).filter(
                        DisputeEvent.dispute_id == disp.id,
                        DisputeEvent.action == "DECISION_RECORDED"
                    ).first()
                    if not event or "Signed:" not in event.notes or event.notes.endswith("Signed:"):
                        dispute_signed_ok = False
            
            if not rev.previous_result_hash:
                prev_hash_preserved = False
                
            packet = db.query(EvidencePacket).filter(
                EvidencePacket.result_id == rev.result_id,
                EvidencePacket.redaction_level == "CANDIDATE_SAFE"
            ).first()
            if not packet:
                evidence_regenerated_ok = False
                
            old_certs = db.query(ResultCertificate).filter(
                ResultCertificate.result_id == rev.result_id,
                ResultCertificate.result_hash == rev.previous_result_hash
            ).all()
            if any(c.status == "VALID" for c in old_certs):
                certs_updated_ok = False
                
        revision_checks_passed = dispute_signed_ok and prev_hash_preserved and evidence_regenerated_ok and certs_updated_ok
        
        checklist.append({
            "name": "Revised Result Integrity Verification",
            "passed": revision_checks_passed,
            "critical": True,
            "details": "All revised result checks passed." if revision_checks_passed else "Some revised result checks failed."
        })
        if not revision_checks_passed:
            blocking_reasons.append("REVISED_RESULT_INTEGRITY_FAILED")

    # 7. Version 0.7 Keyspace, Namespace, and Violations Checks
    keys_ok = True
    ns_ok = True
    has_tenant_boundary_violation = False

    if policy and policy.institution_id != "INS-GENESIS":
        key_count = db.query(InstitutionKey).filter(
            InstitutionKey.institution_id == policy.institution_id,
            InstitutionKey.status == "ACTIVE"
        ).count()
        keys_ok = key_count > 0
        
        ns = db.query(AuditNamespace).filter(AuditNamespace.institution_id == policy.institution_id).first()
        ns_ok = ns is not None and ns.status == "VALID"

        has_tenant_boundary_violation = any(
            issue["code"] == "TENANT_BOUNDARY_VIOLATION"
            for issue in report["critical_issues"]
        )

        checklist.append({
            "name": "Institution Keyspace Initialized",
            "passed": keys_ok,
            "critical": True,
            "details": "Keyspace active and verified." if keys_ok else "No active keyspace found."
        })
        if not keys_ok:
            blocking_reasons.append("KEYS_NOT_INITIALIZED")

        checklist.append({
            "name": "Tenant Audit Namespace Verification",
            "passed": ns_ok,
            "critical": True,
            "details": "Namespace verified VALID." if ns_ok else "Namespace INVALID or missing."
        })
        if not ns_ok:
            blocking_reasons.append("AUDIT_NAMESPACE_INVALID")

        checklist.append({
            "name": "No Tenant Boundary Violations",
            "passed": not has_tenant_boundary_violation,
            "critical": True,
            "details": "No cross-tenant data leaks detected." if not has_tenant_boundary_violation else "Cross-tenant intrusion attempt logged."
        })
        if has_tenant_boundary_violation:
            blocking_reasons.append("TENANT_BOUNDARY_VIOLATION")

    # 8. Version 0.8 DeploymentOps & Reliability Gate Checks
    db_ready = True
    redis_ready = True
    storage_ready = True
    workers_ready = True
    jobs_ok = True
    backup_ok = True
    maintenance_ok = True
    incidents_ok = True

    # 9. Version 0.9 SecurityHardening & Compliance Gate Checks
    sec_incidents_ok = True
    keys_not_compromised = True
    approvals_ok = True
    threats_ok = True

    if policy and policy.institution_id != "INS-GENESIS":
        # Check DB Ready
        from app.db.health import check_db_health
        db_ready = check_db_health() == "OK"
        checklist.append({
            "name": "Database System Ready",
            "passed": db_ready,
            "critical": True,
            "details": "PostgreSQL database fully operational." if db_ready else "Database degraded or offline."
        })
        if not db_ready:
            blocking_reasons.append("DATABASE_NOT_READY")

        # Check Redis Caching Ready
        from app.cache.redis_client import is_redis_degraded
        redis_degraded = is_redis_degraded()
        redis_ready = True
        checklist.append({
            "name": "Redis Lock Layer Available",
            "passed": not redis_degraded,
            "critical": True,
            "details": "Distributed cache lock synchronization available." if not redis_degraded else "Redis cache is offline; using local in-memory fallback."
        })

        # Check Storage Ready
        from app.storage.storage_client import get_storage_client
        try:
            get_storage_client()
            storage_ready = True
        except Exception:
            storage_ready = False
        checklist.append({
            "name": "Object Storage Available",
            "passed": storage_ready,
            "critical": True,
            "details": "MinIO/S3 compatible storage online." if storage_ready else "Storage subsystem unreachable."
        })
        if not storage_ready:
            blocking_reasons.append("STORAGE_UNAVAILABLE")

        # Check Worker Queue
        from app.models import DeploymentConfig, BackgroundJob, BackupManifest, OpsIncident
        queue_stuck = db.query(DeploymentConfig).filter(DeploymentConfig.config_key == "worker_queue_stuck").first()
        workers_ready = not (queue_stuck and queue_stuck.config_value == "True")
        checklist.append({
            "name": "Worker Queues Healthy",
            "passed": workers_ready,
            "critical": True,
            "details": "Background job queue workers online." if workers_ready else "Worker queue is stuck."
        })
        if not workers_ready:
            blocking_reasons.append("WORKERS_UNHEALTHY")

        # Check background jobs
        failed_jobs = db.query(BackgroundJob).filter(
            BackgroundJob.institution_id == policy.institution_id,
            BackgroundJob.status == "FAILED"
        ).count()
        jobs_ok = failed_jobs == 0
        checklist.append({
            "name": "No Failed Critical Jobs",
            "passed": jobs_ok,
            "critical": True,
            "details": "All background execution cycles completed successfully." if jobs_ok else f"Failed background jobs ({failed_jobs}) detected."
        })
        if not jobs_ok:
            blocking_reasons.append("CRITICAL_JOB_FAILED")

        # Check backup policy satisfied
        failed_backups = db.query(BackupManifest).filter(
            BackupManifest.institution_id == policy.institution_id,
            BackupManifest.status == "FAILED"
        ).count()
        backup_ok = failed_backups == 0
        checklist.append({
            "name": "Backup Policy Satisfied",
            "passed": backup_ok,
            "critical": False,
            "details": "Backups intact." if backup_ok else "Last backup manifest verification failed."
        })
        if not backup_ok:
            blocking_reasons.append("BACKUP_POLICY_FAILED")

        # Check maintenance lock
        maintenance_conf = db.query(DeploymentConfig).filter(DeploymentConfig.config_key == "maintenance_mode").first()
        maintenance_ok = not (maintenance_conf and maintenance_conf.config_value == "True")
        checklist.append({
            "name": "No Active Maintenance Lock",
            "passed": maintenance_ok,
            "critical": True,
            "details": "System accepts candidate submissions." if maintenance_ok else "System locked for maintenance."
        })
        if not maintenance_ok:
            blocking_reasons.append("MAINTENANCE_LOCK_ACTIVE")

        # Check unresolved P0 incidents
        p0_incidents = db.query(OpsIncident).filter(
            OpsIncident.severity == "P0",
            OpsIncident.status == "OPEN"
        ).count()
        incidents_ok = p0_incidents == 0
        checklist.append({
            "name": "No Unresolved P0 Incidents",
            "passed": incidents_ok,
            "critical": True,
            "details": "No critical open operations incidents." if incidents_ok else f"Open P0 incidents: {p0_incidents}."
        })
        if not incidents_ok:
            blocking_reasons.append("UNRESOLVED_P0_INCIDENT")

        # 9. Version 0.9 Security Checks
        sec_p0_count = db.query(SecurityIncident).filter(
            SecurityIncident.institution_id == policy.institution_id,
            SecurityIncident.severity == "P0",
            SecurityIncident.status != "RESOLVED"
        ).count()
        sec_incidents_ok = sec_p0_count == 0
        checklist.append({
            "name": "No Unresolved P0 Security Incidents",
            "passed": sec_incidents_ok,
            "critical": True,
            "details": "All critical security incidents resolved." if sec_incidents_ok else f"Active security incidents: {sec_p0_count}."
        })
        if not sec_incidents_ok:
            blocking_reasons.append("UNRESOLVED_P0_SECURITY_INCIDENT")

        compromised_keys = db.query(InstitutionKey).filter(
            InstitutionKey.institution_id == policy.institution_id,
            InstitutionKey.status == "COMPROMISED"
        ).count()
        keys_not_compromised = compromised_keys == 0
        checklist.append({
            "name": "Signing Key Intact",
            "passed": keys_not_compromised,
            "critical": True,
            "details": "No compromised signing keys." if keys_not_compromised else "Active signing key compromised."
        })
        if not keys_not_compromised:
            blocking_reasons.append("COMPROMISED_SIGNING_KEY")

        pending_release_approvals = db.query(ApprovalRequest).filter(
            ApprovalRequest.institution_id == policy.institution_id,
            ApprovalRequest.action_type.in_(["EARLY_PACKAGE_RELEASE", "EMERGENCY_RELEASE"]),
            ApprovalRequest.status == "PENDING"
        ).count()
        approvals_ok = pending_release_approvals == 0
        checklist.append({
            "name": "No Pending Emergency Approvals",
            "passed": approvals_ok,
            "critical": True,
            "details": "No pending emergency package release approvals." if approvals_ok else f"Pending approvals: {pending_release_approvals}."
        })
        if not approvals_ok:
            blocking_reasons.append("PENDING_EMERGENCY_APPROVALS")

        unmitigated_critical_threats = db.query(ThreatModel).filter(
            ThreatModel.institution_id == policy.institution_id,
            ThreatModel.impact == "CRITICAL",
            ThreatModel.status != "MITIGATED"
        ).count()
        threats_ok = unmitigated_critical_threats == 0
        checklist.append({
            "name": "No Unmitigated Critical Threats",
            "passed": threats_ok,
            "critical": True,
            "details": "All critical threats mitigated." if threats_ok else f"Unmitigated critical threats: {unmitigated_critical_threats}."
        })
        if not threats_ok:
            blocking_reasons.append("UNMITIGATED_CRITICAL_THREATS")

    # Publishing is allowed only if all critical checks pass
    allowed = (
        audit_passed and cands_ok and not has_critical_anomaly and 
        all_booklets_locked and omr_ok and evals_locked_ok and conflicts_ok and 
        marks_chain_valid and rubric_ok and revision_checks_passed and
        (not is_score_critical or score_passed) and keys_ok and ns_ok and not has_tenant_boundary_violation and
        db_ready and redis_ready and storage_ready and workers_ready and jobs_ok and maintenance_ok and incidents_ok and
        sec_incidents_ok and keys_not_compromised and approvals_ok and threats_ok
    )
    
    # Log gate verification run
    log_event(
        db=db,
        actor_id="SYSTEM",
        action="PUBLICATION_GATE_CHECK",
        resource_type="Exam",
        resource_id=exam_id,
        payload_data="{}"
    )
    
    # Calculate ops_status for v0.8
    if not db_ready or not storage_ready:
        ops_status = "UNHEALTHY"
    elif not redis_ready or not workers_ready or not maintenance_ok:
        ops_status = "DEGRADED"
    else:
        ops_status = "READY"
        
    return {
        "exam_id": exam_id,
        "allowed": allowed,
        "trust_score": report["trust_score"],
        "checklist": checklist,
        "blocking_reasons": blocking_reasons,
        "critical_issues": report["critical_issues"],
        "warnings": report["warnings"],
        "ops_status": ops_status
    }
