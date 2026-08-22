from typing import List, Union
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.auth.dependencies import (
    require_authenticated_principal,
    AuthenticatedPrincipal,
    log_authorization_denial
)
from app.auth.permissions import has_permission, CanonicalRole

class RoleChecker:
    """
    Role guard that checks whether the authenticated principal has one of the allowed roles,
    or has SUPER_ADMIN role / permission. Logs any unauthorized access attempt.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        current_user: AuthenticatedPrincipal = Depends(require_authenticated_principal),
        db: Session = Depends(get_db)
    ) -> AuthenticatedPrincipal:
        if current_user.role not in self.allowed_roles and current_user.role != CanonicalRole.SUPER_ADMIN.value:
            # Log denied access attempt in Audit Ledger
            log_authorization_denial(
                actor_id=current_user.id,
                action="UNAUTHORIZED_ROLE_ACCESS",
                resource_type="SystemEndpoint",
                resource_id="API_GUARD",
                reason=f"User {current_user.email} (Role: {current_user.role}) attempted action requiring: {self.allowed_roles}",
                db=db
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied. Required role: {self.allowed_roles}. Current role: {current_user.role}"
            )
        return current_user
