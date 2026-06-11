from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models import SecurityIncident, IncidentTimelineEvent
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.audit.ledger import log_event

router = APIRouter(prefix="/api/security-incidents", tags=["security-incidents"])

class IncidentReportRequest(BaseModel):
    incident_type: str # KEY_COMPROMISE, CROSS_TENANT_VIOLATION, etc.
    severity: str # P0, P1, P2
    description: str

class TriageRequest(BaseModel):
    notes: Optional[str] = None

class IncidentResponse(BaseModel):
    id: str
    institution_id: Optional[str]
    incident_type: str
    severity: str
    description: str
    status: str
    triaged_by: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True

class TimelineEventResponse(BaseModel):
    id: str
    incident_id: str
    event_type: str
    message: str
    actor_id: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

@router.post("/report", response_model=IncidentResponse)
def report_incident(
    request: IncidentReportRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    inc = SecurityIncident(
        institution_id=inst_id,
        incident_type=request.incident_type,
        severity=request.severity,
        description=request.description,
        status="OPEN"
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    # Log in incident timeline
    evt = IncidentTimelineEvent(
        incident_id=inc.id,
        event_type="INCIDENT_REPORTED",
        message=f"Incident reported: {request.description}",
        actor_id=current_user.id
    )
    db.add(evt)
    db.commit()

    return inc

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    return db.query(SecurityIncident).filter(SecurityIncident.institution_id == inst_id).all()

@router.post("/{incident_id}/triage", response_model=IncidentResponse)
def triage_incident(
    incident_id: str,
    request: TriageRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inc = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    guard_tenant_access(inc.institution_id)

    inc.status = "TRIAGED"
    inc.triaged_by = current_user.id
    
    evt = IncidentTimelineEvent(
        incident_id=incident_id,
        event_type="INCIDENT_TRIAGED",
        message=f"Incident triaged. Notes: {request.notes or 'No notes'}",
        actor_id=current_user.id
    )
    db.add(evt)
    db.commit()
    
    return inc

@router.post("/{incident_id}/contain", response_model=IncidentResponse)
def contain_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inc = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    guard_tenant_access(inc.institution_id)

    inc.status = "CONTAINED"
    
    evt = IncidentTimelineEvent(
        incident_id=incident_id,
        event_type="INCIDENT_CONTAINED",
        message="Incident marked CONTAINED. Containment measures active.",
        actor_id=current_user.id
    )
    db.add(evt)
    db.commit()
    
    return inc

@router.post("/{incident_id}/resolve", response_model=IncidentResponse)
def resolve_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inc = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    guard_tenant_access(inc.institution_id)

    inc.status = "RESOLVED"
    inc.resolved_at = datetime.now(timezone.utc)
    
    evt = IncidentTimelineEvent(
        incident_id=incident_id,
        event_type="INCIDENT_RESOLVED",
        message="Incident successfully RESOLVED. System lockdown lifted.",
        actor_id=current_user.id
    )
    db.add(evt)
    db.commit()
    
    return inc

@router.get("/{incident_id}/timeline", response_model=List[TimelineEventResponse])
def get_incident_timeline(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inc = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    guard_tenant_access(inc.institution_id)

    return db.query(IncidentTimelineEvent).filter(IncidentTimelineEvent.incident_id == incident_id).all()
