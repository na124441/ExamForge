# Simple IP policy control list
BLOCKED_IPS = set()
ALLOWED_IPS = set()

def is_ip_blocked(ip_address: str) -> bool:
    """Check if the client IP is blocked."""
    return ip_address in BLOCKED_IPS

def block_ip_address(ip_address: str):
    """Add IP to blacklist."""
    BLOCKED_IPS.add(ip_address)

def unblock_ip_address(ip_address: str):
    """Remove IP from blacklist."""
    BLOCKED_IPS.discard(ip_address)
