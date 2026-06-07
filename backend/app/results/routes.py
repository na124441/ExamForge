import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Dict, Any
from app.database import get_db
from app.models import (
    Candidate, 
    GeneratedPaper, 
    CandidateAnswerEvent, 
    Evaluation, 
    OMRScan, 
    Result, 
    AuditLog,
    Question
)
from app.security import calculate_sha256, STORAGE_AES_KEY, decrypt_payload
from app.audit.ledger import verify_audit_chain, log_event
from app.auth.routes import get_current_user, UserResponse

router = APIRouter(tags=["results"])

class TamperRequest(BaseModel):
    mode: str # "ANSWER_EVENT", "EVALUATION_MARKS", "AUDIT_LOG"
    target_id: str
    new_value: str # New answer choice, new marks, or altered log action

# --- Helper Verification Engine ---
def verify_candidate_integrity(db: Session, candidate_id: str) -> tuple[bool, str]:
    """
    Validates that a candidate's answer events form a perfect linked hash chain.
    """
    events = db.query(CandidateAnswerEvent).filter(
        CandidateAnswerEvent.candidate_id == candidate_id
    ).order_by(CandidateAnswerEvent.created_at).all()
    
    if not events:
        return True, "No answer events recorded."
        
    expected_previous = calculate_sha256(f"GENESIS_SESSION_{events[0].session_id}")
    
    for idx, ev in enumerate(events):
        # 1. Verify link back to previous answer
        if ev.previous_event_hash != expected_previous:
            return False, f"Broken chain link at candidate answer event {idx}."
            
        # 2. Recalculate and verify hash
        chain_input = f"{ev.session_id}|{ev.candidate_id}|{ev.question_id}|{ev.selected_answer}|{ev.previous_event_hash}"
        recalculated = calculate_sha256(chain_input)
        if ev.current_event_hash != recalculated:
            return False, f"Tamper detected in answer event {idx}. Expected hash {recalculated} but found {ev.current_event_hash}"
            
        expected_previous = ev.current_event_hash
        
    return True, "Candidate answer chain is valid."

def verify_evaluation_integrity(db: Session, candidate_anonymous_id: str) -> tuple[bool, str]:
    """
    Validates that a candidate's descriptive grading evaluations match their signatures.
    """
    evals = db.query(Evaluation).filter(Evaluation.anonymous_id == candidate_anonymous_id).all()
    for ev in evals:
        # SHA256(exam_id | anon_id | question_id | marks | evaluator_id)
        eval_input = f"{ev.exam_id}|{ev.anonymous_id}|{ev.question_id}|{ev.marks_awarded}|{ev.evaluator_id}"
        recalculated = calculate_sha256(eval_input)
        if ev.evaluation_hash != recalculated:
            return False, f"Tamper detected in evaluation marks for question {ev.question_id}. Mismatched signature."
            
    return True, "All evaluations are verified."


# --- Endpoints ---

