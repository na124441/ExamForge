ERROR_CODES_REGISTRY = {
    "AUTH_FAILED": "Authentication failed. Incorrect credentials provided.",
    "TOKEN_EXPIRED": "Access token has expired or is invalid.",
    "PERMISSION_DENIED": "Insufficient role permissions to execute this request.",
    "CROSS_TENANT_LEAK_DETECTED": "Security Guard: Blocked cross-tenant data retrieval attempt.",
    "AUDIT_LEDGER_BROKEN": "Tamper Guard: Audit logs hash chain matches indicate tampering.",
    "MARKS_CHAIN_TAMPERED": "Tamper Guard: Candidate booklet evaluation hashes mismatch.",
    "UNMITIGATED_CRITICAL_THREATS": "Publication Gate: Unmitigated critical threat found in registry.",
    "UNRESOLVED_P0_INCIDENT": "Publication Gate: Active P0 security incident blocking publication.",
    "PENDING_EMERGENCY_APPROVALS": "Publication Gate: Active approvals pending dual-signature validation.",
    "KEYS_NOT_INITIALIZED": "Tenancy Gate: Signing keys not configured in keyspace.",
    "AUDIT_NAMESPACE_INVALID": "Tenancy Gate: Audit namespace not configured or invalid.",
    "DATABASE_NOT_READY": "Deployment Gate: Primary database state is degraded or offline.",
    "REDIS_LOCK_UNAVAILABLE": "Deployment Gate: Caching distributed lock layer degraded.",
    "STORAGE_UNAVAILABLE": "Deployment Gate: Booklet storage bucket offline.",
    "WORKERS_UNHEALTHY": "Deployment Gate: Background workers queue is stuck.",
    "LEGAL_HOLD_ACTIVE": "Retention Gate: Retention block active. Cannot delete records."
}
