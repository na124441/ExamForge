import contextvars
from typing import Optional, List

# ContextVars to store tenancy info safely across async execution paths
tenant_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("tenant_id", default=None)
user_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)
active_role_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("active_role", default=None)
permissions_var: contextvars.ContextVar[List[str]] = contextvars.ContextVar("permissions", default=[])
tenant_slug_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("tenant_slug", default=None)

class TenantContext:
    @property
    def institution_id(self) -> Optional[str]:
        return tenant_id_var.get()

    @institution_id.setter
    def institution_id(self, val: Optional[str]):
        tenant_id_var.set(val)

    @property
    def user_id(self) -> Optional[str]:
        return user_id_var.get()

    @user_id.setter
    def user_id(self, val: Optional[str]):
        user_id_var.set(val)

    @property
    def active_role(self) -> Optional[str]:
        return active_role_var.get()

    @active_role.setter
    def active_role(self, val: Optional[str]):
        active_role_var.set(val)

    @property
    def permissions(self) -> List[str]:
        return permissions_var.get()

    @permissions.setter
    def permissions(self, val: List[str]):
        permissions_var.set(val)

    @property
    def tenant_slug(self) -> Optional[str]:
        return tenant_slug_var.get()

    @tenant_slug.setter
    def tenant_slug(self, val: Optional[str]):
        tenant_slug_var.set(val)

# Global helper instance
tenant_context = TenantContext()
