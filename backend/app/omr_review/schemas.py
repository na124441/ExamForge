from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OMRFinalizeRequest(BaseModel):
    reviewer_final_answer: str # A, B, C, D, etc.

class OMRReviewResponse(BaseModel):
    id: str
    scan_id: str
    candidate_id: str
    question_no: int
    detected_answer: str
    confidence: float
    reviewer_final_answer: Optional[str]
    review_status: str
    review_hash: Optional[str]
    reviewed_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
