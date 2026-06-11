import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Rubric, RubricCriterion, Question
from app.rubrics.schemas import RubricCreateRequest, RubricResponse
from app.rubrics.criteria import validate_criteria_marks
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event

router = APIRouter(tags=["rubrics"])

@router.post("/api/rubrics/create", response_model=RubricResponse)
def create_rubric(
    request: RubricCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    # Validate question exists
    q = db.query(Question).filter(Question.id == request.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Check if a rubric already exists for this question
    existing = db.query(Rubric).filter(
        Rubric.exam_id == request.exam_id,
        Rubric.question_id == request.question_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rubric already exists for this question")
        
    # Validate criteria marks sum
    if not validate_criteria_marks(request.max_marks, request.criteria):
        raise HTTPException(status_code=400, detail="Criteria max marks total must equal question max marks")
        
    rubric = Rubric(
        exam_id=request.exam_id,
        question_id=request.question_id,
        max_marks=request.max_marks,
        status="DRAFT"
    )
    db.add(rubric)
    db.commit()
    db.refresh(rubric)
    
    # Add criteria
    criteria_list = []
    for c in request.criteria:
        crit = RubricCriterion(
            rubric_id=rubric.id,
            title=c.title,
            max_marks=c.max_marks
        )
        db.add(crit)
        criteria_list.append(crit)
        
    db.commit()
    
    # Reload rubric with criteria
    rubric.criteria = criteria_list
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="RUBRIC_CREATED",
        resource_type="Rubric",
        resource_id=rubric.id,
        payload_data=json.dumps({
            "rubric_id": rubric.id,
            "exam_id": rubric.exam_id,
            "question_id": rubric.question_id,
            "max_marks": rubric.max_marks
        })
    )
    
    return rubric

@router.post("/api/rubrics/{rubric_id}/lock")
def lock_rubric(
    rubric_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
        
    rubric.status = "LOCKED"
    db.commit()
    db.refresh(rubric)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="RUBRIC_LOCKED",
        resource_type="Rubric",
        resource_id=rubric.id,
        payload_data=json.dumps({"rubric_id": rubric.id})
    )
    
    return {"status": "LOCKED", "rubric_id": rubric_id}

@router.get("/api/rubrics/exam/{exam_id}", response_model=List[RubricResponse])
def get_exam_rubrics(exam_id: str, db: Session = Depends(get_db)):
    rubrics = db.query(Rubric).filter(Rubric.exam_id == exam_id).all()
    # Populate criteria relation manually or automatically
    for r in rubrics:
        r.criteria = db.query(RubricCriterion).filter(RubricCriterion.rubric_id == r.id).all()
    return rubrics

@router.get("/api/rubrics/question/{question_id}", response_model=RubricResponse)
def get_question_rubric(question_id: str, db: Session = Depends(get_db)):
    rubric = db.query(Rubric).filter(Rubric.question_id == question_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found for this question")
    rubric.criteria = db.query(RubricCriterion).filter(RubricCriterion.rubric_id == rubric.id).all()
    return rubric
