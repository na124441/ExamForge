import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models import UserSession

SESSION_DURATION_DAYS = 7

class SessionService:
    @staticmethod
    def create_session(
        db: Session,
        user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_metadata: Optional[str] = None
    ) -> Tuple[str, UserSession]:
        """Creates a server-side session, hashes the token, and returns (raw_session_token, session_record)."""
        raw_token = f"ef_sess_{secrets.token_urlsafe(32)}"
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=SESSION_DURATION_DAYS)

        session_record = UserSession(
            user_id=user_id,
            session_token_hash=token_hash,
            expires_at=expires_at,
            last_activity_at=now,
            ip_address=ip_address,
            user_agent=user_agent,
            device_metadata=device_metadata
        )

        db.add(session_record)
        db.commit()
        db.refresh(session_record)

        return raw_token, session_record

    @staticmethod
    def validate_session(db: Session, raw_token: str) -> Optional[UserSession]:
        """Validates session token hash, checks expiration and revocation status."""
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        now = datetime.now(timezone.utc)

        session = db.query(UserSession).filter(
            UserSession.session_token_hash == token_hash,
            UserSession.revoked_at.is_(None)
        ).first()

        if not session:
            return None

        exp_tz = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
        if now > exp_tz:
            return None

        # Update last activity
        session.last_activity_at = now
        db.commit()

        return session

    @staticmethod
    def revoke_session(db: Session, session_id: str) -> bool:
        session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if session:
            session.revoked_at = datetime.now(timezone.utc)
            db.commit()
            return True
        return False

    @staticmethod
    def revoke_all_user_sessions(db: Session, user_id: str) -> int:
        sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None)
        ).all()
        now = datetime.now(timezone.utc)
        for s in sessions:
            s.revoked_at = now
        db.commit()
        return len(sessions)
