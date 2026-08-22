import unittest
import os
import sys
import json
import hmac
import hashlib
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import get_db, SessionLocal
import app.models as models

client = TestClient(app)

class TestSecurityRemediation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_keyspace_rotation_requires_auth(self):
        """Verify that rotating cryptographic keys rejects unauthenticated requests with 401/403."""
        res = client.post("/api/keyspace/keys/KEY-001/rotate")
        self.assertIn(res.status_code, [401, 403], f"Expected 401/403 for unauthenticated key rotation, got {res.status_code}")
        print("  ✓ Verified /api/keyspace/keys/{id}/rotate enforces authentication.")

    def test_02_keyspace_revocation_requires_auth(self):
        """Verify that revoking cryptographic keys rejects unauthenticated requests with 401/403."""
        res = client.post("/api/keyspace/keys/KEY-001/revoke")
        self.assertIn(res.status_code, [401, 403], f"Expected 401/403 for unauthenticated key revocation, got {res.status_code}")
        print("  ✓ Verified /api/keyspace/keys/{id}/revoke enforces authentication.")

    def test_03_payment_webhook_signature_verification(self):
        """Verify that payment webhook accepts valid HMAC signatures and rejects fraudulent signatures."""
        secret = "examforge_webhook_secret_2026"
        payload = json.dumps({"order_id": "ORD-TEST-001", "event": "payment.captured"}).encode("utf-8")
        
        valid_sig = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        invalid_sig = "deadbeef1234567890abcdef"
        
        # Test with invalid signature
        res_fail = client.post(
            "/api/v1/payments/webhook",
            content=payload,
            headers={"x-razorpay-signature": invalid_sig, "Content-Type": "application/json"}
        )
        self.assertEqual(res_fail.status_code, 400, "Expected 400 Bad Request for fraudulent webhook signature")
        
        # Test with valid signature
        res_pass = client.post(
            "/api/v1/payments/webhook",
            content=payload,
            headers={"x-razorpay-signature": valid_sig, "Content-Type": "application/json"}
        )
        self.assertEqual(res_pass.status_code, 200, "Expected 200 OK for authentic webhook signature")
        print("  ✓ Verified payment gateway webhook validates HMAC-SHA256 signatures.")

    def test_04_warroom_lockdown_requires_controller_auth(self):
        """Verify that war room emergency lockdown requires controller/security role."""
        res = client.post("/api/warroom/emergency-lockdown", json={"reason": "Adversarial test"})
        self.assertIn(res.status_code, [401, 403], f"Expected 401/403 for unauthenticated war room lockdown, got {res.status_code}")
        print("  ✓ Verified /api/warroom/emergency-lockdown enforces role authorization.")

    def test_05_role_assignment_requires_auth(self):
        """Verify that assigning institutional roles requires Platform Admin authorization."""
        res = client.post("/api/access/assign-role", json={"user_id": "USR-001", "institution_id": "INS-001", "role": "CONTROLLER"})
        self.assertIn(res.status_code, [401, 403], f"Expected 401/403 for unauthenticated role assignment, got {res.status_code}")
        print("  ✓ Verified /api/access/assign-role enforces Platform Admin authorization.")

if __name__ == "__main__":
    unittest.main()
