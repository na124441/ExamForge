import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
from app.database import get_db
from app.models import OMRScan, Candidate, Evaluation, WrittenPage
from app.security import calculate_sha256
from app.auth.routes import get_current_user, UserResponse
from app.audit.ledger import log_event

router = APIRouter(tags=["ingestion"])

# --- Pydantic Schemas ---
class OMRUploadRequest(BaseModel):
    candidate_id: str
    exam_id: str
    image_name: str

class WrittenBookletCreateRequest(BaseModel):
    candidate_id: str
    exam_id: str
    total_pages: int

class EvaluationSubmitRequest(BaseModel):
    exam_id: str
    anonymous_id: str
    question_id: str
    marks_awarded: float
    max_marks: float
    rubric_notes: str

# --- Endpoints ---

@router.post("/api/omr/scans/upload")
def upload_omr_scan(
    candidate_id: str = Form(...),
    exam_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    # Center Officer uploads scanned bubble sheets
    if current_user.role not in ["CONTROLLER", "OFFICER"]:
        pass

    # Read file and generate mock hash
    file_bytes = file.file.read()
    image_hash = calculate_sha256(file_bytes.decode('latin-1', errors='ignore'))
    
    # 1. Fetch Candidate
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # 2. Simulate OMR Scanner extraction
    # Standard OMR detection result mockup
    mock_detected_answers = {
        "Q1": "A",
        "Q2": "C",
        "Q3": "AMBIGUOUS" # Flagged bubble
    }
    mock_confidence_report = {
        "Q1": 0.98,
        "Q2": 0.94,
        "Q3": 0.52
    }
    
    scan = OMRScan(
        candidate_id=candidate_id,
        exam_id=exam_id,
        image_hash=image_hash,
        detected_answers=json.dumps(mock_detected_answers),
        confidence_report=json.dumps(mock_confidence_report),
        status="PROCESSED"
    )
    
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # Write to Audit Ledger
    log_event(
        db=db,
        actor_id=current_user.id,
        action="OMR_SCANNED",
        resource_type="OMRScan",
        resource_id=scan.id,
        payload_data=json.dumps({
            "candidate_anonymous_id": cand.anonymous_id,
            "image_hash": image_hash,
            "scan_id": scan.id
        })
    )
    
    return {
        "scan_id": scan.id,
        "image_hash": image_hash,
        "detected_answers": mock_detected_answers,
        "confidence_report": mock_confidence_report,
        "status": scan.status
    }

@router.post("/api/written/booklets/create")
def upload_written_pages(
    request: WrittenBookletCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role not in ["CONTROLLER", "OFFICER"]:
        pass
        
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    booklet_id = f"WBK-{calculate_sha256(cand.anonymous_id)[:8].upper()}"
    
    # Insert mock pages
    for i in range(1, request.total_pages + 1):
        page_hash = calculate_sha256(f"MOCK_IMAGE_PAGE_{i}_{booklet_id}")
        wp = WrittenPage(
            booklet_id=booklet_id,
            page_number=i,
            image_hash=page_hash
        )
        db.add(wp)
        
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="WRITTEN_BOOKLET_CREATED",
        resource_type="WrittenBooklet",
        resource_id=booklet_id,
        payload_data=json.dumps({
            "booklet_id": booklet_id,
            "anonymous_id": cand.anonymous_id,
            "total_pages": request.total_pages
        })
    )
    
    return {
        "booklet_id": booklet_id,
        "anonymous_id": cand.anonymous_id,
        "total_pages": request.total_pages
    }

@router.post("/api/evaluations/submit")
def submit_evaluation(
    request: EvaluationSubmitRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != "EVALUATOR":
        raise HTTPException(status_code=403, detail="Access Denied. Only evaluators can grade booklets.")
        
    # Calculate evaluation hash: SHA256(exam_id | anon_id | question_id | marks | evaluator_id)
    eval_input = f"{request.exam_id}|{request.anonymous_id}|{request.question_id}|{request.marks_awarded}|{current_user.id}"
    evaluation_hash = calculate_sha256(eval_input)
    
    evaluation = Evaluation(
        exam_id=request.exam_id,
        anonymous_id=request.anonymous_id,
        evaluator_id=current_user.id,
        question_id=request.question_id,
        marks_awarded=request.marks_awarded,
        max_marks=request.max_marks,
        evaluation_hash=evaluation_hash,
        status="LOCKED"
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="EVALUATION_LOCKED",
        resource_type="Evaluation",
        resource_id=evaluation.id,
        payload_data=json.dumps({
            "anonymous_id": evaluation.anonymous_id,
            "question_id": evaluation.question_id,
            "marks_awarded": evaluation.marks_awarded,
            "evaluation_hash": evaluation_hash
        })
    )
    
    return {
        "evaluation_id": evaluation.id,
        "evaluation_hash": evaluation_hash,
        "status": evaluation.status
    }
