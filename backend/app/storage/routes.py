from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
import time

from app.database import get_db
from app.models import StorageObject, StorageAccessLog
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.tenancy.tenant_guard import guard_tenant_access
from app.storage.storage_client import get_storage_client
from app.storage.signed_urls import verify_presigned_url
from app.storage.file_hashing import calculate_bytes_sha256

router = APIRouter(prefix="/api/storage", tags=["storage"])

@router.post("/upload")
async def upload_object(
    bucket: str,
    key: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "PLATFORM_SUPER_ADMIN"]))
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    file_bytes = await file.read()
    sha256 = calculate_bytes_sha256(file_bytes)
    
    # Store using storage client
    client = get_storage_client()
    res = client.put_object(bucket, key, file_bytes, file.content_type)
    
    # Record metadata in db
    obj = StorageObject(
        institution_id=inst_id,
        bucket=bucket,
        object_key=key,
        content_type=file.content_type,
        size_bytes=len(file_bytes),
        sha256_hash=sha256,
        storage_backend=res["backend"]
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    
    # Log access
    log = StorageAccessLog(
        object_id=obj.id,
        action="WRITE",
        actor_id=current_user.id
    )
    db.add(log)
    db.commit()
    
    return {"object_id": obj.id, "bucket": bucket, "key": key, "sha256": sha256}

@router.get("/objects")
def list_objects(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    inst_id = current_user.institution_id or "INS-GENESIS"
    guard_tenant_access(inst_id)
    
    objects = db.query(StorageObject).filter(StorageObject.institution_id == inst_id).all()
    return objects

@router.get("/keys/{object_id}/url")
def get_object_presigned_url(
    object_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    obj = db.query(StorageObject).filter(StorageObject.id == object_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
        
    guard_tenant_access(obj.institution_id)
    
    client = get_storage_client()
    url = client.generate_presigned_url(obj.bucket, obj.object_key)
    
    # Log access
    log = StorageAccessLog(
        object_id=obj.id,
        action="READ",
        actor_id=current_user.id
    )
    db.add(log)
    db.commit()
    
    return {"url": url}

@router.get("/download")
def download_object(
    bucket: str,
    key: str,
    expires: int,
    signature: str,
    db: Session = Depends(get_db)
):
    # Public endpoint using presigned HMAC signature verification
    if not verify_presigned_url(bucket, key, expires, signature):
        raise HTTPException(status_code=403, detail="Signature invalid or expired.")
        
    obj = db.query(StorageObject).filter(
        StorageObject.bucket == bucket,
        StorageObject.object_key == key
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object metadata not found.")
        
    try:
        client = get_storage_client()
        content = client.get_object(bucket, key)
        
        # Log download access
        log = StorageAccessLog(
            object_id=obj.id,
            action="READ",
            actor_id="GUEST_PRESIGNED"
        )
        db.add(log)
        db.commit()
        
        return Response(content=content, media_type=obj.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {e}")
