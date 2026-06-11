from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json

from app.database import get_db
from app.models import ExamTemplate, ExamState, PaperBlueprint
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

router = APIRouter(tags=["templates"])

class TemplateCreate(BaseModel):
    institution_id: str
    name: str
    exam_type: str
    default_duration_minutes: Optional[int] = 180
    default_sections: List[str]
    default_policy_id: Optional[str] = None
    blueprint_schema: dict

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    default_duration_minutes: Optional[int] = None
    status: Optional[str] = None

class CreateExamFromTemplateRequest(BaseModel):
    exam_id: str

@router.post("/api/templates/create")
def create_template(
    request: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    guard_tenant_access(request.institution_id)

    new_tpl = ExamTemplate(
        institution_id=request.institution_id,
        name=request.name,
        exam_type=request.exam_type,
        default_duration_minutes=request.default_duration_minutes,
        default_sections=json.dumps(request.default_sections),
        default_policy_id=request.default_policy_id,
        blueprint_schema=json.dumps(request.blueprint_schema),
        status="ACTIVE"
    )
    db.add(new_tpl)
    db.commit()
    db.refresh(new_tpl)
    return {
        "id": new_tpl.id,
        "name": new_tpl.name,
        "exam_type": new_tpl.exam_type,
        "status": new_tpl.status
    }

@router.get("/api/templates")
def list_templates(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    guard_tenant_access(institution_id)
    tpls = db.query(ExamTemplate).filter(ExamTemplate.institution_id == institution_id).all()
    
    out = []
    for t in tpls:
        out.append({
            "id": t.id,
            "name": t.name,
            "exam_type": t.exam_type,
            "default_duration_minutes": t.default_duration_minutes,
            "default_sections": json.loads(t.default_sections) if t.default_sections else [],
            "status": t.status
        })
    return out

@router.get("/api/templates/{template_id}")
def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    tpl = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
        
    guard_tenant_access(tpl.institution_id)
    
    return {
        "id": tpl.id,
        "institution_id": tpl.institution_id,
        "name": tpl.name,
        "exam_type": tpl.exam_type,
        "default_duration_minutes": tpl.default_duration_minutes,
        "default_sections": json.loads(tpl.default_sections) if tpl.default_sections else [],
        "default_policy_id": tpl.default_policy_id,
        "blueprint_schema": json.loads(tpl.blueprint_schema) if tpl.blueprint_schema else {},
        "status": tpl.status
    }

@router.post("/api/templates/{template_id}/create-exam")
def create_exam_from_template(
    template_id: str,
    request: CreateExamFromTemplateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    tpl = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
        
    guard_tenant_access(tpl.institution_id)

    # 1. Initialize Exam Lifecycle State
    exam_state = ExamState(
        exam_id=request.exam_id,
        state="DRAFT",
        policy_id=tpl.default_policy_id
    )
    db.add(exam_state)

    # 2. Build Paper Blueprint from Template Schema
    schema = json.loads(tpl.blueprint_schema) if tpl.blueprint_schema else {}
    blueprint = PaperBlueprint(
        exam_id=request.exam_id,
        total_marks=schema.get("total_marks", 100),
        total_questions=schema.get("total_questions", 50),
        duration_minutes=tpl.default_duration_minutes,
        subject_distribution=json.dumps(schema.get("subject_distribution", {})),
        difficulty_distribution=json.dumps(schema.get("difficulty_distribution", {}))
    )
    db.add(blueprint)
    db.commit()

    return {
        "status": "EXAM_CREATED_FROM_TEMPLATE",
        "exam_id": request.exam_id,
        "policy_id": tpl.default_policy_id,
        "blueprint_id": blueprint.id
    }

@router.post("/api/templates/{template_id}/clone")
def clone_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    tpl = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
        
    guard_tenant_access(tpl.institution_id)

    cloned = ExamTemplate(
        institution_id=tpl.institution_id,
        name=f"Copy of {tpl.name}",
        exam_type=tpl.exam_type,
        default_duration_minutes=tpl.default_duration_minutes,
        default_sections=tpl.default_sections,
        default_policy_id=tpl.default_policy_id,
        blueprint_schema=tpl.blueprint_schema,
        status="ACTIVE"
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return {"status": "CLONED", "id": cloned.id}

@router.patch("/api/templates/{template_id}")
def update_template(
    template_id: str,
    request: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    tpl = db.query(ExamTemplate).filter(ExamTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
        
    guard_tenant_access(tpl.institution_id)

    if request.name is not None:
        tpl.name = request.name
    if request.default_duration_minutes is not None:
        tpl.default_duration_minutes = request.default_duration_minutes
    if request.status is not None:
        tpl.status = request.status

    db.commit()
    return {"status": "UPDATED"}
