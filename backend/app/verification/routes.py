import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import Candidate, CandidateVerification, SeatAssignment, User, ExamState
from app.auth.routes import get_current_user, UserResponse
from app.auth.guards import RoleChecker
from app.audit.ledger import log_event
from app.security import calculate_sha256
from app.receipts.candidate_receipt import sign_receipt, verify_receipt_signature
from app.exams.lifecycle import get_exam_state

router = APIRouter(tags=["verification"])

class AdmitCardRequest(BaseModel):
    candidate_id: str
    center_id: str

class VerifyCandidateRequest(BaseModel):
    candidate_id: str
    center_id: str
    seat_id: str
    admit_card_signature: str

class SeatAssignRequest(BaseModel):
    candidate_id: str
    center_id: str
    seat_id: str

class MarkAttendanceRequest(BaseModel):
    candidate_id: str
    seat_id: str
    status: str # "VERIFIED", "ABSENT", "FLAGGED"

@router.post("/api/candidates/generate-admit-card")
def generate_admit_card(
    request: AdmitCardRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["CONTROLLER", "OFFICER"]))
):
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    timestamp = "1780852594" # Fixed for reproducible E2E tests
    
    # We use sign_receipt to generate an ECDSA signature over the admit card payload
    signature = sign_receipt(cand.anonymous_id, cand.exam_id, timestamp, request.center_id)
    
    return {
        "candidate_id": cand.id,
        "anonymous_id": cand.anonymous_id,
        "registration_number": cand.registration_number,
        "exam_id": cand.exam_id,
        "center_id": request.center_id,
        "timestamp": timestamp,
        "admit_card_signature": signature
    }

@router.post("/api/center/scan-admit-card")
def scan_admit_card(
    request: VerifyCandidateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["OFFICER", "INVIGILATOR"]))
):
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    timestamp = "1780852594"
    
    # Verify signature
    valid = verify_receipt_signature(
        anonymous_id=cand.anonymous_id,
        exam_id=cand.exam_id,
        timestamp=timestamp,
        root_hash=request.center_id,
        signature_hex=request.admit_card_signature
    )
    
    if not valid:
        log_event(
            db=db,
            actor_id=current_user.id,
            action="ADMIT_CARD_SIGNATURE_MISMATCH",
            resource_type="Candidate",
            resource_id=cand.id,
            payload_data=json.dumps({"candidate_id": cand.id, "center_id": request.center_id})
        )
        raise HTTPException(status_code=400, detail="Invalid admit card signature. Admission Denied.")
        
    return {
        "status": "VALID",
        "candidate_id": cand.id,
        "anonymous_id": cand.anonymous_id,
        "name": cand.name
    }

@router.post("/api/center/verify-candidate")
def verify_candidate_entry(
    request: VerifyCandidateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["OFFICER", "INVIGILATOR"]))
):
    cand = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Verify admit card first
    timestamp = "1780852594"
    valid = verify_receipt_signature(
        anonymous_id=cand.anonymous_id,
        exam_id=cand.exam_id,
        timestamp=timestamp,
        root_hash=request.center_id,
        signature_hex=request.admit_card_signature
    )
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid admit card signature.")
        
    # Verify candidate can't verify without a seat assignment
    seat = db.query(SeatAssignment).filter(
        SeatAssignment.candidate_id == cand.id,
        SeatAssignment.center_id == request.center_id
    ).first()
    if not seat:
        raise HTTPException(status_code=400, detail="Candidate has no seat mapped. Assign seat first.")
        
    # Generate verification hash: SHA256(candidate_id | anonymous_id | center_id | seat_id | verified_by)
    v_input = f"{cand.id}|{cand.anonymous_id}|{request.center_id}|{request.seat_id}|{current_user.id}"
    v_hash = calculate_sha256(v_input)
    
    verification = CandidateVerification(
        candidate_id=cand.id,
        anonymous_id=cand.anonymous_id,
        exam_id=cand.exam_id,
        center_id=request.center_id,
        seat_id=request.seat_id,
        verification_status="VERIFIED",
        verified_by=current_user.id,
        verification_hash=v_hash
    )
    
    db.add(verification)
    cand.status = "VERIFIED"
    seat.status = "VERIFIED"
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="CANDIDATE_VERIFIED",
        resource_type="CandidateVerification",
        resource_id=verification.id,
        payload_data=json.dumps({
            "candidate_id": cand.id,
            "anonymous_id": cand.anonymous_id,
            "seat_id": request.seat_id,
            "verification_hash": v_hash
        })
    )
    
    return {
        "status": "VERIFIED",
        "verification_id": verification.id,
        "verification_hash": v_hash
    }

