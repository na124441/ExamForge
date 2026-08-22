import os
import sys
import json
from datetime import datetime, timezone, timedelta

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
import app.models as models
from app.pilot.demo_reset import reset_pilot_database
from app.pilot.demo_seed import run_pilot_seeder

def run_full_production_seed():
    print("==========================================================")
    print("  EXAMFORGE PRODUCTION DATABASE INITIALIZATION & SEEDER   ")
    print("==========================================================")

    # 1. Re-create all tables in SQLite / PostgreSQL
    print("[1/5] Creating Database Tables from SQLAlchemy Schemas...")
    Base.metadata.create_all(bind=engine)
    print("  ✓ All tables created successfully.")

    # 2. Reset pilot database state
    print("[2/5] Resetting Pilot Database Base...")
    reset_pilot_database()

    db = SessionLocal()
    try:
        # 3. Seed baseline AuthorityPilot data
        print("[3/5] Seeding Baseline Core Infrastructure...")
        run_pilot_seeder(db)

        # 4. Seed Real Vendor Organizations
        print("[4/5] Seeding Real Vendor Organizations...")
        vendors_data = [
            {
                "id": "VND-NTA-2026",
                "name": "National Testing Agency (NTA)",
                "legal_name": "National Testing Agency, Ministry of Education, Govt. of India",
                "registration_number": "GOI-NTA-2018-001",
                "tenant_slug": "nta-gov",
                "email": "exams@nta.ac.in",
                "google_oauth_key": "OAUTH2_NTA_SECURE_KEY",
                "dlt_sms_key": "DLT_NTA_EXAMFG",
                "payment_upi_id": "nta.exams@govicici",
                "payment_bank_name": "State Bank of India",
                "payment_account_number": "309182736412",
                "payment_ifsc_code": "SBIN0001842"
            },
            {
                "id": "VND-UPSC-2026",
                "name": "Union Public Service Commission (UPSC)",
                "legal_name": "Union Public Service Commission, Dholpur House, New Delhi",
                "registration_number": "GOI-UPSC-1926-001",
                "tenant_slug": "upsc-gov",
                "email": "contact@upsc.gov.in",
                "google_oauth_key": "OAUTH2_UPSC_KEY",
                "dlt_sms_key": "DLT_UPSC_EXAMFG",
                "payment_upi_id": "upsc.application@sbi",
                "payment_bank_name": "State Bank of India",
                "payment_account_number": "100293847561",
                "payment_ifsc_code": "SBIN0000691"
            },
            {
                "id": "VND-AICTE-2026",
                "name": "All India Council for Technical Education (AICTE)",
                "legal_name": "All India Council for Technical Education, Nelson Mandela Marg, New Delhi",
                "registration_number": "GOI-AICTE-1987-001",
                "tenant_slug": "aicte-gov",
                "email": "admissions@aicte-india.org",
                "google_oauth_key": "OAUTH2_AICTE_KEY",
                "dlt_sms_key": "DLT_AICTE_EXAMFG",
                "payment_upi_id": "aicte.portal@hdfcbank",
                "payment_bank_name": "HDFC Bank",
                "payment_account_number": "50200019283746",
                "payment_ifsc_code": "HDFC0000003"
            },
            {
                "id": "VND-STATE-2026",
                "name": "State Higher Education Assessment Board (SHEB)",
                "legal_name": "State Directorate of Technical Education & Higher Assessment",
                "registration_number": "STATE-SHEB-2015-092",
                "tenant_slug": "sheb-state",
                "email": "support@sheb.gov.in",
                "google_oauth_key": "OAUTH2_SHEB_KEY",
                "dlt_sms_key": "DLT_SHEB_EXAMFG",
                "payment_upi_id": "sheb.cet@axisbank",
                "payment_bank_name": "Axis Bank",
                "payment_account_number": "918020048172635",
                "payment_ifsc_code": "UTIB0000142"
            }
        ]

        for vd in vendors_data:
            existing = db.query(models.VendorOrganization).filter(models.VendorOrganization.id == vd["id"]).first()
            if not existing:
                vendor = models.VendorOrganization(
                    id=vd["id"],
                    name=vd["name"],
                    legal_name=vd["legal_name"],
                    registration_number=vd["registration_number"],
                    tenant_slug=vd["tenant_slug"],
                    email=vd["email"],
                    google_oauth_key=vd["google_oauth_key"],
                    dlt_sms_key=vd["dlt_sms_key"],
                    payment_upi_id=vd["payment_upi_id"],
                    payment_bank_name=vd["payment_bank_name"],
                    payment_account_number=vd["payment_account_number"],
                    payment_ifsc_code=vd["payment_ifsc_code"],
                    status="APPROVED"
                )
                db.add(vendor)
        db.commit()
        print("  ✓ 4 Authorized Vendor Organizations seeded.")

        # 5. Seed Comprehensive Real Examination Catalogs
        print("[5/5] Seeding Detailed Examination Catalogs & Eligibility Criteria...")
        now = datetime.now(timezone.utc)
        exams_data = [
            # NTA Exams
            {
                "id": "EXM-JEE-MAIN-2026",
                "vendor_id": "VND-NTA-2026",
                "code": "JEE-MAIN-2026",
                "title": "Joint Entrance Examination (Main) - 2026",
                "purpose": "National level examination for admission to undergraduate engineering programs (B.Tech / B.E.) at NITs, IIITs, CFTIs and eligibility screening for JEE (Advanced).",
                "category": "ENGINEERING",
                "academic_cycle": "2026-2027",
                "exam_date": "2026-05-15",
                "exam_mode": "COMPUTER_BASED_TEST",
                "duration_minutes": 180,
                "total_marks": 300.0,
                "total_questions": 90,
                "negative_marking": "+4 for correct answer, -1 for incorrect answer, 0 for unattempted",
                "fee_general": 1000.0,
                "fee_reserved": 500.0,
                "eligibility_min_qualification": "Class 12",
                "eligibility_min_percentage": 75.0,
                "eligibility_age_limit": "Candidates must have passed Class 12 in 2024, 2025, or appearing in 2026. No upper age limit.",
                "eligibility_subjects_required": "Physics, Mathematics, and one of Chemistry/Biology/Biotechnology/Technical Vocational subject",
                "syllabus_summary": "Section A (MCQ): Physics (20 Qs), Chemistry (20 Qs), Mathematics (20 Qs). Section B (Numerical): 10 Qs each (attempt any 5).",
                "shifts_json": json.dumps([
                    "Morning Shift: 09:00 AM - 12:00 PM (Reporting Time: 07:30 AM)",
                    "Afternoon Shift: 03:00 PM - 06:00 PM (Reporting Time: 01:30 PM)"
                ]),
                "status": "REGISTRATION_OPEN"
            },
            {
                "id": "EXM-NEET-UG-2026",
                "vendor_id": "VND-NTA-2026",
                "code": "NEET-UG-2026",
                "title": "National Eligibility cum Entrance Test (NEET UG) - 2026",
                "purpose": "Mandatory single all-India medical entrance test for admission to MBBS, BDS, BAMS, BHMS, and allied healthcare degree courses across all medical institutions.",
                "category": "MEDICAL",
                "academic_cycle": "2026-2027",
                "exam_date": "2026-05-24",
                "exam_mode": "OMR_PEN_PAPER",
                "duration_minutes": 200,
                "total_marks": 720.0,
                "total_questions": 200,
                "negative_marking": "+4 for correct, -1 for incorrect, 0 for unattempted",
                "fee_general": 1700.0,
                "fee_reserved": 900.0,
                "eligibility_min_qualification": "Class 12",
                "eligibility_min_percentage": 50.0,
                "eligibility_age_limit": "Minimum 17 years completed on or before 31st December 2026.",
                "eligibility_subjects_required": "Physics, Chemistry, Biology/Biotechnology and English",
                "syllabus_summary": "Physics (45 Qs / 180 Marks), Chemistry (45 Qs / 180 Marks), Botany (45 Qs / 180 Marks), Zoology (45 Qs / 180 Marks).",
                "shifts_json": json.dumps([
                    "Single National Shift: 02:00 PM - 05:20 PM (Reporting Time: 12:00 PM)"
                ]),
                "status": "REGISTRATION_OPEN"
            },
            {
                "id": "EXM-CUET-UG-2026",
                "vendor_id": "VND-NTA-2026",
                "code": "CUET-UG-2026",
                "title": "Common University Entrance Test (CUET UG) - 2026",
                "purpose": "Single-window national admission examination for undergraduate degree programs across 250+ Central, State, Deemed, and Private Universities in India.",
                "category": "APPLIED_SCIENCES",
                "academic_cycle": "2026-2027",
                "exam_date": "2026-06-10",
                "exam_mode": "COMPUTER_BASED_TEST",
                "duration_minutes": 135,
                "total_marks": 250.0,
                "total_questions": 60,
                "negative_marking": "+5 for correct, -1 for incorrect",
                "fee_general": 750.0,
                "fee_reserved": 375.0,
                "eligibility_min_qualification": "Class 12",
                "eligibility_min_percentage": 50.0,
                "eligibility_age_limit": "No age limit for CUET (UG).",
                "eligibility_subjects_required": "Language Paper + Selected Domain Specific Subjects + General Test",
                "syllabus_summary": "Section IA/IB: Languages, Section II: Domain Subjects (NCERT Class 12 Syllabus), Section III: General Mental Ability & Reasoning.",
                "shifts_json": json.dumps([
                    "Slot 1 (Morning): 08:30 AM - 10:45 AM",
                    "Slot 2 (Afternoon): 12:00 PM - 02:15 PM",
                    "Slot 3 (Evening): 03:30 PM - 05:45 PM"
                ]),
                "status": "REGISTRATION_OPEN"
            },
            # UPSC Exams
            {
                "id": "EXM-UPSC-CSE-2026",
                "vendor_id": "VND-UPSC-2026",
                "code": "UPSC-CSE-PRELIMS-2026",
                "title": "Civil Services Preliminary Examination (UPSC CSE) - 2026",
                "purpose": "All India competitive screening examination for recruitment to Indian Administrative Service (IAS), Indian Police Service (IPS), Indian Foreign Service (IFS) and Central Group A/B Services.",
                "category": "CIVIL_SERVICES",
                "academic_cycle": "2026-2027",
                "exam_date": "2026-05-31",
                "exam_mode": "OMR_PEN_PAPER",
                "duration_minutes": 240,
                "total_marks": 400.0,
                "total_questions": 180,
                "negative_marking": "One-third (0.33) of marks assigned to the question deducted for wrong answer",
                "fee_general": 100.0,
                "fee_reserved": 0.0,
                "eligibility_min_qualification": "Undergraduate",
                "eligibility_min_percentage": 50.0,
                "eligibility_age_limit": "21 to 32 years as on 1st August 2026 (relaxations applicable for reserved categories).",
                "eligibility_subjects_required": "Graduation in any discipline from a recognized University",
                "syllabus_summary": "Paper I: General Studies (100 Qs / 200 Marks / 2 Hrs). Paper II: Civil Services Aptitude Test - CSAT (80 Qs / 200 Marks / 2 Hrs, Qualifying 33%).",
                "shifts_json": json.dumps([
                    "Paper I (General Studies): 09:30 AM - 11:30 AM",
                    "Paper II (CSAT): 02:30 PM - 04:30 PM"
                ]),
                "status": "REGISTRATION_OPEN"
            },
            {
                "id": "EXM-UPSC-NDA-2026",
                "vendor_id": "VND-UPSC-2026",
                "code": "UPSC-NDA-NA-2026",
                "title": "National Defence Academy & Naval Academy Examination - 2026",
                "purpose": "National selection examination for admission to Army, Navy, and Air Force wings of National Defence Academy (NDA) and Indian Naval Academy (INAC).",
                "category": "CIVIL_SERVICES",
                "academic_cycle": "2026-2027",
                "exam_date": "2026-09-06",
                "exam_mode": "OMR_PEN_PAPER",
                "duration_minutes": 300,
                "total_marks": 900.0,
                "total_questions": 270,
                "negative_marking": "0.33 deduction for wrong answers",
                "fee_general": 100.0,
                "fee_reserved": 0.0,
                "eligibility_min_qualification": "Class 12",
                "eligibility_min_percentage": 60.0,
                "eligibility_age_limit": "Unmarried male and female candidates aged 16.5 to 19.5 years.",
                "eligibility_subjects_required": "Class 12 passed with Physics, Chemistry, and Mathematics (for Air Force/Navy) or any stream (for Army)",
                "syllabus_summary": "Mathematics (120 Qs / 300 Marks / 2.5 Hrs) + General Ability Test - English & General Knowledge (150 Qs / 600 Marks / 2.5 Hrs).",
                "shifts_json": json.dumps([
                    "Mathematics (Paper I): 10:00 AM - 12:30 PM",
                    "General Ability Test (Paper II): 02:00 PM - 04:30 PM"
                ]),
                "status": "REGISTRATION_OPEN"
            },
            # AICTE Exam
            {
                "id": "EXM-AICTE-CSAI-2026",
                "vendor_id": "VND-AICTE-2026",
                "code": "AICTE-CSAI-2026",
                "title": "National AI & Distributed Systems Fellowship Assessment - 2026",
                "purpose": "Premier national technical aptitude examination for postgraduate fellowships, doctoral scholarships, and sponsored research roles in AI, Zero-Knowledge Cryptography, and Distributed Systems.",
                "category": "IT_AI",
                "academic_cycle": "2026-2027",
                "exam_date": "2026-06-28",
                "exam_mode": "COMPUTER_BASED_TEST",
                "duration_minutes": 180,
                "total_marks": 400.0,
                "total_questions": 100,
                "negative_marking": "+4 for correct, -1 for incorrect",
                "fee_general": 1200.0,
                "fee_reserved": 600.0,
                "eligibility_min_qualification": "Undergraduate",
                "eligibility_min_percentage": 65.0,
                "eligibility_age_limit": "No upper age limit for technical fellowship assessment.",
                "eligibility_subjects_required": "B.Tech/B.E./M.Sc/MCA in Computer Science, Data Science, Mathematics, or Electrical Engineering",
                "syllabus_summary": "Part A: Mathematics & Cryptography (30 Qs), Part B: Algorithms & Distributed Architecture (35 Qs), Part C: Machine Learning & AI Security (35 Qs).",
                "shifts_json": json.dumps([
                    "Shift 1: 09:00 AM - 12:00 PM",
                    "Shift 2: 02:30 PM - 05:30 PM"
                ]),
                "status": "REGISTRATION_OPEN"
            },
            # State Assessment Board Exam
            {
                "id": "EXM-STATE-CET-2026",
                "vendor_id": "VND-STATE-2026",
                "code": "STATE-CET-2026",
                "title": "State Common Entrance Test (CET) - 2026",
                "purpose": "State-level entrance examination for admission into full-time degree courses in Engineering & Technology, Pharmacy, and Agricultural Education.",
                "category": "ENGINEERING",
                "academic_cycle": "2026-2027",
                "exam_date": "2026-07-12",
                "exam_mode": "COMPUTER_BASED_TEST",
                "duration_minutes": 180,
                "total_marks": 200.0,
                "total_questions": 150,
                "negative_marking": "No negative marking",
                "fee_general": 800.0,
                "fee_reserved": 400.0,
                "eligibility_min_qualification": "Class 12",
                "eligibility_min_percentage": 45.0,
                "eligibility_age_limit": "Candidates must hold valid State Domicile.",
                "eligibility_subjects_required": "Physics, Chemistry, Mathematics / Biology in Class 12",
                "syllabus_summary": "Mathematics (50 Qs / 100 Marks / 90 Mins), Physics & Chemistry (100 Qs / 100 Marks / 90 Mins).",
                "shifts_json": json.dumps([
                    "PCM Morning Shift: 09:00 AM - 12:00 PM",
                    "PCB Afternoon Shift: 02:00 PM - 05:00 PM"
                ]),
                "status": "REGISTRATION_OPEN"
            }
        ]

        for ed in exams_data:
            existing = db.query(models.ExamCatalog).filter(models.ExamCatalog.id == ed["id"]).first()
            if not existing:
                exam = models.ExamCatalog(
                    id=ed["id"],
                    vendor_id=ed["vendor_id"],
                    code=ed["code"],
                    title=ed["title"],
                    purpose=ed["purpose"],
                    category=ed["category"],
                    academic_cycle=ed["academic_cycle"],
                    application_start_date=now - timedelta(days=15),
                    application_end_date=now + timedelta(days=45),
                    exam_date=ed["exam_date"],
                    exam_mode=ed["exam_mode"],
                    duration_minutes=ed["duration_minutes"],
                    total_marks=ed["total_marks"],
                    total_questions=ed["total_questions"],
                    negative_marking=ed["negative_marking"],
                    fee_general=ed["fee_general"],
                    fee_reserved=ed["fee_reserved"],
                    eligibility_min_qualification=ed["eligibility_min_qualification"],
                    eligibility_min_percentage=ed["eligibility_min_percentage"],
                    eligibility_age_limit=ed["eligibility_age_limit"],
                    eligibility_subjects_required=ed["eligibility_subjects_required"],
                    syllabus_summary=ed["syllabus_summary"],
                    shifts_json=ed["shifts_json"],
                    status=ed["status"]
                )
                db.add(exam)
        db.commit()
        print("  ✓ 7 Comprehensive Real-World Examinations seeded into database.")

        # Candidate Profile
        cand_user = db.query(models.User).filter(models.User.email == "nayantsri19@gmail.com").first()
        if not cand_user:
            cand_user = models.User(
                id="USR-CAN-2026-01",
                name="Nayant Srivastava",
                email="nayantsri19@gmail.com",
                password_hash="pbkdf2_sha256_mock_hash",
                status="ACTIVE"
            )
            db.add(cand_user)
            db.commit()

        existing_profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == cand_user.id).first()
        if not existing_profile:
            profile = models.CandidateProfile(
                id="PRF-CAN-2026-01",
                user_id=cand_user.id,
                candidate_student_id="EXF-CAN-2026-8F42A1",
                full_name="Nayant Srivastava",
                email="nayantsri19@gmail.com",
                phone="+91 98765 43210",
                dob="2007-11-21",
                gender="Male",
                category="General",
                guardian_name="Anand Srivastava",
                address_line1="Flat 402, Green Park Apartments, Sector 14",
                city="New Delhi",
                district="South Delhi",
                state="Delhi",
                postal_code="110016",
                latitude=28.5492,
                longitude=77.2001,
                aadhaar_status="VERIFIED",
                aadhaar_number_masked="XXXX-XXXX-2384",
                photo_match_percent=99.4
            )
            db.add(profile)
            db.commit()

        print("==========================================================")
        print("  ✓ EXAMFORGE DATABASE SEEDING COMPLETED SUCCESSFULLY!   ")
        print("==========================================================")

    except Exception as e:
        print(f"❌ Seeding Error: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_full_production_seed()
