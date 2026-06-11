from sqlalchemy.orm import Session
from app.evaluation_analytics.evaluator_metrics import compute_evaluator_metrics
from app.models import EvaluationMark
from typing import List, Dict, Any

def detect_evaluator_bias(db: Session, evaluator_id: str) -> List[Dict[str, Any]]:
    warnings = []
    metrics = compute_evaluator_metrics(db, evaluator_id)
    
    all_marks = db.query(EvaluationMark.total_marks).all()
    if not all_marks or metrics["total_completed"] == 0:
        return warnings
        
    global_avg = sum(m[0] for m in all_marks) / len(all_marks)
    
    diff = metrics["average_marks_given"] - global_avg
    if diff > 2.5:
        warnings.append({
            "code": "EVALUATOR_LENIENCY_BIAS",
            "message": f"Evaluator average marks ({metrics['average_marks_given']:.2f}) are significantly higher than global average ({global_avg:.2f}).",
            "severity": "MEDIUM"
        })
    elif diff < -2.5:
        warnings.append({
            "code": "EVALUATOR_HARSHNESS_BIAS",
            "message": f"Evaluator average marks ({metrics['average_marks_given']:.2f}) are significantly lower than global average ({global_avg:.2f}).",
            "severity": "MEDIUM"
        })
        
    if metrics["conflict_rate"] > 0.30:
        warnings.append({
            "code": "ABNORMAL_CONFLICT_RATE",
            "message": f"Evaluator conflict rate ({metrics['conflict_rate']*100:.1f}%) exceeds the 30% warning threshold.",
            "severity": "HIGH"
        })
        
    return warnings
