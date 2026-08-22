import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_safebatch():
    print("Testing SafeBatch Backend Endpoints...")
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)

    # 1. Preview
    resp = client.post("/api/safebatch/preview", json={
        "exam_id": "EXM-AIML-2026",
        "action_type": "BULK_CENTRE_ALLOCATION"
    })
    assert resp.status_code == 200, f"Preview failed: {resp.text}"
    preview_json = resp.json()
    print("✓ Preview successful:", preview_json["scope_summary"])
    assert preview_json["scope_summary"]["total_candidates"] == 2847
    assert preview_json["scope_summary"]["safe_allocations"] == 2813
    assert preview_json["scope_summary"]["unresolved_exceptions"] == 34

    # 2. Execute
    resp = client.post("/api/safebatch/execute", json={
        "exam_id": "EXM-AIML-2026",
        "action_type": "BULK_CENTRE_ALLOCATION",
        "confirmed": True,
        "executed_by": "Vendor Controller",
        "executed_by_role": "VENDOR"
    })
    assert resp.status_code == 200, f"Execute failed: {resp.text}"
    exec_json = resp.json()
    print("✓ Execute successful:", exec_json["action_id"], "Handoff:", exec_json["handoff_id"])
    handoff_id = exec_json["handoff_id"]

    # 3. Get Handoff Detail
    resp = client.get(f"/api/safebatch/handoffs/{handoff_id}")
    assert resp.status_code == 200, f"Handoff detail failed: {resp.text}"
    detail_json = resp.json()
    print("✓ Handoff detail loaded:", len(detail_json["items"]), "items")
    assert len(detail_json["items"]) == 34

    # 4. Claim Handoff
    resp = client.post(f"/api/safebatch/handoffs/{handoff_id}/claim", json={
        "claimed_by": "Centre Superintendent",
        "role": "OFFICER"
    })
    assert resp.status_code == 200, f"Claim failed: {resp.text}"
    print("✓ Handoff claimed:", resp.json()["status"])

    # 5. Resolve Handoff
    resp = client.post(f"/api/safebatch/handoffs/{handoff_id}/resolve", json={
        "resolved_by": "Centre Superintendent",
        "role": "OFFICER",
        "resolution_notes": "Allocated 34 exceptions to Chennai Hub D buffer seats."
    })
    assert resp.status_code == 200, f"Resolve failed: {resp.text}"
    print("✓ Handoff resolved:", resp.json()["status"], "Resolved count:", resp.json()["resolved_count"])

    print("\nALL SAFEBATCH ENDPOINTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    test_safebatch()
