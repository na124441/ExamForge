from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models import ApprovalRequest, ApprovalDecision, AuditLog
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.audit.ledger import log_event

router = APIRouter(prefix="/api/approvals", tags=["approvals"])

class ApprovalRequestCreate(BaseModel):
    action_type: str # EARLY_PACKAGE_RELEASE, EMERGENCY_RELEASE, POLICY_UNLOCK, etc.
    resource_type: str
    resource_id: str
    reason: Optional[str] = None
    required_approvals: Optional[int] = 2

class ApprovalRequestResponse(BaseModel):
    id: str
    institution_id: Optional[str]
    requested_by: str
    action_type: str
    resource_type: str
    resource_id: str
    reason: Optional[str]
    required_approvals: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DecisionResponse(BaseModel):
    id: str
    request_id: str
    user_id: str
    action: str
    decided_at: datetime

    class Config:
        from_attributes = True

@router.post("/request", response_model=ApprovalRequestResponse)
def create_approval_request(
    request: ApprovalRequestCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    app_req = ApprovalRequest(
        institution_id=inst_id,
        requested_by=current_user.id,
        action_type=request.action_type,
        resource_type=request.resource_type,
        resource_id=request.resource_id,
        reason=request.reason,
        required_approvals=request.required_approvals,
        status="PENDING"
    )
    db.add(app_req)
    db.commit()
    db.refresh(app_req)

    # Log in audit ledger
    log_event(
        db=db,
        actor_id=current_user.id,
        action="APPROVAL_REQUESTED",
        resource_type="ApprovalRequest",
        resource_id=app_req.id,
        payload_data=f"Requested {request.action_type} for {request.resource_type} {request.resource_id}"
    )

    return app_req

@router.get("/pending", response_model=List[ApprovalRequestResponse])
def list_pending_requests(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    return db.query(ApprovalRequest).filter(
        ApprovalRequest.institution_id == inst_id,
        ApprovalRequest.status == "PENDING"
    ).all()

@router.post("/{approval_id}/approve", response_model=ApprovalRequestResponse)
def approve_request(
    approval_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    app_req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not app_req:
        raise HTTPException(status_code=404, detail="Approval request not found.")
    guard_tenant_access(app_req.institution_id)

    if app_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request is already processed.")

    # 1. Requester cannot approve their own request
    if app_req.requested_by == current_user.id:
        raise HTTPException(status_code=400, detail="Requesters cannot approve their own requests.")

    # 2. Check if already approved by this user
    existing = db.query(ApprovalDecision).filter(
        ApprovalDecision.request_id == approval_id,
        ApprovalDecision.user_id == current_user.id,
        ApprovalDecision.action == "APPROVE"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already approved this request.")

    # Create decision
    decision = ApprovalDecision(
        request_id=approval_id,
        user_id=current_user.id,
        action="APPROVE",
        signature=f"ECDSA_SIG_USR_{current_user.id}"
    )
    db.add(decision)
    db.commit()

    # Log in audit ledger
    log_event(
        db=db,
        actor_id=current_user.id,
        action="APPROVAL_GRANTED",
        resource_type="ApprovalRequest",
        resource_id=approval_id,
        payload_data=f"Approved action {app_req.action_type}"
    )

    # Count approvals
    approvals_count = db.query(ApprovalDecision).filter(
        ApprovalDecision.request_id == approval_id,
        ApprovalDecision.action == "APPROVE"
    ).count()

    if approvals_count >= app_req.required_approvals:
        app_req.status = "APPROVED"
        db.commit()
        # Log final execution permission
        log_event(
            db=db,
            actor_id="SYSTEM",
            action="APPROVAL_COMPLETED",
            resource_type="ApprovalRequest",
            resource_id=approval_id,
            payload_data=f"Action {app_req.action_type} fully authorized."
        )

    return app_req

@router.post("/{approval_id}/reject", response_model=ApprovalRequestResponse)
def reject_request(
    approval_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    app_req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not app_req:
        raise HTTPException(status_code=404, detail="Approval request not found.")
    guard_tenant_access(app_req.institution_id)

    if app_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request is already processed.")

    # Create decision
    decision = ApprovalDecision(
        request_id=approval_id,
        user_id=current_user.id,
        action="REJECT",
        signature=f"ECDSA_SIG_USR_{current_user.id}"
    )
    db.add(decision)
    app_req.status = "REJECTED"
    db.commit()

    # Log rejection
    log_event(
        db=db,
        actor_id=current_user.id,
        action="APPROVAL_REJECTED",
        resource_type="ApprovalRequest",
        resource_id=approval_id,
        payload_data=f"Rejected action {app_req.action_type}"
    )

    return app_req

@router.get("/{approval_id}/history", response_model=List[DecisionResponse])
def get_approval_history(
    approval_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    app_req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not app_req:
        raise HTTPException(status_code=404, detail="Approval request not found.")
    guard_tenant_access(app_req.institution_id)

    return db.query(ApprovalDecision).filter(ApprovalDecision.request_id == approval_id).all()
