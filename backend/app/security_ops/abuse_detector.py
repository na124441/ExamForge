from app.db.session import SessionLocal
from app.models import AbuseEvent
from app.security_ops.ip_policy import block_ip_address

def detect_and_log_abuse(actor_id: str, abuse_type: str, description: str, ip_address: str):
    """Log abuse event in DB and automatically blacklist IP for production safety."""
    db = SessionLocal()
    try:
        evt = AbuseEvent(
            actor_id=actor_id,
            abuse_type=abuse_type,
            description=description,
            ip_address=ip_address
        )
        db.add(evt)
        db.commit()
        
        # Block IP
        block_ip_address(ip_address)
    except Exception as e:
        print(f"Abuse logging error: {e}")
    finally:
        db.close()
