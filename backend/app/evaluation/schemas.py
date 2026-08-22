from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class AssignmentRequest(BaseModel):
    anonymous_id: str
    evaluator_id: str
    exam_id: str

class DoubleAssignmentRequest(BaseModel):
    anonymous_id: str
    question_id: str
    evaluator_a: str
    evaluator_b: str
    exam_id: str

class MarksSubmitRequest(BaseModel):
    anonymous_id: str
    question_id: str
    criteria_scores: Dict[str, float]
    notes: Optional[str] = ""

class MarksLockRequest(BaseModel):
    signature: str

class ConflictResolveRequest(BaseModel):
    resolution_policy: str # AVERAGE, SENIOR_DECISION, THIRD_EVALUATION
    final_marks: float
    notes: str

class SeniorReviewRequest(BaseModel):
    final_marks: float
    decision_notes: str

class AnonymousCopyResponse(BaseModel):
    id: str
    anonymous_id: str
    booklet_id: str
    exam_id: str
    assigned_evaluator_id: Optional[str]
    identity_visible: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class EvaluationMarkResponse(BaseModel):
    id: str
    anonymous_id: str
    question_id: str
    evaluator_id: str
    criteria_scores: str
    total_marks: float
    rubric_id: str
    notes: Optional[str]
    evaluation_hash: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConflictResponse(BaseModel):
    id: str
    anonymous_id: str
    question_id: str
    evaluator_a: str
    marks_a: float
    evaluator_b: str
    marks_b: float
    variance: float
    status: str
    resolution_required: bool
    created_at: datetime

    class Config:
        from_attributes = True
