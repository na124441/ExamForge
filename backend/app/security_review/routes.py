from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json

from app.database import get_db
from app.models import ThreatModel
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

router = APIRouter(prefix="/api/security/threats", tags=["security-review"])

class ThreatCreateRequest(BaseModel):
    threat_id: str
    category: str
    asset: str
    attack_vector: str
    impact: str # LOW, MEDIUM, HIGH, CRITICAL
    likelihood: str # LOW, MEDIUM, HIGH
    mitigation: List[str]
    status: Optional[str] = "UNMITIGATED"

class ThreatUpdateRequest(BaseModel):
    status: Optional[str] = None
    mitigation: Optional[List[str]] = None
    impact: Optional[str] = None
    likelihood: Optional[str] = None

class ThreatResponse(BaseModel):
    id: str
    institution_id: Optional[str]
    threat_id: str
    category: str
    asset: str
    attack_vector: str
    impact: str
    likelihood: str
    mitigation: Optional[str]
    status: str

    class Config:
        orm_mode = True

@router.post("/create", response_model=ThreatResponse)
def create_threat(
    request: ThreatCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    # Check if duplicate threat_id
    existing = db.query(ThreatModel).filter(ThreatModel.threat_id == request.threat_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Threat ID already exists.")

    threat = ThreatModel(
        institution_id=inst_id,
        threat_id=request.threat_id,
        category=request.category,
        asset=request.asset,
        attack_vector=request.attack_vector,
        impact=request.impact,
        likelihood=request.likelihood,
        mitigation=json.dumps(request.mitigation),
        status=request.status
    )
    db.add(threat)
    db.commit()
    db.refresh(threat)
    return threat

@router.get("", response_model=List[ThreatResponse])
def list_threats(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    return db.query(ThreatModel).filter(ThreatModel.institution_id == inst_id).all()

@router.get("/risk-summary")
def get_risk_summary(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)

    threats = db.query(ThreatModel).filter(ThreatModel.institution_id == inst_id).all()
    
    critical_unmitigated = 0
    total_mitigated = 0
    total_unmitigated = 0
    
    for t in threats:
        if t.status == "MITIGATED":
            total_mitigated += 1
        else:
            total_unmitigated += 1
            if t.impact in ["CRITICAL", "HIGH"]:
                critical_unmitigated += 1
                
    return {
        "total_threats": len(threats),
        "mitigated": total_mitigated,
        "unmitigated": total_unmitigated,
        "critical_unmitigated": critical_unmitigated,
        "readiness_score": 100 - (critical_unmitigated * 20) - (total_unmitigated * 5)
    }

@router.get("/{threat_id}", response_model=ThreatResponse)
def get_threat(
    threat_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    threat = db.query(ThreatModel).filter(ThreatModel.threat_id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found.")
    guard_tenant_access(threat.institution_id)
    return threat

@router.patch("/{threat_id}", response_model=ThreatResponse)
def update_threat(
    threat_id: str,
    request: ThreatUpdateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    threat = db.query(ThreatModel).filter(ThreatModel.threat_id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found.")
    guard_tenant_access(threat.institution_id)

    if request.status is not None:
        threat.status = request.status
    if request.mitigation is not None:
        threat.mitigation = json.dumps(request.mitigation)
    if request.impact is not None:
        threat.impact = request.impact
    if request.likelihood is not None:
        threat.likelihood = request.likelihood

    db.commit()
    db.refresh(threat)
    return threat
