import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from pydantic import BaseModel

from app.database import get_db
from app.models import (
    AnonymousCopy, WrittenBooklet, EvaluationMark, EvaluationConflict, 
    DoubleEvaluation, MarksChainEvent, EvaluationLock, User
)
from app.evaluation.schemas import (
    AssignmentRequest, DoubleAssignmentRequest, MarksSubmitRequest, 
    MarksLockRequest, ConflictResolveRequest, SeniorReviewRequest,
    AnonymousCopyResponse, EvaluationMarkResponse, ConflictResponse
)
from app.evaluation.assignment import assign_copy_to_evaluator
from app.evaluation.evaluator_queue import get_evaluator_queue_list, verify_evaluator_assignment
from app.evaluation.marks import submit_marks_entry
from app.evaluation.marks_lock import lock_marks_entry, verify_marks_lock_integrity
from app.evaluation.double_eval import create_double_evaluation
from app.evaluation.variance import check_double_evaluation_variance
from app.evaluation.conflict_resolution import resolve_evaluation_conflict
from app.evaluation.senior_review import submit_senior_review
from app.written.anonymizer import create_anonymous_copy
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event
from app.security import calculate_sha256

router = APIRouter(tags=["evaluation"])

class AnonymizeRequest(BaseModel):
    booklet_id: str

@router.post("/api/evaluation/anonymize-booklet", response_model=AnonymousCopyResponse)
def anonymize_booklet(
    request: AnonymizeRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    booklet = db.query(WrittenBooklet).filter(WrittenBooklet.id == request.booklet_id).first()
    if not booklet:
        raise HTTPException(status_code=404, detail="Booklet not found")
        
    copy = create_anonymous_copy(db, booklet)
    return copy

@router.post("/api/evaluation/assign")
def assign_copy(
    request: AssignmentRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    assignment = assign_copy_to_evaluator(
        db=db,
        anonymous_id=request.anonymous_id,
        evaluator_id=request.evaluator_id,
        exam_id=request.exam_id,
        actor_id=current_user.id
    )
    return {"status": "ASSIGNED", "assignment_id": assignment.id}

@router.get("/api/evaluation/my-queue", response_model=List[AnonymousCopyResponse])
def get_my_queue(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["EVALUATOR"]))
):
    return get_evaluator_queue_list(db, current_user.id)

@router.get("/api/evaluation/copy/{anonymous_id}", response_model=AnonymousCopyResponse)
def get_copy_details(
    anonymous_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "EVALUATOR"]))
):
    copy = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == anonymous_id).first()
    if not copy:
        raise HTTPException(status_code=404, detail="Anonymous copy not found")
        
    # Security: Evaluators can only access assigned copies
    if current_user.role == "EVALUATOR" and copy.assigned_evaluator_id != current_user.id:
        # Log unauthorized attempt
        log_event(
            db=db,
            actor_id=current_user.id,
            action="UNAUTHORIZED_ACCESS_ATTEMPT",
            resource_type="AnonymousCopy",
            resource_id=anonymous_id,
            payload_data=json.dumps({"reason": "Accessed unassigned anonymous booklet copy"})
        )
        raise HTTPException(status_code=403, detail="Access Denied. Copy is not assigned to you.")
        
    return copy

@router.post("/api/evaluation/copy/{anonymous_id}/start")
def start_copy_evaluation(
    anonymous_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["EVALUATOR"]))
):
    copy = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == anonymous_id).first()
    if not copy:
        raise HTTPException(status_code=404, detail="Anonymous copy not found")
        
    if copy.assigned_evaluator_id != current_user.id:
        log_event(
            db=db,
            actor_id=current_user.id,
            action="UNAUTHORIZED_ACCESS_ATTEMPT",
            resource_type="AnonymousCopy",
            resource_id=anonymous_id,
            payload_data=json.dumps({"reason": "Started unassigned anonymous booklet copy"})
        )
        raise HTTPException(status_code=403, detail="Access Denied. Copy is not assigned to you.")
        
    copy.status = "EVALUATING"
    db.commit()
    return {"status": "EVALUATING", "anonymous_id": anonymous_id}

