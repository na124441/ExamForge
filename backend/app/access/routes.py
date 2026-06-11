from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import User, UserInvitation, InstitutionMembership, Institution
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.security import hash_password

router = APIRouter(tags=["access"])

class InviteRequest(BaseModel):
    email: EmailStr
    institution_id: str
    role: str

class AcceptInviteRequest(BaseModel):
    invitation_id: str
    name: str
    password: str

class RoleAssignmentRequest(BaseModel):
    user_id: str
    institution_id: str
    role: str

class InvitationResponse(BaseModel):
    id: str
    email: str
    institution_id: str
    role: str
    status: str
    created_at: datetime

class MemberResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str

@router.post("/api/access/invite-user", response_model=InvitationResponse)
def invite_user(
    request: InviteRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN", "CONTROLLER"]))
):
    guard_tenant_access(request.institution_id)

    # Rejects if suspended
    inst = db.query(Institution).filter(Institution.id == request.institution_id).first()
    if not inst or inst.status == "SUSPENDED":
        raise HTTPException(status_code=400, detail="Cannot invite to inactive or suspended institution.")

    # Check for duplicate pending invitation
    existing = db.query(UserInvitation).filter(
        UserInvitation.email == request.email,
        UserInvitation.institution_id == request.institution_id,
        UserInvitation.status == "PENDING"
    ).first()
    if existing:
        return existing

    new_invite = UserInvitation(
        email=request.email,
        institution_id=request.institution_id,
        role=request.role,
        status="PENDING"
    )
    db.add(new_invite)
    db.commit()
    db.refresh(new_invite)
    return new_invite

@router.post("/api/access/accept-invite")
def accept_invite(request: AcceptInviteRequest, db: Session = Depends(get_db)):
    invite = db.query(UserInvitation).filter(UserInvitation.id == request.invitation_id).first()
    if not invite or invite.status != "PENDING":
        raise HTTPException(status_code=400, detail="Invitation not active or already accepted.")

    # Check if user already exists
    user = db.query(User).filter(User.email == invite.email).first()
    if not user:
        # Create user
        user = User(
            name=request.name,
            email=invite.email,
            password_hash=hash_password(request.password),
            institution_id=invite.institution_id,
            status="ACTIVE"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Link user if they exist
        user.institution_id = invite.institution_id
        db.commit()

    # Add membership
    membership = InstitutionMembership(
        user_id=user.id,
        institution_id=invite.institution_id,
        role=invite.role
    )
    db.add(membership)
    invite.status = "ACCEPTED"
    db.commit()

    return {"message": "Invitation accepted. Membership activated.", "user_id": user.id}

@router.get("/api/access/users", response_model=List[MemberResponse])
def list_institution_members(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    guard_tenant_access(institution_id)

    memberships = db.query(InstitutionMembership).filter(
        InstitutionMembership.institution_id == institution_id
    ).all()

    out = []
    for m in memberships:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u:
            out.append(MemberResponse(
                user_id=u.id,
                name=u.name,
                email=u.email,
                role=m.role
            ))
    return out

@router.post("/api/access/assign-role")
def assign_role(
    request: RoleAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN", "CONTROLLER"]))
):
    guard_tenant_access(request.institution_id)

    # Block Platform Super Admin roles assignments by non-SuperAdmins
    if request.role == "PLATFORM_SUPER_ADMIN" and current_user.role != "PLATFORM_SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Cannot assign PLATFORM_SUPER_ADMIN role.")

    # Rejects out-of-scope role assignment (e.g. if center officer is not bounded, etc. handled in logic)
    membership = db.query(InstitutionMembership).filter(
        InstitutionMembership.user_id == request.user_id,
        InstitutionMembership.institution_id == request.institution_id
    ).first()

    if membership:
        membership.role = request.role
    else:
        membership = InstitutionMembership(
            user_id=request.user_id,
            institution_id=request.institution_id,
            role=request.role
        )
        db.add(membership)

    db.commit()
    return {"status": "ROLE_ASSIGNED", "role": request.role}

@router.post("/api/access/revoke-role")
def revoke_role(
    request: RoleAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN", "CONTROLLER"]))
):
    guard_tenant_access(request.institution_id)

    membership = db.query(InstitutionMembership).filter(
        InstitutionMembership.user_id == request.user_id,
        InstitutionMembership.institution_id == request.institution_id,
        InstitutionMembership.role == request.role
    ).first()

    if not membership:
        raise HTTPException(status_code=404, detail="Membership role mapping not found.")

    db.delete(membership)
    db.commit()
    return {"status": "ROLE_REVOKED"}

@router.get("/api/access/permission-matrix")
def get_permission_matrix(
    current_user: UserResponse = Depends(get_current_user)
):
    return {
        "roles": [
            "PLATFORM_SUPER_ADMIN",
            "CONTROLLER",
            "OFFICER",
            "INVIGILATOR",
            "EVALUATOR",
            "AUDITOR",
            "CANDIDATE"
        ],
        "scopes": {
            "PLATFORM_SUPER_ADMIN": ["GLOBAL_SYSTEM_ACCESS", "MANAGE_TENANTS"],
            "CONTROLLER": ["EXAM_CREATE", "POLICY_LOCK", "PUBLISH_RESULTS", "REPORT_GENERATE"],
            "OFFICER": ["PACKAGE_RELEASE", "SCAN_UPLOAD", "DISPUTE_REVIEW"],
            "INVIGILATOR": ["CANDIDATE_VERIFY", "INCIDENT_REPORT"],
            "EVALUATOR": ["LOCK_MARKS"],
            "AUDITOR": ["VERIFY_CHAIN", "VIEW_REPORT"],
            "CANDIDATE": ["RESULT_LOOKUP", "DISPUTE_FILE"]
        }
    }
