from sqlalchemy.orm import Session
from app.models import DoubleEvaluation

def create_double_evaluation(db: Session, exam_id: str, anonymous_id: str, question_id: str, evaluator_a: str, evaluator_b: str) -> DoubleEvaluation:
    existing = db.query(DoubleEvaluation).filter(
        DoubleEvaluation.exam_id == exam_id,
        DoubleEvaluation.anonymous_id == anonymous_id,
        DoubleEvaluation.question_id == question_id
    ).first()
    if existing:
        return existing
        
    de = DoubleEvaluation(
        exam_id=exam_id,
        anonymous_id=anonymous_id,
        question_id=question_id,
        evaluator_a=evaluator_a,
        evaluator_b=evaluator_b,
        status="ASSIGNED"
    )
    db.add(de)
    db.commit()
    db.refresh(de)
    return de
