import json
from sqlalchemy.orm import Session
from app.models import AnonymousCopy, EvaluationAssignment
from app.audit.ledger import log_event

def assign_copy_to_evaluator(db: Session, anonymous_id: str, evaluator_id: str, exam_id: str, actor_id: str) -> EvaluationAssignment:
    copy = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == anonymous_id).first()
    if copy:
        copy.assigned_evaluator_id = evaluator_id
        copy.status = "ASSIGNED"
        
    assignment = EvaluationAssignment(
        anonymous_id=anonymous_id,
        evaluator_id=evaluator_id,
        exam_id=exam_id,
        status="ASSIGNED"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    log_event(
        db=db,
        actor_id=actor_id,
        action="EVALUATION_ASSIGNED",
        resource_type="AnonymousCopy",
        resource_id=anonymous_id,
        payload_data=json.dumps({
            "anonymous_id": anonymous_id,
            "evaluator_id": evaluator_id,
            "assignment_id": assignment.id
        })
    )
    
    return assignment

def reassign_copy(db: Session, anonymous_id: str, new_evaluator_id: str, reason: str, actor_id: str) -> EvaluationAssignment:
    copy = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == anonymous_id).first()
    old_evaluator = copy.assigned_evaluator_id if copy else None
    
    old_assigns = db.query(EvaluationAssignment).filter(
        EvaluationAssignment.anonymous_id == anonymous_id,
        EvaluationAssignment.status == "ASSIGNED"
    ).all()
    for oa in old_assigns:
        oa.status = "REASSIGNED"
        
    if copy:
        copy.assigned_evaluator_id = new_evaluator_id
        copy.status = "ASSIGNED"
        
    assignment = EvaluationAssignment(
        anonymous_id=anonymous_id,
        evaluator_id=new_evaluator_id,
        exam_id=copy.exam_id if copy else "UNKNOWN",
        status="ASSIGNED",
        reassigned_from=old_evaluator,
        reassignment_reason=reason
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    log_event(
        db=db,
        actor_id=actor_id,
        action="EVALUATION_REASSIGNED",
        resource_type="AnonymousCopy",
        resource_id=anonymous_id,
        payload_data=json.dumps({
            "anonymous_id": anonymous_id,
            "old_evaluator_id": old_evaluator,
            "new_evaluator_id": new_evaluator_id,
            "reason": reason
        })
    )
    
    return assignment