@router.post("/api/exams/{exam_id}/publish-results")
def publish_results(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != "CONTROLLER":
        raise HTTPException(status_code=403, detail="Only Controllers can publish exam results")
        
    # Run end-to-end verification checklist
    verification_errors = []
    
    # 1. Verify append-only Audit Chain
    chain_intact, failing_idx, chain_msg = verify_audit_chain(db)
    if not chain_intact:
        verification_errors.append(f"AUDIT_CHAIN_FAILED: {chain_msg}")
        
    # 2. Verify all active candidates
    candidates = db.query(Candidate).filter(Candidate.exam_id == exam_id).all()
    for cand in candidates:
        # Validate MCQ answer sequence hashes
        ans_ok, ans_msg = verify_candidate_integrity(db, cand.id)
        if not ans_ok:
            verification_errors.append(f"CANDIDATE_ANSWERS_TAMPERED ({cand.anonymous_id}): {ans_msg}")
            
        # Validate written evaluations hashes
        eval_ok, eval_msg = verify_evaluation_integrity(db, cand.anonymous_id)
        if not eval_ok:
            verification_errors.append(f"EVALUATIONS_TAMPERED ({cand.anonymous_id}): {eval_msg}")
            
    # 3. Block publishing if errors exist
    if verification_errors:
        log_event(
            db=db,
            actor_id=current_user.id,
            action="RESULT_PUBLISH_BLOCKED",
            resource_type="ResultCollection",
            resource_id=exam_id,
            payload_data=json.dumps({"errors": verification_errors})
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Result publishing blocked due to integrity validation failures.",
                "failures": verification_errors
            }
        )
        
    # 4. Compile results if verification checks pass
    published_results = []
    for cand in candidates:
        # Calculate scores
        mcq_score = 0.0
        # Simple grading helper: Fetch plain question answers to score MCQ
        events = db.query(CandidateAnswerEvent).filter(
            CandidateAnswerEvent.candidate_id == cand.id
        ).all()
        
        for ev in events:
            q = db.query(Question).filter(Question.id == ev.question_id).first()
            if q and q.question_type == "MCQ_SINGLE":
                ans_payload = json.loads(q.encrypted_answer)
                plain_answer = decrypt_payload(ans_payload["nonce"], ans_payload["ciphertext"], STORAGE_AES_KEY)
                correct_choice = json.loads(plain_answer)["answer"]
                if ev.selected_answer == correct_choice:
                    mcq_score += q.marks
                    
        # Add evaluation scores
        eval_score = 0.0
        evals = db.query(Evaluation).filter(Evaluation.anonymous_id == cand.anonymous_id).all()
        for ev in evals:
            eval_score += ev.marks_awarded
            
        total_score = mcq_score + eval_score
        max_possible = 400.0 # Mock max score
        
        result_hash = calculate_sha256(f"{cand.id}|{total_score}|{chain_msg}")
        
        res = Result(
            exam_id=exam_id,
            candidate_id=cand.id,
            marks_obtained=total_score,
            max_marks=max_possible,
            status="VERIFIED",
            result_hash=result_hash,
            published_at=func.now()
        )
        db.add(res)
        published_results.append({
            "candidate_anonymous_id": cand.anonymous_id,
            "score": total_score,
            "status": res.status
        })
        
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="RESULTS_PUBLISHED",
        resource_type="ResultCollection",
        resource_id=exam_id,
        payload_data=f"Published verified results for {len(candidates)} candidates."
    )
    
    return {
        "message": "All integrity checks passed. Results published successfully.",
        "results": published_results
    }

@router.post("/api/exams/{exam_id}/simulate-tamper")
def simulate_tampering(
    exam_id: str,
    request: TamperRequest,
    db: Session = Depends(get_db)
):
    """
    Security validation backdoor to directly alter SQLite records,
    bypassing cryptographic logging rules to simulate a malicious database edit.
    """
    modified_resource = None
    
    if request.mode == "ANSWER_EVENT":
        # Modify candidate selected answer directly
        event = db.query(CandidateAnswerEvent).filter(CandidateAnswerEvent.id == request.target_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Answer event not found")
        old_val = event.selected_answer
        event.selected_answer = request.new_value
        db.commit()
        modified_resource = f"CandidateAnswerEvent {event.id}: changed answer from {old_val} to {request.new_value}"
        
    elif request.mode == "EVALUATION_MARKS":
        # Modify evaluator's marks directly
        evaluation = db.query(Evaluation).filter(Evaluation.id == request.target_id).first()
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        old_val = evaluation.marks_awarded
        evaluation.marks_awarded = float(request.new_value)
        db.commit()
        modified_resource = f"Evaluation {evaluation.id}: changed marks from {old_val} to {request.new_value}"
        
    elif request.mode == "AUDIT_LOG":
        # Tamper with the append-only ledger entries directly
        log_entry = db.query(AuditLog).filter(AuditLog.id == request.target_id).first()
        if not log_entry:
            raise HTTPException(status_code=404, detail="Audit log entry not found")
        old_val = log_entry.action
        log_entry.action = request.new_value
        db.commit()
        modified_resource = f"AuditLog {log_entry.id}: changed action from {old_val} to {request.new_value}"
        
    else:
        raise HTTPException(status_code=400, detail="Invalid tamper mode. Must be: ANSWER_EVENT, EVALUATION_MARKS, or AUDIT_LOG")
        
    return {
        "status": "TAMPER_SUCCESS",
        "description": "Database values modified directly, bypassing cryptographic verification signatures.",
        "modified_resource": modified_resource
    }

@router.get("/api/audit/logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.id).all()

@router.get("/api/audit/verify-chain")
def verify_ledger_chain(db: Session = Depends(get_db)):
    intact, failing_idx, msg = verify_audit_chain(db)
    return {
        "intact": intact,
        "failing_index": failing_idx,
        "message": msg
    }
