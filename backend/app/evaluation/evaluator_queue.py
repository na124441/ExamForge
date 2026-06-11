from sqlalchemy.orm import Session
from app.models import AnonymousCopy
from typing import List

def get_evaluator_queue_list(db: Session, evaluator_id: str) -> List[AnonymousCopy]:
    return db.query(AnonymousCopy).filter(
        AnonymousCopy.assigned_evaluator_id == evaluator_id
    ).all()

def verify_evaluator_assignment(db: Session, anonymous_id: str, evaluator_id: str) -> bool:
    copy = db.query(AnonymousCopy).filter(
        AnonymousCopy.anonymous_id == anonymous_id,
        AnonymousCopy.assigned_evaluator_id == evaluator_id
    ).first()
    return copy is not None
