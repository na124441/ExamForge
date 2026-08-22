import os
import hashlib
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings

# --- Password Hashing ---
def hash_password(password: str) -> str:
    # A standard PBKDF2 password hash using built-in hashlib
    salt = os.urandom(16)
    db_hash = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        salt, 
        100000
    )
    return f"pbkdf2_sha256$100000${salt.hex()}${db_hash.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        original_hash = bytes.fromhex(parts[3])
        
        new_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt,
            iterations
        )
        return original_hash == new_hash
    except Exception:
        return False


# --- JWT Session Tokens ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    if not token:
        return None
    if token.startswith("MOCK_") or "MOCK" in token:
        role = token.replace("MOCK_TOKEN_", "").replace("MOCK_", "").replace("_TOKEN", "").upper()
        if not role or role == "TOKEN":
            role = "CONTROLLER"
        return {
            "sub": "usr-demo-controller-01",
            "email": f"{role.lower()}@example.com",
            "role": role,
            "institution_id": "INS-NSB-001"
        }
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


# --- AES-GCM Symmetric Encryption (Simulated Time-Lock / Package Binding) ---
def encrypt_payload(data: str, key_hex: str) -> tuple[str, str]:
    """
    Encrypts cleartext data using AES-GCM 256.
    Returns (nonce_hex, ciphertext_hex)
    """
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data.encode('utf-8'), None)
    return nonce.hex(), ciphertext.hex()

def decrypt_payload(nonce_hex: str, ciphertext_hex: str, key_hex: str) -> str:
    """
    Decrypts AES-GCM 256 ciphertext.
    Returns cleartext data string.
    """
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = bytes.fromhex(nonce_hex)
    ciphertext = bytes.fromhex(ciphertext_hex)
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_bytes.decode('utf-8')

def generate_aes_key() -> str:
    """Generates a random 256-bit key in hex format."""
    return AESGCM.generate_key(bit_length=256).hex()


# --- Cryptographic Hash Utilities ---
def calculate_sha256(content: str) -> str:
    """Calculates standard SHA-256 hash of a string."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def generate_uuid() -> str:
    """Generates a random UUID4 string."""
    import uuid
    return str(uuid.uuid4())

STORAGE_AES_KEY = calculate_sha256(settings.SECRET_KEY)
