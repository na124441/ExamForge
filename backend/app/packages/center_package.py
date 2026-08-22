import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import EncryptedPackage, ExamState, GeneratedPaper
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event, verify_audit_chain
from app.exams.lifecycle import get_exam_state, set_exam_state
from app.trust.score_engine import calculate_exam_trust_score
from app.security import calculate_sha256

router = APIRouter(tags=["packages"])

class PackageReleaseRequest(BaseModel):
    center_id: str
    signature: str

class GeneratePackageRequest(BaseModel):
    exam_id: str
    paper_id: str
    center_id: str
    encrypted_payload: str
    package_hash: str
    valid_from: str # ISO string
    valid_until: str # ISO string

@router.get("/api/packages/{center_id}")
def get_center_packages(center_id: str, db: Session = Depends(get_db)):
    packages = db.query(EncryptedPackage).filter(EncryptedPackage.center_id == center_id).all()
    return [{
        "package_id": pkg.id,
        "exam_id": pkg.exam_id,
        "paper_id": pkg.paper_id,
        "center_id": pkg.center_id,
        "package_hash": pkg.package_hash,
        "valid_from": pkg.valid_from.isoformat() if pkg.valid_from else None,
        "valid_until": pkg.valid_until.isoformat() if pkg.valid_until else None,
        "status": pkg.status,
        "released_by": pkg.released_by,
        "release_signature": pkg.release_signature
    } for pkg in packages]

@router.post("/api/packages/generate-center-package")
def generate_center_package(
    request: GeneratePackageRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    valid_from_dt = datetime.fromisoformat(request.valid_from.replace("Z", "+00:00"))
    valid_until_dt = datetime.fromisoformat(request.valid_until.replace("Z", "+00:00"))
    
    pkg = EncryptedPackage(
        exam_id=request.exam_id,
        paper_id=request.paper_id,
        center_id=request.center_id,
        encrypted_payload=request.encrypted_payload,
        package_hash=request.package_hash,
        valid_from=valid_from_dt,
        valid_until=valid_until_dt,
        status="SEALED"
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="CENTER_PACKAGE_GENERATED",
        resource_type="EncryptedPackage",
        resource_id=pkg.id,
        payload_data=json.dumps({"package_id": pkg.id, "center_id": pkg.center_id})
    )
    return {"status": "SUCCESS", "package_id": pkg.id}

@router.post("/api/packages/{package_id}/verify")
def verify_package(package_id: str, db: Session = Depends(get_db)):
    pkg = db.query(EncryptedPackage).filter(EncryptedPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
        
    # Recalculate hash over payload to check integrity
    payload_data = json.loads(pkg.encrypted_payload)
    recalc = calculate_sha256(payload_data.get("ciphertext", ""))
    
    hash_valid = recalc == pkg.package_hash
    chain_intact, _, _ = verify_audit_chain(db)
    
    return {
        "package_id": package_id,
        "hash_valid": hash_valid,
        "audit_chain_valid": chain_intact,
        "status": pkg.status
    }

@router.post("/api/packages/{package_id}/release")
def release_package(
    package_id: str,
    request: PackageReleaseRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    pkg = db.query(EncryptedPackage).filter(EncryptedPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
        
    # 1. Verify Center ID
    if pkg.center_id != request.center_id:
        log_event(
            db=db,
            actor_id=current_user.id,
            action="WRONG_CENTER_PACKAGE_ACCESS",
            resource_type="EncryptedPackage",
            resource_id=package_id,
            payload_data=f"Center Officer from center {request.center_id} tried to unlock package meant for center {pkg.center_id}"
        )
        raise HTTPException(status_code=400, detail="Mismatched center package assignment.")

    # 2. Verify Time Release Window
    now_utc = datetime.now(timezone.utc)
    v_from = pkg.valid_from.replace(tzinfo=timezone.utc) if pkg.valid_from.tzinfo is None else pkg.valid_from
    v_until = pkg.valid_until.replace(tzinfo=timezone.utc) if pkg.valid_until.tzinfo is None else pkg.valid_until
    
    if now_utc < v_from:
        # Suspicious early attempt! Log warning and drop trust score
        log_event(
            db=db,
            actor_id=current_user.id,
            action="EARLY_PACKAGE_DECRYPTION_ATTEMPT",
            resource_type="EncryptedPackage",
            resource_id=package_id,
            payload_data=json.dumps({"attempt_time": now_utc.isoformat(), "scheduled_time": v_from.isoformat()})
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Time lock active. Release window opens in {int((v_from - now_utc).total_seconds())} seconds."
        )
        
    if now_utc > v_until:
        raise HTTPException(status_code=403, detail="Release window has expired.")
        
    # 3. Check Audit Chain
    chain_intact, _, _ = verify_audit_chain(db)
    if not chain_intact:
        raise HTTPException(status_code=400, detail="System audit chain ledger error. Decryption keys locked.")

    # 4. Check active anomalies/score (no P0 alarms)
    trust_report = calculate_exam_trust_score(db, pkg.exam_id)
    has_critical = any(issue["code"].startswith("SYSTEM_CRITICAL_") for issue in trust_report["critical_issues"])
    if has_critical:
        raise HTTPException(status_code=400, detail="Active security intrusion alert. Decryption keys frozen.")

    # 5. Success - Transition state and release package
    try:
        pkg.status = "RELEASED"
        pkg.released_by = current_user.id
        pkg.release_signature = request.signature
        
        # Try transitioning exam state to IN_PROGRESS
        try:
            set_exam_state(db, pkg.exam_id, "IN_PROGRESS", current_user.id)
        except Exception:
            # Already transitioned or ignore
            pass
            
        db.commit()
        
        log_event(
            db=db,
            actor_id=current_user.id,
            action="PACKAGE_RELEASED",
            resource_type="EncryptedPackage",
            resource_id=package_id,
            payload_data=json.dumps({
                "released_by": current_user.id,
                "center_id": request.center_id,
                "signature": request.signature
            })
        )
        
        return {
            "status": "RELEASED",
            "decrypted_payload": pkg.encrypted_payload,
            "released_by": current_user.id,
            "release_signature": request.signature
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to release package: {str(e)}")

@router.post("/api/packages/{package_id}/revoke")
def revoke_package(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER"]))
):
    pkg = db.query(EncryptedPackage).filter(EncryptedPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
        
    pkg.status = "REVOKED"
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="PACKAGE_REVOKED",
        resource_type="EncryptedPackage",
        resource_id=package_id,
        payload_data=f"Package {package_id} revoked by controller."
    )
    return {"status": "REVOKED", "package_id": package_id}
