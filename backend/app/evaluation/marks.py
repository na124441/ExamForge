import json
from sqlalchemy.orm import Session
from app.models import EvaluationMark, Rubric, EvaluationDraft
from app.security import calculate_sha256
from app.rubrics.scoring import validate_scores_against_criteria

def get_previous_evaluation_hash(db: Session, anonymous_id: str) -> str:
    # Find the latest evaluation for this candidate copy
    last_eval = db.query(EvaluationMark).filter(
        EvaluationMark.anonymous_id == anonymous_id
    ).order_by(EvaluationMark.created_at.desc()).first()
    if last_eval:
        return last_eval.evaluation_hash
    return "0" * 64 # Genesis hash for this copy

def calculate_evaluation_hash(
    exam_id: str,
    anonymous_id: str,
    evaluator_id: str,
    question_id: str,
    criteria_scores: dict,
    total_marks: float,
    rubric_id: str,
    previous_hash: str
) -> str:
    scores_str = json.dumps(criteria_scores, sort_keys=True)
    payload = f"{exam_id}|{anonymous_id}|{evaluator_id}|{question_id}|{scores_str}|{total_marks}|{rubric_id}|{previous_hash}"
    return calculate_sha256(payload)

def submit_marks_entry(
    db: Session,
    anonymous_id: str,
    question_id: str,
    evaluator_id: str,
    criteria_scores: dict,
    notes: str,
    exam_id: str
) -> EvaluationMark:
    rubric = db.query(Rubric).filter(Rubric.question_id == question_id).first()
    if not rubric:
        raise ValueError("Rubric not found for this question")
        
    if not validate_scores_against_criteria(db, rubric.id, criteria_scores):
        raise ValueError("Scores do not conform to rubric criteria bounds")
        
    total_marks = sum(criteria_scores.values())
    
    prev_hash = get_previous_evaluation_hash(db, anonymous_id)
    eval_hash = calculate_evaluation_hash(
        exam_id=exam_id,
        anonymous_id=anonymous_id,
        evaluator_id=evaluator_id,
        question_id=question_id,
        criteria_scores=criteria_scores,
        total_marks=total_marks,
        rubric_id=rubric.id,
        previous_hash=prev_hash
    )
    
    mark = db.query(EvaluationMark).filter(
        EvaluationMark.anonymous_id == anonymous_id,
        EvaluationMark.question_id == question_id,
        EvaluationMark.evaluator_id == evaluator_id
    ).first()
    
    if mark:
        if mark.status == "LOCKED":
            raise ValueError("Marks already locked and cannot be edited")
        mark.criteria_scores = json.dumps(criteria_scores)
        mark.total_marks = total_marks
        mark.notes = notes
        mark.evaluation_hash = eval_hash
        mark.status = "SUBMITTED"
    else:
        mark = EvaluationMark(
            anonymous_id=anonymous_id,
            question_id=question_id,
            evaluator_id=evaluator_id,
            criteria_scores=json.dumps(criteria_scores),
            total_marks=total_marks,
            rubric_id=rubric.id,
            notes=notes,
            evaluation_hash=eval_hash,
            status="SUBMITTED"
        )
        db.add(mark)
        
    draft = db.query(EvaluationDraft).filter(
        EvaluationDraft.anonymous_id == anonymous_id,
        EvaluationDraft.question_id == question_id,
        EvaluationDraft.evaluator_id == evaluator_id
    ).first()
    if draft:
        db.delete(draft)
        
    db.commit()
    db.refresh(mark)
    return mark
