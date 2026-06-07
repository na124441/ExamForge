from sqlalchemy.orm import Session
from app.models import CandidateAnswerEvent, Evaluation
from app.security import calculate_sha256

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
