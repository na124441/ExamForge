from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Candidate, EncryptedPackage, IncidentReport, SeatAssignment
from app.exams.lifecycle import get_exam_state
from app.trust.score_engine import calculate_exam_trust_score
from app.publication.gate import verify_publication_gate

router = APIRouter(tags=["ops"])

@router.get("/api/ops/exam-ops-summary/{exam_id}")
def get_exam_ops_summary(exam_id: str, db: Session = Depends(get_db)):
    # 1. Exam lifecycle state
    state = get_exam_state(db, exam_id)
    
    # 2. Query candidates
    candidates = db.query(Candidate).filter(Candidate.exam_id == exam_id).all()
    total_cands = len(candidates)
    verified_cands = sum(1 for c in candidates if c.status in ["VERIFIED", "COMPLETED"])
    completed_cands = sum(1 for c in candidates if c.status == "COMPLETED")
    
    # 3. Query packages
    packages = db.query(EncryptedPackage).filter(EncryptedPackage.exam_id == exam_id).all()
    unique_centers = list(set(pkg.center_id for pkg in packages))
    
    sealed_count = sum(1 for pkg in packages if pkg.status == "SEALED")
    released_count = sum(1 for pkg in packages if pkg.status == "RELEASED")
    revoked_count = sum(1 for pkg in packages if pkg.status == "REVOKED")
    
    # 4. Query incidents
    incidents = db.query(IncidentReport).filter(IncidentReport.exam_id == exam_id).all()
    unresolved_incidents = sum(1 for r in incidents if r.status == "OPEN")
    
    # 5. Query trust score and publication gate
    trust_report = calculate_exam_trust_score(db, exam_id)
    gate_report = verify_publication_gate(db, exam_id)
    
    # 6. Aggregate Center Table Details
    center_details = []
    for center_id in unique_centers:
        center_pkg = next((pkg for pkg in packages if pkg.center_id == center_id), None)
        center_incidents = sum(1 for r in incidents if r.center_id == center_id and r.status == "OPEN")
        center_total_incidents = sum(1 for r in incidents if r.center_id == center_id)
        
        # Count center verified candidates
        center_verified = db.query(Candidate).filter(
            Candidate.exam_id == exam_id,
            Candidate.status.in_(["VERIFIED", "COMPLETED"])
        ).count() # Simplified, maps candidates in the system
        
        # Check package status
        pkg_status = center_pkg.status if center_pkg else "NO_PACKAGE"
        
        # Center status
        center_status = "ONLINE" if pkg_status == "RELEASED" else "READY"
        if center_incidents > 0:
            center_status = "WARNING"
            
        center_details.append({
            "center_id": center_id,
            "package_status": pkg_status,
            "verified_candidates": center_verified,
            "incidents_count": center_total_incidents,
            "unresolved_incidents": center_incidents,
            "status": center_status
        })
        
    return {
        "exam_id": exam_id,
        "exam_state": state,
        "stats": {
            "total_centers": len(unique_centers),
            "total_candidates": total_cands,
            "verified_candidates": verified_cands,
            "attendance_present": verified_cands, # Mock attendance rate
            "attendance_absent": max(0, total_cands - verified_cands),
            "packages_sealed": sealed_count,
            "packages_released": released_count,
            "packages_revoked": revoked_count,
            "unresolved_incidents": unresolved_incidents,
            "submission_completed": completed_cands,
            "submission_pending": max(0, verified_cands - completed_cands)
        },
        "trust_score": trust_report["trust_score"],
        "publication_allowed": gate_report["allowed"],
        "centers": center_details
    }
