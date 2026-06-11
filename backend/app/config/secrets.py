import re

SECRETS_PATTERNS = [
    re.compile(r"password", re.IGNORECASE),
    re.compile(r"secret", re.IGNORECASE),
    re.compile(r"key", re.IGNORECASE),
    re.compile(r"token", re.IGNORECASE),
    re.compile(r"private", re.IGNORECASE),
]

def sanitize_logs_secrets(message: str) -> str:
    """Mask credentials or key signatures in string log values."""
    sanitized = message
    # Simple search & replace for common query params or credentials format
    # Replace key value matches like key=somekey or "password": "value"
    sanitized = re.sub(r'(?i)(password|secret|key|token|private_key)["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_\-\+\/=]{6,})["\']?', r'\1: [REDACTED]', sanitized)
    return sanitized
