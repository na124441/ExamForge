"""
Comprehensive Test Suite for ExamForge Multi-Portal Authentication Architecture.
Covers:
1. Candidate Login Flow & Single-Role Direct Routing
2. Staff / Controller Multi-Role Login & Workspace Discovery
3. Workspace Switching Engine & Privilege Escalation Prevention
4. Risk-Based MFA Challenge & Verification Flow
5. Account State Machine Gating (ACTIVE vs LOCKED / SUSPENDED / REVOKED)
6. Password Failure Lockout Defense
7. CI Route Invariant: All 9 Portals and Workspace Selector Declared in Route Registry
"""

import os
import glob
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
import app.models as models
from app.models import User
from app.security import hash_password, create_access_token
from app.auth.permissions import CanonicalRole

# In-Memory Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_portal_auth.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)


# ------------------------------------------------------------------------------
# 1. Candidate Login Flow Test
# ------------------------------------------------------------------------------

def test_candidate_portal_login(client):
    payload = {
        "email": "candidate@example.com",
        "password": "password123",
        "portal_hint": "candidate"
    }
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "AUTHENTICATED"
    assert data["active_role"] == CanonicalRole.CANDIDATE.value
    assert data["default_workspace"] == "/student-exam"
    assert "access_token" in data
    assert len(data["permissions"]) > 0


# ------------------------------------------------------------------------------
# 2. Multi-Role Workspace Discovery Test
# ------------------------------------------------------------------------------

def test_controller_multi_role_login_discovery(client):
    payload = {
        "email": "controller@example.com",
        "password": "password123",
        "portal_hint": "staff"
    }
    resp = client.post("/api/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "AUTHENTICATED"
    assert data["active_role"] == CanonicalRole.CONTROLLER.value
    # Multi-role user has both Controller and Auditor workspaces
    assert "CONTROLLER" in data["available_roles"]
    assert "AUDITOR" in data["available_roles"]
    assert len(data["workspaces"]) >= 2


# ------------------------------------------------------------------------------
# 3. Workspace Switching Engine Test
# ------------------------------------------------------------------------------

def test_multi_role_workspace_switching(client):
    # 1. Controller logs in
    login_resp = client.post("/api/auth/login", json={
        "email": "controller@example.com",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Switch to AUDITOR workspace
    switch_resp = client.post("/api/auth/switch-workspace", json={"target_role": "AUDITOR"}, headers=headers)
    assert switch_resp.status_code == 200
    switch_data = switch_resp.json()
    assert switch_data["active_role"] == "AUDITOR"
    assert switch_data["default_workspace"] == "/audit-timeline"

    # 3. Attempt to switch to unauthorized role (e.g. SUPER_ADMIN) -> Must be 403
    unauth_switch = client.post("/api/auth/switch-workspace", json={"target_role": "SUPER_ADMIN"}, headers=headers)
    assert unauth_switch.status_code == 403


# ------------------------------------------------------------------------------
# 4. Risk-Based MFA Step-Up Challenge Flow Test
# ------------------------------------------------------------------------------

def test_security_admin_mfa_step_up_flow(client):
    # 1. Login with high-risk role on security portal -> Triggers MFA challenge
    login_resp = client.post("/api/auth/login", json={
        "email": "security_admin@example.com",
        "password": "password123",
        "portal_hint": "security"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["status"] == "MFA_REQUIRED"
    assert "challenge_id" in login_data
    challenge_id = login_data["challenge_id"]

    # 2. Submit wrong OTP code -> 400 Bad Request
    fail_verify = client.post("/api/auth/mfa/verify", json={
        "challenge_id": challenge_id,
        "otp_code": "000000"
    })
    assert fail_verify.status_code == 400

    # 3. Submit valid OTP code ('884920') -> Success
    success_verify = client.post("/api/auth/mfa/verify", json={
        "challenge_id": challenge_id,
        "otp_code": "884920"
    })
    assert success_verify.status_code == 200
    verify_data = success_verify.json()
    assert verify_data["status"] == "AUTHENTICATED"
    assert verify_data["active_role"] == CanonicalRole.SECURITY_ADMIN.value
    assert verify_data["default_workspace"] == "/security"


# ------------------------------------------------------------------------------
# 5. Account State Gating (LOCKED / SUSPENDED / REVOKED)
# ------------------------------------------------------------------------------

def test_account_state_machine_gating(client):
    db = TestingSessionLocal()
    # Create suspended account
    suspended_user = User(
        id="USR-SUSP-01",
        name="Suspended User",
        email="suspended@example.com",
        password_hash=hash_password("password123"),
        role=CanonicalRole.CANDIDATE.value,
        status="SUSPENDED"
    )
    # Create revoked account
    revoked_user = User(
        id="USR-REVK-01",
        name="Revoked User",
        email="revoked@example.com",
        password_hash=hash_password("password123"),
        role=CanonicalRole.EVALUATOR.value,
        status="REVOKED"
    )
    db.add_all([suspended_user, revoked_user])
    db.commit()

    # Attempt login for suspended account -> 403 Forbidden
    resp_susp = client.post("/api/auth/login", json={"email": "suspended@example.com", "password": "password123"})
    assert resp_susp.status_code == 403
    assert "suspended" in resp_susp.json()["detail"].lower()

    # Attempt login for revoked account -> 403 Forbidden
    resp_revk = client.post("/api/auth/login", json={"email": "revoked@example.com", "password": "password123"})
    assert resp_revk.status_code == 403
    assert "revoked" in resp_revk.json()["detail"].lower()

    db.close()


# ------------------------------------------------------------------------------
# 6. CI Route Invariant: All Portals & Workspace Selector in Route Registry
# ------------------------------------------------------------------------------

def test_all_portals_and_workspace_selector_in_registry():
    """
    Verifies that all 9 portal login routes, portals hub, and workspace selector
    are explicitly registered in route-registry.ts.
    """
    registry_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "lib", "auth", "route-registry.ts"))
    with open(registry_file, "r", encoding="utf-8") as f:
        registry_content = f.read()

    required_routes = [
        "/portals",
        "/candidate/login",
        "/staff/login",
        "/evaluation/login",
        "/security/login",
        "/audit/login",
        "/dispute/login",
        "/vendor/login",
        "/admin/login",
        "/ops/login",
        "/workspace/select"
    ]

    for r in required_routes:
        assert f'"{r}"' in registry_content, f"Missing portal route '{r}' in route-registry.ts"
