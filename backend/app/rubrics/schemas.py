from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CriterionCreate(BaseModel):
    title: str
    max_marks: float

class RubricCreateRequest(BaseModel):
    exam_id: str
    question_id: str
    max_marks: float
    criteria: List[CriterionCreate]

class CriterionResponse(BaseModel):
    id: str
    rubric_id: str
    title: str
    max_marks: float
    created_at: datetime

    class Config:
        from_attributes = True

class RubricResponse(BaseModel):
    id: str
    exam_id: str
    question_id: str
    max_marks: float
    criteria: List[CriterionResponse] = []
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
