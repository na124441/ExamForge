import json
import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import (
    Candidate, 
    GeneratedPaper, 
    CandidateAnswerEvent, 
    Evaluation, 
    OMRScan, 
    Result, 
    AuditLog,
    Question,
    RiskSimulation
)
from app.security import calculate_sha256, STORAGE_AES_KEY, decrypt_payload
from app.audit.ledger import verify_audit_chain, log_event
from app.auth.routes import get_current_user, UserResponse

from app.trust.score_engine import calculate_exam_trust_score
from app.risk.simulator import trigger_simulation, clear_simulations
from app.risk.center_risk import (
    detect_evaluator_conflicts,
    get_omr_scans_by_band,
    scan_system_anomalies
)
from app.receipts.candidate_receipt import sign_receipt, verify_receipt_signature
from app.publication.gate import verify_publication_gate

router = APIRouter(tags=["results"])

class TamperRequest(BaseModel):
    mode: str # "ANSWER_EVENT", "EVALUATION_MARKS", "AUDIT_LOG"
    target_id: str
    new_value: str # New answer choice, new marks, or altered log action

from app.results.verification import verify_candidate_integrity, verify_evaluation_integrity


# --- Endpoints ---

@router.post("/api/exams/{exam_id}/publish-results")
def publish_results(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != "CONTROLLER":
        raise HTTPException(status_code=403, detail="Only Controllers can publish exam results")
        
    # Run decoupled publication gate verification checklist
    gate = verify_publication_gate(db, exam_id)
    if not gate["allowed"]:
        log_event(
            db=db,
            actor_id=current_user.id,
            action="RESULT_PUBLISH_BLOCKED",
            resource_type="ResultCollection",
            resource_id=exam_id,
            payload_data=json.dumps({"blocking_reasons": gate["blocking_reasons"]})
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Result publishing blocked due to integrity validation failures.",
                "failures": gate["blocking_reasons"],
                "checklist": gate["checklist"],
                "trust_score": gate["trust_score"]
            }
        )
        
    chain_intact, failing_idx, chain_msg = verify_audit_chain(db)
    candidates = db.query(Candidate).filter(Candidate.exam_id == exam_id).all()
        
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

class SimulateRiskRequest(BaseModel):
    vector: str
    details: Optional[str] = ""

class VerifyReceiptRequest(BaseModel):
    anonymous_id: str
    exam_id: str
    timestamp: str
    root_hash: str
    signature: str

@router.get("/api/trust/score/{exam_id}")
def get_trust_score(exam_id: str, db: Session = Depends(get_db)):
    return calculate_exam_trust_score(db, exam_id)

@router.post("/api/risk/simulate")
def simulate_risk(request: SimulateRiskRequest, db: Session = Depends(get_db)):
    return trigger_simulation(db, request.vector, request.details)

@router.post("/api/risk/clear")
def clear_risk(db: Session = Depends(get_db)):
    return clear_simulations(db)

@router.get("/api/risk/status/{exam_id}")
def get_risk_status(exam_id: str, db: Session = Depends(get_db)):
    anomalies = scan_system_anomalies(db, exam_id)
    active_sim = db.query(RiskSimulation).filter(RiskSimulation.is_active == True).first()
    return {
        "active_simulation": active_sim.vector if active_sim else None,
        "anomalies": anomalies
    }

@router.get("/api/risk/omr-queue/{exam_id}")
def get_omr_queue(exam_id: str, db: Session = Depends(get_db)):
    return get_omr_scans_by_band(db, exam_id)

@router.get("/api/risk/evaluator-conflicts/{exam_id}")
def get_evaluator_conflicts(exam_id: str, db: Session = Depends(get_db)):
    return {
        "exam_id": exam_id,
        "conflicts": detect_evaluator_conflicts(db, exam_id)
    }

