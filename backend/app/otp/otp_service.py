import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models import OTPChallenge
from app.config.settings import settings

SECRET_KEY = getattr(settings, "SECRET_KEY", "examforge-super-secret-dev-key-12345")
DEFAULT_EXPIRY_MINUTES = 5
MAX_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 30

def generate_secure_otp() -> str:
    """Generates a 6-digit cryptographically secure numeric OTP using secrets module."""
    val = secrets.randbelow(900000) + 100000
    return str(val)

def hash_otp(challenge_id: str, otp_code: str) -> str:
    """Calculates HMAC-SHA256 signature for OTP verification."""
    key = SECRET_KEY.encode("utf-8")
    msg = f"{challenge_id}:{otp_code}".encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

class OTPService:
    @staticmethod
    def create_challenge(
        db: Session,
        destination: str,
        channel: str, # EMAIL or SMS
        purpose: str, # REGISTRATION, LOGIN, PASSWORD_RESET, HIGH_RISK_ACTION, CHANGE_EMAIL, CHANGE_PHONE
        user_id: Optional[str] = None
    ) -> Tuple[OTPChallenge, str, bool]:
        """
        Creates an OTP challenge, invalidates previous active challenges for the destination & purpose,
        enforces resend cooldown, and returns (challenge, raw_otp, is_cooldown_blocked).
        """
        now = datetime.now(timezone.utc)
        
        # Check active challenges for resend cooldown
        active_challenge = db.query(OTPChallenge).filter(
            OTPChallenge.destination == destination,
            OTPChallenge.purpose == purpose,
            OTPChallenge.consumed_at.is_(None),
            OTPChallenge.expires_at > now
        ).order_by(OTPChallenge.last_sent_at.desc()).first()

        if active_challenge:
            # Check resend cooldown
            time_since_last = (now - active_challenge.last_sent_at.replace(tzinfo=timezone.utc)).total_seconds()
            if time_since_last < RESEND_COOLDOWN_SECONDS:
                # Return active challenge without creating a duplicate
                return active_challenge, "", True

            # Invalidate prior challenge
            active_challenge.consumed_at = now

        raw_otp = generate_secure_otp()
        challenge_id = f"CHL-{secrets.token_hex(8).upper()}"
        otp_hmac = hash_otp(challenge_id, raw_otp)
        expires_at = now + timedelta(minutes=DEFAULT_EXPIRY_MINUTES)

        challenge = OTPChallenge(
            id=challenge_id,
            user_id=user_id,
            channel=channel,
            destination=destination,
            purpose=purpose,
            otp_hash=otp_hmac,
            expires_at=expires_at,
            attempt_count=0,
            max_attempts=MAX_ATTEMPTS,
            last_sent_at=now,
            consumed_at=None
        )

        db.add(challenge)
        db.commit()
        db.refresh(challenge)

        return challenge, raw_otp, False

    @staticmethod
    def verify_otp(
        db: Session,
        challenge_id: str,
        otp_code: str
    ) -> Tuple[bool, str, Optional[OTPChallenge]]:
        """
        Verifies an OTP challenge against expiry, attempts limit, consumption, and HMAC match.
        Returns (success: bool, error_code: str, challenge_obj).
        """
        now = datetime.now(timezone.utc)
        challenge = db.query(OTPChallenge).filter(OTPChallenge.id == challenge_id).first()

        if not challenge:
            return False, "OTP_NOT_FOUND", None

        if challenge.consumed_at is not None:
            return False, "OTP_ALREADY_CONSUMED", challenge

        expires_at_tz = challenge.expires_at.replace(tzinfo=timezone.utc) if challenge.expires_at.tzinfo is None else challenge.expires_at
        if now > expires_at_tz:
            return False, "OTP_EXPIRED", challenge

        if challenge.attempt_count >= challenge.max_attempts:
            return False, "OTP_ATTEMPTS_EXCEEDED", challenge

        # Constant-time comparison
        expected_hash = hash_otp(challenge.id, otp_code)
        if not hmac.compare_digest(challenge.otp_hash, expected_hash):
            challenge.attempt_count += 1
            db.commit()
            if challenge.attempt_count >= challenge.max_attempts:
                return False, "OTP_ATTEMPTS_EXCEEDED", challenge
            return False, "OTP_INVALID", challenge

        # Consume challenge atomically
        challenge.consumed_at = now
        db.commit()

        return True, "SUCCESS", challenge
