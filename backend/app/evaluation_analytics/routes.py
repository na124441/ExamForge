from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.evaluation_analytics.service import get_all_evaluator_analytics, get_conflict_rate_summary
from app.evaluation_analytics.evaluator_metrics import compute_evaluator_metrics
from app.evaluation_analytics.bias_detector import detect_evaluator_bias
from app.evaluation_analytics.speed_monitor import check_evaluator_speed
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker

router = APIRouter(tags=["evaluation_analytics"])

@router.get("/api/evaluation/analytics/evaluators")
def get_evaluators_analytics(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "AUDITOR"]))
):
    return get_all_evaluator_analytics(db)

@router.get("/api/evaluation/analytics/evaluator/{evaluator_id}")
def get_evaluator_analytic(
    evaluator_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "AUDITOR"]))
):
    metrics = compute_evaluator_metrics(db, evaluator_id)
    biases = detect_evaluator_bias(db, evaluator_id)
    speeds = check_evaluator_speed(db, evaluator_id)
    
    return {
        "evaluator_id": evaluator_id,
        "metrics": metrics,
        "warnings": biases + speeds
    }

@router.get("/api/evaluation/analytics/conflict-rate")
def get_conflict_rate(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "AUDITOR"]))
):
    return get_conflict_rate_summary(db)

@router.get("/api/evaluation/analytics/risk")
def get_evaluation_risk_warnings(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "AUDITOR"]))
):
    # Returns all warnings across all evaluators
    all_evals = get_all_evaluator_analytics(db)
    all_warnings = []
    for ev in all_evals:
        for w in ev["warnings"]:
            all_warnings.append({
                "evaluator_id": ev["evaluator_id"],
                "name": ev["name"],
                "email": ev["email"],
                "code": w["code"],
                "message": w["message"],
                "severity": w["severity"]
            })
    return {"warnings": all_warnings}
