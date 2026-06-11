from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Institution, AuditNamespace
from app.institutions.schemas import InstitutionCreate, InstitutionUpdate, InstitutionResponse
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker

router = APIRouter(tags=["institutions"])

@router.post("/api/institutions/create", response_model=InstitutionResponse)
def create_institution(
    request: InstitutionCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN", "CONTROLLER"]))
):
    # Verify slug uniqueness
    existing = db.query(Institution).filter(Institution.tenant_slug == request.tenant_slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tenant slug already in use.")

    new_inst = Institution(
        name=request.name,
        institution_type=request.institution_type,
        tenant_slug=request.tenant_slug,
        status="ACTIVE",
        deployment_mode=request.deployment_mode,
        data_region=request.data_region
    )
    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)

    # Initialize Audit Namespace
    ns = AuditNamespace(
        institution_id=new_inst.id,
        current_head_hash="GENESIS_HEAD",
        event_count=0,
        status="VALID"
    )
    db.add(ns)
    db.commit()

    return new_inst

@router.get("/api/institutions", response_model=List[InstitutionResponse])
def list_institutions(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    # If super admin, return all. Otherwise, scope to user's assigned institution.
    if current_user.role == "PLATFORM_SUPER_ADMIN":
        return db.query(Institution).all()
        
    # User might belong to user.institution_id or list.
    # Let's fallback to querying by user's institution_id
    from app.models import User
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if db_user and db_user.institution_id:
        return db.query(Institution).filter(Institution.id == db_user.institution_id).all()
        
    return []

@router.get("/api/institutions/{institution_id}", response_model=InstitutionResponse)
def get_institution(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    # Guard access if not super admin and not own institution
    from app.tenancy.tenant_guard import guard_tenant_access
    guard_tenant_access(institution_id)

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst

@router.patch("/api/institutions/{institution_id}", response_model=InstitutionResponse)
def update_institution(
    institution_id: str,
    request: InstitutionUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN", "CONTROLLER"]))
):
    from app.tenancy.tenant_guard import guard_tenant_access
    guard_tenant_access(institution_id)

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    if request.name is not None:
        inst.name = request.name
    if request.institution_type is not None:
        inst.institution_type = request.institution_type
    if request.status is not None:
        inst.status = request.status

    db.commit()
    db.refresh(inst)
    return inst

@router.post("/api/institutions/{institution_id}/activate", response_model=InstitutionResponse)
def activate_institution(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN"]))
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    inst.status = "ACTIVE"
    db.commit()
    db.refresh(inst)
    return inst

@router.post("/api/institutions/{institution_id}/suspend", response_model=InstitutionResponse)
def suspend_institution(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN"]))
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    inst.status = "SUSPENDED"
    db.commit()
    db.refresh(inst)
    return inst
