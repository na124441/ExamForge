from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DisputeFileRequest(BaseModel):
    exam_id: str
    candidate_id: str
    anonymous_id: str
    result_id: str
    dispute_type: str
    priority: Optional[str] = "NORMAL"
    description: str

class DisputeNoteAttachRequest(BaseModel):
    content: str

class DisputeResponse(BaseModel):
    id: str
    exam_id: str
    candidate_id: str
    anonymous_id: str
    result_id: str
    dispute_type: str
    priority: str
    description: str
    status: str
    evidence_packet_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
