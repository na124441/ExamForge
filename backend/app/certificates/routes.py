import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Result, Candidate, ResultCertificate, CertificateVerificationLog, InstitutionKey
from app.certificates.schemas import CertificateResponse
from app.certificates.certificate_signer import sign_certificate_hash, verify_certificate_signature
from app.security import calculate_sha256
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event

router = APIRouter(tags=["certificates"])

@router.post("/api/certificates/result/{result_id}/generate", response_model=CertificateResponse)
def generate_certificate(
    result_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    # Find result
    res = db.query(Result).filter(Result.id == result_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
        
    cand = db.query(Candidate).filter(Candidate.id == res.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Supersede existing certificates for this result
    existing_certs = db.query(ResultCertificate).filter(
        ResultCertificate.result_id == result_id,
        ResultCertificate.status == "VALID"
    ).all()
    for cert in existing_certs:
        cert.status = "SUPERSEDED"
    db.commit()

    # Create new certificate
    payload = f"{res.id}|{cand.anonymous_id}|{res.exam_id}|{res.result_hash}"
    cert_hash = calculate_sha256(payload)
    
    inst_id = current_user.institution_id or "INS-GENESIS"
    sig = None
    
    key = db.query(InstitutionKey).filter(
        InstitutionKey.institution_id == inst_id,
        InstitutionKey.key_type == "CERTIFICATE_SIGNING"
    ).order_by(InstitutionKey.created_at.desc()).first()
    
    if key:
        if key.status in ["COMPROMISED", "REVOKED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Active certificate signing key is COMPROMISED or REVOKED. Signing blocked."
            )
        elif key.status == "ACTIVE":
            sig = sign_certificate_hash(cert_hash, key.private_key)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active certificate signing key found."
            )
    else:
        sig = sign_certificate_hash(cert_hash)

    new_cert = ResultCertificate(
        result_id=res.id,
        candidate_anonymous_id=cand.anonymous_id,
        exam_id=res.exam_id,
        result_hash=res.result_hash,
        certificate_hash=cert_hash,
        signature=sig,
        verification_url=f"/verify-certificate/{res.id}", # Placeholder path or direct ID
        status="VALID"
    )
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)

    # Set real verification URL with certificate ID
    new_cert.verification_url = f"/verify-certificate/{new_cert.id}"
    db.commit()

    log_event(
        db=db,
        actor_id=current_user.id,
        action="CERTIFICATE_GENERATED",
        resource_type="ResultCertificate",
        resource_id=new_cert.id,
        payload_data=json.dumps({
            "certificate_id": new_cert.id,
            "result_id": res.id,
            "certificate_hash": cert_hash
        })
    )

    return new_cert

@router.get("/api/certificates/result/{certificate_id}", response_model=CertificateResponse)
def get_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = db.query(ResultCertificate).filter(ResultCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert

@router.get("/api/certificates/verify/{certificate_id}")
@router.get("/api/certificates/result/{certificate_id}/verify")
def verify_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = db.query(ResultCertificate).filter(ResultCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Verify signature
    payload = f"{cert.result_id}|{cert.candidate_anonymous_id}|{cert.exam_id}|{cert.result_hash}"
    recalc_hash = calculate_sha256(payload)
    
    cand = db.query(Candidate).filter(Candidate.anonymous_id == cert.candidate_anonymous_id).first()
    inst_id = cand.institution_id if cand else None
    
    sig_valid = False
    if inst_id:
        keys = db.query(InstitutionKey).filter(
            InstitutionKey.institution_id == inst_id
        ).all()
        for k in keys:
            if k.status in ["ACTIVE", "ARCHIVED", "ROTATED"]:
                if verify_certificate_signature(recalc_hash, cert.signature, k.public_key):
                    sig_valid = True
                    break
                    
    if not sig_valid:
        sig_valid = verify_certificate_signature(recalc_hash, cert.signature)
    
    # Check if certificate hash matches recalculation
    hash_match = (recalc_hash == cert.certificate_hash)

    # Check if latest result hash matches certificate result_hash
    res = db.query(Result).filter(Result.id == cert.result_id).first()
    result_hash_matches = False
    if res:
        result_hash_matches = (res.result_hash == cert.result_hash)

    is_valid = sig_valid and hash_match and (cert.status == "VALID") and result_hash_matches

    # Log verification check
    log = CertificateVerificationLog(
        certificate_id=certificate_id,
        status="VALID" if is_valid else "INVALID",
        verifier_ip="127.0.0.1"
    )
    db.add(log)
    db.commit()

    return {
        "certificate_id": certificate_id,
        "is_valid": is_valid,
        "status": cert.status,
        "signature_valid": sig_valid,
        "hash_valid": hash_match,
        "result_hash_current": result_hash_matches,
        "details": {
            "candidate_anonymous_id": cert.candidate_anonymous_id,
            "exam_id": cert.exam_id,
            "issued_at": cert.issued_at.isoformat() if cert.issued_at else None
        }
    }

@router.get("/api/certificates/result/{certificate_id}/download")
def download_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = db.query(ResultCertificate).filter(ResultCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    return {
        "certificate_id": cert.id,
        "result_id": cert.result_id,
        "candidate_anonymous_id": cert.candidate_anonymous_id,
        "exam_id": cert.exam_id,
        "result_hash": cert.result_hash,
        "certificate_hash": cert.certificate_hash,
        "signature": cert.signature,
        "verification_url": cert.verification_url,
        "status": cert.status,
        "issued_at": cert.issued_at.isoformat() if cert.issued_at else None
    }
