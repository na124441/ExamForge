from pydantic import BaseModel
from datetime import datetime

class InstitutionReportResponse(BaseModel):
    id: str
    exam_id: str
    report_hash: str
    signature: str
    generated_at: datetime

    class Config:
        from_attributes = True
