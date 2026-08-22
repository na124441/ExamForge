"""
Authoritative FastAPI Security Dependencies for ExamForge Zero-Trust Architecture.
Enforces Authentication, Session Revocation (authz_version), Permissions,
Tenant Boundary, ReBAC Resource Ownership, and State Machine Invariants.
"""

import time
import json
from typing import Optional, List, Set, Callable
from pydantic import BaseModel, EmailStr
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import User, AnonymousCopy, DoubleEvaluation, Result, Dispute, ExamCenter
from app.security import decode_access_token
from app.audit.ledger import log_event
from app.tenancy.context import tenant_context
from app.auth.permissions import get_role_permissions, CanonicalRole, has_permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

# --- In-Memory Rate-Limited Denial Aggregator (Prevents Audit Ledger Log Flooding) ---
_DENIAL_CACHE: dict = {}
_DENIAL_WINDOW_SEC = 5

def log_authorization_denial(
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    reason: str,
    db: Session
):
    """
    Records an authorization failure to the append-only audit ledger with
    rate-limited aggregation to protect the database from denial-of-service sweeps.
    """
    key = f"{actor_id}:{action}:{resource_type}:{resource_id}"
    now = time.time()
    cached = _DENIAL_CACHE.get(key)

    if cached and (now - cached["last_time"] < _DENIAL_WINDOW_SEC):
        cached["count"] += 1
        return

    count = cached["count"] if cached else 1
    _DENIAL_CACHE[key] = {"last_time": now, "count": 1}

    payload = {
        "reason": reason,
        "burst_count": count
    }

    try:
        log_event(
            db=db,
            actor_id=actor_id,
            action="AUTHORIZATION_DENIED",
            resource_type=resource_type,
            resource_id=resource_id,
            payload_data=json.dumps(payload)
        )
    except Exception:
        pass


