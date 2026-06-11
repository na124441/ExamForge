from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database import get_db
from app.models import OpsIncident, RateLimitEvent, AbuseEvent, DeploymentConfig
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

router = APIRouter(prefix="/api/ops", tags=["ops"])

class IncidentResolveRequest(BaseModel):
    notes: Optional[str] = None

class MaintenanceToggleRequest(BaseModel):
    is_active: bool
    description: Optional[str] = None

@router.get("/incidents")
def list_incidents(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    # Incidents can be system wide, allow PLATFORM_SUPER_ADMIN or filter by institution if CONTROLLER
    if current_user.role == "PLATFORM_SUPER_ADMIN":
        return db.query(OpsIncident).all()
    else:
        # CONTROLLER scopes to their tenant
        inst_id = current_user.institution_id or "INS-GENESIS"
        return db.query(OpsIncident).filter(OpsIncident.description.like(f"%{inst_id}%")).all()

@router.post("/incidents/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    incident = db.query(OpsIncident).filter(OpsIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    incident.status = "RESOLVED"
    incident.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "RESOLVED", "incident_id": incident_id}

@router.get("/rate-limits")
def list_rate_limit_events(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    return db.query(RateLimitEvent).all()

@router.get("/abuse-alerts")
def list_abuse_alerts(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    return db.query(AbuseEvent).all()

@router.post("/maintenance/toggle")
def toggle_maintenance_mode(
    request: MaintenanceToggleRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    # Set maintenance_mode flag in deployment_configs
    config = db.query(DeploymentConfig).filter(DeploymentConfig.config_key == "maintenance_mode").first()
    if not config:
        config = DeploymentConfig(config_key="maintenance_mode", config_value=str(request.is_active))
        db.add(config)
    else:
        config.config_value = str(request.is_active)
        
    db.commit()
    
    # Also log an incident if maintenance activated
    if request.is_active:
        inc = OpsIncident(
            incident_type="MAINTENANCE_LOCK",
            severity="P1",
            description=f"System set to maintenance mode. Reason: {request.description or 'Scheduled service'}"
        )
        db.add(inc)
        db.commit()
        
    return {"maintenance_mode": request.is_active}
