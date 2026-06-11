from app.db.session import SessionLocal
from app.models import AuditNamespace

def capture_audit_head_hash(institution_id: str) -> str:
    """Retrieve the current cryptographic head hash of the tenant's audit namespace."""
    db = SessionLocal()
    try:
        ns = db.query(AuditNamespace).filter(AuditNamespace.institution_id == institution_id).first()
        if ns:
            return ns.current_head_hash or "empty_head"
        return "no_namespace"
    except Exception:
        return "error_capturing"
    finally:
        db.close()
