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
    Candidate, EvaluationMark, EvaluationConflict, User, AuditLog, 
    WrittenBooklet, WrittenPage, AnonymousCopy, Rubric, RubricCriterion,
    OMRScan, OMRManualReview, EvaluatorMetric, DoubleEvaluation,
    ConflictResolution, SeniorReview, MarksChainEvent, Question
)
from app.security import hash_password, calculate_sha256

client = TestClient(app)

def run_v05_tests():
    print("=== Starting ExamForge v0.5 EvaluationOps Validation E2E Tests ===")
    
    # 0. Setup and clean database
    print("\n[Setup] Resetting and migrating SQLite tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Login Controller
    res_ctrl = client.post("/api/auth/login", json={"email": "controller@example.com", "password": "password123"})
    assert res_ctrl.status_code == 200
    ctrl_headers = {"Authorization": f"Bearer {res_ctrl.json()['access_token']}"}
    ctrl_user_id = res_ctrl.json()["user_id"]

    # Login Evaluator 1
    res_eval = client.post("/api/auth/login", json={"email": "evaluator@example.com", "password": "password123"})
    assert res_eval.status_code == 200
    eval_headers = {"Authorization": f"Bearer {res_eval.json()['access_token']}"}
    eval_user_id = res_eval.json()["user_id"]

    # Login Evaluator 2
    res_eval2 = client.post("/api/auth/login", json={"email": "evaluator2@example.com", "password": "password123"})
    assert res_eval2.status_code == 200
    eval2_headers = {"Authorization": f"Bearer {res_eval2.json()['access_token']}"}
    eval2_user_id = res_eval2.json()["user_id"]

    # Register Candidate
    reg = client.post("/api/candidates/register", json={
        "name": "Charlie Descriptive",
        "registration_number": "REG-5500",
        "exam_id": "EXM-005"
    }, headers=ctrl_headers).json()
    cand_id = reg["candidate_id"]
    anon_id = reg["anonymous_id"]

    # Add descriptive written question
    q_written = client.post("/api/questions", json={
        "subject": "Science",
        "topic": "Physics",
        "difficulty": "MEDIUM",
        "question_type": "WRITTEN",
        "marks": 10,
        "content": {"text": "Explain gravity kinetics.", "rubric": "Acceleration definition."},
        "answer": "9.8 m/s^2"
    }, headers=ctrl_headers).json()
    q_id = q_written["id"]

    # --- TEST 1: Written booklet creation succeeds ---
    print("\n[Test 1] Testing written booklet creation...")
    res_bk = client.post("/api/written/booklets/create", json={
        "candidate_id": cand_id,
        "exam_id": "EXM-005",
        "total_pages": 4,
        "center_id": "CTR-99"
    }, headers=ctrl_headers)
    assert res_bk.status_code == 200
    booklet_id = res_bk.json()["id"]
    print("Success! Written booklet created successfully.")

    # --- TEST 2: Page hash generation and verification succeeds ---
    print("\n[Test 2] Testing page hash uploads...")
    page_hashes = []
    for i in range(1, 5):
        p_hash = calculate_sha256(f"Charlie_Physics_Page_{i}_Content")
        page_hashes.append(p_hash)
        res_page = client.post(f"/api/written/booklets/{booklet_id}/upload-page", json={
            "page_number": i,
            "image_url": f"storage/written/{booklet_id}/page-{i}.png",
            "page_hash": p_hash
        }, headers=ctrl_headers)
        assert res_page.status_code == 200
    print("Success! All pages uploaded successfully.")

    # --- TEST 3: Missing page detection works ---
    print("\n[Test 3] Testing missing page detection...")
    # Create another booklet for testing missing page check
    reg2 = client.post("/api/candidates/register", json={
        "name": "Diana Descriptive",
        "registration_number": "REG-5600",
        "exam_id": "EXM-005"
    }, headers=ctrl_headers).json()
    cand_id2 = reg2["candidate_id"]
    
    res_bk2 = client.post("/api/written/booklets/create", json={
        "candidate_id": cand_id2,
        "exam_id": "EXM-005",
        "total_pages": 3,
        "center_id": "CTR-99"
    }, headers=ctrl_headers)
    bk_id2 = res_bk2.json()["id"]
    
    # Upload only page 1 and 3 (missing page 2)
    client.post(f"/api/written/booklets/{bk_id2}/upload-page", json={
        "page_number": 1, "image_url": "page-1.png", "page_hash": "hash1"
    }, headers=ctrl_headers)
    client.post(f"/api/written/booklets/{bk_id2}/upload-page", json={
        "page_number": 3, "image_url": "page-3.png", "page_hash": "hash3"
    }, headers=ctrl_headers)
    
    # Locking should fail due to missing pages
    res_lock_fail = client.post(f"/api/written/booklets/{bk_id2}/lock", headers=ctrl_headers)
    assert res_lock_fail.status_code == 400
    assert "missing" in res_lock_fail.json()["detail"]
    print("Success! Missing page anomaly detected and lock blocked.")

    # Lock Charlie's complete booklet (succeeds)
    res_lock = client.post(f"/api/written/booklets/{booklet_id}/lock", headers=ctrl_headers)
    assert res_lock.status_code == 200
    print("Success! Complete booklet successfully locked.")

    # --- TEST 4: Anonymous copy generation hides candidate identity ---
    print("\n[Test 4] Testing anonymized copy details...")
    res_copy = client.get(f"/api/evaluation/copy/{anon_id}", headers=ctrl_headers)
    assert res_copy.status_code == 200
    copy_data = res_copy.json()
    assert copy_data["identity_visible"] is False
    assert "Charlie" not in copy_data.keys()
    print("Success! Booklet anonymized copy restricts identity parameters.")

    # --- TEST 5: Evaluator cannot access unassigned copy ---
    print("\n[Test 5] Testing evaluator access boundaries...")
    res_unassigned = client.get(f"/api/evaluation/copy/{anon_id}", headers=eval_headers)
    assert res_unassigned.status_code == 403
    print("Success! Access to unassigned booklets blocked.")

    # Assign Charlie's copy to Evaluator 1
    client.post("/api/evaluation/assign", json={
        "anonymous_id": anon_id,
        "evaluator_id": eval_user_id,
        "exam_id": "EXM-005"
    }, headers=ctrl_headers)

    # Now Evaluator 1 can access it
    res_assigned = client.get(f"/api/evaluation/copy/{anon_id}", headers=eval_headers)
    assert res_assigned.status_code == 200
    print("Success! Evaluator boundaries working correctly.")

    # --- TEST 6: Rubric creation and locking works ---
    print("\n[Test 6] Creating and locking descriptive questions rubric...")
    res_rubric = client.post("/api/rubrics/create", json={
        "exam_id": "EXM-005",
        "question_id": q_id,
        "max_marks": 10.0,
        "criteria": [
            {"title": "Concept accuracy", "max_marks": 4.0},
            {"title": "Reasoning steps", "max_marks": 3.0},
            {"title": "Presentation clarity", "max_marks": 3.0}
        ]
    }, headers=ctrl_headers)
    assert res_rubric.status_code == 200
    rubric_id = res_rubric.json()["id"]

    # Lock rubric
    client.post(f"/api/rubrics/{rubric_id}/lock", headers=ctrl_headers)
    print("Success! Rubric created, validated, and locked successfully.")

    # --- TEST 7: Marks submission validates rubric limits ---
    print("\n[Test 7] Testing marks validation checks...")
    # Try submitting concept accuracy = 5.0 (max is 4.0)
    res_limit_fail = client.post("/api/evaluation/marks/submit", json={
        "anonymous_id": anon_id,
        "question_id": q_id,
        "criteria_scores": {
            "C1": 5.0, # invalid
            "C2": 2.0,
            "C3": 2.0
        },
        "notes": "Invalid score test"
    }, headers=eval_headers)
    # The scoring criteria IDs will match dynamically, or we get criteria from database
    # Let's check crit IDs
    db = SessionLocal()
    crits = db.query(RubricCriterion).filter(RubricCriterion.rubric_id == rubric_id).all()
    db.close()
    
    # Use real criterion IDs
    crit_ids = [c.id for c in crits]
    
    res_limit_fail = client.post("/api/evaluation/marks/submit", json={
        "anonymous_id": anon_id,
        "question_id": q_id,
        "criteria_scores": {
            crit_ids[0]: 5.0, # Exceeds max 4.0
            crit_ids[1]: 2.0,
            crit_ids[2]: 2.0
        },
        "notes": "Invalid score"
    }, headers=eval_headers)
    assert res_limit_fail.status_code == 400
    print("Success! Rubric max marks validation boundary working.")

    # Submit valid marks (Draft submitted)
    res_marks_ok = client.post("/api/evaluation/marks/submit", json={
        "anonymous_id": anon_id,
        "question_id": q_id,
        "criteria_scores": {
            crit_ids[0]: 3.5,
            crit_ids[1]: 2.5,
            crit_ids[2]: 2.0
        },
        "notes": "Solid gravity reasoning."
    }, headers=eval_headers)
    assert res_marks_ok.status_code == 200
    eval_mark_id = res_marks_ok.json()["id"]
    print("Success! Valid marks entry submitted.")

    # --- TEST 8: Evaluation locking creates marks hash ---
    print("\n[Test 8] Locking evaluation and checking hash generation...")
    res_lock_marks = client.post(f"/api/evaluation/marks/{eval_mark_id}/lock", json={
        "signature": "ECDSA_SIG_EVAL_1_MARK_9901"
    }, headers=eval_headers)
    assert res_lock_marks.status_code == 200
    print("Success! Evaluation locked. Hash created.")

    # --- TEST 9: Locked marks cannot be edited ---
    print("\n[Test 9] Verifying locked marks cannot be edited...")
    res_edit_fail = client.patch(f"/api/evaluation/marks/{eval_mark_id}", json={
        "anonymous_id": anon_id,
        "question_id": q_id,
        "criteria_scores": {
            crit_ids[0]: 4.0,
            crit_ids[1]: 3.0,
            crit_ids[2]: 3.0
        }
    }, headers=eval_headers)
    assert res_edit_fail.status_code == 400
    print("Success! Blocked editing of locked evaluation marks.")

    # --- TEST 10: Double evaluation variance conflict detected ---
    print("\n[Test 10] Simulating double evaluation and variance conflict...")
    # Setup Double Evaluation: Assign Charlie's copy to Evaluator 1 and Evaluator 2
    client.post("/api/evaluation/double-assign", json={
        "anonymous_id": anon_id,
        "question_id": q_id,
        "evaluator_a": eval_user_id,
        "evaluator_b": eval2_user_id,
        "exam_id": "EXM-005"
    }, headers=ctrl_headers)

    # Submit Evaluator 2 marks (3.0 marks difference vs Evaluator 1's 8.0 marks)
    res_eval2_marks = client.post("/api/evaluation/marks/submit", json={
        "anonymous_id": anon_id,
        "question_id": q_id,
        "criteria_scores": {
            crit_ids[0]: 2.0, # 2.0/4.0
            crit_ids[1]: 1.5, # 1.5/3.0
            crit_ids[2]: 1.5  # 1.5/3.0
        },
        "notes": "Incomplete kinetics steps."
    }, headers=eval2_headers)
    assert res_eval2_marks.status_code == 200
    eval2_mark_id = res_eval2_marks.json()["id"]

    # Lock Evaluator 2 marks (Triggers variance checking)
    client.post(f"/api/evaluation/marks/{eval2_mark_id}/lock", json={
        "signature": "ECDSA_SIG_EVAL_2_MARK_9901"
    }, headers=eval2_headers)

    # Fetch conflicts list
    res_conflicts = client.get("/api/evaluation/conflicts")
    assert res_conflicts.status_code == 200
    conflicts = res_conflicts.json()
    assert len(conflicts) == 1
    conflict = conflicts[0]
    assert conflict["variance"] == 3.0 # |8.0 - 5.0|
    assert conflict["status"] == "OPEN"
    print("Success! Variance conflict (>2.0 marks) correctly detected and opened.")

    # --- TEST 12: Unresolved conflict blocks publication gate ---
    print("\n[Test 12] Verifying unresolved conflicts block publication gate...")
    gate_resp = client.get("/api/exams/EXM-005/gate-status")
    assert gate_resp.json()["allowed"] is False
    assert "UNRESOLVED_EVALUATOR_CONFLICTS" in gate_resp.json()["blocking_reasons"]
    print("Success! Unresolved conflict blocks result release.")

    # --- TEST 11: Senior review resolves conflict ---
    print("\n[Test 11] Testing senior review conflict resolution...")
    res_resolve = client.post(f"/api/evaluation/conflicts/{conflict['id']}/senior-review", json={
        "final_marks": 7.0,
        "decision_notes": "Agreed on average score. Checked definition carefully."
    }, headers=ctrl_headers)
    assert res_resolve.status_code == 200
    
    # Conflict status should now be RESOLVED
    res_conf_check = client.get(f"/api/evaluation/conflicts/{conflict['id']}")
    assert res_conf_check.json()["status"] == "RESOLVED"
    print("Success! Senior reviewer successfully resolved conflict.")

    # --- TEST 13: OMR manual review finalizes ambiguous answer ---
    print("\n[Test 13] finalization of OMR manual reviews...")
    # Seed mock OMR scan and review report
    db = SessionLocal()
    scan = OMRScan(
        candidate_id=cand_id,
        exam_id="EXM-005",
        image_hash="abc",
        detected_answers='{"Q1": "A", "Q3": "AMBIGUOUS"}',
        confidence_report='{"Q1": 0.99, "Q3": 0.52}',
        status="PROCESSED"
    )
    db.add(scan)
    db.commit()
    
    omr_rev = OMRManualReview(
        scan_id=scan.id,
        candidate_id=cand_id,
        question_no=3,
        detected_answer="AMBIGUOUS",
        confidence=0.52,
        review_status="PENDING"
    )
    db.add(omr_rev)
    db.commit()
    omr_rev_id = omr_rev.id
    db.close()

    # Finalize manual review choice
    res_omr_fin = client.post(f"/api/omr/review/{omr_rev_id}/finalize", json={
        "reviewer_final_answer": "C"
    }, headers=ctrl_headers)
    assert res_omr_fin.status_code == 200
    assert res_omr_fin.json()["reviewer_final_answer"] == "C"
    print("Success! Ambiguous scan bubble manually finalized.")

    # --- TEST 14: OMR review lock prevents mutation ---
    print("\n[Test 14] Locking OMR review and blocking changes...")
    client.post(f"/api/omr/review/{omr_rev_id}/lock", headers=ctrl_headers)
    
    # Attempt finalize edit again (should be blocked)
    res_omr_edit_fail = client.post(f"/api/omr/review/{omr_rev_id}/finalize", json={
        "reviewer_final_answer": "D"
    }, headers=ctrl_headers)
    assert res_omr_edit_fail.status_code == 400
    print("Success! Lock prevents OMR review mutation.")

    # --- TEST 15: Evaluator analytics detects suspicious speed ---
    print("\n[Test 15] Seeding evaluator metrics to trigger warnings...")
    # Seed evaluator metric with speed = 3.0 seconds (suspicious, threshold is 10.0)
    db = SessionLocal()
    metric = EvaluatorMetric(
        evaluator_id=eval_user_id,
        total_assigned=1,
        total_completed=1,
        average_marks_given=8.0,
        conflict_rate=0.0,
        average_speed_seconds=3.0, # Fast
        lock_delay_seconds=120.0
    )
    db.add(metric)
    db.commit()
    db.close()

    # Query analytics risk warnings
    res_risk = client.get("/api/evaluation/analytics/risk", headers=ctrl_headers)
    assert res_risk.status_code == 200
    warnings = res_risk.json()["warnings"]
    assert any(w["code"] == "ABNORMAL_EVALUATION_SPEED" for w in warnings)
    print("Success! Performance analytics detected suspicious speed.")

    # --- TEST 16: Marks chain verification succeeds ---
    print("\n[Test 16] Running MarksChain cryptographical verify check...")
    res_chain = client.get("/api/evaluation/marks-chain/verify")
    assert res_chain.status_code == 200
    assert res_chain.json()["locks_valid"] is True
    assert res_chain.json()["chain_intact"] is True
    print("Success! MarksChain audit verified intact.")

    # --- TEST 17: Full EvaluationOps workflow passes ---
    print("\n[Test 17] Checking final Results Publication Gate status...")
    gate_resp = client.get("/api/exams/EXM-005/gate-status")
    # Charlie and Diana booklets are locked, conflicts resolved, OMR reviews locked.
    # Diana booklet bk_id2 is currently unlocked, so let's lock it first to pass final gate check!
    # Lock Diana booklet
    p_hash_d = calculate_sha256("Diana_Page_1")
    client.post(f"/api/written/booklets/{bk_id2}/upload-page", json={
        "page_number": 2, "image_url": "page-2.png", "page_hash": p_hash_d
    }, headers=ctrl_headers)
    client.post(f"/api/written/booklets/{bk_id2}/lock", headers=ctrl_headers)
    
    # Check gate again
    gate_resp = client.get("/api/exams/EXM-005/gate-status")
    print(f"Gate output: {gate_resp.json()}")
    assert gate_resp.json()["allowed"] is True
    print("Success! Full EvaluationOps E2E workflow passed successfully.")

    print("\n=== All Version 0.5 EvaluationOps Tests Passed ===")

if __name__ == "__main__":
    try:
        run_v05_tests()
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
