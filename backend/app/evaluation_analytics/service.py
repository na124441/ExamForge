from sqlalchemy.orm import Session
from app.models import User
from app.evaluation_analytics.evaluator_metrics import compute_evaluator_metrics
from app.evaluation_analytics.bias_detector import detect_evaluator_bias
from app.evaluation_analytics.speed_monitor import check_evaluator_speed
from typing import List, Dict, Any

def get_all_evaluator_analytics(db: Session) -> List[Dict[str, Any]]:
    users = db.query(User).all()
    results = []
    
    for u in users:
        from app.auth.routes import DEMO_USERS
        is_eval = False
        if u.email in DEMO_USERS:
            is_eval = (DEMO_USERS[u.email]["role"] == "EVALUATOR")
        elif "evaluator" in u.email.lower():
            is_eval = True
            
        if is_eval:
            metrics = compute_evaluator_metrics(db, u.id)
            biases = detect_evaluator_bias(db, u.id)
            speeds = check_evaluator_speed(db, u.id)
            
            warnings = biases + speeds
            
            results.append({
                "evaluator_id": u.id,
                "name": u.name,
                "email": u.email,
                "metrics": metrics,
                "warnings": warnings
            })
            
    return results

def get_conflict_rate_summary(db: Session) -> Dict[str, Any]:
    from app.models import EvaluationConflict, EvaluationMark
    total_evals = db.query(EvaluationMark).count()
    total_conflicts = db.query(EvaluationConflict).count()
    
    rate = 0.0
    if total_evals > 0:
        rate = total_conflicts / total_evals
        
    return {
        "total_evaluations": total_evals,
        "total_conflicts": total_conflicts,
        "conflict_rate": rate
    }
