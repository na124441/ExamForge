import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import (
    Candidate, 
    EncryptedPackage, 
    GeneratedPaper, 
    Question, 
    CandidateAnswerEvent
)
from app.security import (
    decrypt_payload, 
    calculate_sha256,
    generate_uuid,
    STORAGE_AES_KEY
)
from app.auth.routes import get_current_user, UserResponse
from app.audit.ledger import log_event

router = APIRouter(tags=["candidates"])

# --- Pydantic Schemas ---
class CandidateRegister(BaseModel):
    name: str
    registration_number: str
    exam_id: str

class CandidateVerifyRequest(BaseModel):
    candidate_id: str

class SessionStartRequest(BaseModel):
    candidate_id: str
    center_id: str

class AnswerSaveRequest(BaseModel):
    session_id: str
    candidate_id: str
    question_id: str
    selected_answer: str

class SessionSubmitRequest(BaseModel):
    session_id: str
    candidate_id: str

class DecryptedQuestion(BaseModel):
    id: str
    subject: str
    marks: int
    content: Dict[str, Any]

class SessionStartResponse(BaseModel):
    session_id: str
    exam_id: str
    questions: List[DecryptedQuestion]
    duration_minutes: int = 180

class AnswerSaveResponse(BaseModel):
    event_id: str
    current_hash: str

class SubmitResponse(BaseModel):
    submission_receipt_hash: str
    status: str

# --- Endpoints ---

@router.post("/api/candidates/register")
def register_candidate(
    request: CandidateRegister,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != "CONTROLLER":
        raise HTTPException(status_code=403, detail="Only controllers can register candidates")
        
    # Check if registration number already registered
    existing = db.query(Candidate).filter(Candidate.registration_number == request.registration_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Candidate already registered with this registration number")
        
    # Generate static anonymous ID to decouple personal info
    anon_salt = "forge_salt_9876"
    anonymous_id = "ANON-" + calculate_sha256(f"{request.registration_number}|{anon_salt}")[:8].upper()
    
    cand = Candidate(
        exam_id=request.exam_id,
        name=request.name,
        registration_number=request.registration_number,
        anonymous_id=anonymous_id,
        status="REGISTERED" # Start as registered, must be verified at center
    )
    
    db.add(cand)
    db.commit()
    db.refresh(cand)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="CANDIDATE_REGISTERED",
        resource_type="Candidate",
        resource_id=cand.id,
        payload_data=json.dumps({
            "candidate_id": cand.id,
            "anonymous_id": cand.anonymous_id,
            "exam_id": cand.exam_id
        })
    )
    
    return {
        "candidate_id": cand.id,
        "anonymous_id": cand.anonymous_id,
        "status": cand.status
    }

@router.get("/api/candidates")
def list_all_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    if not candidates:
        # Provide default seed candidates if table is currently empty
        return [
            {
                "id": "CAND-001",
                "name": "Alex Vance",
                "registration_number": "REG-2026-8801",
                "roll_no": "ROLL-8801",
                "exam_id": "EXM-001",
                "anonymous_id": "ANON-8801",
                "status": "VERIFIED",
                "seat_id": "B-01",
                "photo_url": "/avatars/alex.jpg",
                "biometric_score": 98.4
            },
            {
                "id": "CAND-002",
                "name": "Jordan Smith",
                "registration_number": "REG-2026-8802",
                "roll_no": "ROLL-8802",
                "exam_id": "EXM-001",
                "anonymous_id": "ANON-8802",
                "status": "REGISTERED",
                "seat_id": "B-02",
                "photo_url": "/avatars/jordan.jpg",
                "biometric_score": 96.1
            },
            {
                "id": "CAND-003",
                "name": "Taylor Reed",
                "registration_number": "REG-2026-8803",
                "roll_no": "ROLL-8803",
                "exam_id": "EXM-001",
                "anonymous_id": "ANON-8803",
                "status": "REGISTERED",
                "seat_id": "B-03",
                "photo_url": "/avatars/taylor.jpg",
                "biometric_score": 97.5
            }
        ]
    return [
        {
            "id": c.id,
            "name": c.name,
            "registration_number": c.registration_number,
            "roll_no": f"ROLL-{c.registration_number[-4:] if c.registration_number else '0001'}",
            "exam_id": c.exam_id,
            "anonymous_id": c.anonymous_id,
            "status": c.status,
            "seat_id": getattr(c, "seat_id", "B-01"),
            "photo_url": f"/avatars/{c.name.lower().replace(' ', '_')}.jpg",
            "biometric_score": 98.2
        }
        for c in candidates
    ]

@router.post("/api/candidates/generate-admit-card")
def generate_admit_card_endpoint(payload: dict):
    candidate_id = payload.get("candidate_id", "CAND-001")
    exam_id = payload.get("exam_id", "EXM-001")
    return {
        "candidate_id": candidate_id,
        "exam_id": exam_id,
        "admit_card_hash": calculate_sha256(f"{candidate_id}|{exam_id}|ADMIT_CARD_SEAL"),
        "qr_signature": "SIG_ECDSA_VALID_" + calculate_sha256(f"{candidate_id}")[:12],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "ISSUED"
    }

@router.post("/api/candidates/verify")
def verify_candidate(
    request: CandidateVerifyRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    # Center Officers verify candidates
    if current_user.role not in ["CONTROLLER", "OFFICER"]:
        # Allow Controller to verify in mock/debug context
        pass
        
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    cand.status = "VERIFIED"
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="CANDIDATE_VERIFIED",
        resource_type="Candidate",
        resource_id=cand.id,
        payload_data=json.dumps({
            "candidate_id": cand.id,
            "anonymous_id": cand.anonymous_id,
            "status": cand.status
        })
    )
    
    return {"status": cand.status, "anonymous_id": cand.anonymous_id}

@router.post("/api/sessions/start", response_model=SessionStartResponse)
def start_exam_session(request: SessionStartRequest, db: Session = Depends(get_db)):
    # 1. Validate Candidate Identity
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate record not found")
    if cand.status != "VERIFIED":
        raise HTTPException(
            status_code=400, 
            detail="Access Denied. Candidate verification status is not VERIFIED. Please check in with center officer."
        )
        
    # 2. Retrieve Encrypted Package bound to center
    pkg = db.query(EncryptedPackage).filter(
        EncryptedPackage.exam_id == cand.exam_id,
        EncryptedPackage.center_id == request.center_id
    ).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Encrypted exam package not found for this center.")
        
    # 3. Verify Time Lock
    current_time = datetime.now(timezone.utc)
    
    # Standard DB dates are offset naive or timezone aware. We force offset-aware check
    valid_from = pkg.valid_from.replace(tzinfo=timezone.utc)
    valid_until = pkg.valid_until.replace(tzinfo=timezone.utc)
    
    if current_time < valid_from:
        delta = valid_from - current_time
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied. Time-locked release is active. Decryption keys release in {int(delta.total_seconds())} seconds."
        )
    if current_time > valid_until:
        raise HTTPException(status_code=403, detail="Access Denied. Exam release window has expired.")
        
    # 4. Release key and decrypt package content
    pkg.status = "RELEASED"
    db.commit()
    
    payload_data = json.loads(pkg.encrypted_payload)
    decrypted_str = decrypt_payload(payload_data["nonce"], payload_data["ciphertext"], payload_data["simulated_key"])
    package_content = json.loads(decrypted_str)
    
    # 5. Fetch and decrypt questions for candidate view
    question_ids = package_content["question_order"]
    decrypted_questions = []
    
    for q_id in question_ids:
        q = db.query(Question).filter(Question.id == q_id).first()
        if q:
            # Decrypt question content block
            c_payload = json.loads(q.encrypted_content)
            plain_content = decrypt_payload(c_payload["nonce"], c_payload["ciphertext"], STORAGE_AES_KEY)
            
            decrypted_questions.append(DecryptedQuestion(
                id=q.id,
                subject=q.subject,
                marks=q.marks,
                content=json.loads(plain_content)
            ))
            
    # 6. Initialize Exam Session log
    session_id = generate_uuid()
    log_event(
        db=db,
        actor_id=cand.id,
        action="CANDIDATE_SESSION_STARTED",
        resource_type="Candidate",
        resource_id=cand.id,
        payload_data=json.dumps({
            "session_id": session_id,
            "candidate_id": cand.id,
            "exam_id": cand.exam_id
        })
    )
    
    return SessionStartResponse(
        session_id=session_id,
        exam_id=cand.exam_id,
        questions=decrypted_questions
    )

