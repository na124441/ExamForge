import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import WrittenBooklet, WrittenPage, Candidate
from app.written.schemas import BookletCreateRequest, PageUploadRequest, WrittenBookletResponse, WrittenPageResponse
from app.written.page_ingestion import validate_page_sequence, detect_missing_pages
from app.written.booklet import finalize_booklet_hashing
from app.written.anonymizer import create_anonymous_copy
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event
from app.security import calculate_sha256

router = APIRouter(tags=["written"])

@router.post("/api/written/booklets/create", response_model=WrittenBookletResponse)
def create_booklet(
    request: BookletCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    existing = db.query(WrittenBooklet).filter(WrittenBooklet.candidate_id == request.candidate_id).first()
    if existing:
        return existing
        
    booklet_id = f"WBK-{calculate_sha256(cand.anonymous_id)[:8].upper()}"
    
    booklet = WrittenBooklet(
        id=booklet_id,
        exam_id=request.exam_id,
        candidate_id=request.candidate_id,
        anonymous_id=cand.anonymous_id,
        center_id=request.center_id,
        total_pages=request.total_pages,
        booklet_hash="",
        status="SCANNED"
    )
    db.add(booklet)
    db.commit()
    db.refresh(booklet)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="WRITTEN_BOOKLET_CREATED",
        resource_type="WrittenBooklet",
        resource_id=booklet.id,
        payload_data=json.dumps({
            "booklet_id": booklet.id,
            "anonymous_id": booklet.anonymous_id,
            "total_pages": booklet.total_pages
        })
    )
    
    create_anonymous_copy(db, booklet)
    
    return booklet

@router.post("/api/written/booklets/{booklet_id}/upload-page", response_model=WrittenPageResponse)
def upload_page(
    booklet_id: str,
    request: PageUploadRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    # Verify sequence bounds
    if not validate_page_sequence(db, booklet_id, request.page_number):
        raise HTTPException(status_code=400, detail="Invalid page number for booklet layout parameters")
        
    existing = db.query(WrittenPage).filter(
        WrittenPage.booklet_id == booklet_id,
        WrittenPage.page_number == request.page_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Duplicate page upload detected")
        
    wp = WrittenPage(
        booklet_id=booklet_id,
        page_number=request.page_number,
        image_url=request.image_url,
        page_hash=request.page_hash,
        image_hash=request.page_hash, # compatibility
        upload_status="LOCKED"
    )
    db.add(wp)
    db.commit()
    db.refresh(wp)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="WRITTEN_PAGE_UPLOADED",
        resource_type="WrittenPage",
        resource_id=wp.id,
        payload_data=json.dumps({
            "booklet_id": booklet_id,
            "page_number": wp.page_number,
            "page_hash": wp.page_hash
        })
    )
    return wp

@router.post("/api/written/booklets/{booklet_id}/lock")
def lock_booklet(
    booklet_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    booklet = db.query(WrittenBooklet).filter(WrittenBooklet.id == booklet_id).first()
    if not booklet:
        raise HTTPException(status_code=404, detail="Booklet not found")
        
    missing = detect_missing_pages(db, booklet_id)
    if missing:
        raise HTTPException(status_code=400, detail=f"Cannot lock booklet: missing page numbers {missing}")
        
    booklet_hash = finalize_booklet_hashing(db, booklet_id)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="WRITTEN_BOOKLET_LOCKED",
        resource_type="WrittenBooklet",
        resource_id=booklet_id,
        payload_data=json.dumps({
            "booklet_id": booklet_id,
            "booklet_hash": booklet_hash
        })
    )
    return {
        "status": "LOCKED",
        "booklet_id": booklet_id,
        "booklet_hash": booklet_hash
    }

@router.get("/api/written/booklets/{booklet_id}/verify")
def verify_booklet(booklet_id: str, db: Session = Depends(get_db)):
    booklet = db.query(WrittenBooklet).filter(WrittenBooklet.id == booklet_id).first()
    if not booklet:
        raise HTTPException(status_code=404, detail="Booklet not found")
        
    pages = db.query(WrittenPage).filter(WrittenPage.booklet_id == booklet_id).order_by(WrittenPage.page_number).all()
    page_hashes = [p.page_hash for p in pages if p.page_hash]
    
    from app.written.page_hashing import compute_booklet_hash
    current_hash = compute_booklet_hash(page_hashes)
    
    hash_valid = (current_hash == booklet.booklet_hash)
    
    return {
        "booklet_id": booklet_id,
        "stored_hash": booklet.booklet_hash,
        "recalculated_hash": current_hash,
        "hash_valid": hash_valid
    }

@router.get("/api/written/booklets/{booklet_id}/pages", response_model=List[WrittenPageResponse])
def get_booklet_pages(booklet_id: str, db: Session = Depends(get_db)):
    return db.query(WrittenPage).filter(WrittenPage.booklet_id == booklet_id).order_by(WrittenPage.page_number).all()
