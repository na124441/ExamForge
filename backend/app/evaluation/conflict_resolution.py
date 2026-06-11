import json
from sqlalchemy.orm import Session
from app.models import EvaluationConflict, ConflictResolution, MarksChainEvent
from app.security import calculate_sha256
from app.audit.ledger import log_event

def resolve_evaluation_conflict(
    db: Session,
    conflict_id: str,
    resolved_by: str,
    resolution_policy: str,
    final_marks: float,
    notes: str
) -> ConflictResolution:
    conflict = db.query(EvaluationConflict).filter(EvaluationConflict.id == conflict_id).first()
    if not conflict:
        raise ValueError("Conflict not found")
        
    conflict.status = "RESOLVED"
    conflict.resolution_required = False
    
    res = ConflictResolution(
        conflict_id=conflict_id,
        resolved_by=resolved_by,
        resolution_policy=resolution_policy,
        final_marks=final_marks,
        notes=notes
    )
    db.add(res)
    
    last_event = db.query(MarksChainEvent).filter(
        MarksChainEvent.anonymous_id == conflict.anonymous_id
    ).order_by(MarksChainEvent.id.desc()).first()
    prev_hash = last_event.current_hash if last_event else "0" * 64
    
    event_payload = f"{conflict.anonymous_id}|CONFLICT_RESOLVED|{final_marks}|{prev_hash}"
    event_hash = calculate_sha256(event_payload)
    
    event = MarksChainEvent(
        anonymous_id=conflict.anonymous_id,
        event_type="CONFLICT_RESOLVED",
        details=f"Conflict resolved. Final marks: {final_marks}. Policy: {resolution_policy}",
        previous_hash=prev_hash,
        current_hash=event_hash
    )
    db.add(event)
    db.commit()
    db.refresh(res)
    
    log_event(
        db=db,
        actor_id=resolved_by,
        action="CONFLICT_RESOLVED",
        resource_type="EvaluationConflict",
        resource_id=conflict_id,
        payload_data=json.dumps({
            "conflict_id": conflict_id,
            "resolution_policy": resolution_policy,
            "final_marks": final_marks,
            "notes": notes
        })
    )
    
    return res
