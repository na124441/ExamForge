import hashlib
from starlette.requests import Request

def get_request_fingerprint(request: Request) -> str:
    """Generate MD5 hash client fingerprint based on IP address and User-Agent."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    raw = f"{client_ip}:{user_agent}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()