@router.get("/api/candidates/{candidate_id}/receipt")
def get_candidate_receipt(candidate_id: str, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    latest_event = db.query(CandidateAnswerEvent).filter(
        CandidateAnswerEvent.candidate_id == candidate_id
    ).order_by(CandidateAnswerEvent.created_at.desc()).first()
    
    root_hash = latest_event.current_event_hash if latest_event else calculate_sha256(f"EMPTY_SESSION_{cand.id}")
    
    timestamp = str(int(time.time()))
    if cand.created_at:
        timestamp = str(int(cand.created_at.timestamp()))
        
    signature = sign_receipt(cand.anonymous_id, cand.exam_id, timestamp, root_hash)
    
    return {
        "anonymous_id": cand.anonymous_id,
        "exam_id": cand.exam_id,
        "timestamp": timestamp,
        "root_hash": root_hash,
        "signature": signature
    }

@router.post("/api/receipts/verify")
def verify_receipt(request: VerifyReceiptRequest):
    is_valid = verify_receipt_signature(
        anonymous_id=request.anonymous_id,
        exam_id=request.exam_id,
        timestamp=request.timestamp,
        root_hash=request.root_hash,
        signature_hex=request.signature
    )
    return {
        "is_valid": is_valid,
        "payload": {
            "anonymous_id": request.anonymous_id,
            "exam_id": request.exam_id,
            "timestamp": request.timestamp,
            "root_hash": request.root_hash
        }
    }

@router.get("/api/exams/{exam_id}/gate-status")
def get_gate_status(exam_id: str, db: Session = Depends(get_db)):
    return verify_publication_gate(db, exam_id)

# --- Result Versioning & Revisions (v0.6) ---
from app.models import ResultVersion, Dispute
from app.auth.guards import RoleChecker

class CreateVersionRequest(BaseModel):
    new_marks: float
    change_reason: str
    linked_dispute_id: Optional[str] = None
    signature: str

@router.get("/api/results/{result_id}/versions")
def get_result_versions(result_id: str, db: Session = Depends(get_db)):
    versions = db.query(ResultVersion).filter(ResultVersion.result_id == result_id).order_by(ResultVersion.version_number.asc()).all()
    return versions

@router.get("/api/results/{result_id}/diff/{version_a}/{version_b}")
def get_result_diff(result_id: str, version_a: int, version_b: int, db: Session = Depends(get_db)):
    res_a = db.query(ResultVersion).filter(
        ResultVersion.result_id == result_id,
        ResultVersion.version_number == version_a
    ).first()
    res_b = db.query(ResultVersion).filter(
        ResultVersion.result_id == result_id,
        ResultVersion.version_number == version_b
    ).first()

    if not res_a or not res_b:
        raise HTTPException(status_code=404, detail="One or both versions not found")

    # Mock diff marks or extract marks obtained
    # We can retrieve total marks from details or simulate diff payload
    # Let's say we retrieve marks from change reason or we can parse it from new_result_hash content if we saved it.
    # To be general, let's return a clean diff:
    return {
        "result_id": result_id,
        "version_a": version_a,
        "version_b": version_b,
        "marks_obtained_diff": 0.0, # Diff calculated by frontend or parsed
        "change_reason": res_b.change_reason,
        "changed_by": res_b.changed_by
    }

@router.post("/api/results/{result_id}/create-version")
def create_result_version(
    result_id: str,
    request: CreateVersionRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    res = db.query(Result).filter(Result.id == result_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")

    # Get count of existing versions
    count = db.query(ResultVersion).filter(ResultVersion.result_id == result_id).count()
    if count == 0:
        # Create Version 1 representing the original result
        v1 = ResultVersion(
            result_id=res.id,
            version_number=1,
            previous_result_hash=None,
            new_result_hash=res.result_hash,
            change_reason="Original published results",
            changed_by="CONTROLLER",
            signature="SYSTEM_ECDSA_GENESIS_VERSION_SIG",
            linked_dispute_id=None
        )
        db.add(v1)
        db.commit()
        count = 1

    next_version = count + 1
    prev_hash = res.result_hash

    # Calculate new result hash
    payload = f"{res.id}|{request.new_marks}|{request.change_reason}"
    new_hash = calculate_sha256(payload)

    # Update result
    res.marks_obtained = request.new_marks
    res.result_hash = new_hash
    db.commit()

    # Create new version
    v_new = ResultVersion(
        result_id=res.id,
        version_number=next_version,
        previous_result_hash=prev_hash,
        new_result_hash=new_hash,
        change_reason=request.change_reason,
        changed_by=current_user.id,
        linked_dispute_id=request.linked_dispute_id,
        signature=request.signature
    )
    db.add(v_new)
    db.commit()
    db.refresh(v_new)

    log_event(
        db=db,
        actor_id=current_user.id,
        action="RESULT_REVISED",
        resource_type="ResultVersion",
        resource_id=v_new.id,
        payload_data=json.dumps({
            "result_id": res.id,
            "version": next_version,
            "change_reason": request.change_reason
        })
    )

    return v_new

