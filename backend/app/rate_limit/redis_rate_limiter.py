import time
from typing import Dict, Tuple

# In-Memory & Redis Rate Limiter Store
# IP -> list of timestamps, Destination -> list of timestamps
_RATE_LIMIT_STORE: Dict[str, list] = {}

class RedisRateLimiter:
    @staticmethod
    def is_rate_limited(key: str, max_requests: int = 5, window_seconds: int = 60) -> Tuple[bool, int]:
        """
        Sliding window rate limiter for IP, Email, Phone, or Account.
        Returns (is_blocked: bool, retry_after_seconds: int).
        """
        now = time.time()
        timestamps = _RATE_LIMIT_STORE.get(key, [])

        # Filter out timestamps outside window
        valid_timestamps = [ts for ts in timestamps if now - ts < window_seconds]
        
        if len(valid_timestamps) >= max_requests:
            oldest_in_window = valid_timestamps[0]
            retry_after = int(window_seconds - (now - oldest_in_window)) + 1
            return True, retry_after

        valid_timestamps.append(now)
        _RATE_LIMIT_STORE[key] = valid_timestamps
        return False, 0
