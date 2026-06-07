import sys
import os
import json
import numpy as np
import cv2

# Add current folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base
from app.models import Candidate

client = TestClient(app)

def generate_mock_omr_image_bytes() -> bytes:
    """Generates a small mock OMR sheet image using NumPy/OpenCV."""
    # Create a 400x400 white canvas
    img = np.ones((400, 400, 3), dtype=np.uint8) * 255
    
    # Draw 3 rows of MCQ bubbles (each row has 4 bubbles)
    # Fill one bubble in row 1, one in row 2 to simulate candidate marks
    # Row 1 choice B: filled (draw black filled circle)
    cv2.circle(img, (150, 100), 15, (0, 0, 0), 2)  # Empty outline
    cv2.circle(img, (200, 100), 15, (0, 0, 0), -1) # Filled
    cv2.circle(img, (250, 100), 15, (0, 0, 0), 2)  # Empty
    cv2.circle(img, (300, 100), 15, (0, 0, 0), 2)  # Empty

    # Row 2 choice C: filled
    cv2.circle(img, (150, 200), 15, (0, 0, 0), 2)  # Empty
    cv2.circle(img, (200, 200), 15, (0, 0, 0), 2)  # Empty
    cv2.circle(img, (250, 200), 15, (0, 0, 0), -1) # Filled
    cv2.circle(img, (300, 200), 15, (0, 0, 0), 2)  # Empty

    # Row 3 choice A: filled, choice B: half-filled (Ambiguous)
    cv2.circle(img, (150, 300), 15, (0, 0, 0), -1) # Filled
    cv2.circle(img, (200, 300), 15, (0, 0, 0), -1) # Filled (simulate double-marking)
    cv2.circle(img, (250, 300), 15, (0, 0, 0), 2)  # Empty
    cv2.circle(img, (300, 300), 15, (0, 0, 0), 2)  # Empty

    _, img_bytes = cv2.imencode('.png', img)
    return img_bytes.tobytes()

def run_v02_tests():
    print("=== Starting ExamForge Version 0.2 Ingestion & AI Tests ===")
    
    # Setup baseline tables
    Base.metadata.create_all(bind=engine)
    
    # 1. Login as Controller to seed Candidate
    print("\n[Test 1] Registering candidate in database...")
    resp = client.post("/api/auth/login", json={
        "email": "controller@example.com",
        "password": "password123"
    })
    ctrl = resp.json()
    ctrl_headers = {"Authorization": f"Bearer {ctrl['access_token']}"}
    
    # Check if candidate registered
    from app.database import SessionLocal
    db = SessionLocal()
    cand = db.query(Candidate).first()
    if not cand:
        # Register a new one
        reg = client.post("/api/candidates/register", json={
            "name": "Bob Tester",
            "registration_number": "REG-9990",
            "exam_id": "EXM-001"
        }, headers=ctrl_headers)
        cand_id = reg.json()["candidate_id"]
    else:
        cand_id = cand.id
    db.close()
    
    # 2. Test QR Booklet Cover Stamp Generator
    print("\n[Test 2] Testing secure QR cover booklet generator...")
    resp = client.get(f"/api/candidates/{cand_id}/booklet/cover")
    assert resp.status_code == 200, f"QR Generator failed: {resp.text}"
    assert resp.headers["content-type"] == "image/png", f"Incorrect content type: {resp.headers}"
    # Verify PNG magic bytes
    assert resp.content.startswith(b"\x89PNG\r\n\x1a\n"), "File is not a valid PNG image."
    print("Success! QR code cover generated successfully as a verified PNG file.")

    # 3. Test OpenCV OMR Scan parsing
    print("\n[Test 3] Testing OpenCV bubble grid contour and density extraction...")
    omr_bytes = generate_mock_omr_image_bytes()
    # Perform upload
    files = {"file": ("omr_scan.png", omr_bytes, "image/png")}
    data = {"candidate_id": cand_id, "exam_id": "EXM-001"}
    
    resp = client.post("/api/omr/scans/upload", data=data, files=files, headers=ctrl_headers)
    assert resp.status_code == 200, f"OMR upload failed: {resp.text}"
    omr_res = resp.json()
    print("OMR Scanning complete. Detected Bubble Choices:")
    print(json.dumps(omr_res["detected_answers"], indent=2))
    print("Bubble Confidence Indices:")
    print(json.dumps(omr_res["confidence_report"], indent=2))
    
    # Validate OpenCV detected B on Q1, C on Q2, and flagged Q3 as AMBIGUOUS
    assert omr_res["detected_answers"]["Q1"] == "B", f"Q1 was incorrect: {omr_res['detected_answers']}"
    assert omr_res["detected_answers"]["Q2"] == "C", f"Q2 was incorrect: {omr_res['detected_answers']}"
    assert omr_res["detected_answers"]["Q3"] == "AMBIGUOUS", f"Q3 was incorrect: {omr_res['detected_answers']}"
    print("Success! OpenCV aligned and parsed bubble densities correctly.")

    # 4. Test AI Vision Grading assistant
    print("\n[Test 4] Testing AI Vision grading insights (OCR & rubric validation)...")
    insight_payload = {
        "exam_id": "EXM-001",
        "anonymous_id": "ANON-DB233633",
        "question_id": "QST-HARD-1",
        "text_content": "Electrolysis breaks water into oxygen gas at the anode and hydrogen at the cathode. The volumetric ratio is 2:1.",
        "rubric_guidelines": "Score 10: mentions anode, cathode, and 2:1 ratio."
    }
    resp = client.post("/api/evaluations/ai-insight", json=insight_payload)
    assert resp.status_code == 200, f"AI insight failed: {resp.text}"
    ai_res = resp.json()
    print("AI Evaluation suggestion:")
    print(f"Suggested Score: {ai_res['suggested_marks']} / 10.0")
    print("Mismatched Rubric Comments:")
    print(json.dumps(ai_res["rubric_mismatch_flags"], indent=2))
    
    # Verify the keyword fallback worked correctly
    assert ai_res["suggested_marks"] == 8.0, f"Incorrect score calculation: {ai_res}"
    print("Success! AI grading insights compiled successfully.")
    
    print("\n=== All Version 0.2 Ingestion & AI Tests Passed! ===")

if __name__ == "__main__":
    try:
        run_v02_tests()
    except AssertionError as ae:
        print(f"\nAssertion Error: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected Error: {e}", file=sys.stderr)
        sys.exit(1)
