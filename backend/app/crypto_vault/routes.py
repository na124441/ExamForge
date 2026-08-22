from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.crypto_vault.ed25519_provider import CryptographicVault
from typing import Dict, Any

router = APIRouter(prefix="/api/crypto-vault", tags=["v2.0 Cryptographic Vault & ZKP"])

vault = CryptographicVault()

@router.post("/sign")
def sign_payload(payload: Dict[str, Any]):
    """
    Signs arbitrary payload using the vault ED25519-HMAC cryptographic key.
    """
    data = payload.get("data", "")
    if not data:
        raise HTTPException(status_code=400, detail="Data payload required for signing")
    return vault.generate_digital_signature(data)

@router.get("/zk-proof/{result_id}")
def generate_zkp_proof(result_id: str, score: float = 78.5, threshold: float = 50.0):
    """
    Generates a Zero-Knowledge Proof (ZKP) score attestation.
    """
    candidate_hash = f"cand_hash_{result_id}_3891491823901"
    return vault.generate_zkp_score_proof(result_id, candidate_hash, score, threshold)