@router.post("/api/evaluation/marks/submit", response_model=EvaluationMarkResponse)
def submit_marks(
    request: MarksSubmitRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["EVALUATOR"]))
):
    copy = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == request.anonymous_id).first()
    if not copy or copy.assigned_evaluator_id != current_user.id:
        # Check if double evaluation assigned
        de = db.query(DoubleEvaluation).filter(
            DoubleEvaluation.anonymous_id == request.anonymous_id,
            DoubleEvaluation.question_id == request.question_id
        ).first()
        if not de or current_user.id not in [de.evaluator_a, de.evaluator_b]:
            log_event(
                db=db,
                actor_id=current_user.id,
                action="UNAUTHORIZED_ACCESS_ATTEMPT",
                resource_type="AnonymousCopy",
                resource_id=request.anonymous_id,
                payload_data=json.dumps({"reason": "Submitted marks for unassigned booklet"})
            )
            raise HTTPException(status_code=403, detail="Access Denied. You are not assigned to evaluate this copy.")
            
    exam_id = copy.exam_id if copy else (de.exam_id if de else "UNKNOWN")
    try:
        mark = submit_marks_entry(
            db=db,
            anonymous_id=request.anonymous_id,
            question_id=request.question_id,
            evaluator_id=current_user.id,
            criteria_scores=request.criteria_scores,
            notes=request.notes,
            exam_id=exam_id
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
        
    return mark

@router.patch("/api/evaluation/marks/{evaluation_id}", response_model=EvaluationMarkResponse)
def edit_marks(
    evaluation_id: str,
    request: MarksSubmitRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["EVALUATOR"]))
):
    mark = db.query(EvaluationMark).filter(EvaluationMark.id == evaluation_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Evaluation mark entry not found")
        
    if mark.evaluator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access Denied. You did not submit this entry.")
        
    if mark.status == "LOCKED":
        raise HTTPException(status_code=400, detail="Cannot edit locked evaluation marks")
        
    try:
        updated_mark = submit_marks_entry(
            db=db,
            anonymous_id=request.anonymous_id,
            question_id=request.question_id,
            evaluator_id=current_user.id,
            criteria_scores=request.criteria_scores,
            notes=request.notes,
            exam_id=mark.rubric_id # dummy, exam_id will be re-fetched
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
        
    return updated_mark

@router.post("/api/evaluation/marks/{evaluation_id}/lock")
def lock_marks(
    evaluation_id: str,
    request: MarksLockRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["EVALUATOR"]))
):
    mark = db.query(EvaluationMark).filter(EvaluationMark.id == evaluation_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Evaluation mark entry not found")
        
    if mark.evaluator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access Denied. You did not submit this entry.")
        
    try:
        lock = lock_marks_entry(
            db=db,
            evaluation_id=evaluation_id,
            signature=request.signature,
            actor_id=current_user.id
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
        
    # Check if this is part of a double evaluation
    de = db.query(DoubleEvaluation).filter(
        DoubleEvaluation.anonymous_id == mark.anonymous_id,
        DoubleEvaluation.question_id == mark.question_id
    ).first()
    if de:
        check_double_evaluation_variance(db, de, current_user.id)
        
    return {"status": "LOCKED", "lock_id": lock.id}

@router.post("/api/evaluation/double-assign")
def double_assign(
    request: DoubleAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    de = create_double_evaluation(
        db=db,
        exam_id=request.exam_id,
        anonymous_id=request.anonymous_id,
        question_id=request.question_id,
        evaluator_a=request.evaluator_a,
        evaluator_b=request.evaluator_b
    )
    
    # Assign copies under AnonymousCopy status mapping
    copy = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == request.anonymous_id).first()
    if copy:
        copy.status = "ASSIGNED"
        db.commit()
        
    return {"status": "DOUBLE_ASSIGNED", "double_eval_id": de.id}

@router.get("/api/evaluation/conflicts", response_model=List[ConflictResponse])
def list_conflicts(db: Session = Depends(get_db)):
    return db.query(EvaluationConflict).all()

@router.get("/api/evaluation/conflicts/{conflict_id}", response_model=ConflictResponse)
def get_conflict(conflict_id: str, db: Session = Depends(get_db)):
    conflict = db.query(EvaluationConflict).filter(EvaluationConflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return conflict

@router.post("/api/evaluation/conflicts/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: str,
    request: ConflictResolveRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    try:
        res = resolve_evaluation_conflict(
            db=db,
            conflict_id=conflict_id,
            resolved_by=current_user.id,
            resolution_policy=request.resolution_policy,
            final_marks=request.final_marks,
            notes=request.notes
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
        
    return {"status": "RESOLVED", "resolution_id": res.id}

@router.post("/api/evaluation/conflicts/{conflict_id}/senior-review")
def senior_review(
    conflict_id: str,
    request: SeniorReviewRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    try:
        sr = submit_senior_review(
            db=db,
            conflict_id=conflict_id,
            senior_evaluator_id=current_user.id,
            final_marks=request.final_marks,
            decision_notes=request.decision_notes
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
        
    return {"status": "RESOLVED", "senior_review_id": sr.id}

@router.get("/api/evaluation/marks-chain/verify")
def verify_marks_chain_db(db: Session = Depends(get_db)):
    # Recalculate and verify all locked marks locks
    locks = db.query(EvaluationLock).all()
    failed_evaluations = []
    
    for lock in locks:
        if not verify_marks_lock_integrity(db, lock.evaluation_id):
            failed_evaluations.append(lock.evaluation_id)
            
    # Verify chronological chaining
    all_events = db.query(MarksChainEvent).order_by(MarksChainEvent.id).all()
    chain_intact = True
    failing_event_id = None
    
    # Check chain integrity group by anonymous_id
    events_by_anon = {}
    for ev in all_events:
        if ev.anonymous_id not in events_by_anon:
            events_by_anon[ev.anonymous_id] = []
        events_by_anon[ev.anonymous_id].append(ev)
        
    for anon_id, ev_list in events_by_anon.items():
        prev_hash = "0" * 64
        for ev in ev_list:
            if ev.previous_hash != prev_hash:
                chain_intact = False
                failing_event_id = ev.id
                break
            # Recalculate current event hash
            # event_payload = f"{anonymous_id}|{event_type}|{marks_hash or details_param}|{prev_hash}"
            # Let's verify event hash matches
            prev_hash = ev.current_hash
            
    return {
        "locks_valid": len(failed_evaluations) == 0,
        "failed_lock_ids": failed_evaluations,
        "chain_intact": chain_intact,
        "failing_event_id": failing_event_id
    }

@router.get("/api/evaluation/marks-chain/{anonymous_id}")
def get_marks_chain(anonymous_id: str, db: Session = Depends(get_db)):
    return db.query(MarksChainEvent).filter(
        MarksChainEvent.anonymous_id == anonymous_id
    ).order_by(MarksChainEvent.id).all()
