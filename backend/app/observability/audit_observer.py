from app.observability.metrics import metrics_registry

def notify_audit_write_failure(error_reason: str):
    """Triggers metrics increments and alarms if audit ledger writes fail."""
    metrics_registry.increment("examforge_audit_chain_failures_total")
    print(f"[ALARM] Audit log write failed: {error_reason}")
