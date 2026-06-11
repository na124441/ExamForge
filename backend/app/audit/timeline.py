from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog, User
from app.security import calculate_sha256

router = APIRouter(tags=["timeline"])

EXPLANATIONS = {
    "USER_SEEDED": "Authorized role credentials registered in the database for secure identity verification.",
    "USER_LOGIN": "User successfully authenticated with the central server, obtaining a timed session token.",
    "QUESTION_CREATED": "Question content and rubric guidelines cryptographically locked and stored in the encrypted pool.",
    "BLUEPRINT_CREATED": "Exam blueprint constraints locked. Ensures question counts and difficulty limits cannot be modified.",
    "PAPER_GENERATED": "Controller generated dynamic paper sets. Option orders shuffled to prevent leaks.",
    "PAPER_ENCRYPTED": "Dynamic paper package sealed with unique center-bound keys, awaiting time-lock release.",
    "CANDIDATE_REGISTERED": "Candidate registration received. Salted anonymous identifier generated to ensure grading blind-auditing.",
    "CANDIDATE_VERIFIED": "Candidate checked in at center. Admit card signature matches public key.",
    "CANDIDATE_SESSION_STARTED": "Candidate started exam session. Decryption of time-locked paper package verified.",
    "SEAT_ASSIGNED": "Candidate seat assignment logged and locked in the center room map.",
    "SEAT_MAP_LOCKED": "Seat configuration locked for this center. Any subsequent seat changes will trigger anomaly alerts.",
    "ATTENDANCE_MARKED": "Candidate attendance status updated in the seat map grid.",
    "PACKAGE_RELEASED": "Center-bound package released. Officer signature validated inside the scheduled window.",
    "PACKAGE_REVOKED": "Center package revoked by Controller due to a security warning.",
    "EARLY_PACKAGE_DECRYPTION_ATTEMPT": "Intrusion detected! Officer tried to decrypt package before release window opened.",
    "UNAUTHORIZED_ACCESS_ATTEMPT": "Security alert! An unauthorized user tried to access a restricted API endpoint.",
    "INCIDENT_REPORTED": "Incident logged. Unresolved P0 incidents drop the trust score and block results release.",
    "INCIDENT_RESOLVED": "Incident resolved by authority. Evidence hash recorded in audit ledger.",
    "INCIDENT_ESCALATED": "Incident severity escalated. Alarm flags updated.",
    "ANSWER_SAVED": "Answer event recorded and linked to the candidate's previous event hash chain.",
    "ANSWER_SUBMITTED": "Exam submission received. Final receipt generated and signed.",
    "EVALUATION_LOCKED": "Evaluator grade locked. Cryptographic signature binds marks to evaluator ID.",
    "RESULTS_PUBLISHED": "Integrity gate verification checks passed. Final results published successfully.",
    "RESULT_PUBLISH_BLOCKED": "Integrity check failed! Publication gate blocked results release due to security alerts."
}

@router.get("/api/audit/timeline-explain/{exam_id}")
def get_timeline_explain(exam_id: str, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id).all()
    
    timeline = []
    expected_previous = "0" * 64
    
    for idx, log in enumerate(logs):
        # Determine signature validity up to this block
        chain_input = f"{log.actor_id}|{log.action}|{log.payload_hash}|{log.previous_hash}"
        recalculated_hash = calculate_sha256(chain_input)
        
        signature_status = "VALID"
        if log.previous_hash != expected_previous or log.current_hash != recalculated_hash:
            signature_status = "TAMPERED"
            
        expected_previous = log.current_hash
        
        # Get actor name
        actor = db.query(User).filter(User.id == log.actor_id).first()
        actor_name = actor.name if actor else f"System/ID: {log.actor_id[:8]}"
        if log.actor_id == "CENTER_SIMULATOR":
            actor_name = "Tamper Simulator Backdoor"
        elif log.actor_id == "SQL_BACKDOOR":
            actor_name = "Direct DB Backdoor"
            
        explanation = EXPLANATIONS.get(log.action, "Operation logged in append-only system ledger.")
        
        timeline.append({
            "index": log.id,
            "action": log.action,
            "actor_id": log.actor_id,
            "actor_name": actor_name,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "payload_hash": log.payload_hash,
            "previous_hash": log.previous_hash,
            "current_hash": log.current_hash,
            "signature_status": signature_status,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "explanation": explanation
        })
        
    return {
        "exam_id": exam_id,
        "timeline": timeline
    }