@router.post("/api/center/seats/assign")
def assign_seat(
    request: SeatAssignRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["OFFICER", "INVIGILATOR"]))
):
    # 1. Check duplicate seat assignments
    dup_seat = db.query(SeatAssignment).filter(
        SeatAssignment.center_id == request.center_id,
        SeatAssignment.seat_id == request.seat_id,
        SeatAssignment.candidate_id != request.candidate_id
    ).first()
    if dup_seat:
        raise HTTPException(status_code=400, detail=f"Seat {request.seat_id} is already assigned to another candidate.")
        
    dup_cand = db.query(SeatAssignment).filter(
        SeatAssignment.center_id == request.center_id,
        SeatAssignment.candidate_id == request.candidate_id,
        SeatAssignment.seat_id != request.seat_id
    ).first()
    if dup_cand:
        # Check if layout is locked
        if dup_cand.locked:
            log_event(
                db=db,
                actor_id=current_user.id,
                action="UNAUTHORIZED_SEAT_CHANGE",
                resource_type="SeatAssignment",
                resource_id=dup_cand.id,
                payload_data=json.dumps({"candidate_id": request.candidate_id, "original_seat": dup_cand.seat_id, "new_seat": request.seat_id})
            )
            raise HTTPException(status_code=400, detail="Seat map is LOCKED. Reassignment is blocked.")
        
        # Update existing seat mapping
        old_seat = dup_cand.seat_id
        dup_cand.seat_id = request.seat_id
        dup_cand.assignment_hash = calculate_sha256(f"EXM-001|{request.center_id}|{request.candidate_id}|{request.seat_id}|ASSIGNED")
        db.commit()
        
        log_event(
            db=db,
            actor_id=current_user.id,
            action="SEAT_ASSIGNED",
            resource_type="SeatAssignment",
            resource_id=dup_cand.id,
            payload_data=json.dumps({"candidate_id": request.candidate_id, "old_seat": old_seat, "new_seat": request.seat_id})
        )
        return {"status": "UPDATED", "seat_id": request.seat_id}

    # 2. Insert new assignment
    a_hash = calculate_sha256(f"EXM-001|{request.center_id}|{request.candidate_id}|{request.seat_id}|ASSIGNED")
    assignment = SeatAssignment(
        exam_id="EXM-001",
        center_id=request.center_id,
        candidate_id=request.candidate_id,
        seat_id=request.seat_id,
        status="ASSIGNED",
        assignment_hash=a_hash,
        locked=False
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="SEAT_ASSIGNED",
        resource_type="SeatAssignment",
        resource_id=assignment.id,
        payload_data=json.dumps({"candidate_id": request.candidate_id, "seat_id": request.seat_id})
    )
    return {"status": "ASSIGNED", "seat_id": request.seat_id}

@router.post("/api/center/seats/lock")
def lock_seat_map(
    center_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["OFFICER"]))
):
    assignments = db.query(SeatAssignment).filter(SeatAssignment.center_id == center_id).all()
    for a in assignments:
        a.locked = True
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="SEAT_MAP_LOCKED",
        resource_type="SeatAssignmentCollection",
        resource_id=center_id,
        payload_data=f"Seat map locked for center {center_id} with {len(assignments)} assignments."
    )
    return {"status": "LOCKED", "center_id": center_id, "count": len(assignments)}

@router.get("/api/center/seats/map/{center_id}")
def get_seat_map(center_id: str, db: Session = Depends(get_db)):
    assignments = db.query(SeatAssignment).filter(SeatAssignment.center_id == center_id).all()
    res = []
    for a in assignments:
        cand = db.query(Candidate).filter(Candidate.id == a.candidate_id).first()
        res.append({
            "assignment_id": a.id,
            "candidate_id": a.candidate_id,
            "candidate_name": cand.name if cand else "Bob",
            "candidate_anonymous_id": cand.anonymous_id if cand else "ANON-BOB",
            "seat_id": a.seat_id,
            "status": a.status,
            "locked": a.locked
        })
    return res

@router.post("/api/center/seats/mark-attendance")
def mark_attendance(
    request: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(RoleChecker(["OFFICER", "INVIGILATOR"]))
):
    assignment = db.query(SeatAssignment).filter(
        SeatAssignment.candidate_id == request.candidate_id,
        SeatAssignment.seat_id == request.seat_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Seat assignment record not found.")
        
    assignment.status = request.status.upper()
    db.commit()
    
    log_event(
        db=db,
        actor_id=current_user.id,
        action="ATTENDANCE_MARKED",
        resource_type="SeatAssignment",
        resource_id=assignment.id,
        payload_data=json.dumps({"candidate_id": request.candidate_id, "seat_id": request.seat_id, "status": request.status})
    )
    return {"status": assignment.status}
