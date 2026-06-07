import sys
import os
import json
import numpy as np
import cv2

# Add current folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, SessionLocal, Base
from app.models import Candidate, Evaluation, OMRScan, User, CandidateAnswerEvent, Question
from app.security import hash_password, calculate_sha256

client = TestClient(app)

def generate_mock_low_conf_omr_bytes() -> bytes:
    """Generates a mock OMR sheet image with double-marked answers (low confidence)."""
    img = np.ones((400, 400, 3), dtype=np.uint8) * 255
    # Row 1 choice A: filled, choice B: half-filled (Ambiguous/Low Confidence)
    cv2.circle(img, (150, 100), 15, (0, 0, 0), -1) 
    cv2.circle(img, (200, 100), 15, (0, 0, 0), -1) 
    cv2.circle(img, (250, 100), 15, (0, 0, 0), 2)  
    cv2.circle(img, (300, 100), 15, (0, 0, 0), 2)  
    _, img_bytes = cv2.imencode('.png', img)
    return img_bytes.tobytes()

def run_v03_tests():
    print("=== Starting ExamForge Version 0.3 TrustOps Validation E2E Tests ===")
    
    # 0. Clean database schemas
    print("\n[Setup] Migrating SQLite tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # 1. Login as Controller to seed Candidate
    print("\n[Setup] Seeding initial controller login and credentials...")
    resp = client.post("/api/auth/login", json={
        "email": "controller@example.com",
        "password": "password123"
    })
    ctrl = resp.json()
    ctrl_headers = {"Authorization": f"Bearer {ctrl['access_token']}"}
    
    # 2. Add Questions to Bank
    print("[Setup] Seeding initial questions pool...")
    q_mcq = client.post("/api/questions", json={
        "subject": "Science",
        "topic": "Electricity",
        "difficulty": "EASY",
        "question_type": "MCQ_SINGLE",
        "marks": 4,
        "content": {"text": "Unit of current?", "options": {"A": "Volt", "B": "Ampere"}},
        "answer": "B"
    }, headers=ctrl_headers).json()
    
    q_written = client.post("/api/questions", json={
        "subject": "Science",
        "topic": "Chemistry",
        "difficulty": "HARD",
        "question_type": "WRITTEN",
        "marks": 10,
        "content": {"text": "Electrolysis?", "rubric": "Anode and cathode."},
        "answer": "Water decomposition"
    }, headers=ctrl_headers).json()
    
    # 3. Create Blueprint and generate papers
    print("[Setup] Seeding blueprint and generating secure papers...")
    client.post("/api/exams/EXM-001/blueprint", json={
        "total_marks": 14,
        "total_questions": 2,
        "duration_minutes": 180,
        "subject_distribution": {"Science": 2},
        "difficulty_distribution": {"EASY": 50, "HARD": 50}
    }, headers=ctrl_headers)
    
    client.post("/api/exams/EXM-001/generate-paper", json={
        "set_id": "A",
        "center_id": "CTR-22",
        "release_delay_seconds": 0
    }, headers=ctrl_headers)
    
    # 4. Enroll and Verify Candidate
    print("[Setup] Enrolling Bob Developer candidate...")
    reg = client.post("/api/candidates/register", json={
        "name": "Bob Developer",
        "registration_number": "REG-1200",
        "exam_id": "EXM-001"
    }, headers=ctrl_headers).json()
    cand_id = reg["candidate_id"]
    anon_id = reg["anonymous_id"]
    
    client.post("/api/candidates/verify", json={"candidate_id": cand_id}, headers=ctrl_headers)
    
    # 5. Start candidate session and log answer events
    session = client.post("/api/sessions/start", json={"candidate_id": cand_id, "center_id": "CTR-22"}).json()
    client.post("/api/sessions/answer", json={
        "session_id": session["session_id"],
        "candidate_id": cand_id,
        "question_id": q_mcq["id"],
        "selected_answer": "B"
    })
    client.post("/api/sessions/submit", json={"session_id": session["session_id"], "candidate_id": cand_id})
    
    # --- TEST 1: Initial Trust Score Calculation (Happy Path) ---
    print("\n[Test 1] Fetching initial exam integrity score report...")
    resp = client.get("/api/trust/score/EXM-001")
    assert resp.status_code == 200
    report = resp.json()
    print(f"Intact Trust Score: {report['trust_score']}/100.0")
    assert report["trust_score"] == 100.0, "Initial score should be perfect."
    assert report["audit_chain_intact"] is True, "Audit chain should be intact."
    
    # --- TEST 2: Candidate Submission Receipts & Verification ---
    print("\n[Test 2] Generating and verifying signed candidate receipts...")
    receipt_resp = client.get(f"/api/candidates/{cand_id}/receipt")
    assert receipt_resp.status_code == 200
    receipt = receipt_resp.json()
    assert receipt["anonymous_id"] == anon_id
    
    verify_resp = client.post("/api/receipts/verify", json=receipt)
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is True, "Cryptographic receipt signature should verify."
    
    # Test signature tampered
    tampered_receipt = receipt.copy()
    tampered_receipt["root_hash"] = "TAMPERED_ROOT_HASH_123"
    verify_resp_fail = client.post("/api/receipts/verify", json=tampered_receipt)
    assert verify_resp_fail.json()["is_valid"] is False, "Tampered receipt signature verification should fail."
    print("Success! Signed candidate receipts generated and validated successfully.")
    
    # --- TEST 3: Evaluator Conflict Grading Variance ---
    print("\n[Test 3] Testing evaluator conflict detector (Marks discrepancy > 2.0)...")
    # Login and seed Evaluator 1 grade (8.0 marks)
    resp = client.post("/api/auth/login", json={"email": "evaluator@example.com", "password": "password123"})
    eval1_token = resp.json()["access_token"]
    
    client.post("/api/evaluations/submit", json={
        "exam_id": "EXM-001",
        "anonymous_id": anon_id,
        "question_id": q_written["id"],
        "marks_awarded": 8.0,
        "max_marks": 10.0,
        "rubric_notes": "Good cathode description."
    }, headers={"Authorization": f"Bearer {eval1_token}"})
    
    # Seed Evaluator 2 grade in database (4.0 marks) - discrepancy of 4.0 (> 2.0)
    db = SessionLocal()
    eval2 = User(
        name="Evaluator Two",
        email="evaluator2@example.com",
        password_hash=hash_password("password123"),
        status="ACTIVE"
    )
    db.add(eval2)
    db.commit()
    db.refresh(eval2)
    
    # Insert evaluation directly under Evaluator 2
    eval_input = f"EXM-001|{anon_id}|{q_written['id']}|4.0|{eval2.id}"
    ev2_record = Evaluation(
        exam_id="EXM-001",
        anonymous_id=anon_id,
        evaluator_id=eval2.id,
        question_id=q_written["id"],
        marks_awarded=4.0,
        max_marks=10.0,
        evaluation_hash=calculate_sha256(eval_input),
        status="LOCKED"
    )
    db.add(ev2_record)
    db.commit()
    db.close()
    
    # Retrieve conflicts
    conf_resp = client.get("/api/risk/evaluator-conflicts/EXM-001")
    assert conf_resp.status_code == 200
    conf_data = conf_resp.json()
    print(f"Conflicts found: {len(conf_data['conflicts'])}")
    assert len(conf_data["conflicts"]) == 1, "Should flag exactly one grading discrepancy conflict."
    assert conf_data["conflicts"][0]["difference"] == 4.0
    
    # Verify trust score drop
    score_resp = client.get("/api/trust/score/EXM-001")
    report_conflict = score_resp.json()
    print(f"Trust score after evaluator conflict: {report_conflict['trust_score']}/100")
    assert report_conflict["trust_score"] < 100.0, "Score should drop."
    assert report_conflict["penalties"]["evaluator_conflicts"] == 5.0, "Conflict penalty should apply."
    
    # --- TEST 4: OMR Low Confidence Bands Review Queue ---
    print("\n[Test 4] Testing OMR scan low-confidence bands reviews queue...")
    omr_bytes = generate_mock_low_conf_omr_bytes()
    client.post("/api/omr/scans/upload", data={"candidate_id": cand_id, "exam_id": "EXM-001"}, files={"file": ("omr.png", omr_bytes, "image/png")}, headers=ctrl_headers)
    
    queue_resp = client.get("/api/risk/omr-queue/EXM-001")
    assert queue_resp.status_code == 200
    queue = queue_resp.json()
    print(f"OMR scans in MANUAL_REVIEW band: {len(queue['MANUAL_REVIEW'])}")
    assert len(queue["MANUAL_REVIEW"]) == 1, "OMR scan should land in MANUAL_REVIEW queue."
    
    score_resp = client.get("/api/trust/score/EXM-001")
    report_omr = score_resp.json()
    print(f"Trust score after low-confidence OMR scan: {report_omr['trust_score']}/100")
    assert report_omr["penalties"]["omr_confidence"] == 5.0, "OMR low confidence penalty should apply."
    
    # --- TEST 5: Center-Level Attack Simulator & Publication Gate ---
    print("\n[Test 5] Simulating center-level attack early release & publication gate blocks...")
    sim_resp = client.post("/api/risk/simulate", json={"vector": "early_release", "details": "Exploit simulation."})
    assert sim_resp.status_code == 200
    
    # Verify anomaly is caught
    status_resp = client.get("/api/risk/status/EXM-001")
    anoms = status_resp.json()["anomalies"]
    print(f"Active Anomalies detected: {len(anoms)}")
    assert any(a["type"] == "EARLY_PAPER_RELEASE" for a in anoms), "Early release anomaly should be detected."
    
    # Verify publication gate is locked
    gate_resp = client.get("/api/exams/EXM-001/gate-status")
    gate = gate_resp.json()
    print(f"Result release allowed status: {gate['allowed']}, Trust Score: {gate['trust_score']}")
    assert gate["allowed"] is False, "Release should be blocked due to critical intrusion."
    assert "SYSTEM_INTRUSION_DETECTED" in gate["blocking_reasons"]
    
    # Try to publish results (should fail with 400 Bad Request)
    pub_resp = client.post("/api/exams/EXM-001/publish-results", headers=ctrl_headers)
    assert pub_resp.status_code == 400
    print("Success! Results publication gate successfully blocked release on security breaches.")
    
    # --- TEST 6: Resetting simulation state ---
    print("\n[Test 6] Resetting simulation state...")
    client.post("/api/risk/clear")
    status_resp = client.get("/api/risk/status/EXM-001")
    assert status_resp.json()["active_simulation"] is None, "Active simulation should be cleared."
    print("Success! Simulator reset verified.")
    
    print("\n=== All Version 0.3 TrustOps Tests Passed! ===")

if __name__ == "__main__":
    try:
        run_v03_tests()
    except AssertionError as ae:
        print(f"\nAssertion Error: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected Error: {e}", file=sys.stderr)
        sys.exit(1)
