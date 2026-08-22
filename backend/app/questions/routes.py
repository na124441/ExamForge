import json
import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import Question, PaperBlueprint, GeneratedPaper, EncryptedPackage
from app.security import (
    encrypt_payload, 
    decrypt_payload, 
    generate_aes_key, 
    calculate_sha256,
    generate_uuid,
    STORAGE_AES_KEY
)
from app.auth.dependencies import (
    require_authenticated_principal,
    require_permission,
    AuthenticatedPrincipal
)
from app.audit.ledger import log_event
from app.config import settings
from app.questions.generator import (
    generate_questions_with_ollama,
    list_available_models,
    OLLAMA_HOST
)

router = APIRouter(tags=["questions"])

# --- Pydantic Schemas ---
class QuestionCreate(BaseModel):
    subject: str
    topic: str
    difficulty: str # EASY, MEDIUM, HARD
    question_type: str # MCQ_SINGLE, WRITTEN
    marks: int
    content: Dict[str, Any] # e.g. {"text": "...", "options": {"A": "...", "B": "..."}}
    answer: str # e.g. "A" or descriptive rubric

class QuestionResponse(BaseModel):
    id: str
    subject: str
    topic: str
    difficulty: str
    question_type: str
    marks: int
    status: str
    content_hash: str

class AIGenerateRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str = "MEDIUM"
    count: int = 5
    model: str = "phi:latest"
    question_type: str = "MCQ_SINGLE"
    custom_instructions: Optional[str] = None
    auto_save_to_bank: bool = True

class AIGeneratedQuestion(BaseModel):
    id: Optional[str] = None
    text: str
    options: Dict[str, str]
    answer: str
    explanation: str
    difficulty: str
    marks: int
    content_hash: str
    status: str = "GENERATED"

class AIGenerateResponse(BaseModel):
    subject: str
    topic: str
    difficulty: str
    model_used: str
    count: int
    questions: List[AIGeneratedQuestion]
    saved_to_bank: bool
    ollama_endpoint: str

AIGenerateRequest.model_rebuild()
AIGeneratedQuestion.model_rebuild()
AIGenerateResponse.model_rebuild()

class BlueprintCreate(BaseModel):
    total_marks: int
    total_questions: int
    duration_minutes: int
    subject_distribution: Dict[str, int] # e.g. {"Science": 5, "Math": 5}
    difficulty_distribution: Dict[str, int] # e.g. {"EASY": 40, "MEDIUM": 40, "HARD": 20} (percentages)

class BlueprintResponse(BaseModel):
    id: str
    exam_id: str
    total_marks: int
    total_questions: int
    duration_minutes: int

class PaperGenerateRequest(BaseModel):
    set_id: str
    center_id: str
    release_delay_seconds: int = 0 # Simulates release timing

class PaperResponse(BaseModel):
    paper_id: str
    exam_id: str
    set_id: str
    paper_hash: str
    status: str

# --- Endpoints ---

@router.post("/api/questions", response_model=QuestionResponse)
def create_question(
    request: QuestionCreate, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedPrincipal = Depends(require_permission("question-bank.create"))
):
    # Serialize content and answer
    content_str = json.dumps(request.content)
    answer_str = json.dumps({"answer": request.answer})
    
    # Encrypt sensitive data using AES-GCM
    nonce_c, cipher_c = encrypt_payload(content_str, STORAGE_AES_KEY)
    nonce_a, cipher_a = encrypt_payload(answer_str, STORAGE_AES_KEY)
    
    # Calculate unique content SHA-256 hash (on plaintext for consistency)
    raw_hash_input = f"{request.subject}|{request.topic}|{content_str}|{answer_str}"
    content_hash = calculate_sha256(raw_hash_input)
    
    new_qst = Question(
        subject=request.subject,
        topic=request.topic,
        difficulty=request.difficulty.upper(),
        question_type=request.question_type.upper(),
        marks=request.marks,
        encrypted_content=json.dumps({"nonce": nonce_c, "ciphertext": cipher_c}),
        encrypted_answer=json.dumps({"nonce": nonce_a, "ciphertext": cipher_a}),
        status="APPROVED", # For the MVP, auto-approve questions
        author_id=current_user.id
    )
    
    db.add(new_qst)
    db.commit()
    db.refresh(new_qst)
    
    # Write to Audit Ledger
    log_event(
        db=db,
        actor_id=current_user.id,
        action="QUESTION_CREATED",
        resource_type="Question",
        resource_id=new_qst.id,
        payload_data=json.dumps({
            "question_id": new_qst.id,
            "subject": new_qst.subject,
            "difficulty": new_qst.difficulty,
            "content_hash": content_hash
        })
    )
    
    return QuestionResponse(
        id=new_qst.id,
        subject=new_qst.subject,
        topic=new_qst.topic,
        difficulty=new_qst.difficulty,
        question_type=new_qst.question_type,
        marks=new_qst.marks,
        status=new_qst.status,
        content_hash=content_hash
    )

