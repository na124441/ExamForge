import json
from sqlalchemy.orm import Session
from app.models import DoubleEvaluation, EvaluationMark, EvaluationConflict, ConflictResolution
from app.audit.ledger import log_event

def check_double_evaluation_variance(db: Session, de: DoubleEvaluation, actor_id: str) -> EvaluationConflict:
    mark_a = db.query(EvaluationMark).filter(
        EvaluationMark.anonymous_id == de.anonymous_id,
        EvaluationMark.question_id == de.question_id,
        EvaluationMark.evaluator_id == de.evaluator_a,
        EvaluationMark.status == "LOCKED"
    ).first()
    
    mark_b = db.query(EvaluationMark).filter(
        EvaluationMark.anonymous_id == de.anonymous_id,
        EvaluationMark.question_id == de.question_id,
        EvaluationMark.evaluator_id == de.evaluator_b,
        EvaluationMark.status == "LOCKED"
    ).first()
    
    if not mark_a or not mark_b:
        return None
        
    de.status = "COMPLETED"
    
    variance = abs(mark_a.total_marks - mark_b.total_marks)
    
    existing = db.query(EvaluationConflict).filter(
        EvaluationConflict.anonymous_id == de.anonymous_id,
        EvaluationConflict.question_id == de.question_id
    ).first()
    if existing:
        return existing
        
    if variance <= 2.0:
        avg_marks = (mark_a.total_marks + mark_b.total_marks) / 2.0
        
        conflict = EvaluationConflict(
            anonymous_id=de.anonymous_id,
            question_id=de.question_id,
            evaluator_a=de.evaluator_a,
            marks_a=mark_a.total_marks,
            evaluator_b=de.evaluator_b,
            marks_b=mark_b.total_marks,
            variance=variance,
            status="RESOLVED",
            resolution_required=False
        )
        db.add(conflict)
        db.commit()
        db.refresh(conflict)
        
        res = ConflictResolution(
            conflict_id=conflict.id,
            resolved_by="SYSTEM",
            resolution_policy="AVERAGE",
            final_marks=avg_marks,
            notes="Auto-resolved: variance within tolerance <= 2.0 marks."
        )
        db.add(res)
        db.commit()
        
        log_event(
            db=db,
            actor_id=actor_id,
            action="CONFLICT_AUTO_RESOLVED",
            resource_type="EvaluationConflict",
            resource_id=conflict.id,
            payload_data=json.dumps({
                "conflict_id": conflict.id,
                "final_marks": avg_marks
            })
        )
        
        return conflict
        
    else:
        # Variance > 2
        status = "OPEN"
        if variance > 5.0:
            status = "SENIOR_REVIEW"
            
        conflict = EvaluationConflict(
            anonymous_id=de.anonymous_id,
            question_id=de.question_id,
            evaluator_a=de.evaluator_a,
            marks_a=mark_a.total_marks,
            evaluator_b=de.evaluator_b,
            marks_b=mark_b.total_marks,
            variance=variance,
            status=status,
            resolution_required=True
        )
        db.add(conflict)
        db.commit()
        db.refresh(conflict)
        
        log_event(
            db=db,
            actor_id=actor_id,
            action="CONFLICT_DETECTED",
            resource_type="EvaluationConflict",
            resource_id=conflict.id,
            payload_data=json.dumps({
                "conflict_id": conflict.id,
                "variance": variance,
                "status": status
            })
        )
        
        return conflict
