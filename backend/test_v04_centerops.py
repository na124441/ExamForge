import sys
import os
import json
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

# Add current folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import engine, SessionLocal, Base
from app.models import Candidate, Evaluation, OMRScan, User, AuditLog, EncryptedPackage, SeatAssignment, IncidentReport
from app.security import hash_password, calculate_sha256

client = TestClient(app)

def run_v04_tests():
    print("=== Starting ExamForge v0.4 CenterOps Validation E2E Tests ===")
    
    # 0. Clean database schemas
    print("\n[Setup] Resetting and migrating SQLite tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # --- TEST 1: Role login and permission boundaries ---
    print("\n[Test 1] Verifying role permissions and RBAC guards...")
    # Login Controller
    res_ctrl = client.post("/api/auth/login", json={"email": "controller@example.com", "password": "password123"})
    assert res_ctrl.status_code == 200
    ctrl_headers = {"Authorization": f"Bearer {res_ctrl.json()['access_token']}"}

    # Login Center Officer
    res_off = client.post("/api/auth/login", json={"email": "officer@example.com", "password": "password123"})
    assert res_off.status_code == 200
    off_headers = {"Authorization": f"Bearer {res_off.json()['access_token']}"}

    # Access Controller transition endpoint using Officer token (should fail with 403)
    res_fail = client.post("/api/exams/EXM-001/transition", json={"new_state": "CONFIG_LOCKED"}, headers=off_headers)
    assert res_fail.status_code == 403
    print("Success! Denied unauthorized role access.")

    # Check that denied access attempt was logged to the Audit Ledger
    db = SessionLocal()
    unauth_logs = db.query(AuditLog).filter(AuditLog.action == "UNAUTHORIZED_ACCESS_ATTEMPT").all()
    assert len(unauth_logs) == 1, "Should log unauthorized attempt in the ledger."
    print("Success! Denied access logged in ledger.")
    db.close()

    # --- TEST 2: Exam lifecycle valid transitions ---
    print("\n[Test 2] Testing exam lifecycle state machine valid transitions...")
    # Initial state should be DRAFT
    res_state = client.get("/api/exams/EXM-001/state")
    assert res_state.json()["state"] == "DRAFT"

    # Seed blueprint to allow CONFIG_LOCKED
    client.post("/api/exams/EXM-001/blueprint", json={
        "total_marks": 14,
        "total_questions": 2,
        "duration_minutes": 180,
        "subject_distribution": {"Science": 2},
        "difficulty_distribution": {"EASY": 100}
    }, headers=ctrl_headers)

    # Transition DRAFT -> CONFIG_LOCKED
    res_trans = client.post("/api/exams/EXM-001/transition", json={"new_state": "CONFIG_LOCKED"}, headers=ctrl_headers)
    assert res_trans.status_code == 200
    assert res_trans.json()["current_state"] == "CONFIG_LOCKED"
    print("Success! Exam transitioned: DRAFT -> CONFIG_LOCKED.")

    # --- TEST 3: Invalid lifecycle transition rejection ---
    print("\n[Test 3] Testing invalid lifecycle transitions rejection...")
    # Try transitioning CONFIG_LOCKED -> PACKAGE_SEALED directly (should fail with 400)
    res_err = client.post("/api/exams/EXM-001/transition", json={"new_state": "PACKAGE_SEALED"}, headers=ctrl_headers)
    assert res_err.status_code == 400
    print("Success! Out of order lifecycle transition blocked.")

    # --- TEST 4: Center package generation and hash verification ---
    print("\n[Test 4] Generating center time-locked package and verifying hashes...")
    # Seed Question Bank
    q_mcq = client.post("/api/questions", json={
        "subject": "Science",
        "topic": "Electricity",
        "difficulty": "EASY",
        "question_type": "MCQ_SINGLE",
        "marks": 4,
        "content": {"text": "Unit of current?", "options": {"A": "Volt", "B": "Ampere"}},
        "answer": "B"
    }, headers=ctrl_headers).json()

    # Generate Paper (triggers CONFIG_LOCKED -> PAPER_GENERATED automatically or manually)
    client.post("/api/exams/EXM-001/transition", json={"new_state": "PAPER_GENERATED"}, headers=ctrl_headers)
    client.post("/api/exams/EXM-001/transition", json={"new_state": "PACKAGE_SEALED"}, headers=ctrl_headers)

    # Generate Center Package
    valid_from = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    valid_until = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    
    pkg_resp = client.post("/api/packages/generate-center-package", json={
        "exam_id": "EXM-001",
        "paper_id": "PPR-A-MOCK-ID",
        "center_id": "CTR-22",
        "encrypted_payload": '{"nonce": "abcd", "ciphertext": "xyz", "simulated_key": "1234"}',
        "package_hash": calculate_sha256("xyz"),
        "valid_from": valid_from,
        "valid_until": valid_until
    }, headers=ctrl_headers)
    assert pkg_resp.status_code == 200
    package_id = pkg_resp.json()["package_id"]

    # Verify package
    verify_resp = client.post(f"/api/packages/{package_id}/verify")
    assert verify_resp.json()["hash_valid"] is True
    print("Success! Package sealed and cryptographically verified.")

    # --- TEST 5: Early release attempt blocked ---
    print("\n[Test 5] Attempting early package release (should be blocked)...")
    # Exam must be in AWAITING_RELEASE state to release package
    client.post("/api/exams/EXM-001/transition", json={"new_state": "AWAITING_RELEASE"}, headers=ctrl_headers)
    client.post("/api/exams/EXM-001/transition", json={"new_state": "RELEASE_WINDOW_OPEN"}, headers=ctrl_headers)
    
    res_early = client.post(f"/api/packages/{package_id}/release", json={
        "center_id": "CTR-22",
        "signature": "ECDSA_SIG_CTR_OFFICER_8820"
    }, headers=off_headers)
    assert res_early.status_code == 403
    print("Success! Early release attempt blocked by time-lock.")

    # Check trust score drops after early attempt
    res_score = client.get("/api/trust/score/EXM-001")
    assert res_score.json()["penalties"]["center_operations"] == 50.0, "Should apply -40 early decrypt penalty (-50 total with unauthorized access)."
    print(f"Trust score degraded to: {res_score.json()['trust_score']}/100")

    # --- TEST 6: Correct release window allows package release ---
    print("\n[Test 6] Releasing package inside valid scheduled window...")
    # Update valid_from in SQLite database to past to simulate correct time release
    db = SessionLocal()
    pkg_rec = db.query(EncryptedPackage).filter(EncryptedPackage.id == package_id).first()
    pkg_rec.valid_from = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()
    db.close()

    # Retry release
    res_ok = client.post(f"/api/packages/{package_id}/release", json={
        "center_id": "CTR-22",
        "signature": "ECDSA_SIG_CTR_OFFICER_8820"
    }, headers=off_headers)
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "RELEASED"
    print("Success! Package released inside window with verified signature.")

    # --- TEST 7: Candidate admit card verification succeeds ---
    print("\n[Test 7] Verifying candidate admit card QR code signatures...")
    # Seed Candidate Bob
    reg = client.post("/api/candidates/register", json={
        "name": "Bob Developer",
        "registration_number": "REG-1200",
        "exam_id": "EXM-001"
    }, headers=ctrl_headers).json()
    cand_id = reg["candidate_id"]

    # Generate Admit Card
    card_resp = client.post("/api/candidates/generate-admit-card", json={
        "candidate_id": cand_id,
        "center_id": "CTR-22"
    }, headers=off_headers)
    assert card_resp.status_code == 200
    admit_card = card_resp.json()

    # Verify admit card scan
    scan_resp = client.post("/api/center/scan-admit-card", json={
        "candidate_id": cand_id,
        "center_id": "CTR-22",
        "seat_id": "B-14",
        "admit_card_signature": admit_card["admit_card_signature"]
    }, headers=off_headers)
    assert scan_resp.status_code == 200
    assert scan_resp.json()["status"] == "VALID"
    print("Success! Candidate admit card signature matches public key.")

    # --- TEST 8: Duplicate seat assignment blocked ---
    print("\n[Test 8] Assigning candidate desk seat mapping layout...")
    # Seed Candidate Alice
    reg_alice = client.post("/api/candidates/register", json={
        "name": "Alice Developer",
        "registration_number": "REG-1300",
        "exam_id": "EXM-001"
    }, headers=ctrl_headers).json()
    alice_id = reg_alice["candidate_id"]

    # Assign Bob to B-14
    client.post("/api/center/seats/assign", json={"candidate_id": cand_id, "center_id": "CTR-22", "seat_id": "B-14"}, headers=off_headers)
    
    # Try assigning Alice to B-14 (should fail with 400)
    res_dup = client.post("/api/center/seats/assign", json={"candidate_id": alice_id, "center_id": "CTR-22", "seat_id": "B-14"}, headers=off_headers)
    assert res_dup.status_code == 400
    print("Success! Duplicate desk seat mapping rejected.")

    # --- TEST 9: Seat modification after lock triggers anomaly ---
    print("\n[Test 9] Modifying seat mapping after layout locks...")
    # Lock layout
    client.post("/api/center/seats/lock?center_id=CTR-22", headers=off_headers)

    # Re-assign Bob to B-15 after layout is locked (should fail with 400 and log unauthorized seat change)
    res_reassign = client.post("/api/center/seats/assign", json={"candidate_id": cand_id, "center_id": "CTR-22", "seat_id": "B-15"}, headers=off_headers)
    assert res_reassign.status_code == 400
    
    # Verify trust score drops for post-lock modifications
    res_score = client.get("/api/trust/score/EXM-001")
    assert res_score.json()["penalties"]["center_operations"] >= 65.0, "Should apply -25 seat tamper penalty."
    print(f"Trust score degraded to: {res_score.json()['trust_score']}/100")

    # --- TEST 10: Incident report reduces trust score ---
    print("\n[Test 10] Submitting invigilator incident logs...")
    res_inc = client.post("/api/incidents/report", json={
        "exam_id": "EXM-001",
        "center_id": "CTR-22",
        "incident_type": "OMR_DAMAGE",
        "severity": "HIGH",
        "description": "Candidate spilled water on OMR cover booklet."
    }, headers=off_headers)
    assert res_inc.status_code == 200
    inc_id = res_inc.json()["incident_id"]

    res_score = client.get("/api/trust/score/EXM-001")
    # Capped at 75.0 penalty for center ops
    assert res_score.json()["penalties"]["center_operations"] == 75.0
    print("Success! Incident logged in ledger. Score updated.")

    # --- TEST 11: P0 incident blocks publication gate ---
    print("\n[Test 11] Escalating incident to P0 Critical to test publication block...")
    client.post(f"/api/incidents/{inc_id}/escalate", json={"severity": "P0_CRITICAL"}, headers=ctrl_headers)
    
    gate_resp = client.get("/api/exams/EXM-001/gate-status")
    assert gate_resp.json()["allowed"] is False
    assert "SYSTEM_INTRUSION_DETECTED" in gate_resp.json()["blocking_reasons"]
    print("Success! P0 incident successfully blocked result publication gate.")

    # --- TEST 12: Incident resolution updates gate status ---
    print("\n[Test 12] Resolving P0 incident and checking gate clearance...")
    client.post(f"/api/incidents/{inc_id}/resolve", json={"resolution_notes": "OMR replaced and signed."}, headers=ctrl_headers)
    
    gate_resp = client.get("/api/exams/EXM-001/gate-status")
    # Seat tamper warning might still make trust score below 90, but P0 intrusion is cleared
    assert "SYSTEM_INTRUSION_DETECTED" not in gate_resp.json()["blocking_reasons"]
    print("Success! Resolution cleared the P0 blocking rule.")

    # --- TEST 13: Audit timeline verifies full chain ---
    print("\n[Test 13] Verifying explainable audit timeline logs...")
    res_time = client.get("/api/audit/timeline-explain/EXM-001")
    assert res_time.status_code == 200
    timeline = res_time.json()["timeline"]
    assert len(timeline) > 0
    # Check that explanation is linked
    assert timeline[-1]["explanation"] != ""
    print(f"Timeline verification: verified {len(timeline)} chronological audit blocks.")

    # --- TEST 14: End-to-end CenterOps dashboard aggregator ---
    print("\n[Test 14] Querying live ops dashboard aggregator summary...")
    res_ops = client.get("/api/ops/exam-ops-summary/EXM-001")
    assert res_ops.status_code == 200
    ops_summary = res_ops.json()
    assert ops_summary["stats"]["total_centers"] == 1
    assert ops_summary["stats"]["total_candidates"] == 2
    print("Success! Ops aggregator compiled metrics correctly.")

    print("\n=== All Version 0.4 CenterOps Tests Passed ===")

if __name__ == "__main__":
    try:
        run_v04_tests()
    except AssertionError as ae:
        print(f"\nAssertion Error: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected Error: {e}", file=sys.stderr)
        sys.exit(1)