@router.get("/api/questions", response_model=List[QuestionResponse])
def list_questions(
    db: Session = Depends(get_db),
    current_user: AuthenticatedPrincipal = Depends(require_permission("question-bank.read"))
):
    questions = db.query(Question).all()
    res = []
    for q in questions:
        # Reconstruct content hash for response validation safely
        try:
            if q.encrypted_content and q.encrypted_content.strip().startswith("{"):
                payload = json.loads(q.encrypted_content)
                plain_content = decrypt_payload(payload["nonce"], payload["ciphertext"], STORAGE_AES_KEY)
            else:
                plain_content = str(q.encrypted_content or "")

            if q.encrypted_answer and q.encrypted_answer.strip().startswith("{"):
                payload_ans = json.loads(q.encrypted_answer)
                plain_answer = decrypt_payload(payload_ans["nonce"], payload_ans["ciphertext"], STORAGE_AES_KEY)
            else:
                plain_answer = str(q.encrypted_answer or "")

            raw_hash_input = f"{q.subject}|{q.topic}|{plain_content}|{plain_answer}"
            content_hash = calculate_sha256(raw_hash_input)
        except Exception:
            content_hash = calculate_sha256(f"{q.id}|{q.subject}|{q.topic}")
        
        res.append(QuestionResponse(
            id=q.id,
            subject=q.subject,
            topic=q.topic,
            difficulty=q.difficulty,
            question_type=q.question_type,
            marks=q.marks,
            status=q.status,
            content_hash=content_hash
        ))
    return res

@router.post("/api/exams/{exam_id}/blueprint", response_model=BlueprintResponse)
def create_blueprint(
    exam_id: str,
    request: BlueprintCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedPrincipal = Depends(require_permission("question-bank.create"))
):
        
    bp = PaperBlueprint(
        exam_id=exam_id,
        total_marks=request.total_marks,
        total_questions=request.total_questions,
        duration_minutes=request.duration_minutes,
        subject_distribution=json.dumps(request.subject_distribution),
        difficulty_distribution=json.dumps(request.difficulty_distribution)
    )
    db.add(bp)
    db.commit()
    db.refresh(bp)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="BLUEPRINT_CREATED",
        resource_type="PaperBlueprint",
        resource_id=bp.id,
        payload_data=json.dumps({
            "exam_id": exam_id,
            "total_questions": bp.total_questions,
            "total_marks": bp.total_marks
        })
    )
    
    return bp

@router.post("/api/exams/{exam_id}/generate-paper", response_model=PaperResponse)
def generate_paper(
    exam_id: str,
    request: PaperGenerateRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedPrincipal = Depends(require_permission("question-bank.create"))
):
    # 1. Fetch Blueprint
    bp = db.query(PaperBlueprint).filter(PaperBlueprint.exam_id == exam_id).order_by(PaperBlueprint.created_at.desc()).first()
    if not bp:
        raise HTTPException(status_code=404, detail="No blueprint found for this exam. Please configure a blueprint first.")
        
    subj_dist = json.loads(bp.subject_distribution)
    diff_dist = json.loads(bp.difficulty_distribution)
    
    # 2. Query all approved questions
    pool = db.query(Question).filter(Question.status == "APPROVED").all()
    
    # 3. Select questions matching blueprint criteria
    selected_ids = []
    # For simplicity in the MVP, we pick questions matching subject requirements
    for subject, count in subj_dist.items():
        sub_pool = [q for q in pool if q.subject.lower() == subject.lower()]
        if len(sub_pool) < count:
            raise HTTPException(
                status_code=400,
                detail=f"Question pool has insufficient questions for subject: {subject}. Required {count}, found {len(sub_pool)}"
            )
        sampled = random.sample(sub_pool, count)
        selected_ids.extend([s.id for s in sampled])
        
    # Shuffle question order
    random.shuffle(selected_ids)
    
    # 4. Generate option shuffle mapping
    option_order_map = {}
    for q_id in selected_ids:
        # Seed simple option orders for MCQ questions
        option_order_map[q_id] = ["A", "B", "C", "D"] # Shuffled in real production, kept sequential/mocked here
        
    # 5. Calculate paper hash
    paper_data_str = f"{exam_id}|{request.set_id}|{','.join(selected_ids)}"
    paper_hash = calculate_sha256(paper_data_str)
    
    # 6. Save GeneratedPaper
    paper = GeneratedPaper(
        exam_id=exam_id,
        blueprint_id=bp.id,
        set_id=request.set_id,
        question_order=json.dumps(selected_ids),
        option_order_map=json.dumps(option_order_map),
        difficulty_score=0.75, # Mock difficulty index
        paper_hash=paper_hash,
        status="LOCKED"
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="PAPER_GENERATED",
        resource_type="GeneratedPaper",
        resource_id=paper.id,
        payload_data=json.dumps({
            "exam_id": exam_id,
            "set_id": paper.set_id,
            "paper_hash": paper_hash
        })
    )
    
    # 7. Create Encrypted Package (Simulate Time-Locked Binding)
    package_key = generate_aes_key() # Fresh AES key for this package
    package_payload = json.dumps({
        "paper_id": paper.id,
        "exam_id": exam_id,
        "question_order": selected_ids,
        "option_order_map": option_order_map
    })
    
    nonce, ciphertext = encrypt_payload(package_payload, package_key)
    
    # Release timing: valid from now + delay_seconds, valid for 2 hours
    valid_from = datetime.now(timezone.utc) + timedelta(seconds=request.release_delay_seconds)
    valid_until = valid_from + timedelta(hours=2)
    
    pkg = EncryptedPackage(
        exam_id=exam_id,
        paper_id=paper.id,
        center_id=request.center_id,
        encrypted_payload=json.dumps({
            "nonce": nonce,
            "ciphertext": ciphertext,
            "simulated_key": package_key # Backdoor key ONLY for simulation in MVP context
        }),
        package_hash=calculate_sha256(ciphertext),
        valid_from=valid_from,
        valid_until=valid_until,
        status="SEALED"
    )
    
    db.add(pkg)
    # Mark paper as encrypted
    paper.status = "ENCRYPTED"
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="PAPER_ENCRYPTED",
        resource_type="EncryptedPackage",
        resource_id=pkg.id,
        payload_data=json.dumps({
            "exam_id": exam_id,
            "center_id": pkg.center_id,
            "valid_from": valid_from.isoformat(),
            "valid_until": valid_until.isoformat()
        })
    )
    
    return PaperResponse(
        paper_id=paper.id,
        exam_id=exam_id,
        set_id=paper.set_id,
        paper_hash=paper.paper_hash,
        status=paper.status
    )

