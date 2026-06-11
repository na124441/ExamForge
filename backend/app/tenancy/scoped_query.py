from sqlalchemy.orm import Session
from app.tenancy.context import tenant_context

def get_scoped_query(model, db: Session):
    """
    Returns a query for the model scoped to the active tenant/institution_id.
    """
    query = db.query(model)
    
    # Bypass for super admin
    if tenant_context.active_role == "PLATFORM_SUPER_ADMIN":
        return query
        
    inst_id = tenant_context.institution_id
    if inst_id and hasattr(model, "institution_id"):
        return query.filter(model.institution_id == inst_id)
        
    return query
