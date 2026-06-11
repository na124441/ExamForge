from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EvidencePacketResponse(BaseModel):
    id: str
    exam_id: str
    result_id: str
    anonymous_id: str
    packet_type: str
    redaction_level: str
    packet_hash: str
    signature: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True
