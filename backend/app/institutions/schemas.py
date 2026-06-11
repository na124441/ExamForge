from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InstitutionCreate(BaseModel):
    name: str
    institution_type: str
    tenant_slug: str
    deployment_mode: Optional[str] = "SAAS"
    data_region: Optional[str] = "IN"

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    institution_type: Optional[str] = None
    status: Optional[str] = None

class InstitutionResponse(BaseModel):
    id: str
    name: str
    institution_type: str
    tenant_slug: str
    status: str
    deployment_mode: str
    data_region: str
    created_at: datetime

    class Config:
        from_attributes = True
