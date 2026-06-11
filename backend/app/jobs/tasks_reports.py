import json
from datetime import datetime, timezone
from app.jobs.celery_app import celery_app
from app.db.session import SessionLocal
from app.jobs.task_status import update_job_progress, complete_job_record, fail_job_record, log_job_event

# Import database models and verification tools
from app.models import (
    InstitutionReport, ReportSection, Candidate, 
    EncryptedPackage, IncidentReport, OMRManualReview, 
    EvaluationMark, Dispute
)
from app.security import calculate_sha256
from app.audit.ledger import log_event, verify_audit_chain
from app.certificates.certificate_signer import sign_certificate_hash

@celery_app.task(bind=True)
def generate_audit_report_job(self, job_id: str, exam_id: str, requestor_id: str):
    """Background task to compile, verify audit ledger, and sign institutional reports."""
    db = SessionLocal()
    try:
        update_job_progress(db, job_id, 10, "RUNNING")
        log_job_event(db, job_id, "REPORT_COMPILE_STARTED", f"Initializing background audit compile for exam {exam_id}")
        
        # 1. Fetch telemetry stats
        update_job_progress(db, job_id, 35, "RUNNING")
        candidates_count = db.query(Candidate).filter(Candidate.exam_id == exam_id).count()
        packages_count = db.query(EncryptedPackage).filter(EncryptedPackage.exam_id == exam_id).count()
        incidents_count = db.query(IncidentReport).filter(IncidentReport.exam_id == exam_id).count()
        omr_reviews_count = db.query(OMRManualReview).count()
        evaluations_count = db.query(EvaluationMark).count()
        disputes_count = db.query(Dispute).filter(Dispute.exam_id == exam_id).count()

        # 2. Verify audit ledger chain sequence
        update_job_progress(db, job_id, 65, "RUNNING")
        audit_chain_intact, _, _ = verify_audit_chain(db)
        
        sections_map = {
            "overview": {
                "exam_id": exam_id,
                "generated_by": f"Job-{job_id[:8]}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "stats": {
                "total_candidates": candidates_count,
                "total_packages": packages_count,
                "total_incidents": incidents_count,
                "total_omr_reviews": omr_reviews_count,
                "total_evaluations": evaluations_count,
                "total_disputes": disputes_count
            },
            "audit_chain": {
                "intact": audit_chain_intact
            },
            "integrity_verdict": {
                "verdict": "VERIFIED" if audit_chain_intact else "FAILED"
            }
        }

        # 3. Compute SHA256 checksum and sign payload
        update_job_progress(db, job_id, 80, "RUNNING")
        sections_str = json.dumps(sections_map, sort_keys=True)
        report_hash = calculate_sha256(sections_str)
        sig = sign_certificate_hash(report_hash)

        # 4. Save report manifest and details to db
        report = InstitutionReport(
            exam_id=exam_id,
            report_hash=report_hash,
            signature=sig
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        for name, content in sections_map.items():
            sec = ReportSection(
                report_id=report.id,
                section_name=name,
                content=json.dumps(content)
            )
            db.add(sec)
        db.commit()

        # 5. Log audit trail milestone
        log_event(
            db=db,
            actor_id=requestor_id or "SYSTEM",
            action="REPORT_GENERATED",
            resource_type="InstitutionReport",
            resource_id=report.id,
            payload_data=json.dumps({
                "report_id": report.id,
                "exam_id": exam_id,
                "report_hash": report_hash
            })
        )
        log_job_event(db, job_id, "SIGNATURE_ATTACHED", f"ECDSA Signature generated. Report ID: {report.id}")
        
        update_job_progress(db, job_id, 95, "RUNNING")
        complete_job_record(db, job_id)
        log_job_event(db, job_id, "REPORT_COMPILE_COMPLETED", f"Asynchronous report compile for exam {exam_id} finished.")
    except Exception as e:
        fail_job_record(db, job_id, str(e))
        log_job_event(db, job_id, "REPORT_COMPILE_FAILED", f"Job failed with error: {e}")
    finally:
        db.close()
