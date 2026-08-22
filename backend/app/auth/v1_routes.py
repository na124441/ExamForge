import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from app.database import get_db
import app.models as models
from app.otp.otp_service import OTPService
from app.session.session_service import SessionService
from app.rate_limit.redis_rate_limiter import RedisRateLimiter
from app.audit.auth_audit import log_auth_event
from app.messaging.email_providers import SmtpEmailProvider, ResendProvider, SESProvider
from app.messaging.sms_providers import IndiaDltSmsProvider, normalize_e164_india_phone
from app.messaging.provider_interfaces import EmailDeliveryInput, SmsDeliveryInput

router = APIRouter(prefix="/api/v1/auth", tags=["auth_v1"])

# Providers
import os
if os.environ.get("SMTP_USERNAME") and os.environ.get("SMTP_PASSWORD"):
    email_provider = SmtpEmailProvider()
else:
    email_provider = ResendProvider()
sms_provider = IndiaDltSmsProvider()

# --- Pydantic Request & Response Schemas ---

class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: Optional[str] = None

class SendEmailOtpInput(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "REGISTRATION"

class SendPhoneOtpInput(BaseModel):
    phone: str
    purpose: Optional[str] = "REGISTRATION"

class VerifyOtpInput(BaseModel):
    challengeId: str
    otp: str

class LoginInput(BaseModel):
    destination: str # Email or Phone
    channel: str # EMAIL or SMS

class StepUpStartInput(BaseModel):
    actionName: str
    channel: str # EMAIL or SMS

# --- Endpoints ---

@router.post("/register")
def register_candidate(
    input_data: RegisterInput,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "unknown")

    # Rate limiting by IP
    is_limited, retry_after = RedisRateLimiter.is_rate_limited(f"ip_reg:{ip}", max_requests=10, window_seconds=60)
    if is_limited:
        raise HTTPException(status_code=429, detail=f"Too many registration requests. Retry in {retry_after} seconds.")

    normalized_phone = normalize_e164_india_phone(input_data.phone)

    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.email == input_data.email) | (models.User.phone == normalized_phone)
    ).first()

    if existing_user:
        # Enumeration safe response
        return {
            "status": "SUCCESS",
            "message": "If this account is eligible, candidate account registration has been initiated.",
            "userId": existing_user.id,
            "registrationState": "ACCOUNT_CREATED"
        }

    user = models.User(
        name=input_data.name,
        email=input_data.email,
        phone=normalized_phone,
        password_hash=input_data.password or "MOCK_PASSWORD_HASH",
        role="CANDIDATE",
        status="PENDING_VERIFICATION"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_auth_event(
        db=db,
        event_type="ACCOUNT_CREATED",
        user_id=user.id,
        ip_address=ip,
        user_agent=ua,
        metadata={"email": input_data.email, "phone": normalized_phone}
    )

    return {
        "status": "SUCCESS",
        "message": "Candidate account created. Please proceed to verify email and phone OTP.",
        "userId": user.id,
        "registrationState": "ACCOUNT_CREATED"
    }

@router.post("/email/send-otp")
async def send_email_otp(
    input_data: SendEmailOtpInput,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "unknown")

    # Rate limit by IP & Email
    is_ip_limited, ip_retry = RedisRateLimiter.is_rate_limited(f"ip_email_otp:{ip}", max_requests=5, window_seconds=60)
    if is_ip_limited:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Try again in {ip_retry} seconds.")

    is_email_limited, email_retry = RedisRateLimiter.is_rate_limited(f"email_otp:{input_data.email}", max_requests=3, window_seconds=300)
    if is_email_limited:
        raise HTTPException(status_code=429, detail=f"Maximum OTP requests for this email reached. Cooldown: {email_retry}s.")

    user = db.query(models.User).filter(models.User.email == input_data.email).first()

    challenge, raw_otp, is_cooldown = OTPService.create_challenge(
        db=db,
        destination=input_data.email,
        channel="EMAIL",
        purpose=input_data.purpose or "REGISTRATION",
        user_id=user.id if user else None
    )

    if is_cooldown:
        return {
            "status": "SUCCESS",
            "message": "If this account is eligible, a verification code has been sent.",
            "challengeId": challenge.id,
            "resendCooldownActive": True
        }

    # Dispatch email via provider
    await email_provider.send_otp(EmailDeliveryInput(
        destination_email=input_data.email,
        otp_code=raw_otp,
        purpose=input_data.purpose or "REGISTRATION"
    ))

    log_auth_event(
        db=db,
        event_type="EMAIL_OTP_SENT",
        user_id=user.id if user else None,
        ip_address=ip,
        user_agent=ua,
        metadata={"destination": input_data.email, "challengeId": challenge.id}
    )

    return {
        "status": "SUCCESS",
        "message": "If this account is eligible, a verification code has been sent.",
        "challengeId": challenge.id,
        "resendCooldownSeconds": 30
    }

@router.post("/phone/send-otp")
async def send_phone_otp(
    input_data: SendPhoneOtpInput,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "unknown")
    normalized_phone = normalize_e164_india_phone(input_data.phone)

    # Rate limit by IP & Phone
    is_ip_limited, ip_retry = RedisRateLimiter.is_rate_limited(f"ip_phone_otp:{ip}", max_requests=5, window_seconds=60)
    if is_ip_limited:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Try again in {ip_retry} seconds.")

    is_phone_limited, phone_retry = RedisRateLimiter.is_rate_limited(f"phone_otp:{normalized_phone}", max_requests=3, window_seconds=300)
    if is_phone_limited:
        raise HTTPException(status_code=429, detail=f"Maximum OTP requests for this phone reached. Cooldown: {phone_retry}s.")

    user = db.query(models.User).filter(models.User.phone == normalized_phone).first()

    challenge, raw_otp, is_cooldown = OTPService.create_challenge(
        db=db,
        destination=normalized_phone,
        channel="SMS",
        purpose=input_data.purpose or "REGISTRATION",
        user_id=user.id if user else None
    )

    if is_cooldown:
        return {
            "status": "SUCCESS",
            "message": "If this account is eligible, a verification code has been sent.",
            "challengeId": challenge.id,
            "resendCooldownActive": True
        }

    # Dispatch SMS via India DLT provider
    await sms_provider.send_otp(SmsDeliveryInput(
        destination_phone=normalized_phone,
        otp_code=raw_otp,
        purpose=input_data.purpose or "REGISTRATION",
        dlt_entity_id="1701159812736412",
        dlt_template_id="1407168912736412"
    ))

    log_auth_event(
        db=db,
        event_type="PHONE_OTP_SENT",
        user_id=user.id if user else None,
        ip_address=ip,
        user_agent=ua,
        metadata={"destination": normalized_phone, "challengeId": challenge.id}
    )

    return {
        "status": "SUCCESS",
        "message": "If this account is eligible, a verification code has been sent.",
        "challengeId": challenge.id,
        "resendCooldownSeconds": 30
    }

@router.post("/otp/verify")
def verify_otp(
    input_data: VerifyOtpInput,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "unknown")

    success, error_code, challenge = OTPService.verify_otp(
        db=db,
        challenge_id=input_data.challengeId,
        otp_code=input_data.otp
    )

    if not success:
        log_auth_event(
            db=db,
            event_type="OTP_FAILED",
            user_id=challenge.user_id if challenge else None,
            ip_address=ip,
            user_agent=ua,
            metadata={"challengeId": input_data.challengeId, "reason": error_code}
        )
        if error_code == "OTP_EXPIRED":
            raise HTTPException(status_code=400, detail="The verification code has expired. Please request a new code.")
        elif error_code == "OTP_ATTEMPTS_EXCEEDED":
            raise HTTPException(status_code=429, detail="Maximum verification attempts exceeded. Challenge locked.")
        else:
            raise HTTPException(status_code=400, detail="Invalid verification code. Please check and try again.")

    # Verification successful
    user = None
    if challenge.user_id:
        user = db.query(models.User).filter(models.User.id == challenge.user_id).first()

    if user:
        if challenge.channel == "EMAIL":
            log_auth_event(db=db, event_type="EMAIL_VERIFIED", user_id=user.id, ip_address=ip, user_agent=ua)
        elif challenge.channel == "SMS":
            log_auth_event(db=db, event_type="PHONE_VERIFIED", user_id=user.id, ip_address=ip, user_agent=ua)

        # Create session
        raw_token, session_rec = SessionService.create_session(
            db=db,
            user_id=user.id,
            ip_address=ip,
            user_agent=ua
        )

        # Set secure HttpOnly cookie
        response.set_cookie(
            key="examforge_session",
            value=raw_token,
            httponly=True,
            secure=False, # True in production HTTPS
            samesite="lax",
            max_age=7 * 86400
        )

        return {
            "status": "SUCCESS",
            "message": "OTP verification successful.",
            "verifiedChannel": challenge.channel,
            "sessionToken": raw_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role
            }
        }

    return {
        "status": "SUCCESS",
        "message": "OTP verification successful.",
        "verifiedChannel": challenge.channel
    }

