from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
from app.security import calculate_sha256

_CERT_PRIVATE_KEY = None

def get_cert_private_key():
    global _CERT_PRIVATE_KEY
    if _CERT_PRIVATE_KEY is None:
        _CERT_PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
    return _CERT_PRIVATE_KEY

def sign_with_pem_private_key(private_key_pem: str, cert_hash: str) -> str:
    private_key = load_pem_private_key(private_key_pem.encode('utf-8'), password=None)
    signature = private_key.sign(
        cert_hash.encode('utf-8'),
        ec.ECDSA(hashes.SHA256())
    )
    return signature.hex()

def verify_with_pem_public_key(public_key_pem: str, cert_hash: str, signature_hex: str) -> bool:
    try:
        public_key = load_pem_public_key(public_key_pem.encode('utf-8'))
        signature = bytes.fromhex(signature_hex)
        public_key.verify(
            signature,
            cert_hash.encode('utf-8'),
            ec.ECDSA(hashes.SHA256())
        )
        return True
    except Exception:
        return False

def sign_certificate_hash(cert_hash: str, private_key_pem: str = None) -> str:
    if private_key_pem:
        try:
            return sign_with_pem_private_key(private_key_pem, cert_hash)
        except Exception:
            pass
    private_key = get_cert_private_key()
    signature = private_key.sign(
        cert_hash.encode('utf-8'),
        ec.ECDSA(hashes.SHA256())
    )
    return signature.hex()

def verify_certificate_signature(cert_hash: str, signature_hex: str, public_key_pem: str = None) -> bool:
    if public_key_pem:
        try:
            return verify_with_pem_public_key(public_key_pem, cert_hash, signature_hex)
        except Exception:
            pass
    private_key = get_cert_private_key()
    public_key = private_key.public_key()
    try:
        signature = bytes.fromhex(signature_hex)
        public_key.verify(
            signature,
            cert_hash.encode('utf-8'),
            ec.ECDSA(hashes.SHA256())
        )
        return True
    except Exception:
        return False
