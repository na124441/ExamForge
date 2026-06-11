from app.cache.redis_client import get_redis_client

def set_session_heartbeat(session_id: str, ttl_seconds: int = 30) -> bool:
    """Register or refresh candidate heartbeat window."""
    client = get_redis_client()
    try:
        client.set(f"heartbeat:{session_id}", "ACTIVE", ex=ttl_seconds)
        return True
    except Exception:
        return False

def get_active_sessions_count() -> int:
    """Retrieve count of currently connected candidate sessions."""
    client = get_redis_client()
    try:
        # Check if it is the MockRedis client
        if hasattr(client, "data"):
            # Mock client keys scan
            client._check_expire = getattr(client, "_check_expire", lambda k: None)
            # Make sure all keys are expired correctly
            for k in list(client.expires.keys()):
                client._check_expire(k)
            keys = [k for k in client.data.keys() if k.startswith("heartbeat:")]
            return len(keys)
        else:
            # Real Redis scan
            keys = client.keys("heartbeat:*")
            return len(keys)
    except Exception:
        return 0