@router.get("/me")
def get_current_user_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    session_token = request.cookies.get("examforge_session") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication session required.")

    session_rec = SessionService.validate_session(db, session_token)
    if not session_rec:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")

    user = db.query(models.User).filter(models.User.id == session_rec.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "status": user.status
        },
        "session": {
            "id": session_rec.id,
            "ipAddress": session_rec.ip_address,
            "lastActivityAt": session_rec.last_activity_at.isoformat()
        }
    }

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    session_token = request.cookies.get("examforge_session") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if session_token:
        session_rec = SessionService.validate_session(db, session_token)
        if session_rec:
            SessionService.revoke_session(db, session_rec.id)
            log_auth_event(db=db, event_type="LOGOUT", user_id=session_rec.user_id)

    response.delete_cookie("examforge_session")
    return {"status": "SUCCESS", "message": "Successfully logged out."}

@router.post("/session/revoke-all")
def revoke_all_sessions(
    request: Request,
    db: Session = Depends(get_db)
):
    session_token = request.cookies.get("examforge_session") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required.")

    session_rec = SessionService.validate_session(db, session_token)
    if not session_rec:
        raise HTTPException(status_code=401, detail="Session invalid.")

    count = SessionService.revoke_all_user_sessions(db, session_rec.user_id)
    log_auth_event(db=db, event_type="SESSION_REVOKED", user_id=session_rec.user_id, metadata={"revokedCount": count})

    return {"status": "SUCCESS", "message": f"Revoked all {count} active sessions."}


