from app.cache.redis_client import get_redis_client

def check_rate_limit(actor_id: str, action: str, limit: int = 10, window_seconds: int = 60) -> bool:
    """Increment and verify client action count. Returns True if allowed, False if throttled."""
    client = get_redis_client()
    key = f"rate_limit:{actor_id}:{action}"
    try:
        # Check if key exists
        if not client.exists(key):
            # Key does not exist, set initial value to 1 and expire
            client.set(key, 1, ex=window_seconds)
            return True
        
        # Increment value
        current = client.incr(key)
        if current > limit:
            return False
        return True
    except Exception as e:
        print(f"Rate limiting check failed: {e}")
        # Allow request to proceed on cache failure to avoid system outage
        return True
