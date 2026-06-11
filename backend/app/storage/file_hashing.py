import hashlib

def calculate_bytes_sha256(data: bytes) -> str:
    """Returns SHA256 hexadecimal hash string of bytes data."""
    return hashlib.sha256(data).hexdigest()

def verify_data_hash(data: bytes, expected_hash: str) -> bool:
    """Compare content SHA256 against expected signature hash."""
    return calculate_bytes_sha256(data) == expected_hash
