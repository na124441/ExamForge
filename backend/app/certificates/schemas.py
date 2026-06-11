from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CertificateResponse(BaseModel):
    id: str
    certificate_id: str
    result_id: str
    candidate_anonymous_id: str
    exam_id: str
    result_hash: str
    certificate_hash: str
    signature: str
    verification_url: str
    status: str
    issued_at: datetime

    class Config:
        from_attributes = True
