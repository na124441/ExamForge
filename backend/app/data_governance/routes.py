from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.models import SecurityAsset, PIIAccessLog
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

router = APIRouter(prefix="/api/security/assets", tags=["data-governance"])

class AssetClassifyRequest(BaseModel):
    asset_id: str
    resource_type: str
    field_name: str
    classification: str # PUBLIC, INTERNAL, CONFIDENTIAL, SECRET, PII, EVIDENCE, CRYPTO_MATERIAL
    encryption_required: Optional[bool] = False
    redaction_required: Optional[bool] = False
    access_audit_required: Optional[bool] = False
    retention_policy: Optional[str] = "EXAM_PLUS_180_DAYS"

class AssetResponse(BaseModel):
    id: str
    institution_id: Optional[str]
    asset_id: str
    resource_type: str
    field_name: str
    classification: str
    encryption_required: bool
    redaction_required: bool
    access_audit_required: bool
    retention_policy: Optional[str]

    class Config:
        from_attributes = True

class PIIAccessLogResponse(BaseModel):
    id: str
    actor_id: str
    resource_type: str
    resource_id: str
    accessed_fields: str
    accessed_at: str

@router.post("/classify", response_model=AssetResponse)
def classify_asset(
    request: AssetClassifyRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    # Check if duplicate asset_id
    asset = db.query(SecurityAsset).filter(SecurityAsset.asset_id == request.asset_id).first()
    if asset:
        asset.classification = request.classification
        asset.encryption_required = request.encryption_required
        asset.redaction_required = request.redaction_required
        asset.access_audit_required = request.access_audit_required
        asset.retention_policy = request.retention_policy
    else:
        asset = SecurityAsset(
            institution_id=inst_id,
            asset_id=request.asset_id,
            resource_type=request.resource_type,
            field_name=request.field_name,
            classification=request.classification,
            encryption_required=request.encryption_required,
            redaction_required=request.redaction_required,
            access_audit_required=request.access_audit_required,
            retention_policy=request.retention_policy
        )
        db.add(asset)
    
    db.commit()
    db.refresh(asset)
    return asset

@router.get("", response_model=List[AssetResponse])
def list_assets(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    return db.query(SecurityAsset).filter(SecurityAsset.institution_id == inst_id).all()
