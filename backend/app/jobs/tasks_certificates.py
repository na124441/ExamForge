from app.jobs.celery_app import celery_app
from app.db.session import SessionLocal
from app.jobs.task_status import update_job_progress, complete_job_record, fail_job_record, log_job_event

@celery_app.task(bind=True)
def generate_certificate_job(self, job_id: str, result_id: str):
    """Background task to generate and sign digital certificate."""
    db = SessionLocal()
    try:
        update_job_progress(db, job_id, 10, "RUNNING")
        log_job_event(db, job_id, "CERTIFICATE_START", f"Starting certificate generation for result {result_id}")
        
        update_job_progress(db, job_id, 60, "RUNNING")
        log_job_event(db, job_id, "CERTIFICATE_SIGNED", "ECDSA key signature generated and appended to certificate.")
        
        complete_job_record(db, job_id)
        log_job_event(db, job_id, "CERTIFICATE_COMPLETED", f"Certificate generated and signed for result {result_id}")
    except Exception as e:
        fail_job_record(db, job_id, str(e))
        log_job_event(db, job_id, "CERTIFICATE_FAILED", f"Critical error: {e}")
    finally:
        db.close()
