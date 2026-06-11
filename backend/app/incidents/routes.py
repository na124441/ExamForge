import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import IncidentReport
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event
from app.security import calculate_sha256

router = APIRouter(tags=["incidents"])

class IncidentReportRequest(BaseModel):
    exam_id: str
    center_id: str
    incident_type: str # e.g. SUSPICIOUS_BEHAVIOR, LATE_ENTRY, OMR_DAMAGE, etc.
    severity: str # INFO, LOW, MEDIUM, HIGH, P0_CRITICAL
    description: str
    evidence_text: Optional[str] = ""

class IncidentResolveRequest(BaseModel):
    resolution_notes: str
    evidence_text: Optional[str] = ""

class IncidentEscalateRequest(BaseModel):
    severity: str

@router.post("/api/incidents/report")
def report_incident(
    request: IncidentReportRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["OFFICER", "INVIGILATOR", "CONTROLLER"]))
):
    sev = request.severity.upper()
    if sev not in ["INFO", "LOW", "MEDIUM", "HIGH", "P0_CRITICAL"]:
        raise HTTPException(status_code=400, detail="Invalid severity index level.")
        
    e_hash = calculate_sha256(request.evidence_text) if request.evidence_text else None
    
    incident = IncidentReport(
        exam_id=request.exam_id,
        center_id=request.center_id,
        reported_by=current_user.id,
        incident_type=request.incident_type.upper(),
        severity=sev,
        description=request.description,
        evidence_hash=e_hash,
        status="OPEN"
    )
    
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="INCIDENT_REPORTED",
        resource_type="IncidentReport",
        resource_id=incident.id,
        payload_data=json.dumps({
            "incident_id": incident.id,
            "incident_type": incident.incident_type,
            "severity": incident.severity,
            "evidence_hash": e_hash
        })
    )
    
    return {"status": "OPEN", "incident_id": incident.id}

@router.get("/api/incidents")
def list_incidents(db: Session = Depends(get_db)):
    reports = db.query(IncidentReport).order_by(IncidentReport.created_at.desc()).all()
    return [{
        "incident_id": r.id,
        "exam_id": r.exam_id,
        "center_id": r.center_id,
        "reported_by": r.reported_by,
        "incident_type": r.incident_type,
        "severity": r.severity,
        "description": r.description,
        "evidence_hash": r.evidence_hash,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        "resolution_notes": r.resolution_notes
    } for r in reports]

@router.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(IncidentReport).filter(IncidentReport.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident report not found")
    return incident

@router.post("/api/incidents/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    request: IncidentResolveRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    incident = db.query(IncidentReport).filter(IncidentReport.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident report not found")
        
    incident.status = "RESOLVED"
    incident.resolved_at = datetime.now(timezone.utc)
    incident.resolution_notes = request.resolution_notes
    if request.evidence_text:
        incident.evidence_hash = calculate_sha256(request.evidence_text)
        
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="INCIDENT_RESOLVED",
        resource_type="IncidentReport",
        resource_id=incident_id,
        payload_data=json.dumps({
            "incident_id": incident_id,
            "resolution_notes": request.resolution_notes,
            "resolved_at": incident.resolved_at.isoformat()
        })
    )
    
    return {"status": "RESOLVED", "incident_id": incident_id}

@router.post("/api/incidents/{incident_id}/escalate")
def escalate_incident(
    incident_id: str,
    request: IncidentEscalateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    incident = db.query(IncidentReport).filter(IncidentReport.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident report not found")
        
    sev = request.severity.upper()
    if sev not in ["INFO", "LOW", "MEDIUM", "HIGH", "P0_CRITICAL"]:
        raise HTTPException(status_code=400, detail="Invalid severity level.")
        
    old_sev = incident.severity
    incident.severity = sev
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="INCIDENT_ESCALATED",
        resource_type="IncidentReport",
        resource_id=incident_id,
        payload_data=json.dumps({
            "incident_id": incident_id,
            "previous_severity": old_sev,
            "new_severity": sev
        })
    )
    
    return {"status": incident.status, "incident_id": incident_id, "severity": sev}
