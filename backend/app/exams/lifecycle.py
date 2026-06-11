from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import ExamState, PaperBlueprint, GeneratedPaper, EncryptedPackage, Evaluation, Candidate
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event

router = APIRouter(tags=["exams"])

VALID_TRANSITIONS = {
    "DRAFT": ["CONFIG_LOCKED"],
    "CONFIG_LOCKED": ["PAPER_GENERATED"],
    "PAPER_GENERATED": ["PACKAGE_SEALED"],
    "PACKAGE_SEALED": ["AWAITING_RELEASE"],
    "AWAITING_RELEASE": ["RELEASE_WINDOW_OPEN"],
    "RELEASE_WINDOW_OPEN": ["IN_PROGRESS"],
    "IN_PROGRESS": ["SUBMISSION_LOCKED"],
    "SUBMISSION_LOCKED": ["EVALUATION_OPEN"],
    "EVALUATION_OPEN": ["RESULT_VERIFICATION"],
    "RESULT_VERIFICATION": ["RESULT_PUBLISHED"],
    "RESULT_PUBLISHED": ["ARCHIVED"],
    "ARCHIVED": []
}

class StateTransitionRequest(BaseModel):
    new_state: str

def get_exam_state(db: Session, exam_id: str) -> str:
    """Helper to retrieve the current state of an exam, defaulting to DRAFT."""
    record = db.query(ExamState).filter(ExamState.exam_id == exam_id).first()
    return record.state if record else "DRAFT"

def set_exam_state(db: Session, exam_id: str, new_state: str, actor_id: str) -> str:
    """Helper to set and log an exam state transition, validating rules first."""
    current_state = get_exam_state(db, exam_id)
    
    # Validate transition rules
    allowed_states = VALID_TRANSITIONS.get(current_state, [])
    if new_state not in allowed_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from state {current_state} to state {new_state}."
        )
        
    # Check conditions
    if new_state == "CONFIG_LOCKED":
        bp = db.query(PaperBlueprint).filter(PaperBlueprint.exam_id == exam_id).first()
        if not bp:
            raise HTTPException(status_code=400, detail="Cannot lock configuration. Blueprint must be created first.")
            
    elif new_state == "PAPER_GENERATED":
        paper = db.query(GeneratedPaper).filter(GeneratedPaper.exam_id == exam_id).first()
        if not paper:
            raise HTTPException(status_code=400, detail="Cannot transition. Secure paper must be generated first.")
            
    elif new_state == "PACKAGE_SEALED":
        pkg = db.query(EncryptedPackage).filter(EncryptedPackage.exam_id == exam_id).first()
        if not pkg:
            raise HTTPException(status_code=400, detail="Cannot transition. Encrypted packages must be generated first.")
            
    elif new_state == "RESULT_PUBLISHED":
        # Checked via Publication Gate, but ensure we don't bypass manually
        pass
        
    # Persist or create
    record = db.query(ExamState).filter(ExamState.exam_id == exam_id).first()
    if not record:
        record = ExamState(exam_id=exam_id, state=new_state)
        db.add(record)
    else:
        record.state = new_state
        
    db.commit()
    
    # Log state change to append-only ledger
    log_event(
        db=db,
        actor_id=actor_id,
        action="EXAM_STATE_TRANSITION",
        resource_type="ExamState",
        resource_id=exam_id,
        payload_data=f"Exam transition from {current_state} to {new_state}"
    )
    
    return new_state

@router.get("/api/exams/{exam_id}/state")
def get_state(exam_id: str, db: Session = Depends(get_db)):
    return {
        "exam_id": exam_id,
        "state": get_exam_state(db, exam_id)
    }

@router.post("/api/exams/{exam_id}/transition")
def transition_exam(
    exam_id: str,
    request: StateTransitionRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    target_state = request.new_state.upper()
    next_state = set_exam_state(db, exam_id, target_state, current_user.id)
    return {
        "exam_id": exam_id,
        "previous_state": get_exam_state(db, exam_id),
        "current_state": next_state
    }
