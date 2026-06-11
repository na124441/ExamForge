from sqlalchemy.orm import Session
from app.models import OMRManualReview
from typing import List

def get_pending_omr_reviews(db: Session) -> List[OMRManualReview]:
    return db.query(OMRManualReview).filter(
        OMRManualReview.review_status == "PENDING"
    ).all()