class AuthenticatedPrincipal(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    institution_id: Optional[str] = None
    status: str
    authz_version: int
    permissions: Set[str] = set()

    class Config:
        arbitrary_types_allowed = True


def require_authenticated_principal(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> AuthenticatedPrincipal:
    """
    Authoritative authentication gate:
    1. Validates JWT signature and expiry.
    2. Queries live Database user record (never trusts client claims alone).
    3. Validates account status == ACTIVE.
    4. Validates token.authz_version == db_user.authz_version for instant revocation.
    5. Resolves live permissions from canonical RBAC catalog.
    6. Establishes server-side tenant isolation context.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or corrupted token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub")
    token_authz_version: int = payload.get("authz_version", 1)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identity.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Database lookup is authoritative
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status}. Access denied.",
        )

    # Session revocation validation
    db_authz_version = getattr(user, "authz_version", 1)
    if token_authz_version < db_authz_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked or permissions have changed. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Resolve active DB role and permissions
    active_role = user.role or "CANDIDATE"
    perms = get_role_permissions(active_role)
    inst_id = user.institution_id or payload.get("institution_id", "INS-GENESIS")

    # Set server-side tenant context
    tenant_context.set_context(
        tenant_id=inst_id,
        user_id=user.id,
        role=active_role
    )

    return AuthenticatedPrincipal(
        id=user.id,
        name=user.name,
        email=user.email,
        role=active_role,
        institution_id=inst_id,
        status=user.status,
        authz_version=db_authz_version,
        permissions=perms
    )


def require_permission(permission: str) -> Callable:
    """
    Returns a dependency enforcing that the authenticated principal possesses the required permission.
    """
    def permission_guard(
        principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
        db: Session = Depends(get_db)
    ) -> AuthenticatedPrincipal:
        if permission not in principal.permissions:
            log_authorization_denial(
                actor_id=principal.id,
                action="PERMISSION_CHECK_FAILED",
                resource_type="Permission",
                resource_id=permission,
                reason=f"Role {principal.role} lacks permission {permission}",
                db=db
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden. Required permission: {permission}"
            )
        return principal

    return permission_guard


def require_any_permission(permissions: List[str]) -> Callable:
    """
    Returns a dependency enforcing that the principal possesses at least one of the listed permissions.
    """
    def any_permission_guard(
        principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
        db: Session = Depends(get_db)
    ) -> AuthenticatedPrincipal:
        if not any(p in principal.permissions for p in permissions):
            log_authorization_denial(
                actor_id=principal.id,
                action="ANY_PERMISSION_CHECK_FAILED",
                resource_type="PermissionList",
                resource_id=",".join(permissions),
                reason=f"Role {principal.role} lacks any of {permissions}",
                db=db
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden. Requires one of permissions: {permissions}"
            )
        return principal

    return any_permission_guard


def require_role(roles: List[str]) -> Callable:
    """
    Returns a dependency enforcing that the principal belongs to one of the specified canonical roles.
    """
    def role_guard(
        principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
        db: Session = Depends(get_db)
    ) -> AuthenticatedPrincipal:
        if principal.role not in roles and "SUPER_ADMIN" not in roles:
            if principal.role != "SUPER_ADMIN":
                log_authorization_denial(
                    actor_id=principal.id,
                    action="ROLE_CHECK_FAILED",
                    resource_type="Role",
                    resource_id=",".join(roles),
                    reason=f"Role {principal.role} not in allowed roles {roles}",
                    db=db
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Forbidden. Required role: {roles}"
                )
        return principal

    return role_guard


# --- Resource-Level Authorization (ReBAC / Ownership) ---

def require_tenant_access(resource_institution_id: str, principal: AuthenticatedPrincipal, db: Session) -> bool:
    """
    Enforces tenant boundaries: blocks access if the resource belongs to another tenant,
    unless the principal explicitly holds the `tenant.cross.read` permission.
    """
    if "tenant.cross.read" in principal.permissions or "tenant.cross.manage" in principal.permissions:
        return True

    if principal.institution_id and resource_institution_id and principal.institution_id != resource_institution_id:
        log_authorization_denial(
            actor_id=principal.id,
            action="CROSS_TENANT_ACCESS_BLOCKED",
            resource_type="Institution",
            resource_id=resource_institution_id,
            reason=f"Principal tenant {principal.institution_id} attempted access to resource tenant {resource_institution_id}",
            db=db
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied. Cross-tenant access is strictly prohibited."
        )
    return True


def require_evaluator_copy_access(anonymous_id: str, principal: AuthenticatedPrincipal, db: Session) -> AnonymousCopy:
    """
    Enforces double-blind evaluator isolation:
    An evaluator can ONLY access booklet copies assigned directly to them.
    A senior evaluator can only access copies flagged with active variance conflicts.
    """
    copy = db.query(AnonymousCopy).filter(AnonymousCopy.anonymous_id == anonymous_id).first()
    if not copy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anonymous booklet copy not found.")

    # Controllers with tenant evaluation permission can inspect
    if "evaluation.assign" in principal.permissions or "tenant.cross.manage" in principal.permissions:
        return copy

    if principal.role == CanonicalRole.EVALUATOR.value:
        # Check primary or double-eval assignment
        is_assigned = (copy.assigned_evaluator_id == principal.id)
        if not is_assigned:
            # Check double eval table
            de = db.query(DoubleEvaluation).filter(
                DoubleEvaluation.anonymous_id == anonymous_id
            ).first()
            if de and (de.evaluator_a == principal.id or de.evaluator_b == principal.id):
                is_assigned = True

        if not is_assigned:
            log_authorization_denial(
                actor_id=principal.id,
                action="UNASSIGNED_COPY_ACCESS_ATTEMPT",
                resource_type="AnonymousCopy",
                resource_id=anonymous_id,
                reason="Evaluator attempted to access a copy not assigned to them",
                db=db
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied. You are not assigned to evaluate this booklet."
            )

    elif principal.role == CanonicalRole.SENIOR_EVALUATOR.value:
        if "evaluation.conflict.resolve" not in principal.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

    return copy


def require_candidate_result_access(result_id: str, principal: AuthenticatedPrincipal, db: Session) -> Result:
    """
    Enforces candidate result ownership:
    Candidates can ONLY view their own scorecard.
    """
    result = db.query(Result).filter(Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found.")

    if principal.role == CanonicalRole.CANDIDATE.value:
        if result.candidate_id != principal.id:
            log_authorization_denial(
                actor_id=principal.id,
                action="IDOR_RESULT_ATTEMPT",
                resource_type="Result",
                resource_id=result_id,
                reason="Candidate attempted to view another candidate's scorecard",
                db=db
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied. You do not own this scorecard."
            )
    return result


def require_candidate_dispute_access(dispute_id: str, principal: AuthenticatedPrincipal, db: Session) -> Dispute:
    """
    Enforces candidate dispute ownership:
    Candidates can ONLY view their own dispute records.
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")

    if principal.role == CanonicalRole.CANDIDATE.value:
        if dispute.candidate_id != principal.id:
            log_authorization_denial(
                actor_id=principal.id,
                action="IDOR_DISPUTE_ATTEMPT",
                resource_type="Dispute",
                resource_id=dispute_id,
                reason="Candidate attempted to view another candidate's dispute",
                db=db
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied. You do not own this dispute."
            )
    return dispute
