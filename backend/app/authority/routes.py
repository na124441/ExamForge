from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.routes import get_current_user, UserResponse
from app.authority.dashboard import get_authority_dashboard_metrics

router = APIRouter(prefix="/api/authority", tags=["authority"])

@router.get("/dashboard")
def get_authority_dashboard(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Exposes unified metrics across the entire platform for executive review.
    """
    inst_id = current_user.institution_id or "INS-NSB-001"
    try:
        metrics = get_authority_dashboard_metrics(db, inst_id)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compile executive dashboard: {str(e)}"
        )
