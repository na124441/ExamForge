from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models import PIIAccessLog, SecurityIncident, IncidentTimelineEvent
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.privacy.redactor import redact_payload

router = APIRouter(prefix="/api/privacy", tags=["privacy"])

class RedactRequest(BaseModel):
    payload: Dict[str, Any]
    mode: str

class ExportValidateRequest(BaseModel):
    payload: Dict[str, Any]
    mode: str

class PIIAccessLogResponse(BaseModel):
    id: str
    actor_id: str
    resource_type: str
    resource_id: str
    accessed_fields: str
    accessed_at: str

    class Config:
        from_attributes = True

@router.post("/redact")
def redact_data(
    request: RedactRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    # If PII is accessed, write to PII access log
    pii_fields = []
    for k in ["candidate_name", "registration_number", "photo_url", "evaluator_id", "internal_audit_actor_id"]:
        if k in request.payload and request.payload[k] not in ["[REDACTED]", "[HIDDEN]", "[REDACTED_LEGAL]", None]:
            pii_fields.append(k)

    if pii_fields:
        log = PIIAccessLog(
            institution_id=inst_id,
            actor_id=current_user.id,
            resource_type=request.payload.get("resource_type", "GeneralObject"),
            resource_id=request.payload.get("resource_id", "GEN-001"),
            accessed_fields=",".join(pii_fields)
        )
        db.add(log)
        db.commit()

    return redact_payload(request.payload, request.mode)

@router.get("/policy")
def get_privacy_policy(
    current_user: UserResponse = Depends(get_current_user)
):
    return {
        "modes": ["PUBLIC_SAFE", "CANDIDATE_SAFE", "EVALUATOR_SAFE", "CENTER_SAFE", "AUDITOR_FULL", "LEGAL_EXPORT"],
        "pii_fields": ["candidate_name", "registration_number", "photo_url"],
        "secret_fields": ["evaluator_id", "internal_audit_actor_id"]
    }

@router.post("/validate-export")
def validate_export(
    request: ExportValidateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    payload = request.payload
    mode = request.mode

    # Check if there are unsafe fields in the payload for candidate_safe or other safe modes
    # An export is unsafe if it contains raw PII/Evaluator info and the mode is safe
    unsafe_fields = []
    
    if mode in ["CANDIDATE_SAFE", "PUBLIC_SAFE", "EVALUATOR_SAFE"]:
        for k in ["candidate_name", "photo_url", "evaluator_id", "internal_audit_actor_id"]:
            val = payload.get(k)
            # If the value exists and is NOT redacted/hidden
            if val and val not in ["[REDACTED]", "[HIDDEN]", "[REDACTED_LEGAL]"]:
                unsafe_fields.append(k)

    if unsafe_fields:
        # Register a privacy incident
        inc = SecurityIncident(
            institution_id=inst_id,
            incident_type="PII_EXPORT_ATTEMPT",
            severity="P1",
            description=f"Blocked unsafe export containing unredacted fields: {','.join(unsafe_fields)} under {mode} mode.",
            status="OPEN"
        )
        db.add(inc)
        db.commit()
        db.refresh(inc)

        evt = IncidentTimelineEvent(
            incident_id=inc.id,
            event_type="PRIVACY_EXPORT_VIOLATION",
            message=f"Export request by user {current_user.id} blocked due to unsafe fields: {','.join(unsafe_fields)}.",
            actor_id=current_user.id
        )
        db.add(evt)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export blocked. Reason: Contains PII and evaluator identity not allowed under {mode} mode."
        )

    return {"status": "VALID", "message": "Export validation checks passed."}

@router.get("/pii-access-log")
def get_pii_access_logs(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    return db.query(PIIAccessLog).filter(PIIAccessLog.institution_id == inst_id).all()
