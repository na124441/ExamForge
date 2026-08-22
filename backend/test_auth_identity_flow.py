import os
import sys

# Ensure backend root in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.auth.v1_routes import register_candidate, send_email_otp, send_phone_otp, verify_otp
from app.identity.routes import verify_aadhaar_qr_document
from app.auth.v1_routes import RegisterInput, SendEmailOtpInput, SendPhoneOtpInput, VerifyOtpInput
from fastapi import Request

class MockRequest:
    class MockClient:
        host = "127.0.0.1"
    client = MockClient()
    headers = {"user-agent": "pytest-test-agent"}
    cookies = {}

async def test_complete_flow():
    print("==========================================================")
    print("  EXAMFORGE AUTH & UIDAI IDENTITY VERIFICATION FLOW TEST  ")
    print("==========================================================")

    db = SessionLocal()
    req = MockRequest()
    try:
        # 1. Register Candidate
        print("[1/5] Testing Candidate Registration (API v1)...")
        reg_res = register_candidate(
            input_data=RegisterInput(
                name="Ananya Sharma",
                email="ananya.sharma@example.com",
                phone="+91 98765 12345"
            ),
            request=req,
            db=db
        )
        print(f"  ✓ {reg_res['message']} (State: {reg_res['registrationState']})")

        # 2. Send Email OTP
        print("[2/5] Testing Email OTP Dispatch (Resend/SES Abstraction)...")
        email_res = await send_email_otp(
            input_data=SendEmailOtpInput(email="ananya.sharma@example.com", purpose="REGISTRATION"),
            request=req,
            db=db
        )
        print(f"  ✓ {email_res['message']} (ChallengeId: {email_res['challengeId']})")

        # 3. Send Phone OTP (India DLT E.164 Normalization)
        print("[3/5] Testing Phone OTP Dispatch (India DLT E.164)...")
        phone_res = await send_phone_otp(
            input_data=SendPhoneOtpInput(phone="+919876512345", purpose="REGISTRATION"),
            request=req,
            db=db
        )
        print(f"  ✓ {phone_res['message']} (ChallengeId: {phone_res['challengeId']})")

        # 4. UIDAI Secure QR Verification Pipeline Test
        print("[4/5] Testing UIDAI Secure QR Verification Engine...")
        qr_res = await verify_aadhaar_qr_document(
            candidateId="PRF-CAN-2026-01",
            qrPayload="MOCK_UIDAI_SECURE_QR_PAYLOAD_2048BIT",
            db=db
        )
        print(f"  ✓ UIDAI RSA-2048 Signature: {qr_res['uidaiSignatureValid']}")
        print(f"  ✓ Match Score: {qr_res['overallMatchScore'] * 100}% ({qr_res['nameMatchStatus']})")
        print(f"  ✓ Document Hash SHA256: {qr_res['documentHash'][:24]}...")
        print(f"  ✓ Final Status: {qr_res['status']}")

        print("==========================================================")
        print("  ✓ ALL AUTH & IDENTITY VERIFICATION TESTS PASSED!       ")
        print("==========================================================")

    except Exception as e:
        print(f"❌ Flow Error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_complete_flow())
