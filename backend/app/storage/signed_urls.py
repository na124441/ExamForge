import hmac
import hashlib
import time
from app.config import settings

def verify_presigned_url(bucket: str, key: str, expires: int, signature: str) -> bool:
    """Check if presigned local storage HMAC signature is valid and not expired."""
    try:
        # Enforce expiration limit
        if time.time() > int(expires):
            print("Presigned URL access rejected: URL expired.")
            return False
        
        # Verify HMAC match
        msg = f"{bucket}:{key}:{expires}".encode("utf-8")
        expected = hmac.new(settings.SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()
        
        return hmac.compare_digest(expected, signature)
    except Exception as e:
        print(f"Error validating presigned URL: {e}")
        return False
