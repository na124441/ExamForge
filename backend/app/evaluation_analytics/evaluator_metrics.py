from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import EvaluationMark, EvaluationConflict, AnonymousCopy, User
from typing import Dict, Any

def compute_evaluator_metrics(db: Session, evaluator_id: str) -> Dict[str, Any]:
    # Total assigned copies
    total_assigned = db.query(AnonymousCopy).filter(
        AnonymousCopy.assigned_evaluator_id == evaluator_id
    ).count()
    
    # Total completed marks entries
    completed_marks = db.query(EvaluationMark).filter(
        EvaluationMark.evaluator_id == evaluator_id
    ).all()
    total_completed = len(completed_marks)
    
    # Average marks awarded
    avg_marks = 0.0
    if total_completed > 0:
        avg_marks = sum(m.total_marks for m in completed_marks) / total_completed
        
    # Conflicts count where this evaluator was involved
    conflicts_count = db.query(EvaluationConflict).filter(
        (EvaluationConflict.evaluator_a == evaluator_id) |
        (EvaluationConflict.evaluator_b == evaluator_id)
    ).count()
    
    conflict_rate = 0.0
    if total_completed > 0:
        conflict_rate = conflicts_count / total_completed
        
    # Mock speed and lock delay (or override via database custom metrics)
    from app.models import EvaluatorMetric
    custom = db.query(EvaluatorMetric).filter(EvaluatorMetric.evaluator_id == evaluator_id).first()
    if custom:
        avg_speed = custom.average_speed_seconds
        lock_delay = custom.lock_delay_seconds
        if custom.conflict_rate > 0.0:
            conflict_rate = custom.conflict_rate
    else:
        avg_speed = 35.5
        lock_delay = 120.0
    
    return {
        "evaluator_id": evaluator_id,
        "total_assigned": total_assigned,
        "total_completed": total_completed,
        "average_marks_given": avg_marks,
        "conflict_rate": conflict_rate,
        "average_speed_seconds": avg_speed,
        "lock_delay_seconds": lock_delay,
        "reopen_requests": 0
    }
