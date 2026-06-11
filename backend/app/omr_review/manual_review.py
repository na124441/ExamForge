from sqlalchemy.orm import Session
from app.models import OMRManualReview

def set_reviewer_choice(db: Session, review_id: str, choice: str, reviewer_id: str) -> OMRManualReview:
    review = db.query(OMRManualReview).filter(OMRManualReview.id == review_id).first()
    if not review:
        raise ValueError("OMR review not found")
    if review.review_status == "LOCKED":
        raise ValueError("Cannot edit locked OMR reviews")
        
    review.reviewer_final_answer = choice
    review.reviewed_by = reviewer_id
    db.commit()
    db.refresh(review)
    return review
