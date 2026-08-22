from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

router = APIRouter(tags=["keyspace"])

def generate_ecdsa_keypair():
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
    
    return public_pem, private_pem

from app.database import get_db
from app.models import InstitutionKey
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access

class KeyInitializeRequest(BaseModel):
    key_type: str # CERTIFICATE_SIGNING, RECEIPT_SIGNING, AUDIT_SIGNING, PACKAGE_SIGNING

@router.post("/api/keyspace/institution/{institution_id}/initialize")
def initialize_keyspace(
    institution_id: str,
    request: KeyInitializeRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["PLATFORM_SUPER_ADMIN", "CONTROLLER"]))
):
    guard_tenant_access(institution_id)

    # Rejects if key already active for that type
    existing = db.query(InstitutionKey).filter(
        InstitutionKey.institution_id == institution_id,
        InstitutionKey.key_type == request.key_type,
        InstitutionKey.status == "ACTIVE"
    ).first()
    
    if existing:
        return existing

    # Generate real ECDSA keypair
    pub_k, priv_k = generate_ecdsa_keypair()

    new_key = InstitutionKey(
        institution_id=institution_id,
        key_type=request.key_type,
        algorithm="ECDSA_P256",
        public_key=pub_k,
        private_key=priv_k,
        status="ACTIVE"
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    return new_key

@router.get("/api/keyspace/institution/{institution_id}/keys")
def get_institution_keys(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    guard_tenant_access(institution_id)
    keys = db.query(InstitutionKey).filter(InstitutionKey.institution_id == institution_id).all()
    # Exclude private key for safety
    return [
        {
            "id": k.id,
            "institution_id": k.institution_id,
            "key_type": k.key_type,
            "algorithm": k.algorithm,
            "public_key": k.public_key,
            "status": k.status,
            "created_at": k.created_at
        }
        for k in keys
    ]

@router.post("/api/keyspace/keys/{key_id}/rotate")
def rotate_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "SECURITY_OFFICER", "PLATFORM_ADMIN", "AUTHORITY"]))
):
    try:
        key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
        if not key:
            raise HTTPException(status_code=404, detail="Key not found")
            
        guard_tenant_access(key.institution_id)

        # Mark old key as rotated
        key.status = "ROTATED"
        
        # Generate real ECDSA keypair
        pub_k, priv_k = generate_ecdsa_keypair()

        new_key = InstitutionKey(
            institution_id=key.institution_id,
            key_type=key.key_type,
            algorithm="ECDSA_P256",
            public_key=pub_k,
            private_key=priv_k,
            status="ACTIVE"
        )
        db.add(new_key)
        db.commit()
        return {"status": "KEY_ROTATED", "new_key_id": new_key.id}
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to rotate cryptographic key: {str(e)}")

@router.post("/api/keyspace/keys/{key_id}/revoke")
def revoke_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "SECURITY_OFFICER", "PLATFORM_ADMIN", "AUTHORITY"]))
):
    try:
        key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
        if not key:
            raise HTTPException(status_code=404, detail="Key not found")
            
        guard_tenant_access(key.institution_id)
        key.status = "REVOKED"
        db.commit()
        return {"status": "KEY_REVOKED", "key_id": key_id}
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to revoke cryptographic key: {str(e)}")

@router.get("/api/keyspace/keys/{key_id}/public")
def get_public_key(key_id: str, db: Session = Depends(get_db)):
    # Public endpoint to fetch public key for verifying signed certificates/receipts
    key = db.query(InstitutionKey).filter(InstitutionKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    return {
        "id": key.id,
        "key_type": key.key_type,
        "public_key": key.public_key,
        "status": key.status
    }
