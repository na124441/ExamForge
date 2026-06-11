from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import BackgroundJob, JobEvent
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

# Import Celery tasks
from app.jobs.tasks_omr import process_omr_scan_job
from app.jobs.tasks_reports import generate_audit_report_job
from app.jobs.tasks_certificates import generate_certificate_job
from app.jobs.task_status import create_job_record, log_job_event

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

class OMRScanJobRequest(BaseModel):
    exam_id: str
    bubble_data: dict

class ReportJobRequest(BaseModel):
    exam_id: str

class CertificateJobRequest(BaseModel):
    result_id: str

@router.post("/omr/process-scan")
def trigger_omr_scan_job(
    request: OMRScanJobRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    job_id = create_job_record(db, inst_id, "PROCESS_OMR_SCAN", current_user.id)
    process_omr_scan_job.delay(job_id, request.exam_id, request.bubble_data)
    
    return {"job_id": job_id, "status": "PENDING"}

@router.post("/reports/generate")
def trigger_report_job(
    request: ReportJobRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    job_id = create_job_record(db, inst_id, "GENERATE_AUDIT_REPORT", current_user.id)
    generate_audit_report_job.delay(job_id, request.exam_id, current_user.id)
    
    return {"job_id": job_id, "status": "PENDING"}

@router.post("/certificates/generate")
def trigger_certificate_job(
    request: CertificateJobRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    job_id = create_job_record(db, inst_id, "GENERATE_CERTIFICATE", current_user.id)
    generate_certificate_job.delay(job_id, request.result_id)
    
    return {"job_id": job_id, "status": "PENDING"}

@router.get("")
def list_jobs(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    jobs = db.query(BackgroundJob).filter(BackgroundJob.institution_id == inst_id).all()
    return jobs

@router.get("/{job_id}")
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    guard_tenant_access(job.institution_id)
    events = db.query(JobEvent).filter(JobEvent.job_id == job_id).all()
    
    return {
        "job": job,
        "events": [
            {
                "event_type": e.event_type,
                "message": e.message,
                "created_at": e.created_at
            }
            for e in events
        ]
    }

@router.post("/{job_id}/cancel")
def cancel_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    guard_tenant_access(job.institution_id)
    
    if job.status in ["COMPLETED", "FAILED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Job has already finished.")
        
    job.status = "CANCELLED"
    db.commit()
    log_job_event(db, job_id, "JOB_CANCELLED", f"Job manually cancelled by user {current_user.id}")
    
    return {"status": "CANCELLED", "job_id": job_id}
