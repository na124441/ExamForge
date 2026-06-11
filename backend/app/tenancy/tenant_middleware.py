from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.tenancy.context import tenant_id_var, user_id_var, active_role_var
from app.security import decode_access_token

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization")
        tenant_id = None
        user_id = None
        role = None
        
        # Super Admin override header
        admin_override = request.headers.get("X-Tenant-Scope")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = decode_access_token(token)
                if payload:
                    user_id = payload.get("sub")
                    role = payload.get("role")
                    tenant_id = payload.get("institution_id")
            except Exception:
                pass
                
        if admin_override:
            tenant_id = admin_override

        # Default fallback for unauthenticated calls
        if not tenant_id and request.query_params.get("institution_id"):
            tenant_id = request.query_params.get("institution_id")
            
        # Bind context
        t_token = tenant_id_var.set(tenant_id)
        u_token = user_id_var.set(user_id)
        r_token = active_role_var.set(role)
        
        try:
            response = await call_next(request)
            return response
        finally:
            tenant_id_var.reset(t_token)
            user_id_var.reset(u_token)
            active_role_var.reset(r_token)
