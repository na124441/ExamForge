from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import ExamCenter, CenterAssignment
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

router = APIRouter(tags=["centers"])

class CenterRegister(BaseModel):
    institution_id: str
    name: str
    city: str
    state: str
    capacity: int
    rooms: int
    device_count: int
    network_mode: Optional[str] = "HYBRID"
    security_level: Optional[str] = "HIGH"

class CenterAssignRequest(BaseModel):
    exam_id: str
    capacity: int

@router.post("/api/centers/register")
def register_center(
    request: CenterRegister,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    guard_tenant_access(request.institution_id)

    new_center = ExamCenter(
        institution_id=request.institution_id,
        name=request.name,
        city=request.city,
        state=request.state,
        capacity=request.capacity,
        rooms=request.rooms,
        device_count=request.device_count,
        network_mode=request.network_mode,
        security_level=request.security_level,
        status="APPROVED"  # Auto approve for demo, can suspend/blacklist
    )
    db.add(new_center)
    db.commit()
    db.refresh(new_center)
    
    return {
        "center_id": new_center.id,
        "name": new_center.name,
        "status": new_center.status
    }

@router.get("/api/centers")
def list_centers(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    guard_tenant_access(institution_id)
    return db.query(ExamCenter).filter(ExamCenter.institution_id == institution_id).all()

@router.get("/api/centers/{center_id}")
def get_center(
    center_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    center = db.query(ExamCenter).filter(ExamCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
        
    guard_tenant_access(center.institution_id)
    return center

@router.post("/api/centers/{center_id}/approve")
def approve_center(
    center_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    center = db.query(ExamCenter).filter(ExamCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
        
    guard_tenant_access(center.institution_id)
    center.status = "APPROVED"
    db.commit()
    return {"center_id": center_id, "status": "APPROVED"}

@router.post("/api/centers/{center_id}/suspend")
def suspend_center(
    center_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    center = db.query(ExamCenter).filter(ExamCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
        
    guard_tenant_access(center.institution_id)
    center.status = "SUSPENDED"
    db.commit()
    return {"center_id": center_id, "status": "SUSPENDED"}

@router.post("/api/centers/{center_id}/assign-to-exam")
def assign_center_to_exam(
    center_id: str,
    request: CenterAssignRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    center = db.query(ExamCenter).filter(ExamCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
        
    guard_tenant_access(center.institution_id)

    # Rejects suspended/blacklisted centers assignment
    if center.status in ["SUSPENDED", "BLACKLISTED"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot assign suspended or blacklisted centers to exams."
        )

    # Capacity check validation
    if request.capacity > center.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Exceeded center capacity of {center.capacity}."
        )

    assignment = CenterAssignment(
        center_id=center_id,
        exam_id=request.exam_id,
        assigned_capacity=request.capacity,
        status="ASSIGNED"
    )
    db.add(assignment)
    db.commit()

    return {"status": "CENTER_ASSIGNED", "center_id": center_id, "exam_id": request.exam_id}

@router.get("/api/centers/{center_id}/history")
def get_center_history(
    center_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    center = db.query(ExamCenter).filter(ExamCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
        
    guard_tenant_access(center.institution_id)

    # Return center assignments
    assignments = db.query(CenterAssignment).filter(CenterAssignment.center_id == center_id).all()
    return {
        "center_id": center_id,
        "total_exams_hosted": len(assignments),
        "history": assignments
    }
