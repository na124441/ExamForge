from app.cache.redis_client import get_redis_client

def acquire_lock(key: str, ttl_seconds: int = 60) -> bool:
    """Acquire a distributed lock. Returns True if successful, False if already locked."""
    client = get_redis_client()
    try:
        # For real Redis, set NX (only set if not exists)
        if hasattr(client, "set") and not hasattr(client, "data"):
            # Real Redis client set
            return bool(client.set(key, "LOCKED", ex=ttl_seconds, nx=True))
        else:
            # Mock client NX implementation
            if not client.exists(key):
                client.set(key, "LOCKED", ex=ttl_seconds)
                return True
            return False
    except Exception as e:
        print(f"Failed to acquire lock {key}: {e}")
        return False

def release_lock(key: str) -> bool:
    """Release a lock by deleting the key."""
    client = get_redis_client()
    try:
        client.delete(key)
        return True
    except Exception as e:
        print(f"Failed to release lock {key}: {e}")
        return False

def extend_lock(key: str, ttl_seconds: int = 60) -> bool:
    """Extend the expiration of an existing lock."""
    client = get_redis_client()
    try:
        if client.exists(key):
            client.set(key, "LOCKED", ex=ttl_seconds)
            return True
        return False
    except Exception as e:
        print(f"Failed to extend lock {key}: {e}")
        return False
