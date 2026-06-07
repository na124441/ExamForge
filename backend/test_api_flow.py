import sys
import os
import json

# Add current folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base
from app.models import Evaluation

client = TestClient(app)

def run_e2e_test():
    print("=== Starting ExamForge End-to-End Cryptographic Chain Test ===")
    
    # 0. Clean database schemas
    print("\n[Step 0] Resetting and migrating SQLite tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")
    
    # 1. Login as Controller
    print("\n[Step 1] Logging in as Exam Controller...")
    resp = client.post("/api/auth/login", json={
        "email": "controller@example.com",
        "password": "password123"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    ctrl_data = resp.json()
    ctrl_headers = {"Authorization": f"Bearer {ctrl_data['access_token']}"}
    print(f"Logged in successfully. User: {ctrl_data['name']}, Role: {ctrl_data['role']}")
    
    # 2. Add Questions to Bank
    print("\n[Step 2] Seeding Question Bank pool...")
    questions = [
        {
            "subject": "Science",
            "topic": "Electricity",
            "difficulty": "EASY",
            "question_type": "MCQ_SINGLE",
            "marks": 4,
            "content": {"text": "What is the SI unit of electric current?", "options": {"A": "Volt", "B": "Ampere", "C": "Ohm", "D": "Watt"}},
            "answer": "B"
        },
        {
            "subject": "Science",
            "topic": "Electricity",
            "difficulty": "MEDIUM",
            "question_type": "MCQ_SINGLE",
            "marks": 4,
            "content": {"text": "Which material has the highest electrical conductivity?", "options": {"A": "Copper", "B": "Gold", "C": "Silver", "D": "Aluminum"}},
            "answer": "C"
        },
        {
            "subject": "Science",
            "topic": "Chemistry",
            "difficulty": "HARD",
            "question_type": "WRITTEN",
            "marks": 10,
            "content": {"text": "Explain the electrolysis process of water.", "rubric": "Mentions anode, cathode, and gas ratios."},
            "answer": "Anode produces oxygen, cathode hydrogen. Ratio 1:2."
        }
    ]
    
    question_responses = []
    for q in questions:
        resp = client.post("/api/questions", json=q, headers=ctrl_headers)
        assert resp.status_code == 200, f"Failed to insert question: {resp.text}"
        res = resp.json()
        question_responses.append(res)
        print(f"Created question: id={res['id']}, Subject={res['subject']}, Hash={res['content_hash'][:12]}...")

    # 3. Create Blueprint
    print("\n[Step 3] Defining exam blueprint constraints...")
    bp_data = {
        "total_marks": 8,
        "total_questions": 2,
        "duration_minutes": 180,
        "subject_distribution": {"Science": 2},
        "difficulty_distribution": {"EASY": 50, "MEDIUM": 50}
    }
    resp = client.post("/api/exams/EXM-001/blueprint", json=bp_data, headers=ctrl_headers)
    assert resp.status_code == 200, f"Blueprint creation failed: {resp.text}"
    bp = resp.json()
    print(f"Blueprint configured: id={bp['id']}, Total marks={bp['total_marks']}")

    # 4. Generate Paper (and Time-Locked Package)
    print("\n[Step 4] Dynamically generating exam papers...")
    gen_data = {
        "set_id": "A",
        "center_id": "CTR-22",
        "release_delay_seconds": 0 # Open immediately for test
    }
    resp = client.post("/api/exams/EXM-001/generate-paper", json=gen_data, headers=ctrl_headers)
    assert resp.status_code == 200, f"Paper generation failed: {resp.text}"
    paper = resp.json()
    print(f"Paper Generated: id={paper['paper_id']}, Hash={paper['paper_hash'][:16]}..., Status={paper['status']}")

    # 5. Enroll and Verify Candidate
    print("\n[Step 5] Enrolling and verifying candidate at center...")
    reg_data = {
        "name": "Alice Developer",
        "registration_number": "REG-8812",
        "exam_id": "EXM-001"
    }
    resp = client.post("/api/candidates/register", json=reg_data, headers=ctrl_headers)
    assert resp.status_code == 200, f"Candidate registration failed: {resp.text}"
    cand = resp.json()
    print(f"Candidate enrolled: id={cand['candidate_id']}, Anonymous ID={cand['anonymous_id']}")
    
    resp = client.post("/api/candidates/verify", json={"candidate_id": cand["candidate_id"]}, headers=ctrl_headers)
    assert resp.status_code == 200, f"Candidate verification failed: {resp.text}"
    print("Candidate identity verified. Seat mapped.")

    # 6. Candidate Starts Exam & Decrypts Package
    print("\n[Step 6] Starting exam session (Decrypting time-locked package)...")
    sess_data = {
        "candidate_id": cand["candidate_id"],
        "center_id": "CTR-22"
    }
    resp = client.post("/api/sessions/start", json=sess_data)
    assert resp.status_code == 200, f"Exam start failed: {resp.text}"
    session = resp.json()
    print(f"Session started: ID={session['session_id']}. Fetched {len(session['questions'])} decrypted questions.")

    # 7. Candidate Answers Questions (Event Chain Log)
    print("\n[Step 7] Candidate answering questions (chaining event logs)...")
    q_ids = [q["id"] for q in session["questions"]]
    
    # Save Answer 1
    ans_resp = client.post("/api/sessions/answer", json={
        "session_id": session["session_id"],
        "candidate_id": cand["candidate_id"],
        "question_id": q_ids[0],
        "selected_answer": "B" # Correct answer SI unit Ampere
    })
    assert ans_resp.status_code == 200
    ans1 = ans_resp.json()
    print(f"Answer Event 1 logged. Current Hash: {ans1['current_hash'][:16]}...")
    
    # Save Answer 2 (Chained to Answer 1)
    ans_resp = client.post("/api/sessions/answer", json={
        "session_id": session["session_id"],
        "candidate_id": cand["candidate_id"],
        "question_id": q_ids[1],
        "selected_answer": "C" # Correct answer conductivity Silver
    })
    assert ans_resp.status_code == 200
    ans2 = ans_resp.json()
    print(f"Answer Event 2 logged. Current Hash: {ans2['current_hash'][:16]}...")

    # 8. Submit Exam & Receive Receipt
    print("\n[Step 8] Submitting exam session...")
    resp = client.post("/api/sessions/submit", json={
        "session_id": session["session_id"],
        "candidate_id": cand["candidate_id"]
    })
    assert resp.status_code == 200, f"Submit failed: {resp.text}"
    receipt = resp.json()
    print(f"Submission successful. Cryptographic Receipt: {receipt['submission_receipt_hash'][:16]}...")

    # 9. Ingest Written descriptive answer and Grade
    print("\n[Step 9] Simulating written booklet upload and evaluation grading...")
    # Create booklet entry
    resp = client.post("/api/written/booklets/create", json={
        "candidate_id": cand["candidate_id"],
        "exam_id": "EXM-001",
        "total_pages": 3
    }, headers=ctrl_headers)
    assert resp.status_code == 200
    booklet = resp.json()
    print(f"Ingested descriptive booklet: {booklet['booklet_id']}, Anonymous ID={booklet['anonymous_id']}")
    
    # Login as Evaluator
    resp = client.post("/api/auth/login", json={
        "email": "evaluator@example.com",
        "password": "password123"
    })
    assert resp.status_code == 200
    eval_data = resp.json()
    eval_headers = {"Authorization": f"Bearer {eval_data['access_token']}"}
    
    # Submit grade for descriptive question (10 marks)
    resp = client.post("/api/evaluations/submit", json={
        "exam_id": "EXM-001",
        "anonymous_id": cand["anonymous_id"],
        "question_id": question_responses[2]["id"],
        "marks_awarded": 8.0,
        "max_marks": 10.0,
        "rubric_notes": "Cathode hydrogen ratio matches perfectly. 2 marks deducted for anode detail."
    }, headers=eval_headers)
    assert resp.status_code == 200
    grade = resp.json()
    print(f"Evaluator lock grade saved. Signature: {grade['evaluation_hash'][:16]}...")

    # 10. Verify and Publish Results (Happy Path)
    print("\n[Step 10] Running full integrity verification checks for publication (Happy Path)...")
    resp = client.post("/api/exams/EXM-001/publish-results", headers=ctrl_headers)
    assert resp.status_code == 200, f"Integrity check failed on happy path: {resp.text}"
    results = resp.json()
    print("Success! Verification checks passed. Published results:")
    print(json.dumps(results["results"], indent=2))

    # 11. Tamper Simulation Backend Backdoor (Malicious DB Modification)
    print("\n[Step 11] BACKDOOR TAMPER SIMULATION: Altering evaluator marks directly in SQLite...")
    # Get evaluation id
    from app.database import SessionLocal
    db = SessionLocal()
    evaluation_record = db.query(Evaluation).first()
    evaluation_id = evaluation_record.id
    db.close()
    
    resp = client.post("/api/exams/EXM-001/simulate-tamper", json={
        "mode": "EVALUATION_MARKS",
        "target_id": evaluation_id,
        "new_value": "10.0" # Change marks from 8.0 to 10.0 directly in SQLite
    })
    assert resp.status_code == 200
    print(f"Tamper completed. {resp.json()['modified_resource']}")

    # 12. Re-verify results (Integrity Failure Path)
    print("\n[Step 12] Re-running integrity verifier on tampered state...")
    resp = client.post("/api/exams/EXM-001/publish-results", headers=ctrl_headers)
    
    # Expected: The verifier fails with code 400 and blocks results
    assert resp.status_code == 400, f"Security check bypassed! Returned: {resp.text}"
    err_payload = resp.json()
    print("\n[TAMPER CAUGHT SUCCESSFULLY]")
    print(f"Response status code: {resp.status_code}")
    print(f"Verification Failure details: {json.dumps(err_payload['detail'], indent=2)}")
    
    print("\n=== E2E Cryptographic Chain Verification Passed! ===")

if __name__ == "__main__":
    try:
        run_e2e_test()
    except AssertionError as ae:
        print(f"\nAssertion error: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}", file=sys.stderr)
        sys.exit(1)
