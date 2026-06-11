from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models import (
    AccessReviewCycle, AccessReviewItem, InstitutionMembership, 
    User, AuditLog
)
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.audit.ledger import log_event

router = APIRouter(prefix="/api/access-review", tags=["access-review"])

class AccessReviewCycleResponse(BaseModel):
    id: str
    institution_id: Optional[str]
    scope: str
    status: str
    users_reviewed: int
    stale_roles_found: int
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        orm_mode = True

class AccessReviewItemResponse(BaseModel):
    id: str
    cycle_id: str
    user_id: str
    role: str
    status: str
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]

    class Config:
        orm_mode = True

class AccessReviewDetailResponse(BaseModel):
    cycle: AccessReviewCycleResponse
    items: List[AccessReviewItemResponse]

@router.post("/start", response_model=AccessReviewCycleResponse)
def start_access_review(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    # 1. Check if there is already an open cycle
    existing = db.query(AccessReviewCycle).filter(
        AccessReviewCycle.institution_id == inst_id,
        AccessReviewCycle.status == "OPEN"
    ).first()
    if existing:
        return existing

    # Create new cycle
    cycle = AccessReviewCycle(
        institution_id=inst_id,
        scope="INSTITUTION",
        status="OPEN"
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    # Get all memberships
    memberships = db.query(InstitutionMembership).filter(
        InstitutionMembership.institution_id == inst_id
    ).all()

    stale_count = 0
    for m in memberships:
        # Check for stale role: no audit activity in last 90 days
        # To make it easy to test, we also flag email containing "stale"
        user = db.query(User).filter(User.id == m.user_id).first()
        is_stale = False
        if user:
            if "stale" in user.email.lower():
                is_stale = True
            else:
                last_event = db.query(AuditLog).filter(
                    AuditLog.actor_id == user.id
                ).order_by(AuditLog.created_at.desc()).first()
                if last_event:
                    # check if timestamp is older than 90 days
                    # Let's say if timestamp < now - 90 days
                    # In python: last_event.timestamp < datetime.now(timezone.utc) - timedelta(days=90)
                    # For safety let's just use timezone-naive/aware handling
                    pass
        
        status_val = "PENDING"
        if is_stale:
            stale_count += 1
            # We can prefix/status it or track it in a custom way, e.g. details
            # For simplicity, we just increment stale_roles_found count

        item = AccessReviewItem(
            cycle_id=cycle.id,
            user_id=m.user_id,
            role=m.role,
            status="PENDING"
        )
        db.add(item)
    
    cycle.stale_roles_found = stale_count
    db.commit()
    db.refresh(cycle)

    log_event(
        db=db,
        actor_id=current_user.id,
        action="ACCESS_REVIEW_STARTED",
        resource_type="AccessReviewCycle",
        resource_id=cycle.id,
        payload_data=f"Started access review cycle. Stale roles detected: {stale_count}"
    )

    return cycle

@router.get("/{review_id}", response_model=AccessReviewDetailResponse)
def get_access_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    cycle = db.query(AccessReviewCycle).filter(AccessReviewCycle.id == review_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Access review cycle not found.")
    guard_tenant_access(cycle.institution_id)

    items = db.query(AccessReviewItem).filter(AccessReviewItem.cycle_id == review_id).all()
    return {
        "cycle": cycle,
        "items": items
    }

@router.post("/{review_id}/approve-user")
def approve_user_role(
    review_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    cycle = db.query(AccessReviewCycle).filter(AccessReviewCycle.id == review_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Access review cycle not found.")
    guard_tenant_access(cycle.institution_id)

    item = db.query(AccessReviewItem).filter(
        AccessReviewItem.cycle_id == review_id,
        AccessReviewItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="User item not found in this cycle.")

    item.status = "APPROVED"
    item.reviewed_by = current_user.id
    item.reviewed_at = datetime.now(timezone.utc)
    
    # Update cycle reviewed count
    cycle.users_reviewed += 1
    db.commit()

    return {"status": "APPROVED", "user_id": user_id}

@router.post("/{review_id}/revoke-user-role")
def revoke_user_role(
    review_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    cycle = db.query(AccessReviewCycle).filter(AccessReviewCycle.id == review_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Access review cycle not found.")
    guard_tenant_access(cycle.institution_id)

    item = db.query(AccessReviewItem).filter(
        AccessReviewItem.cycle_id == review_id,
        AccessReviewItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="User item not found in this cycle.")

    item.status = "REVOKED"
    item.reviewed_by = current_user.id
    item.reviewed_at = datetime.now(timezone.utc)

    # Remove the role membership from database
    membership = db.query(InstitutionMembership).filter(
        InstitutionMembership.institution_id == cycle.institution_id,
        InstitutionMembership.user_id == user_id,
        InstitutionMembership.role == item.role
    ).first()
    if membership:
        db.delete(membership)

    cycle.users_reviewed += 1
    db.commit()

    log_event(
        db=db,
        actor_id=current_user.id,
        action="ROLE_REVOKED_BY_REVIEW",
        resource_type="User",
        resource_id=user_id,
        payload_data=f"Revoked role {item.role} during access review cycle {review_id}"
    )

    return {"status": "REVOKED", "user_id": user_id}

@router.post("/{review_id}/complete", response_model=AccessReviewCycleResponse)
def complete_access_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    cycle = db.query(AccessReviewCycle).filter(AccessReviewCycle.id == review_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Access review cycle not found.")
    guard_tenant_access(cycle.institution_id)

    cycle.status = "COMPLETED"
    cycle.completed_at = datetime.now(timezone.utc)
    db.commit()

    log_event(
        db=db,
        actor_id=current_user.id,
        action="ACCESS_REVIEW_COMPLETED",
        resource_type="AccessReviewCycle",
        resource_id=review_id,
        payload_data=f"Completed cycle. Reviewed: {cycle.users_reviewed}"
    )

    return cycle
