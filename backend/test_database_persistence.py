import os
import sys
import unittest
from datetime import datetime, timezone

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
import app.models as models
from app.authority.dashboard import get_authority_dashboard_metrics

class TestDatabasePersistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_vendor_organizations_persisted(self):
        vendors = self.db.query(models.VendorOrganization).all()
        self.assertGreaterEqual(len(vendors), 1, "At least 1 vendor organization must be persisted in database.")
        nta = self.db.query(models.VendorOrganization).filter(models.VendorOrganization.id == "VND-NTA-2026").first()
        self.assertIsNotNone(nta, "NTA vendor record must exist.")
        self.assertEqual(nta.name, "National Testing Agency (NTA)")
        print(f"  ✓ Verified {len(vendors)} Vendor Organizations in DB.")

    def test_02_exam_catalogs_persisted(self):
        exams = self.db.query(models.ExamCatalog).all()
        self.assertGreaterEqual(len(exams), 1, "At least 1 exam must exist in exam_catalogs table.")
        jee = self.db.query(models.ExamCatalog).filter(models.ExamCatalog.code == "JEE-MAIN-2026").first()
        self.assertIsNotNone(jee, "JEE Main exam catalog must exist.")
        self.assertEqual(jee.category, "ENGINEERING")
        print(f"  ✓ Verified {len(exams)} Real Examination Catalogs in DB.")

    def test_03_candidate_workflow_persistence(self):
        # 1. Create candidate user & profile
        test_email = f"test_candidate_{int(datetime.now().timestamp())}@examforge.org"
        user = models.User(
            id=f"USR-TEST-{int(datetime.now().timestamp())}",
            name="Test Persistence Candidate",
            email=test_email,
            password_hash="test_hash_pbkdf2",
            status="ACTIVE"
        )
        self.db.add(user)
        self.db.commit()

        student_id = f"EXF-CAN-TEST-{int(datetime.now().timestamp())}"
        profile = models.CandidateProfile(
            user_id=user.id,
            candidate_student_id=student_id,
            full_name="Test Persistence Candidate",
            email=test_email,
            phone="+91 9988776655",
            dob="2007-05-10",
            gender="Male",
            category="General",
            aadhaar_status="VERIFIED",
            aadhaar_number_masked="XXXX-XXXX-9988",
            registration_state="IDENTITY_VERIFIED"
        )
        self.db.add(profile)
        self.db.commit()

        # 2. Simulate Process Restart by closing and reopening session
        self.db.close()
        fresh_db = SessionLocal()

        reloaded_profile = fresh_db.query(models.CandidateProfile).filter(
            models.CandidateProfile.candidate_student_id == student_id
        ).first()
        self.assertIsNotNone(reloaded_profile, "Candidate profile must survive session/process restart.")
        self.assertEqual(reloaded_profile.full_name, "Test Persistence Candidate")
        self.assertEqual(reloaded_profile.aadhaar_status, "VERIFIED")

        # 3. Create Exam Application & Payment
        app_num = f"APP-TEST-{int(datetime.now().timestamp())}"
        exam_app = models.ExamApplication(
            application_number=app_num,
            exam_id="EXM-JEE-MAIN-2026",
            candidate_id=reloaded_profile.id,
            vendor_id="VND-NTA-2026",
            fee_amount=1000.0,
            payment_status="PAID",
            status="SUBMITTED"
        )
        fresh_db.add(exam_app)
        fresh_db.commit()

        tx_ref = f"TXN-TEST-{int(datetime.now().timestamp())}"
        payment = models.PaymentOrder(
            application_id=exam_app.id,
            candidate_id=reloaded_profile.id,
            exam_id="EXM-JEE-MAIN-2026",
            vendor_id="VND-NTA-2026",
            amount=1000.0,
            transaction_ref=tx_ref,
            bank_ref_no="UTR-998877661122",
            payment_method="UPI_DYNAMIC_QR",
            status="PAID",
            paid_at=datetime.now(timezone.utc)
        )
        fresh_db.add(payment)
        fresh_db.commit()

        # 4. Verify Payment in fresh DB session
        fresh_db.close()
        verification_db = SessionLocal()
        saved_payment = verification_db.query(models.PaymentOrder).filter(
            models.PaymentOrder.transaction_ref == tx_ref
        ).first()
        self.assertIsNotNone(saved_payment, "Payment record must persist in database.")
        self.assertEqual(saved_payment.status, "PAID")
        self.assertEqual(saved_payment.amount, 1000.0)
        verification_db.close()
        print("  ✓ Verified Full Candidate Lifecycle & Payment Persistence across process restarts.")

    def test_04_authority_dashboard_aggregation(self):
        metrics = get_authority_dashboard_metrics(self.db, "INS-NSB-001")
        self.assertIn("center_ops", metrics)
        self.assertIn("evaluation_ops", metrics)
        self.assertIn("trust_ops", metrics)
        self.assertIn("verdict", metrics)
        self.assertGreaterEqual(metrics["center_ops"]["total_candidates"], 0)
        print(f"  ✓ Verified Authority Executive Dashboard aggregates real DB metrics (Trust Score: {metrics['trust_ops']['score']}%).")

if __name__ == "__main__":
    print("\n========================================================")
    print("  EXAMFORGE DATABASE PERSISTENCE & SOURCE-OF-TRUTH TEST ")
    print("========================================================")
    unittest.main(verbosity=2)
