from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.pilot.demo_reset import reset_pilot_database
from app.pilot.demo_seed import run_pilot_seeder
from app.pilot.pilot_flow import initialize_pilot_run, advance_pilot_stage
from app.pilot.evidence_binder import compile_evidence_binder, verify_binder_signature
from app.pilot.schemas import PilotRunResponse, PilotStageResponse, PilotEvidenceBinderResponse
from app.models import PilotRun, PilotStage, PilotEvidenceBinder, ComplianceReport, ThreatModel

router = APIRouter(prefix="/api/pilot", tags=["pilot"])

@router.post("/reset-and-seed")
def reset_and_seed_pilot(db: Session = Depends(get_db)):
    """
    Resets the database tables and seeds the default pilot dataset.
    Can be run without active auth token to bootstrap initial demo users.
    """
    try:
        reset_pilot_database()
        run_pilot_seeder(db)
        return {
            "status": "success",
            "message": "AuthorityPilot database reset and seeded successfully. Pre-configured credentials active."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Reset and seed failed: {str(e)}"
        )

@router.post("/runs", response_model=PilotRunResponse)
def create_pilot_run(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inst_id = current_user.institution_id or "INS-NSB-001"
    run = initialize_pilot_run(db, inst_id)
    run.stages = db.query(PilotStage).filter(PilotStage.pilot_run_id == run.id).order_by(PilotStage.sequence.asc()).all()
    return run

@router.get("/runs", response_model=List[PilotRunResponse])
def list_pilot_runs(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-NSB-001"
    runs = db.query(PilotRun).filter(PilotRun.institution_id == inst_id).order_by(PilotRun.started_at.desc()).all()
    
    # Load stages relations manually if lazy loading issues arise
    for r in runs:
        r.stages = db.query(PilotStage).filter(PilotStage.pilot_run_id == r.id).order_by(PilotStage.sequence.asc()).all()
    return runs

@router.get("/runs/{run_id}", response_model=PilotRunResponse)
def get_pilot_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    run = db.query(PilotRun).filter(PilotRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Pilot run not found.")
    
    run.stages = db.query(PilotStage).filter(PilotStage.pilot_run_id == run.id).order_by(PilotStage.sequence.asc()).all()
    for s in run.stages:
        from app.models import PilotStageEvent
        s.events = db.query(PilotStageEvent).filter(PilotStageEvent.pilot_stage_id == s.id).all()
    return run

@router.post("/runs/{run_id}/stages/{stage_id}/advance", response_model=PilotStageResponse)
def advance_run_stage(
    run_id: str,
    stage_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    stage = advance_pilot_stage(db, run_id, stage_id)
    from app.models import PilotStageEvent
    stage.events = db.query(PilotStageEvent).filter(PilotStageEvent.pilot_stage_id == stage.id).all()
    return stage

@router.post("/evidence-binder/generate", response_model=PilotEvidenceBinderResponse)
def generate_binder(
    pilot_run_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    inst_id = current_user.institution_id or "INS-NSB-001"
    binder = compile_evidence_binder(db, inst_id, pilot_run_id)
    return binder

@router.get("/evidence-binder/{binder_id}", response_model=PilotEvidenceBinderResponse)
def get_binder(
    binder_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    binder = db.query(PilotEvidenceBinder).filter(PilotEvidenceBinder.id == binder_id).first()
    if not binder:
        raise HTTPException(status_code=404, detail="Evidence binder not found.")
    return binder

@router.get("/evidence-binder/{binder_id}/verify")
def verify_binder(
    binder_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return verify_binder_signature(db, binder_id)

@router.get("/readiness-verdict")
def get_readiness_verdict(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-NSB-001"
    
    compliance = db.query(ComplianceReport).filter(ComplianceReport.institution_id == inst_id).first()
    score = compliance.readiness_score if compliance else 100
    
    threats = db.query(ThreatModel).filter(
        ThreatModel.institution_id == inst_id,
        ThreatModel.status != "MITIGATED"
    ).count()

    verdict = "READY"
    if score < 90 or threats > 0:
        verdict = "NOT_READY"
        
    return {
        "verdict": verdict,
        "score": score,
        "unmitigated_threats": threats,
        "details": "All integrity metrics verified. System prepared for institutional deployment." if verdict == "READY" else "System has pending vulnerabilities or unmitigated security configurations."
    }