# ==============================================================================
# Candidate Registration Finite-State Machine & Hardened Step Locking
# ==============================================================================

REGISTRATION_STEP_ORDER = [
    "ACCOUNT_CREATED",
    "EMAIL_VERIFIED",
    "PHONE_VERIFIED",
    "PROFILE_COMPLETED",
    "ADDRESS_COMPLETED",
    "EDUCATION_COMPLETED",
    "IDENTITY_VERIFIED",
    "APPLICATION_REVIEWED",
    "PAYMENT_COMPLETED",
    "CENTRE_ALLOCATED",
    "ADMIT_CARD_READY"
]

class CandidateProfileInput(BaseModel):
    candidateStudentId: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    pwdStatus: Optional[str] = "NO"
    domicileState: Optional[str] = None
    guardianName: Optional[str] = None
    addressLine1: Optional[str] = None
    addressLine2: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    qualificationLevel: Optional[str] = None
    boardUniversity: Optional[str] = None
    passingYear: Optional[str] = None
    rollNumber: Optional[str] = None
    percentageCgpa: Optional[str] = None

class AssertStepInput(BaseModel):
    candidateStudentId: str
    requestedStep: str

def check_registration_step_permission(current_state: str, requested_step: str) -> bool:
    curr_idx = REGISTRATION_STEP_ORDER.index(current_state) if current_state in REGISTRATION_STEP_ORDER else 0
    req_idx = REGISTRATION_STEP_ORDER.index(requested_step) if requested_step in REGISTRATION_STEP_ORDER else len(REGISTRATION_STEP_ORDER)
    return curr_idx >= req_idx

