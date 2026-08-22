from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models import (
    InstitutionKey, KeyLifecycleEvent, ApprovalRequest, 
    SecurityIncident, IncidentTimelineEvent
)
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.audit.ledger import log_event

router = APIRouter(prefix="/api/keys", tags=["key-lifecycle"])

class LifecycleEventResponse(BaseModel):
    id: str
    key_id: str
    event_type: str
    old_state: Optional[str]
    new_state: str
    actor_id: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class KeyResponse(BaseModel):
    id: str
    institution_id: str
    key_type: str
    algorithm: str
    public_key: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/{key_id}/rotate/request")
def request_key_rotation(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found.")
    guard_tenant_access(key.institution_id)

    if key.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Only ACTIVE keys can be rotated.")

    # Create an ApprovalRequest
    app_req = ApprovalRequest(
        institution_id=key.institution_id,
        requested_by=current_user.id,
        action_type="KEY_ROTATION",
        resource_type="InstitutionKey",
        resource_id=key_id,
        reason="Scheduled cryptographic rotation.",
        required_approvals=2,
        status="PENDING"
    )
    db.add(app_req)
    
    evt = KeyLifecycleEvent(
        key_id=key_id,
        event_type="ROTATE_REQUEST",
        old_state=key.status,
        new_state="ROTATING",
        actor_id=current_user.id,
        details=f"Rotation request created. Approval ID: {app_req.id}"
    )
    db.add(evt)
    db.commit()

    return {"message": "Key rotation request submitted.", "approval_request_id": app_req.id}

@router.post("/{key_id}/rotate/approve")
def approve_key_rotation(
    key_id: str,
    approval_request_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found.")
    guard_tenant_access(key.institution_id)

    app_req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_request_id).first()
    if not app_req or app_req.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Associated approval request must be APPROVED first.")

    # Execute Key Rotation
    old_status = key.status
    key.status = "ARCHIVED" # or ROTATED
    
    # Create new key
    from app.keyspace.routes import generate_ecdsa_keypair
    pub_k, priv_k = generate_ecdsa_keypair()
    
    new_key = InstitutionKey(
        institution_id=key.institution_id,
        key_type=key.key_type,
        algorithm=key.algorithm,
        public_key=pub_k,
        private_key=priv_k,
        status="ACTIVE"
    )
    db.add(new_key)
    
    evt = KeyLifecycleEvent(
        key_id=key_id,
        event_type="ROTATE_APPROVE",
        old_state=old_status,
        new_state="ARCHIVED",
        actor_id=current_user.id,
        details=f"Key rotated. New active key: {new_key.id}"
    )
    db.add(evt)
    db.commit()

    return {"message": "Key successfully rotated.", "new_key_id": new_key.id}

@router.post("/{key_id}/revoke/request")
def request_key_revocation(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found.")
    guard_tenant_access(key.institution_id)

    # Create an ApprovalRequest for Key Revocation
    app_req = ApprovalRequest(
        institution_id=key.institution_id,
        requested_by=current_user.id,
        action_type="KEY_REVOCATION",
        resource_type="InstitutionKey",
        resource_id=key_id,
        reason="Revoke key requested.",
        required_approvals=2,
        status="PENDING"
    )
    db.add(app_req)
    db.commit()
    
    return {"message": "Key revocation request submitted.", "approval_request_id": app_req.id}

@router.post("/{key_id}/mark-compromised")
def mark_key_compromised(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found.")
    guard_tenant_access(key.institution_id)

    old_status = key.status
    key.status = "COMPROMISED"
    
    evt = KeyLifecycleEvent(
        key_id=key_id,
        event_type="MARK_COMPROMISED",
        old_state=old_status,
        new_state="COMPROMISED",
        actor_id=current_user.id,
        details="Key marked compromised. Immediate lockout triggered."
    )
    db.add(evt)

    # 1. Trigger a P0 Platform Security Incident
    inc = SecurityIncident(
        institution_id=key.institution_id,
        incident_type="KEY_COMPROMISE",
        severity="P0",
        description=f"CRITICAL: Certificate signing key {key_id} marked COMPROMISED. Immediate system lockdown.",
        status="OPEN"
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    timeline_evt = IncidentTimelineEvent(
        incident_id=inc.id,
        event_type="KEY_COMPROMISE_LOCKOUT",
        message=f"System lockout activated. Active key: {key_id} is compromised.",
        actor_id=current_user.id
    )
    db.add(timeline_evt)
    db.commit()

    return {"message": "Key marked compromised. P0 incident reported.", "incident_id": inc.id}

@router.get("/{key_id}/lifecycle", response_model=List[LifecycleEventResponse])
def get_key_lifecycle(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found.")
    guard_tenant_access(key.institution_id)

    return db.query(KeyLifecycleEvent).filter(KeyLifecycleEvent.key_id == key_id).all()
