import json
from sqlalchemy.orm import Session
from app.models import EvaluationMark, EvaluationLock, MarksChainEvent
from app.security import calculate_sha256
from app.audit.ledger import log_event

def lock_marks_entry(db: Session, evaluation_id: str, signature: str, actor_id: str) -> EvaluationLock:
    mark = db.query(EvaluationMark).filter(EvaluationMark.id == evaluation_id).first()
    if not mark:
        raise ValueError("Evaluation mark entry not found")
        
    if mark.status == "LOCKED":
        lock = db.query(EvaluationLock).filter(EvaluationLock.evaluation_id == evaluation_id).first()
        return lock
        
    mark.status = "LOCKED"
    
    payload = f"{mark.id}|{mark.anonymous_id}|{mark.total_marks}|{mark.evaluation_hash}"
    marks_hash = calculate_sha256(payload)
    
    lock = EvaluationLock(
        evaluation_id=evaluation_id,
        anonymous_id=mark.anonymous_id,
        marks_hash=marks_hash,
        locked_by=actor_id,
        signature=signature,
        status="LOCKED"
    )
    db.add(lock)
    
    last_event = db.query(MarksChainEvent).filter(
        MarksChainEvent.anonymous_id == mark.anonymous_id
    ).order_by(MarksChainEvent.id.desc()).first()
    prev_hash = last_event.current_hash if last_event else "0" * 64
    
    event_payload = f"{mark.anonymous_id}|MARKS_LOCKED|{marks_hash}|{prev_hash}"
    event_hash = calculate_sha256(event_payload)
    
    event = MarksChainEvent(
        anonymous_id=mark.anonymous_id,
        event_type="MARKS_LOCKED",
        details=f"Marks locked for question {mark.question_id} by evaluator {actor_id}",
        previous_hash=prev_hash,
        current_hash=event_hash
    )
    db.add(event)
    db.commit()
    db.refresh(lock)
    
    log_event(
        db=db,
        actor_id=actor_id,
        action="MARKS_LOCKED",
        resource_type="EvaluationMark",
        resource_id=evaluation_id,
        payload_data=json.dumps({
            "evaluation_id": evaluation_id,
            "anonymous_id": mark.anonymous_id,
            "marks_hash": marks_hash,
            "signature": signature
        })
    )
    
    return lock

def verify_marks_lock_integrity(db: Session, evaluation_id: str) -> bool:
    lock = db.query(EvaluationLock).filter(EvaluationLock.evaluation_id == evaluation_id).first()
    if not lock:
        return False
        
    mark = db.query(EvaluationMark).filter(EvaluationMark.id == evaluation_id).first()
    if not mark:
        return False
        
    payload = f"{mark.id}|{mark.anonymous_id}|{mark.total_marks}|{mark.evaluation_hash}"
    recalculated_hash = calculate_sha256(payload)
    
    return lock.marks_hash == recalculated_hash
