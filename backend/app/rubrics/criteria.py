from typing import List
from app.rubrics.schemas import CriterionCreate

def validate_criteria_marks(max_marks: float, criteria: List[CriterionCreate]) -> bool:
    total = sum(c.max_marks for c in criteria)
    return abs(total - max_marks) < 0.01
