import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import OMRManualReview
from app.omr_review.schemas import OMRFinalizeRequest, OMRReviewResponse
from app.omr_review.queue import get_pending_omr_reviews
from app.omr_review.manual_review import set_reviewer_choice
from app.omr_review.finalization import lock_omr_review
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.security import calculate_sha256

router = APIRouter(tags=["omr_review"])

@router.get("/api/omr/review-queue", response_model=List[OMRReviewResponse])
def get_review_queue(db: Session = Depends(get_db)):
    return db.query(OMRManualReview).all()

@router.get("/api/omr/review/{review_id}", response_model=OMRReviewResponse)
def get_review_details(review_id: str, db: Session = Depends(get_db)):
    review = db.query(OMRManualReview).filter(OMRManualReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="OMR review report not found")
    return review

@router.post("/api/omr/review/{review_id}/finalize", response_model=OMRReviewResponse)
def finalize_omr_review(
    review_id: str,
    request: OMRFinalizeRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    try:
        review = set_reviewer_choice(
            db=db,
            review_id=review_id,
            choice=request.reviewer_final_answer,
            reviewer_id=current_user.id
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    return review

@router.post("/api/omr/review/{review_id}/lock", response_model=OMRReviewResponse)
def lock_omr_review_route(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    try:
        review = lock_omr_review(
            db=db,
            review_id=review_id,
            actor_id=current_user.id
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    return review

@router.get("/api/omr/review/{review_id}/verify")
def verify_omr_review(review_id: str, db: Session = Depends(get_db)):
    review = db.query(OMRManualReview).filter(OMRManualReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="OMR review report not found")
        
    if review.review_status != "LOCKED":
        return {
            "review_id": review_id,
            "status": review.review_status,
            "hash_valid": False,
            "message": "OMR review is not locked yet"
        }
        
    # Recalculate
    payload = f"{review.id}|{review.scan_id}|{review.question_no}|{review.reviewer_final_answer}|{review.reviewed_by}"
    recalculated_hash = calculate_sha256(payload)
    
    hash_valid = (recalculated_hash == review.review_hash)
    return {
        "review_id": review_id,
        "stored_hash": review.review_hash,
        "recalculated_hash": recalculated_hash,
        "hash_valid": hash_valid
    }
