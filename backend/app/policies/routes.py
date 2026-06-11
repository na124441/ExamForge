from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import PolicyTemplate, ExamState, Institution
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

router = APIRouter(tags=["policies"])

class PolicyCreate(BaseModel):
    institution_id: str
    name: str
    trust_threshold: Optional[float] = 90.0
    requires_double_evaluation: Optional[bool] = False
    requires_dual_package_release: Optional[bool] = False
    allow_emergency_release: Optional[bool] = True
    dispute_window_days: Optional[int] = 7
    certificate_required: Optional[bool] = True
    audit_report_required: Optional[bool] = True

class PolicyResponse(BaseModel):
    id: str
    institution_id: str
    name: str
    trust_threshold: float
    requires_double_evaluation: bool
    requires_dual_package_release: bool
    allow_emergency_release: bool
    dispute_window_days: int
    certificate_required: bool
    audit_report_required: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplyPolicyRequest(BaseModel):
    exam_id: str

@router.post("/api/policies/create", response_model=PolicyResponse)
def create_policy(
    request: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN", "CONTROLLER"]))
):
    guard_tenant_access(request.institution_id)

    new_policy = PolicyTemplate(
        institution_id=request.institution_id,
        name=request.name,
        trust_threshold=request.trust_threshold,
        requires_double_evaluation=request.requires_double_evaluation,
        requires_dual_package_release=request.requires_dual_package_release,
        allow_emergency_release=request.allow_emergency_release,
        dispute_window_days=request.dispute_window_days,
        certificate_required=request.certificate_required,
        audit_report_required=request.audit_report_required,
        status="DRAFT"
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy

@router.get("/api/policies/institution/{institution_id}", response_model=List[PolicyResponse])
def get_institution_policies(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    guard_tenant_access(institution_id)
    return db.query(PolicyTemplate).filter(PolicyTemplate.institution_id == institution_id).all()

@router.post("/api/policies/{policy_id}/lock", response_model=PolicyResponse)
def lock_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    policy = db.query(PolicyTemplate).filter(PolicyTemplate.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    guard_tenant_access(policy.institution_id)
    
    policy.status = "LOCKED"
    db.commit()
    db.refresh(policy)
    return policy

@router.post("/api/policies/{policy_id}/clone", response_model=PolicyResponse)
def clone_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    policy = db.query(PolicyTemplate).filter(PolicyTemplate.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    guard_tenant_access(policy.institution_id)

    cloned = PolicyTemplate(
        institution_id=policy.institution_id,
        name=f"Copy of {policy.name}",
        trust_threshold=policy.trust_threshold,
        requires_double_evaluation=policy.requires_double_evaluation,
        requires_dual_package_release=policy.requires_dual_package_release,
        allow_emergency_release=policy.allow_emergency_release,
        dispute_window_days=policy.dispute_window_days,
        certificate_required=policy.certificate_required,
        audit_report_required=policy.audit_report_required,
        status="DRAFT"
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned

@router.post("/api/policies/{policy_id}/apply-to-exam")
def apply_policy_to_exam(
    policy_id: str,
    request: ApplyPolicyRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    policy = db.query(PolicyTemplate).filter(PolicyTemplate.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    guard_tenant_access(policy.institution_id)

    # Note: ExamState was added in v0.4 to track lifecycle. We bind the policy ID to the ExamState record
    exam_state = db.query(ExamState).filter(ExamState.exam_id == request.exam_id).first()
    if not exam_state:
        # Create a new ExamState if not exists
        exam_state = ExamState(
            exam_id=request.exam_id,
            state="DRAFT",
            policy_id=policy.id
        )
        db.add(exam_state)
    else:
        # Check if policy is locked
        if policy.status != "LOCKED":
            raise HTTPException(status_code=400, detail="Only locked policies can be applied to exams.")
        exam_state.policy_id = policy.id
        
    db.commit()
    return {"status": "POLICY_APPLIED", "exam_id": request.exam_id, "policy_id": policy_id}

@router.get("/api/policies/{policy_id}/validate")
def validate_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    policy = db.query(PolicyTemplate).filter(PolicyTemplate.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    guard_tenant_access(policy.institution_id)
    
    issues = []
    if policy.trust_threshold < 80.0:
        issues.append("Trust threshold is dangerously low (<80).")
    if not policy.certificate_required and policy.trust_threshold >= 95.0:
        issues.append("High stakes policy should require certificates.")
        
    return {
        "policy_id": policy_id,
        "is_valid": len(issues) == 0,
        "issues": issues
    }
