import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import AuthEvent

def log_auth_event(
    db: Session,
    event_type: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    device_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """Records security-sensitive authentication audit events in DB without logging plaintext OTPs."""
    # Ensure plaintext OTP is never logged in metadata
    safe_metadata = metadata.copy() if metadata else {}
    safe_metadata.pop("otp", None)
    safe_metadata.pop("otp_code", None)
    safe_metadata.pop("raw_otp", None)

    event = AuthEvent(
        user_id=user_id,
        event_type=event_type,
        ip_address=ip_address,
        user_agent=user_agent,
        device_id=device_id,
        metadata_json=json.dumps(safe_metadata)
    )
    db.add(event)
    db.commit()
    return event
