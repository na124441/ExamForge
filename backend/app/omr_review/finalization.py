import json
from sqlalchemy.orm import Session
from app.models import OMRManualReview, MarksChainEvent, Candidate
from app.security import calculate_sha256
from app.audit.ledger import log_event

def lock_omr_review(db: Session, review_id: str, actor_id: str) -> OMRManualReview:
    review = db.query(OMRManualReview).filter(OMRManualReview.id == review_id).first()
    if not review:
        raise ValueError("OMR review not found")
        
    if not review.reviewer_final_answer:
        raise ValueError("Cannot lock OMR review without a final reviewer answer")
        
    review.review_status = "LOCKED"
    
    payload = f"{review.id}|{review.scan_id}|{review.question_no}|{review.reviewer_final_answer}|{actor_id}"
    review_hash = calculate_sha256(payload)
    review.review_hash = review_hash
    
    cand = db.query(Candidate).filter(Candidate.id == review.candidate_id).first()
    anon_id = cand.anonymous_id if cand else "UNKNOWN_OMR_CANDIDATE"
    
    last_event = db.query(MarksChainEvent).filter(
        MarksChainEvent.anonymous_id == anon_id
    ).order_by(MarksChainEvent.id.desc()).first()
    prev_hash = last_event.current_hash if last_event else "0" * 64
    
    event_payload = f"{anon_id}|OMR_REVIEW_LOCKED|{review_hash}|{prev_hash}"
    event_hash = calculate_sha256(event_payload)
    
    event = MarksChainEvent(
        anonymous_id=anon_id,
        event_type="OMR_REVIEW_LOCKED",
        details=f"OMR manual review locked for question {review.question_no}. Choice: {review.reviewer_final_answer}",
        previous_hash=prev_hash,
        current_hash=event_hash
    )
    db.add(event)
    db.commit()
    db.refresh(review)
    
    log_event(
        db=db,
        actor_id=actor_id,
        action="OMR_REVIEW_LOCKED",
        resource_type="OMRManualReview",
        resource_id=review_id,
        payload_data=json.dumps({
            "review_id": review_id,
            "scan_id": review.scan_id,
            "question_no": review.question_no,
            "final_answer": review.reviewer_final_answer,
            "review_hash": review_hash
        })
    )
    
    return review
