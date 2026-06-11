from sqlalchemy.orm import Session
from app.tenancy.context import tenant_context
from app.tenancy.scoped_query import get_scoped_query
from app.models import ExamState

def verify_query_isolation(db: Session, institution_id: str) -> bool:
    """
    Test utility to verify that scoped queries restrict access to the matching tenant.
    """
    # Temporarily bind tenant context
    old_tenant = tenant_context.institution_id
    tenant_context.institution_id = institution_id
    
    try:
        q = get_scoped_query(ExamState, db)
        # Check all returned entities belong to the institution
        for item in q.all():
            if item.institution_id != institution_id:
                return False
        return True
    finally:
        tenant_context.institution_id = old_tenant
