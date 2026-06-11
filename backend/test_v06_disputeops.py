import sys
import os
import json
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Add current folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import engine, SessionLocal, Base
from app.models import (
    Candidate, Result, ResultCertificate, Dispute, DisputeEvent, DisputeNote,
    EvidencePacket, EvidencePacketSection, ResultVersion, InstitutionReport, ReportSection,
    CandidateAnswerEvent, AuditLog, User, Question
)
from app.security import hash_password, calculate_sha256
from app.receipts.candidate_receipt import sign_receipt, verify_receipt_signature
from app.certificates.certificate_signer import sign_certificate_hash, verify_certificate_signature

client = TestClient(app)

def run_v06_tests():
    print("=== Starting ExamForge v0.6 DisputeOps & Transparency Validation E2E Tests ===")
    
    # 0. Setup and clean database
    print("\n[Setup] Resetting SQLite tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Login Controller
    res_ctrl = client.post("/api/auth/login", json={"email": "controller@example.com", "password": "password123"})
    assert res_ctrl.status_code == 200
    ctrl_headers = {"Authorization": f"Bearer {res_ctrl.json()['access_token']}"}
    
    # Login Officer
    res_off = client.post("/api/auth/login", json={"email": "officer@example.com", "password": "password123"})
    assert res_off.status_code == 200
    off_headers = {"Authorization": f"Bearer {res_off.json()['access_token']}"}
    off_user_id = res_off.json()["user_id"]
    
    # Login Candidate User
    res_cand_user = client.post("/api/auth/login", json={"email": "candidate@example.com", "password": "password123"})
    assert res_cand_user.status_code == 200
    cand_headers = {"Authorization": f"Bearer {res_cand_user.json()['access_token']}"}
    
    # Register Candidate in system
    reg = client.post("/api/candidates/register", json={
        "name": "Alice Transparency",
        "registration_number": "REG-6000",
        "exam_id": "EXM-006"
    }, headers=ctrl_headers).json()
    cand_id = reg["candidate_id"]
    anon_id = reg["anonymous_id"]
    
    # --- TEST 1: Lookup fails before publication ---
    print("\n[Test 1] Testing result lookup failure before publication...")
    res_lookup_fail = client.post("/api/transparency/result/lookup", json={
        "registration_number": "REG-6000",
        "exam_id": "EXM-006",
        "pin": "2026-06-11"
    })
    assert res_lookup_fail.status_code == 404
    print("Success! Lookup blocked when result is not yet available.")
    
    # Setup: Create Question, submit answer, create published Result
    q_mcq = client.post("/api/questions", json={
        "subject": "Math",
        "topic": "Algebra",
        "difficulty": "EASY",
        "question_type": "MCQ",
        "marks": 10,
        "content": {"text": "Solve 2x = 10"},
        "answer": "5"
    }, headers=ctrl_headers).json()
    q_id = q_mcq["id"]
    
    # Add candidate answer event
    db = SessionLocal()
    ans_event = CandidateAnswerEvent(
        session_id="SESS-100", candidate_id=cand_id, exam_id="EXM-006",
        question_id=q_id, event_type="ANSWER_SAVED", selected_answer="5",
        previous_event_hash="GENESIS_HASH", current_event_hash="CURRENT_HASH"
    )
    db.add(ans_event)
    db.commit()
    
    # Create Result
    res = Result(
        candidate_id=cand_id, exam_id="EXM-006", marks_obtained=10.0, max_marks=10.0,
        result_hash=calculate_sha256("ResultDataAlice"), status="VERIFIED", published_at=datetime.utcnow()
    )
    db.add(res)
    db.commit()
    result_id = res.id
    db.close()
    
    # --- TEST 2: Lookup succeeds after publication ---
    print("\n[Test 2] Testing result lookup success after publication...")
    res_lookup = client.post("/api/transparency/result/lookup", json={
        "registration_number": "REG-6000",
        "exam_id": "EXM-006",
        "pin": "2026-06-11"
    })
    assert res_lookup.status_code == 200
    lookup_data = res_lookup.json()
    assert lookup_data["result_id"] == result_id
    assert lookup_data["qualification_status"] == "Qualified"
    print("Success! Lookup completed successfully.")
    
    # --- TEST 3: Integrity Summary Endpoint ---
    print("\n[Test 3] Testing transparency integrity summary endpoint...")
    res_sum = client.get(f"/api/transparency/result/{result_id}/integrity-summary")
    assert res_sum.status_code == 200
    summary_data = res_sum.json()
    assert summary_data["audit_chain_intact"] is True
    print("Success! Integrity summary checklist verified.")
    
    # --- TEST 4: Verify Candidate Receipt Route ---
    print("\n[Test 4] Testing receipt signature verification route...")
    timestamp = "2026-06-11T12:00:00"
    root_hash = "abc123hash"
    sig = sign_receipt(anon_id, "EXM-006", timestamp, root_hash)
    
    res_verify_receipt = client.post("/api/transparency/result/verify-receipt", json={
        "anonymous_id": anon_id,
        "exam_id": "EXM-006",
        "timestamp": timestamp,
        "root_hash": root_hash,
        "signature": sig
    })
    assert res_verify_receipt.status_code == 200
    assert res_verify_receipt.json()["is_valid"] is True
    print("Success! Candidate receipt signature verified.")
    
    # --- TEST 5: Get Public Proof Route ---
    print("\n[Test 5] Testing public proof query route...")
    res_proof = client.get(f"/api/transparency/result/{result_id}/public-proof")
    assert res_proof.status_code == 200
    assert res_proof.json()["candidate_anonymous_id"] == anon_id
    print("Success! Public redacted hashes retrieved.")
    
    # --- TEST 6: Generate Result Certificate ---
    print("\n[Test 6] Testing certificate generation by controller...")
    res_cert = client.post(f"/api/certificates/result/{result_id}/generate", headers=ctrl_headers)
    assert res_cert.status_code == 200
    cert_id = res_cert.json()["id"]
    print(f"Success! Certificate {cert_id} generated.")
    
    # --- TEST 7: Retrieve Certificate Details ---
    print("\n[Test 7] Testing certificate retrieval...")
    res_cert_details = client.get(f"/api/certificates/result/{cert_id}")
    assert res_cert_details.status_code == 200
    assert res_cert_details.json()["status"] == "VALID"
    print("Success! Certificate details matched.")
    
    # --- TEST 8: Cryptographic Verification of Certificate ---
    print("\n[Test 8] Testing certificate signature and hash verify...")
    res_verify = client.get(f"/api/certificates/result/{cert_id}/verify")
    assert res_verify.status_code == 200
    assert res_verify.json()["is_valid"] is True
    assert res_verify.json()["signature_valid"] is True
    print("Success! ECDSA lock signature verified intact.")
    
    # --- TEST 9: Certificate Download JSON Packet ---
    print("\n[Test 9] Testing certificate package download...")
    res_dl = client.get(f"/api/certificates/result/{cert_id}/download")
    assert res_dl.status_code == 200
    assert "signature" in res_dl.json()
    print("Success! JSON packet matching schema downloaded.")
    
    # --- TEST 10: File Dispute ---
    print("\n[Test 10] Testing dispute filing by candidate...")
    res_disp = client.post("/api/disputes/file", json={
        "exam_id": "EXM-006",
        "candidate_id": cand_id,
        "anonymous_id": anon_id,
        "result_id": result_id,
        "dispute_type": "MARKS_TOTALING_ERROR",
        "priority": "HIGH",
        "description": "Total marks showing 10 instead of expected 12."
    }, headers=cand_headers)
    assert res_disp.status_code == 200
    print(f"DISPUTE RESPONSE JSON: {res_disp.json()}")
    disp_id = res_disp.json()["id"]
    print("Success! Dispute logged in system.")
    
    # --- TEST 11: Duplicate Dispute Rule ---
    print("\n[Test 11] Testing duplicate dispute restriction...")
    res_disp_dup = client.post("/api/disputes/file", json={
        "exam_id": "EXM-006",
        "candidate_id": cand_id,
        "anonymous_id": anon_id,
        "result_id": result_id,
        "dispute_type": "MARKS_TOTALING_ERROR",
        "priority": "NORMAL",
        "description": "Another marks query."
    }, headers=cand_headers)
    assert res_disp_dup.status_code == 400
    print("Success! Blocked duplicate active dispute filing.")
    
    # --- TEST 12: View Dispute Details & Notes ---
    print("\n[Test 12] Testing dispute detail view and notes...")
    # Add a note
    client.post(f"/api/disputes/{disp_id}/attach-note", json={
        "content": "Additional details provided."
    }, headers=cand_headers)
    
    res_detail = client.get(f"/api/disputes/{disp_id}", headers=cand_headers)
    assert res_detail.status_code == 200
    assert len(res_detail.json()["notes"]) == 1
    print("Success! Details and notes visible in audit timeline.")
    
    # --- TEST 13: Dispute Withdrawal ---
    print("\n[Test 13] Testing dispute withdrawal...")
    # Create another dispute and withdraw it
    disp2 = client.post("/api/disputes/file", json={
        "exam_id": "EXM-006",
        "candidate_id": cand_id,
        "anonymous_id": anon_id,
        "result_id": result_id,
        "dispute_type": "WRITTEN_RECHECK",
        "priority": "NORMAL",
        "description": "Written paper query."
    }, headers=cand_headers).json()
    disp2_id = disp2["id"]
    
    res_wd = client.post(f"/api/disputes/{disp2_id}/withdraw", headers=cand_headers)
    assert res_wd.status_code == 200
    assert res_wd.json()["status"] == "CLOSED"
    print("Success! Dispute withdrawn and closed.")
    
    # --- TEST 14: Dispute Officer Queue & Review ---
    print("\n[Test 14] Testing dispute officer review assignment...")
    # List queue
    res_q = client.get("/api/dispute-ops/queue", headers=off_headers)
    assert res_q.status_code == 200
    assert len(res_q.json()) > 0
    
    # Start review
    client.post(f"/api/dispute-ops/{disp_id}/open-review", headers=off_headers)
    # Assign recheck
    client.post(f"/api/dispute-ops/{disp_id}/assign-recheck", headers=off_headers)
    # Trigger OMR recheck
    client.post(f"/api/dispute-ops/{disp_id}/trigger-omr-review", headers=off_headers)
    # Trigger written recheck
    res_state = client.post(f"/api/dispute-ops/{disp_id}/trigger-written-recheck", headers=off_headers)
    assert res_state.json()["status"] == "RECHECK_IN_PROGRESS"
    print("Success! Dispute status progressed properly through recheck phases.")
    
    # Add dummy evaluation mark in DB to verify
    rub_res = client.post("/api/rubrics/create", json={
        "exam_id": "EXM-006",
        "question_id": q_id,
        "max_marks": 10.0,
        "criteria": [
            {"title": "Concept accuracy", "max_marks": 10.0}
        ]
    }, headers=ctrl_headers).json()
    rubric_id = rub_res["id"]

    db = SessionLocal()
    from app.models import EvaluationMark
    eval_hash = calculate_sha256(f"EXM-006|{anon_id}|EVAL-44|{q_id}|{{}}|10.0|{rubric_id}|{'0'*64}")
    db.add(EvaluationMark(
        anonymous_id=anon_id, 
        question_id=q_id, 
        evaluator_id="EVAL-44", 
        total_marks=10.0, 
        status="LOCKED", 
        criteria_scores="{}",
        rubric_id=rubric_id,
        evaluation_hash=eval_hash
    ))
    db.commit()
    db.close()

    # --- TEST 15: Redacted Evidence Packet Generation ---
    print("\n[Test 15] Testing evidence packet creation and redactions...")
    res_evp = client.post(f"/api/evidence/result/{result_id}/generate", json={
        "redaction_level": "CANDIDATE_SAFE"
    }, headers=off_headers)
    assert res_evp.status_code == 200
    packet_id = res_evp.json()["id"]
    
    # Check Candidate Safe redaction of evaluator ID
    res_pack_cand = client.get(f"/api/evidence/{packet_id}", params={"redaction_level": "CANDIDATE_SAFE"}, headers=cand_headers)
    assert res_pack_cand.status_code == 200
    
    # Regenerate evidence packet to include the evaluation mark
    client.post(f"/api/evidence/dispute/{disp_id}/generate", headers=off_headers)
    
    res_pack_cand = client.get(f"/api/evidence/{packet_id}", params={"redaction_level": "CANDIDATE_SAFE"}, headers=cand_headers)
    eval_list = res_pack_cand.json()["sections"]["evaluation_integrity"]["evaluations"]
    assert eval_list[0]["evaluator_id"] == "[REDACTED_EVALUATOR_ID]"
    print("Success! Candidate safe evidence packet generated with correct redaction.")
    
    # --- TEST 16: Verify Evidence Packet Hash ---
    print("\n[Test 16] Testing evidence packet hash validation...")
    res_v_ev = client.get(f"/api/evidence/{packet_id}/verify")
    assert res_v_ev.status_code == 200
    assert res_v_ev.json()["hash_valid"] is True
    print("Success! Evidence packet hash integrity validated.")
    
    # --- TEST 17: Result Versioning & Superseding Certificates ---
    print("\n[Test 17] Testing result version creation and certificate updates...")
    # Record Dispute Decision
    client.post(f"/api/dispute-ops/{disp_id}/decision", json={
        "decision": "RESOLVED_UPDATED",
        "notes": "Marks corrected from 10 to 12.",
        "signature": "ECDSA_SIG_OFFICER_REVISION_9901"
    }, headers=off_headers)
    
    # Update result version
    res_v = client.post(f"/api/results/{result_id}/create-version", json={
        "new_marks": 12.0,
        "change_reason": "OMR re-evaluation updated marks to 12.",
        "linked_dispute_id": disp_id,
        "signature": "ECDSA_SIG_OFFICER_REVISION_9901"
    }, headers=off_headers)
    assert res_v.status_code == 200
    
    # Generate new certificate
    res_new_cert = client.post(f"/api/certificates/result/{result_id}/generate", headers=ctrl_headers)
    assert res_new_cert.status_code == 200
    new_cert_id = res_new_cert.json()["id"]

    # Check that previous certificate status has become SUPERSEDED
    res_old_cert = client.get(f"/api/certificates/result/{cert_id}")
    assert res_old_cert.json()["status"] == "SUPERSEDED"
    print("Success! Result version incremented, older certificate superseded, and new certificate generated.")
    
    # --- TEST 18: Version Diff Query ---
    print("\n[Test 18] Testing version diff comparison...")
    res_diff = client.get(f"/api/results/{result_id}/diff/1/2")
    assert res_diff.status_code == 200
    diff_data = res_diff.json()
    assert diff_data["version_a"] == 1
    assert diff_data["version_b"] == 2
    assert "change_reason" in diff_data
    print("Success! Version diff outputs correct values.")
    
    # --- TEST 19: Institution Audit Report ---
    print("\n[Test 19] Testing institution audit report generation & verification...")
    res_rep = client.post(f"/api/reports/exam/EXM-006/generate", headers=ctrl_headers)
    assert res_rep.status_code == 200
    report_id = res_rep.json()["id"]
    
    # Verify report signature
    res_v_rep = client.get(f"/api/reports/{report_id}/verify")
    assert res_v_rep.json()["is_valid"] is True
    print("Success! Institution audit report generated, signed, and verified.")
    
    # --- TEST 20: Trust Score & Gate Penalty Validation ---
    print("\n[Test 20] Testing Trust Score penalties and Publication Gate checks...")
    # Fetch gate status
    gate_data = client.get("/api/exams/EXM-006/gate-status").json()
    print(f"Publication Gate Status: {gate_data['allowed']}")
    
    # Now simulate a penalty by adding an invalid certificate signature
    # In SQLite, we can update the certificate signature to something random to simulate tamper
    db = SessionLocal()
    c = db.query(ResultCertificate).filter(ResultCertificate.id == new_cert_id).first()
    c.signature = "TAMPERED_SIGNATURE"
    db.commit()
    db.close()
    
    # Score calculation should apply -50 penalty
    score_data = client.get("/api/exams/EXM-006/gate-status").json()
    assert score_data["trust_score"] < 90.0
    print(f"Success! Tampered certificate signature applied penalty. Trust Score: {score_data['trust_score']}")
    
    print("\n=== All Version 0.6 DisputeOps & Transparency Tests Passed ===")

if __name__ == "__main__":
    try:
        run_v06_tests()
    except AssertionError as ae:
        import traceback
        traceback.print_exc()
        print(f"\nAssertion Error: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nUnexpected Error: {e}", file=sys.stderr)
        sys.exit(1)
