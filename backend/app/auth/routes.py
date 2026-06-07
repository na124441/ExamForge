from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import User
from app.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    decode_access_token
)
from app.audit.ledger import log_event

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Predefined Demo Users & Roles mapping
DEMO_USERS = {
    "controller@example.com": {
        "name": "Exam Controller",
        "role": "CONTROLLER"
    },
    "candidate@example.com": {
        "name": "Candidate User",
        "role": "CANDIDATE"
    },
    "evaluator@example.com": {
        "name": "Evaluator User",
        "role": "EVALUATOR"
    },
    "auditor@example.com": {
        "name": "System Auditor",
        "role": "AUDITOR"
    }
}

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    name: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("email")
    role: str = payload.get("role")
    user_id: str = payload.get("sub")
    
    if email is None or user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=role,
        status=user.status
    )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    
    # 1. Check if it's an authorized demo user
    if email not in DEMO_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access denied. Email is not an authorized Demo User."
        )
    
    demo_meta = DEMO_USERS[email]
    
    # 2. Get or seed the user in the SQLite database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Seed user with default password 'password123'
        user = User(
            name=demo_meta["name"],
            email=email,
            password_hash=hash_password("password123"),
            status="ACTIVE"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Log genesis seeding in ledger
        log_event(
            db=db,
            actor_id="SYSTEM",
            action="USER_SEEDED",
            resource_type="User",
            resource_id=user.id,
            payload_data=f"Seeded demo user {user.name} with role {demo_meta['role']}"
        )

    # 3. Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. For demo users, use 'password123'."
        )

    # 4. Generate access token
    access_token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": demo_meta["role"]
        }
    )
    
    # Log successful login event
    log_event(
        db=db,
        actor_id=user.id,
        action="USER_LOGIN",
        resource_type="User",
        resource_id=user.id,
        payload_data=f"User {user.name} logged in with JWT"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=demo_meta["role"],
        user_id=user.id,
        name=user.name
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
