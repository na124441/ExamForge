from fastapi import HTTPException
from app.cache.rate_limit import check_rate_limit
from app.db.session import SessionLocal
from app.models import RateLimitEvent
from datetime import datetime, timezone, timedelta

def enforce_rate_limit(actor_id: str, action: str, limit: int = 10, window_seconds: int = 60, ip_address: str = "127.0.0.1", fingerprint: str = None):
    """Enforce rate limits. Raises 429 if limit breached and logs event to DB."""
    allowed = check_rate_limit(actor_id, action, limit, window_seconds)
    if not allowed:
        # Record event in db
        db = SessionLocal()
        try:
            blocked_until = datetime.now(timezone.utc) + timedelta(seconds=window_seconds)
            evt = RateLimitEvent(
                actor_id=actor_id,
                action=action,
                ip_address=ip_address,
                fingerprint=fingerprint,
                blocked_until=blocked_until
            )
            db.add(evt)
            db.commit()
        except Exception as e:
            print(f"Failed to log rate limit event: {e}")
        finally:
            db.close()
            
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Rate limit exceeded. Please try again later."
        )
    return True
