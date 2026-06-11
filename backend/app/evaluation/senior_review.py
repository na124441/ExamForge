from sqlalchemy.orm import Session
from app.models import EvaluationConflict, SeniorReview
from app.evaluation.conflict_resolution import resolve_evaluation_conflict

def submit_senior_review(
    db: Session,
    conflict_id: str,
    senior_evaluator_id: str,
    final_marks: float,
    decision_notes: str
) -> SeniorReview:
    conflict = db.query(EvaluationConflict).filter(EvaluationConflict.id == conflict_id).first()
    if not conflict:
        raise ValueError("Conflict not found")
        
    sr = SeniorReview(
        conflict_id=conflict_id,
        senior_evaluator_id=senior_evaluator_id,
        final_marks=final_marks,
        decision_notes=decision_notes
    )
    db.add(sr)
    db.commit()
    db.refresh(sr)
    
    # Resolve the conflict in the conflict resolution table
    resolve_evaluation_conflict(
        db=db,
        conflict_id=conflict_id,
        resolved_by=senior_evaluator_id,
        resolution_policy="SENIOR_DECISION",
        final_marks=final_marks,
        notes=decision_notes
    )
    
    return sr
