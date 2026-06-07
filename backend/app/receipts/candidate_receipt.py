import time
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from app.security import calculate_sha256

# Cache the generated key in memory for this session
_PRIVATE_KEY = None

def get_private_key():
    global _PRIVATE_KEY
    if _PRIVATE_KEY is None:
        # Generate a standard NIST P-256 key
        _PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
    return _PRIVATE_KEY

def sign_receipt(anonymous_id: str, exam_id: str, timestamp: str, root_hash: str) -> str:
    """
    Cryptographically signs the receipt payload using the server's ECDSA private key.
    Payload format: {anonymous_id}|{exam_id}|{timestamp}|{root_hash}
    Returns: Hex string signature
    """
    private_key = get_private_key()
    payload = f"{anonymous_id}|{exam_id}|{timestamp}|{root_hash}".encode('utf-8')
    signature = private_key.sign(payload, ec.ECDSA(hashes.SHA256()))
    return signature.hex()

def verify_receipt_signature(anonymous_id: str, exam_id: str, timestamp: str, root_hash: str, signature_hex: str) -> bool:
    """
    Verifies that the receipt signature matches the payload.
    """
    private_key = get_private_key()
    public_key = private_key.public_key()
    payload = f"{anonymous_id}|{exam_id}|{timestamp}|{root_hash}".encode('utf-8')
    try:
        signature = bytes.fromhex(signature_hex)
        public_key.verify(signature, payload, ec.ECDSA(hashes.SHA256()))
        return True
    except Exception:
        return False
