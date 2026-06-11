from sqlalchemy.orm import Session
from app.models import Rubric

def is_rubric_locked(db: Session, rubric_id: str) -> bool:
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if rubric and rubric.status == "LOCKED":
        return True
    return False
