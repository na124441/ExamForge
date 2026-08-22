from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PilotStageEventResponse(BaseModel):
    id: str
    pilot_stage_id: str
    event_name: str
    status: str
    actor: str
    action: str
    proof_hash: Optional[str]
    signature: Optional[str]
    risk_effect: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class PilotStageResponse(BaseModel):
    id: str
    pilot_run_id: str
    stage_name: str
    status: str
    sequence: int
    started_at: datetime
    completed_at: Optional[datetime]
    events: List[PilotStageEventResponse] = []

    class Config:
        from_attributes = True

class PilotRunResponse(BaseModel):
    id: str
    institution_id: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    readiness_score: Optional[int]
    stages: List[PilotStageResponse] = []

    class Config:
        from_attributes = True

class PilotEvidenceBinderResponse(BaseModel):
    id: str
    institution_id: Optional[str]
    pilot_run_id: Optional[str]
    binder_hash: str
    signature: str
    metadata_json: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True
