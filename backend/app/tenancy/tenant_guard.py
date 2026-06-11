from fastapi import HTTPException, status
from app.tenancy.context import tenant_context
from app.models import TenantSecurityViolation
from app.database import SessionLocal

def guard_tenant_access(resource_institution_id: str):
    """
    Guards access by raising 403 if the resource belongs to a different institution
    than the active tenant context. Logs a violation in tenant_security_violations.
    """
    if tenant_context.active_role == "PLATFORM_SUPER_ADMIN":
        return True
        
    inst_id = tenant_context.institution_id
    # Allow INS-GENESIS as fallback if no active tenant is bound,
    # but block actual mismatches.
    if inst_id and resource_institution_id and inst_id != resource_institution_id:
        # Log a security violation
        db = SessionLocal()
        try:
            violation = TenantSecurityViolation(
                institution_id=inst_id,
                user_id=tenant_context.user_id or "ANONYMOUS",
                violation_type="CROSS_TENANT_ACCESS",
                details=f"Cross-tenant attempt: Access resource for {resource_institution_id}"
            )
            db.add(violation)
            db.commit()
        except Exception:
            pass
        finally:
            db.close()
            
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-tenant access blocked"
        )
    return True
