from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.models import BackupManifest, BackupEvent, RestoreDryRun
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.backup.db_backup import create_db_snapshot
from app.backup.object_backup import create_object_manifest_snapshot
from app.backup.audit_snapshot import capture_audit_head_hash
from app.backup.verification import verify_backup_manifest
from app.backup.restore import execute_restore_dry_run

router = APIRouter(tags=["backup"])

class RestoreRequest(BaseModel):
    backup_id: str

class BackupManifestResponse(BaseModel):
    id: str
    institution_id: Optional[str] = None
    backup_type: str
    db_snapshot_hash: str
    object_manifest_hash: str
    audit_head_hash: Optional[str] = None
    status: str
    error_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BackupEventResponse(BaseModel):
    event_type: str
    message: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BackupDetailsResponse(BaseModel):
    manifest: BackupManifestResponse
    events: List[BackupEventResponse]

@router.post("/api/backup/create", response_model=BackupManifestResponse)
def trigger_backup(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    try:
        # Create DB snapshot hash
        db_hash = create_db_snapshot()
        
        # Create storage object manifest hash
        obj_hash = create_object_manifest_snapshot(inst_id)
        
        # Capture current audit log head hash
        audit_hash = capture_audit_head_hash(inst_id)
        
        # Record manifest
        manifest = BackupManifest(
            institution_id=inst_id,
            backup_type="FULL",
            db_snapshot_hash=db_hash,
            object_manifest_hash=obj_hash,
            audit_head_hash=audit_hash,
            status="COMPLETED"
        )
        db.add(manifest)
        db.commit()
        db.refresh(manifest)
        
        # Log event
        evt = BackupEvent(
            backup_id=manifest.id,
            event_type="BACKUP_SUCCEEDED",
            message=f"Full backup manifest {manifest.id} generated successfully."
        )
        db.add(evt)
        db.commit()
        
        return manifest
    except Exception as e:
        # Create failed manifest
        manifest = BackupManifest(
            institution_id=inst_id,
            backup_type="FULL",
            db_snapshot_hash="error",
            object_manifest_hash="error",
            audit_head_hash="error",
            status="FAILED",
            error_reason=str(e)
        )
        db.add(manifest)
        db.commit()
        db.refresh(manifest)
        raise HTTPException(status_code=500, detail=f"Backup generation failed: {e}")

@router.get("/api/backup", response_model=List[BackupManifestResponse])
def list_backups(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    backups = db.query(BackupManifest).filter(BackupManifest.institution_id == inst_id).all()
    return backups

@router.get("/api/backup/{backup_id}", response_model=BackupDetailsResponse)
def get_backup_details(
    backup_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    manifest = db.query(BackupManifest).filter(BackupManifest.id == backup_id).first()
    if not manifest:
        raise HTTPException(status_code=404, detail="Backup manifest not found.")
        
    guard_tenant_access(manifest.institution_id)
    events = db.query(BackupEvent).filter(BackupEvent.backup_id == backup_id).all()
    
    return {
        "manifest": manifest,
        "events": [
            {"event_type": e.event_type, "message": e.message, "created_at": e.created_at}
            for e in events
        ]
    }

@router.post("/api/backup/{backup_id}/verify")
def verify_backup(
    backup_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    manifest = db.query(BackupManifest).filter(BackupManifest.id == backup_id).first()
    if not manifest:
        raise HTTPException(status_code=404, detail="Backup manifest not found.")
        
    guard_tenant_access(manifest.institution_id)
    
    is_valid = verify_backup_manifest(backup_id)
    return {"backup_id": backup_id, "is_valid": is_valid}

@router.post("/api/restore/dry-run")
def run_restore_dry_run(
    request: RestoreRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    manifest = db.query(BackupManifest).filter(BackupManifest.id == request.backup_id).first()
    if not manifest:
        raise HTTPException(status_code=404, detail="Backup manifest not found.")
        
    guard_tenant_access(manifest.institution_id)
    
    passed = execute_restore_dry_run(request.backup_id)
    
    dry_run_record = db.query(RestoreDryRun).filter(RestoreDryRun.backup_id == request.backup_id).order_by(RestoreDryRun.created_at.desc()).first()
    
    return {
        "status": "PASSED" if passed else "FAILED",
        "backup_id": request.backup_id,
        "details": dry_run_record.verification_details if dry_run_record else "No dry-run details recorded."
    }
