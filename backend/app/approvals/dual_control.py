from sqlalchemy.orm import Session
from app.models import ApprovalRequest

def is_action_authorized(db: Session, institution_id: str, action_type: str, resource_type: str, resource_id: str) -> bool:
    """
    Checks if a privileged action has been approved via the ApprovalRequest workflow.
    """
    req = db.query(ApprovalRequest).filter(
        ApprovalRequest.institution_id == institution_id,
        ApprovalRequest.action_type == action_type,
        ApprovalRequest.resource_type == resource_type,
        ApprovalRequest.resource_id == resource_id,
        ApprovalRequest.status == "APPROVED"
    ).first()
    return req is not None