@router.get("/candidate/state/{candidate_student_id}")
def get_candidate_registration_state(
    candidate_student_id: str,
    db: Session = Depends(get_db)
):
    candidate = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.candidate_student_id == candidate_student_id
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    curr_state = candidate.registration_state or "ACCOUNT_CREATED"
    curr_idx = REGISTRATION_STEP_ORDER.index(curr_state) if curr_state in REGISTRATION_STEP_ORDER else 0

    completed_steps = REGISTRATION_STEP_ORDER[:curr_idx + 1]
    locked_steps = REGISTRATION_STEP_ORDER[curr_idx + 1:]

    return {
        "candidateStudentId": candidate_student_id,
        "currentState": curr_state,
        "completedSteps": completed_steps,
        "lockedSteps": locked_steps,
        "emailVerified": candidate.email_verified,
        "phoneVerified": candidate.phone_verified,
        "aadhaarStatus": candidate.aadhaar_status,
        "progressPercent": int(((curr_idx + 1) / len(REGISTRATION_STEP_ORDER)) * 100)
    }

@router.post("/candidate/assert-step")
def assert_candidate_step(
    input_data: AssertStepInput,
    db: Session = Depends(get_db)
):
    candidate = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.candidate_student_id == input_data.candidateStudentId
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    curr_state = candidate.registration_state or "ACCOUNT_CREATED"
    allowed = check_registration_step_permission(curr_state, input_data.requestedStep)

    if not allowed:
        req_idx = REGISTRATION_STEP_ORDER.index(input_data.requestedStep) if input_data.requestedStep in REGISTRATION_STEP_ORDER else 0
        missing_prereqs = REGISTRATION_STEP_ORDER[:req_idx]
        raise HTTPException(
            status_code=403,
            detail={
                "code": "REGISTRATION_STEP_LOCKED",
                "message": f"Step '{input_data.requestedStep}' is locked until prerequisites are satisfied.",
                "currentStep": curr_state,
                "requestedStep": input_data.requestedStep,
                "requiredSteps": missing_prereqs
            }
        )

    return {
        "status": "ALLOWED",
        "candidateStudentId": input_data.candidateStudentId,
        "requestedStep": input_data.requestedStep,
        "currentStep": curr_state
    }

@router.put("/candidate/profile")
def update_candidate_profile(
    input_data: CandidateProfileInput,
    db: Session = Depends(get_db)
):
    candidate = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.candidate_student_id == input_data.candidateStudentId
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    # Update demographics, address, and educational data
    if input_data.dob: candidate.dob = input_data.dob
    if input_data.gender: candidate.gender = input_data.gender
    if input_data.category: candidate.category = input_data.category
    if input_data.pwdStatus: candidate.pwd_status = input_data.pwdStatus
    if input_data.domicileState: candidate.domicile_state = input_data.domicileState
    if input_data.guardianName: candidate.guardian_name = input_data.guardianName
    if input_data.addressLine1: candidate.address_line1 = input_data.addressLine1
    if input_data.addressLine2: candidate.address_line2 = input_data.addressLine2
    if input_data.city: candidate.city = input_data.city
    if input_data.district: candidate.district = input_data.district
    if input_data.state: candidate.state = input_data.state
    if input_data.postalCode: candidate.postal_code = input_data.postalCode
    if input_data.qualificationLevel: candidate.qualification_level = input_data.qualificationLevel
    if input_data.boardUniversity: candidate.board_university = input_data.boardUniversity
    if input_data.passingYear: candidate.passing_year = input_data.passingYear
    if input_data.rollNumber: candidate.roll_number = input_data.rollNumber
    if input_data.percentageCgpa: candidate.percentage_cgpa = input_data.percentageCgpa

    # Advance state machine position
    if candidate.qualification_level and candidate.city:
        candidate.registration_state = "EDUCATION_COMPLETED"
    elif candidate.address_line1 and candidate.city:
        candidate.registration_state = "ADDRESS_COMPLETED"
    elif candidate.dob and candidate.gender:
        candidate.registration_state = "PROFILE_COMPLETED"

    db.commit()
    db.refresh(candidate)

    return {
        "status": "SUCCESS",
        "message": "Candidate profile updated successfully.",
        "candidateStudentId": candidate.candidate_student_id,
        "registrationState": candidate.registration_state
    }

