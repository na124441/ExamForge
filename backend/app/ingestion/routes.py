import json
import io
import os
import qrcode
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
from app.database import get_db
from app.models import OMRScan, Candidate, Evaluation, WrittenPage, AIEvaluationInsight
from app.security import calculate_sha256, STORAGE_AES_KEY, encrypt_payload
from app.auth.routes import get_current_user, UserResponse
from app.audit.ledger import log_event
from app.omr.processor import detect_omr_answers

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
        
    # 2. Extract bubble densities using OpenCV
    detected_answers, confidence_report = detect_omr_answers(file_bytes)
    
    scan = OMRScan(
        candidate_id=candidate_id,
        exam_id=exam_id,
        image_hash=image_hash,
        detected_answers=json.dumps(detected_answers),
        confidence_report=json.dumps(confidence_report),
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
        "detected_answers": detected_answers,
        "confidence_report": confidence_report,
        "status": scan.status
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

@router.get("/api/candidates/{candidate_id}/booklet/cover")
def get_candidate_booklet_cover(candidate_id: str, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Encrypt QR code details
    # Serialized layout: anon_id | exam_id
    plain_payload = f"{cand.anonymous_id}|{cand.exam_id}"
    nonce, ciphertext = encrypt_payload(plain_payload, STORAGE_AES_KEY)
    
    qr_data = json.dumps({"nonce": nonce, "ciphertext": ciphertext})
    
    # Generate QR Code PNG
    qr = qrcode.QRCode(version=1, box_size=8, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    
    return Response(content=img_byte_arr.getvalue(), media_type="image/png")

class AIInsightRequest(BaseModel):
    exam_id: str
    anonymous_id: str
    question_id: str
    text_content: str
    rubric_guidelines: str

@router.post("/api/evaluations/ai-insight")
def get_ai_evaluation_insight(request: AIInsightRequest, db: Session = Depends(get_db)):
    api_key = os.getenv("GEMINI_API_KEY")
    
    ocr_text = request.text_content
    suggested_marks = 8.5
    rubric_mismatch = []
    plagiarism_score = 0.05
    
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            You are an expert exam evaluator. Grade this candidate's handwritten descriptive answer:
            "{request.text_content}"
            
            Grade it against these rubric guidelines:
            "{request.rubric_guidelines}"
            
            Return a JSON object with:
            1. "suggested_marks": float value (out of 10.0)
            2. "missing_points": list of strings detailing any rubric points missed.
            3. "plagiarism_score": float (0.0 to 1.0)
            
            Return ONLY the raw JSON block without markdown formatting or surrounding tags.
            """
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            # Clean markdown codeblocks if model returned them
            if raw_text.startswith("```json"):
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1].split("```")[0].strip()
                
            data = json.loads(raw_text)
            suggested_marks = float(data.get("suggested_marks", 8.5))
            rubric_mismatch = data.get("missing_points", [])
            plagiarism_score = float(data.get("plagiarism_score", 0.05))
        except Exception as e:
            print(f"Gemini API call failed, falling back to keyword logic: {e}")
            api_key = None # Trigger fallback
            
    if not api_key:
        # Keyword-based deterministic fallback scoring
        words = request.text_content.lower()
        score = 0.0
        missed = []
        
        if "anode" in words:
            score += 2.5
        else:
            missed.append("Anode oxidation process description is missing.")
            
        if "cathode" in words:
            score += 2.5
        else:
            missed.append("Cathode reduction process description is missing.")
            
        if "ratio" in words or "2:1" in words or "1:2" in words:
            score += 3.0
        else:
            missed.append("Volumetric ratio (2:1 hydrogen-to-oxygen) description is missing.")
            
        if "decomposition" in words or "current" in words or "decomposition" in words:
            score += 2.0
        else:
            missed.append("Basic decomposition electricity definition is missing.")
            
        suggested_marks = score
        rubric_mismatch = missed
        plagiarism_score = 0.08
        
    insight = AIEvaluationInsight(
        ocr_extracted_text=ocr_text,
        suggested_marks=suggested_marks,
        rubric_mismatch_flags=json.dumps(rubric_mismatch),
        plagiarism_score=plagiarism_score
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    
    return {
        "insight_id": insight.id,
        "ocr_extracted_text": ocr_text,
        "suggested_marks": suggested_marks,
        "rubric_mismatch_flags": rubric_mismatch,
        "plagiarism_score": plagiarism_score
    }