# --- Ollama AI Question Generator Endpoints ---

@router.get("/api/questions/ai-models")
def get_ai_models(
    current_user: AuthenticatedPrincipal = Depends(require_permission("question-bank.read"))
):
    """Returns available Ollama models and cloud configuration."""
    models = list_available_models()
    return {
        "models": models,
        "default_model": "llama3.2",
        "ollama_host": OLLAMA_HOST,
        "status": "ONLINE"
    }

@router.post("/api/questions/generate-ai", response_model=AIGenerateResponse)
def generate_questions_ai(
    request: AIGenerateRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedPrincipal = Depends(require_permission("question-bank.generate-ai"))
):
    """
    Generates examination questions using Ollama Python client and stores them into the Question Bank.
    """
    raw_questions = generate_questions_with_ollama(
        subject=request.subject,
        topic=request.topic,
        difficulty=request.difficulty,
        count=request.count,
        model=request.model,
        question_type=request.question_type,
        custom_instructions=request.custom_instructions
    )
    
    formatted_questions: List[AIGeneratedQuestion] = []
    
    for q in raw_questions:
        q_text = q.get("text", "")
        q_options = q.get("options", {"A": "A", "B": "B", "C": "C", "D": "D"})
        q_ans = q.get("answer", "A")
        q_exp = q.get("explanation", "")
        q_diff = q.get("difficulty", request.difficulty).upper()
        q_marks = q.get("marks", 2)
        
        # Calculate SHA-256 integrity hash
        content_str = json.dumps({"text": q_text, "options": q_options, "explanation": q_exp})
        answer_str = json.dumps({"answer": q_ans})
        raw_hash_input = f"{request.subject}|{request.topic}|{content_str}|{answer_str}"
        content_hash = calculate_sha256(raw_hash_input)
        
        q_id = f"QST-AI-{content_hash[:8].upper()}"
        
        if request.auto_save_to_bank:
            # Encrypt sensitive data using AES-GCM
            nonce_c, cipher_c = encrypt_payload(content_str, STORAGE_AES_KEY)
            nonce_a, cipher_a = encrypt_payload(answer_str, STORAGE_AES_KEY)
            
            db_qst = Question(
                id=q_id,
                subject=request.subject,
                topic=request.topic,
                difficulty=q_diff,
                question_type=request.question_type,
                marks=q_marks,
                encrypted_content=json.dumps({"nonce": nonce_c, "ciphertext": cipher_c}),
                encrypted_answer=json.dumps({"nonce": nonce_a, "ciphertext": cipher_a}),
                status="APPROVED",
                author_id="SYSTEM_OLLAMA_AI"
            )
            # Upsert into Question Bank
            existing = db.query(Question).filter(Question.id == q_id).first()
            if not existing:
                db.add(db_qst)
                db.commit()
        
        formatted_questions.append(AIGeneratedQuestion(
            id=q_id,
            text=q_text,
            options=q_options,
            answer=q_ans,
            explanation=q_exp,
            difficulty=q_diff,
            marks=q_marks,
            content_hash=content_hash,
            status="SAVED_TO_BANK" if request.auto_save_to_bank else "GENERATED"
        ))
        
    return AIGenerateResponse(
        subject=request.subject,
        topic=request.topic,
        difficulty=request.difficulty,
        model_used=request.model,
        count=len(formatted_questions),
        questions=formatted_questions,
        saved_to_bank=request.auto_save_to_bank,
        ollama_endpoint=OLLAMA_HOST
    )

