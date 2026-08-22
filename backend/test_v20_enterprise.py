import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_v20_warroom_telemetry():
    res = client.get("/api/warroom/telemetry")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "threat_level" in data
    assert data["status"] in ["OPERATIONAL", "EMERGENCY_LOCKDOWN"]

def test_v20_emergency_lockdown_flow():
    # Trigger lockdown
    payload = {"reason": "Automated security unit test anomaly"}
    res_lock = client.post("/api/warroom/emergency-lockdown", json=payload)
    assert res_lock.status_code == 200
    data_lock = res_lock.json()
    assert data_lock["success"] is True
    assert data_lock["action"] == "EMERGENCY_LOCKDOWN_ACTIVATED"

    # Verify telemetry reflects lockdown
    res_tel = client.get("/api/warroom/telemetry")
    assert res_tel.json()["status"] == "EMERGENCY_LOCKDOWN"

    # Reset lockdown
    res_reset = client.post("/api/warroom/reset-lockdown")
    assert res_reset.status_code == 200
    assert res_reset.json()["status"] == "OPERATIONAL"

def test_v20_ai_collusion_analysis():
    payload = {
        "candidates": [
            {"candidate_id": "TEST-C1", "seat": {"x": 1, "y": 1}, "answers": ["A", "B", "C", "D"]},
            {"candidate_id": "TEST-C2", "seat": {"x": 1, "y": 2}, "answers": ["A", "B", "C", "D"]}, # 100% match adjacent
            {"candidate_id": "TEST-C3", "seat": {"x": 5, "y": 5}, "answers": ["D", "C", "B", "A"]},
        ]
    }
    res = client.post("/api/ai-security/analyze-collusion", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["suspicious_clusters_found"] >= 1
    assert "TEST-C1" in data["flagged_candidates"]
    assert "TEST-C2" in data["flagged_candidates"]

def test_v20_evaluator_calibration():
    res = client.get("/api/ai-security/evaluator-calibration")
    assert res.status_code == 200
    data = res.json()
    assert "evaluators_calibrated" in data
    assert len(data["evaluator_profiles"]) > 0

def test_v20_crypto_vault_sign_and_zkp():
    # Test signing
    sign_res = client.post("/api/crypto-vault/sign", json={"data": "ExamResult-Pass-CAND101"})
    assert sign_res.status_code == 200
    sign_data = sign_res.json()
    assert "signature" in sign_data
    assert sign_data["algorithm"] == "ED25519-HMAC-SHA256"

    # Test ZKP score proof
    zkp_res = client.get("/api/crypto-vault/zk-proof/RES-9988?score=82.0&threshold=50.0")
    assert zkp_res.status_code == 200
    zkp_data = zkp_res.json()
    assert zkp_data["passed"] is True
    assert zkp_data["zero_knowledge"] is True
    assert zkp_data["raw_marks_disclosed"] is False
    assert "zkp_commitment_hash" in zkp_data
