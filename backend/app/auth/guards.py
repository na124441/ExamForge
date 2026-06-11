from fastapi import Depends, HTTPException, status
from app.auth.routes import get_current_user, UserResponse
from app.audit.ledger import log_event
from app.database import SessionLocal

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        if current_user.role not in self.allowed_roles:
            # Log denied access attempt in Audit Ledger
            db = SessionLocal()
            try:
                log_event(
                    db=db,
                    actor_id=current_user.id,
                    action="UNAUTHORIZED_ACCESS_ATTEMPT",
                    resource_type="SystemEndpoint",
                    resource_id="API_GUARD",
                    payload_data=f"User {current_user.email} (Role: {current_user.role}) attempted restricted action requiring: {self.allowed_roles}"
                )
            finally:
                db.close()

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied. Required role: {self.allowed_roles}. Current role: {current_user.role}"
            )
        return current_user
