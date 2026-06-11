from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json

from app.database import get_db
from app.db.health import check_db_health
from app.cache.redis_client import is_redis_degraded
from app.cache.heartbeat import get_active_sessions_count
from app.storage.storage_client import get_storage_client
from app.observability.metrics import metrics_registry
from app.models import AuditNamespace, InstitutionKey, DeploymentConfig

router = APIRouter(tags=["observability"])

@router.get("/health/live")
def health_live():
    """Simple check to verify the API process is alive."""
    return {"status": "OK"}

@router.get("/health/ready")
def health_ready(db: Session = Depends(get_db)):
    """Verifies that the API can accept traffic (Database check)."""
    db_health = check_db_health()
    if db_health == "UNHEALTHY":
        raise HTTPException(status_code=503, detail="Database connection is unhealthy.")
    return {"status": "READY"}

@router.get("/health/deep")
def health_deep(db: Session = Depends(get_db)):
    """Performs validation of database, cache locks, object storage, background queues, and keyspace status."""
    db_status = check_db_health()
    
    redis_status = "DEGRADED" if is_redis_degraded() else "OK"
    
    # Storage check
    try:
        get_storage_client()
        storage_status = "OK"
    except Exception:
        storage_status = "UNHEALTHY"
        
    # Check simulated worker outage via config
    worker_outage_conf = db.query(DeploymentConfig).filter(
        DeploymentConfig.config_key.in_(["worker_outage_simulated", "worker_queue_stuck"])
    ).filter(DeploymentConfig.config_value == "True").first()
    workers_status = "DEGRADED" if worker_outage_conf else "OK"
    
    # Audit Namespace status check
    invalid_ns = db.query(AuditNamespace).filter(AuditNamespace.status == "INVALID").first()
    ns_status = "DEGRADED" if invalid_ns else "OK"
    
    # Keyspace check: any active keys?
    active_key = db.query(InstitutionKey).filter(InstitutionKey.status == "ACTIVE").first()
    keyspace_status = "OK" if active_key else "DEGRADED"
    
    # Determine overall status
    statuses = [db_status, redis_status, storage_status, workers_status, ns_status, keyspace_status]
    if "UNHEALTHY" in statuses:
        overall = "UNHEALTHY"
    elif "DEGRADED" in statuses:
        overall = "DEGRADED"
    else:
        overall = "READY"
        
    return {
        "status": overall,
        "api": "OK",
        "database": db_status,
        "redis": redis_status,
        "storage": storage_status,
        "workers": workers_status,
        "audit_namespace": ns_status,
        "keyspace": keyspace_status,
        "checked_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/api/ops/metrics")
def get_metrics():
    """Exposes core metrics in structured JSON."""
    # Synchronize candidate sessions active counter
    metrics_registry.counters["examforge_candidate_sessions_active"] = get_active_sessions_count()
    return {
        "counters": metrics_registry.counters,
        "average_latency_seconds": metrics_registry.get_avg_latency()
    }