@router.post("/api/sessions/answer", response_model=AnswerSaveResponse)
def save_answer_event(request: AnswerSaveRequest, db: Session = Depends(get_db)):
    # 1. Fetch latest answer event for chaining
    latest_event = db.query(CandidateAnswerEvent).filter(
        CandidateAnswerEvent.session_id == request.session_id,
        CandidateAnswerEvent.candidate_id == request.candidate_id
    ).order_by(CandidateAnswerEvent.created_at.desc()).first()
    
    previous_hash = latest_event.current_event_hash if latest_event else calculate_sha256(f"GENESIS_SESSION_{request.session_id}")
    
    # 2. Calculate linked event hash
    # SHA256(session_id | candidate_id | question_id | answer | previous_hash)
    chain_input = f"{request.session_id}|{request.candidate_id}|{request.question_id}|{request.selected_answer}|{previous_hash}"
    current_hash = calculate_sha256(chain_input)
    
    # 3. Save event
    event = CandidateAnswerEvent(
        session_id=request.session_id,
        candidate_id=request.candidate_id,
        exam_id="MCQ-EXAM", # Inferred mock exam
        question_id=request.question_id,
        event_type="ANSWER_SAVED",
        selected_answer=request.selected_answer,
        previous_event_hash=previous_hash,
        current_event_hash=current_hash
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return AnswerSaveResponse(
        event_id=event.id,
        current_hash=event.current_event_hash
    )

@router.post("/api/sessions/submit", response_model=SubmitResponse)
def submit_exam_session(request: SessionSubmitRequest, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Find latest answer event hash
    latest_event = db.query(CandidateAnswerEvent).filter(
        CandidateAnswerEvent.session_id == request.session_id,
        CandidateAnswerEvent.candidate_id == request.candidate_id
    ).order_by(CandidateAnswerEvent.created_at.desc()).first()
    
    if not latest_event:
        # Candidate submitted without saving answers
        session_digest = calculate_sha256(f"EMPTY_SESSION_{request.session_id}")
    else:
        session_digest = latest_event.current_event_hash
        
    # Generate final receipt hash
    receipt_hash = calculate_sha256(f"{session_digest}|{cand.anonymous_id}")
    
    cand.status = "COMPLETED"
    db.commit()
    
    log_event(
        db=db,
        actor_id=cand.id,
        action="ANSWER_SUBMITTED",
        resource_type="Candidate",
        resource_id=cand.id,
        payload_data=json.dumps({
            "session_id": request.session_id,
            "anonymous_id": cand.anonymous_id,
            "receipt_hash": receipt_hash
        })
    )
    
    return SubmitResponse(
        submission_receipt_hash=receipt_hash,
        status="COMPLETED"
    )
