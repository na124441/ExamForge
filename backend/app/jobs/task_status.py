from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import BackgroundJob, JobEvent

def create_job_record(db: Session, institution_id: str, job_type: str, created_by: str = None) -> str:
    """Create a new pending background job record in the database."""
    job = BackgroundJob(
        institution_id=institution_id,
        job_type=job_type,
        status="PENDING",
        progress=0,
        created_by=created_by
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job.id

def update_job_progress(db: Session, job_id: str, progress: int, status: str = None):
    """Update progress percentage and status of a running job."""
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if job:
        job.progress = progress
        if status:
            job.status = status
        db.commit()

def complete_job_record(db: Session, job_id: str):
    """Mark a background job as completed successfully."""
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if job:
        job.progress = 100
        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

def fail_job_record(db: Session, job_id: str, error_reason: str):
    """Mark a background job as failed, recording the error details."""
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if job:
        job.status = "FAILED"
        job.error_reason = error_reason
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

def log_job_event(db: Session, job_id: str, event_type: str, message: str):
    """Add a detailed execution event/milestone linked to a job."""
    event = JobEvent(
        job_id=job_id,
        event_type=event_type,
        message=message
    )
    db.add(event)
    db.commit()
