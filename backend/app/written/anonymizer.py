from sqlalchemy.orm import Session
from app.models import AnonymousCopy, WrittenBooklet

def create_anonymous_copy(db: Session, booklet: WrittenBooklet) -> AnonymousCopy:
    existing = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == booklet.anonymous_id).first()
    if existing:
        return existing
    
    copy = AnonymousCopy(
        anonymous_id=booklet.anonymous_id,
        booklet_id=booklet.id,
        exam_id=booklet.exam_id,
        assigned_evaluator_id=None,
        identity_visible=False,
        status="ANONYMIZED"
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy
