import json
from app.cache.redis_client import get_redis_client

def get_session_state(session_id: str) -> dict:
    """Retrieve temporary session state dictionary from the cache."""
    client = get_redis_client()
    try:
        val = client.get(f"session:{session_id}")
        if val:
            return json.loads(val)
        return {}
    except Exception:
        return {}

def set_session_state(session_id: str, state: dict, ttl_seconds: int = 3600) -> bool:
    """Write temporary session state dictionary to the cache."""
    client = get_redis_client()
    try:
        client.set(f"session:{session_id}", json.dumps(state), ex=ttl_seconds)
        return True
    except Exception:
        return False
