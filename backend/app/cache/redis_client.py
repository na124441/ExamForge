import time
from app.config import settings

class MockRedis:
    """In-memory dictionary fallback for Redis commands when server is offline."""
    def __init__(self):
        self.data = {}
        self.expires = {}

    def get(self, key: str):
        self._check_expire(key)
        return self.data.get(key)

    def set(self, key: str, value, ex=None):
        self.data[key] = str(value) if value is not None else None
        if ex:
            self.expires[key] = time.time() + ex
        else:
            self.expires.pop(key, None)
        return True

    def delete(self, key: str):
        self.data.pop(key, None)
        self.expires.pop(key, None)
        return True

    def exists(self, key: str) -> bool:
        self._check_expire(key)
        return key in self.data

    def incr(self, key: str):
        self._check_expire(key)
        val = int(self.data.get(key, 0)) + 1
        self.data[key] = str(val)
        return val

    def ping(self) -> bool:
        return True

    def _check_expire(self, key: str):
        if key in self.expires and time.time() > self.expires[key]:
            self.data.pop(key, None)
            self.expires.pop(key, None)


# Singleton instances
_redis_client = None
_use_fallback = False

def get_redis_client():
    global _redis_client, _use_fallback
    if _redis_client is not None:
        return _redis_client
    
    # Try importing redis package
    try:
        import redis
        client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        # Attempt a quick ping to see if server is active
        client.ping()
        _redis_client = client
        _use_fallback = False
        print("Connected to Redis successfully.")
    except Exception as e:
        print(f"Redis not available, using in-memory Cache fallback: {e}")
        _redis_client = MockRedis()
        _use_fallback = True
        
    return _redis_client

def is_redis_degraded() -> bool:
    """Helper to detect if we are running in degraded cache mode."""
    get_redis_client()
    return _use_fallback
