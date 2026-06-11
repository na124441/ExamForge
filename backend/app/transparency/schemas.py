from pydantic import BaseModel
from typing import Dict, Any, List

class ResultLookupRequest(BaseModel):
    registration_number: str
    exam_id: str
    pin: str

class ResultLookupResponse(BaseModel):
    result_id: str
    candidate_anonymous_id: str
    exam_id: str
    marks_obtained: float
    max_marks: float
    status: str
    published_at: str
    rank: int
    qualification_status: str

class ReceiptVerifyRequest(BaseModel):
    anonymous_id: str
    exam_id: str
    timestamp: str
    root_hash: str
    signature: str
