import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any

from app.database import get_db
from app.models import (
    InstitutionReport, ReportSection, Candidate, 
    EncryptedPackage, IncidentReport, OMRManualReview, 
    EvaluationMark, Dispute
)
from app.security import calculate_sha256
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event, verify_audit_chain
from app.certificates.certificate_signer import sign_certificate_hash, verify_certificate_signature

from app.reports.schemas import InstitutionReportResponse

router = APIRouter(tags=["reports"])

@router.post("/api/reports/exam/{exam_id}/generate", response_model=InstitutionReportResponse)
def generate_institution_report(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    # Retrieve counts and summary stats
    candidates_count = db.query(Candidate).filter(Candidate.exam_id == exam_id).count()
    packages_count = db.query(EncryptedPackage).filter(EncryptedPackage.exam_id == exam_id).count()
    incidents_count = db.query(IncidentReport).filter(IncidentReport.exam_id == exam_id).count()
    omr_reviews_count = db.query(OMRManualReview).count()  # all OMR reviews
    evaluations_count = db.query(EvaluationMark).count()
    disputes_count = db.query(Dispute).filter(Dispute.exam_id == exam_id).count()

    audit_chain_intact, _, _ = verify_audit_chain(db)

    sections_map = {
        "overview": {
            "exam_id": exam_id,
            "generated_by": current_user.name,
            "timestamp": datetime.utcnow().isoformat()
        },
        "stats": {
            "total_candidates": candidates_count,
            "total_packages": packages_count,
            "total_incidents": incidents_count,
            "total_omr_reviews": omr_reviews_count,
            "total_evaluations": evaluations_count,
            "total_disputes": disputes_count
        },
        "audit_chain": {
            "intact": audit_chain_intact
        },
        "integrity_verdict": {
            "verdict": "VERIFIED" if audit_chain_intact else "FAILED"
        }
    }

    sections_str = json.dumps(sections_map, sort_keys=True)
    report_hash = calculate_sha256(sections_str)
    sig = sign_certificate_hash(report_hash)

    report = InstitutionReport(
        exam_id=exam_id,
        report_hash=report_hash,
        signature=sig
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Save sections
    for name, content in sections_map.items():
        sec = ReportSection(
            report_id=report.id,
            section_name=name,
            content=json.dumps(content)
        )
        db.add(sec)
    db.commit()

    log_event(
        db=db,
        actor_id=current_user.id,
        action="REPORT_GENERATED",
        resource_type="InstitutionReport",
        resource_id=report.id,
        payload_data=json.dumps({
            "report_id": report.id,
            "exam_id": exam_id,
            "report_hash": report_hash
        })
    )

    return report

@router.get("/api/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(InstitutionReport).filter(InstitutionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    sections = db.query(ReportSection).filter(ReportSection.report_id == report_id).all()
    sections_out = {}
    for s in sections:
        sections_out[s.section_name] = json.loads(s.content)

    return {
        "id": report.id,
        "exam_id": report.exam_id,
        "report_hash": report.report_hash,
        "signature": report.signature,
        "generated_at": report.generated_at.isoformat() if report.generated_at else None,
        "sections": sections_out
    }

@router.get("/api/reports/{report_id}/verify")
def verify_report_route(report_id: str, db: Session = Depends(get_db)):
    report = db.query(InstitutionReport).filter(InstitutionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    sections = db.query(ReportSection).filter(ReportSection.report_id == report_id).all()
    sections_map = {}
    for s in sections:
        sections_map[s.section_name] = json.loads(s.content)

    sections_str = json.dumps(sections_map, sort_keys=True)
    recalc_hash = calculate_sha256(sections_str)

    sig_valid = verify_certificate_signature(recalc_hash, report.signature)
    hash_valid = (recalc_hash == report.report_hash)

    return {
        "report_id": report_id,
        "is_valid": sig_valid and hash_valid,
        "signature_valid": sig_valid,
        "hash_valid": hash_valid
    }

@router.get("/api/reports/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db)):
    # Standard download is retrieve report
    return get_report(report_id, db)
