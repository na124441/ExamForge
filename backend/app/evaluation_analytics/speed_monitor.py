from sqlalchemy.orm import Session
from app.evaluation_analytics.evaluator_metrics import compute_evaluator_metrics
from typing import List, Dict, Any

def check_evaluator_speed(db: Session, evaluator_id: str) -> List[Dict[str, Any]]:
    warnings = []
    metrics = compute_evaluator_metrics(db, evaluator_id)
    
    if metrics["average_speed_seconds"] < 10.0:
        warnings.append({
            "code": "ABNORMAL_EVALUATION_SPEED",
            "message": f"Suspicious evaluation speed: average {metrics['average_speed_seconds']:.1f} seconds per answer sheet.",
            "severity": "HIGH"
        })
    return warnings
