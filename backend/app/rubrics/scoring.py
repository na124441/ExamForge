from sqlalchemy.orm import Session
from app.models import RubricCriterion
from typing import Dict

def validate_scores_against_criteria(db: Session, rubric_id: str, criteria_scores: Dict[str, float]) -> bool:
    criteria = db.query(RubricCriterion).filter(RubricCriterion.rubric_id == rubric_id).all()
    criteria_map = {c.id: c.max_marks for c in criteria}
    
    # Check if all criteria are present in scores
    for c_id in criteria_map:
        if c_id not in criteria_scores:
            return False
            
    for c_id, score in criteria_scores.items():
        if c_id not in criteria_map:
            return False
        if score < 0 or score > criteria_map[c_id]:
            return False
            
    return True
