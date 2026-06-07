from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import AuditLog
from app.security import calculate_sha256
from datetime import datetime, timezone

GENESIS_HASH = "0" * 64

def log_event(
    db: Session,
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    payload_data: str
) -> AuditLog:
    """
    Logs an event into the database, linking it cryptographically 
    to the preceding audit event.
    """
    # 1. Calculate the hash of the payload
    payload_hash = calculate_sha256(payload_data)
    
    # 2. Retrieve the latest audit log to chain
    latest_log = db.query(AuditLog).order_by(desc(AuditLog.id)).first()
    previous_hash = latest_log.current_hash if latest_log else GENESIS_HASH
    
    # 3. Calculate current chain hash: SHA256(actor + action + payload_hash + previous_hash)
    # We use a deterministic string format
    chain_input = f"{actor_id}|{action}|{payload_hash}|{previous_hash}"
    current_hash = calculate_sha256(chain_input)
    
    # 4. Create and persist the audit record
    new_log = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        payload_hash=payload_hash,
        previous_hash=previous_hash,
        current_hash=current_hash
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

def verify_audit_chain(db: Session) -> tuple[bool, int, str]:
    """
    Verifies the entire audit trail chain of custody.
    Returns: (is_valid, failing_index, error_message)
    """
    logs = db.query(AuditLog).order_by(AuditLog.id).all()
    
    expected_previous = GENESIS_HASH
    for idx, log in enumerate(logs):
        # 1. Verify link back to previous element
        if log.previous_hash != expected_previous:
            return (
                False, 
                idx, 
                f"Broken chain link at index {idx}. Log links to previous {log.previous_hash} but expected {expected_previous}"
            )
        
        # 2. Recalculate and verify current hash
        chain_input = f"{log.actor_id}|{log.action}|{log.payload_hash}|{log.previous_hash}"
        recalculated_hash = calculate_sha256(chain_input)
        if log.current_hash != recalculated_hash:
            return (
                False, 
                idx, 
                f"Hash mismatch at index {idx}. Stored hash {log.current_hash} does not match recalculated hash {recalculated_hash}"
            )
            
        expected_previous = log.current_hash
        
    return True, -1, "Audit chain is intact and fully verified."
