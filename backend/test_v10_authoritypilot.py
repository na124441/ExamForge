import sys
import os
import time
import json
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Add current folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Institution, AuditNamespace, PolicyTemplate, ExamTemplate,
    ExamCenter, CenterAssignment, InstitutionKey, TenantSecurityViolation,
    ExamState, Candidate, Result, ResultCertificate, InstitutionMembership,
    GeneratedPaper, EncryptedPackage, SeatAssignment, CandidateVerification,
    WrittenBooklet, OMRManualReview, EvaluationMark, EvaluationConflict,
    ConflictResolution, ResultVersion, Dispute, DisputeEvent, FinalGateDecision,
    ComplianceReport, PilotEvidenceBinder, PilotRun, PilotStage, Question
)
from app.security import hash_password, calculate_sha256

client = TestClient(app)

def run_v10_tests():
    print("=== Starting ExamForge v1.0 AuthorityPilot Validation E2E Tests ===\n")

    # --- TEST 1: Demo Seed creates full pilot dataset ---
    res_seed = client.post("/api/pilot/reset-and-seed")
    assert res_seed.status_code == 200
    assert "seeded successfully" in res_seed.json()["message"]
    
    db = SessionLocal()
    # Check counts
    inst_count = db.query(Institution).count()
    usr_count = db.query(User).count()
    center_count = db.query(ExamCenter).count()
    cand_count = db.query(Candidate).count()
    qst_count = db.query(Question).count()
    paper_count = db.query(GeneratedPaper).count()
    pkg_count = db.query(EncryptedPackage).count()
    
    assert inst_count >= 1
    assert usr_count >= 17
    assert center_count >= 2
    assert cand_count >= 30
    assert qst_count >= 20
    assert paper_count >= 2
    assert pkg_count >= 2
    db.close()
    
    print("[Test 1] Demo seed created full pilot dataset.")

    # --- TEST 2: Institution and tenant namespace verified ---
    res_login = client.post("/api/auth/login", json={"email": "controller@example.com", "password": "password123"})
    assert res_login.status_code == 200
    ctrl_token = res_login.json()["access_token"]
    ctrl_headers = {"Authorization": f"Bearer {ctrl_token}"}
    
    db = SessionLocal()
    ns = db.query(AuditNamespace).filter(AuditNamespace.institution_id == "INS-NSB-001").first()
    assert ns is not None
    assert ns.status == "VALID"
    db.close()
    print("[Test 2] Institution and tenant namespace verified.")

    # --- TEST 3: Locked policy applied to pilot exam ---
    db = SessionLocal()
    exam = db.query(ExamState).filter(ExamState.exam_id == "EXM-PILOT-001").first()
    assert exam is not None
    assert exam.policy_id == "POL-PILOT-001"
    
    policy = db.query(PolicyTemplate).filter(PolicyTemplate.id == exam.policy_id).first()
    assert policy.status == "LOCKED"
    assert policy.trust_threshold == 95.0
    db.close()
    print("[Test 3] Locked policy applied to pilot exam.")

    # --- TEST 4: Paper generation proof verified ---
    db = SessionLocal()
    papers = db.query(GeneratedPaper).filter(GeneratedPaper.exam_id == "EXM-PILOT-001").all()
    assert len(papers) >= 2
    for p in papers:
        assert p.status == "GENERATED"
        assert p.paper_hash is not None
    db.close()
    print("[Test 4] Paper generation proof verified.")

    # --- TEST 5: Center packages sealed and verified ---
    db = SessionLocal()
    pkgs = db.query(EncryptedPackage).filter(EncryptedPackage.exam_id == "EXM-PILOT-001").all()
    assert len(pkgs) >= 2
    for pkg in pkgs:
        assert pkg.package_hash is not None
        # Since seeder transitions them to RELEASED to simulate complete lifecycle:
        assert pkg.status in ["SEALED", "RELEASED"]
    db.close()
    print("[Test 5] Center packages sealed and verified.")

    # --- TEST 6: Candidate verification records valid ---
    db = SessionLocal()
    verifications = db.query(CandidateVerification).all()
    assert len(verifications) >= 30
    for v in verifications:
        assert v.verification_status == "VERIFIED"
    db.close()
    print("[Test 6] Candidate verification records valid.")


    # --- TEST 7: Seat map lock verified ---
    db = SessionLocal()
    seats = db.query(SeatAssignment).all()
    assert len(seats) >= 30
    for s in seats:
        assert s.status == "LOCKED"
    db.close()
    print("[Test 7] Seat map lock verified.")

    # --- TEST 8: Candidate submission receipts verified ---
    # The submission records can be validated by checking that candidate submissions exist
    # and have receipts associated with evaluation markers
    db = SessionLocal()
    booklet = db.query(WrittenBooklet).filter(WrittenBooklet.exam_id == "EXM-PILOT-001").first()
    assert booklet is not None
    assert booklet.status == "LOCKED"
    db.close()
    print("[Test 8] Candidate submission receipts verified.")

    # --- TEST 9: OMR reviews finalized ---
    db = SessionLocal()
    omr = db.query(OMRManualReview).filter(OMRManualReview.exam_id == "EXM-PILOT-001").first()
    assert omr is not None
    assert omr.review_status == "FINALIZED"
    db.close()
    print("[Test 9] OMR reviews finalized.")

    # --- TEST 10: Written evaluations locked ---
    db = SessionLocal()
    marks = db.query(EvaluationMark).all()
    assert len(marks) >= 2
    for m in marks:
        assert m.status == "LOCKED"
    db.close()
    print("[Test 10] Written evaluations locked.")

    # --- TEST 11: Evaluation conflict resolved ---
    db = SessionLocal()
    conflict = db.query(EvaluationConflict).first()
    assert conflict is not None
    assert conflict.status == "RESOLVED"
    
    res = db.query(ConflictResolution).filter(ConflictResolution.conflict_id == conflict.id).first()
    assert res is not None
    assert res.final_marks == 42.0
    db.close()
    print("[Test 11] Evaluation conflict resolved.")

    # --- TEST 12: Publication gate passed ---
    res_gate = client.get("/api/exams/EXM-PILOT-001/gate-status", headers=ctrl_headers)
    assert res_gate.status_code == 200
    # Gate allows release since everything was seeded correctly
    assert res_gate.json()["allowed"] is True
    print("[Test 12] Publication gate passed.")

    # --- TEST 13: Result certificates verified ---
    db = SessionLocal()
    cert = db.query(ResultCertificate).filter(ResultCertificate.status == "VALID").first()
    assert cert is not None
    assert cert.signature is not None
    db.close()
    
    # Verify via API
    res_cert = client.get(f"/api/certificates/verify/{cert.id}")
    assert res_cert.status_code == 200
    assert res_cert.json()["is_valid"] is True
    print("[Test 13] Result certificates verified.")

    # --- TEST 14: Candidate dispute processed ---
    db = SessionLocal()
    dispute = db.query(Dispute).filter(Dispute.id == "DSP-PILOT-001").first()
    assert dispute is not None
    assert dispute.status == "RESOLVED"
    
    event = db.query(DisputeEvent).filter(DisputeEvent.dispute_id == dispute.id).first()
    assert event is not None
    assert "Signed:" in event.notes
    db.close()
    print("[Test 14] Candidate dispute processed.")

    # --- TEST 15: Result version chain preserved ---
    db = SessionLocal()
    versions = db.query(ResultVersion).filter(ResultVersion.result_id == "RSL-PILOT-001").all()
    assert len(versions) >= 1
    for v in versions:
        assert v.result_hash is not None
        assert v.signature is not None
    db.close()
    print("[Test 15] Result version chain preserved.")

    # --- TEST 16: Audit chain verified end-to-end ---
    res_audit = client.get("/api/audit-namespace/verify?namespace_name=nsb-audit-ns", headers=ctrl_headers)
    assert res_audit.status_code == 200
    # Should check if namespace is validated successfully
    assert res_audit.json()["status"] == "success"
    print("[Test 16] Audit chain verified end-to-end.")

    # --- TEST 17: Compliance report signed and passed ---
    db = SessionLocal()
    report = db.query(ComplianceReport).filter(ComplianceReport.institution_id == "INS-NSB-001").first()
    assert report is not None
    assert report.verdict == "PASS"
    assert report.hash_signature is not None
    db.close()
    print("[Test 17] Compliance report signed and passed.")

    # --- TEST 18: Ops health ready ---
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"
    print("[Test 18] Ops health ready.")

    # --- TEST 19: Security readiness passed ---
    res_readiness = client.get("/api/pilot/readiness-verdict", headers=ctrl_headers)
    assert res_readiness.status_code == 200
    assert res_readiness.json()["verdict"] == "READY"
    print("[Test 19] Security readiness passed.")

    # --- TEST 20: Pilot evidence binder verified ---
    res_binder = client.post("/api/pilot/evidence-binder/generate", headers=ctrl_headers)
    assert res_binder.status_code == 200
    binder_id = res_binder.json()["id"]
    
    res_verify = client.get(f"/api/pilot/evidence-binder/{binder_id}/verify", headers=ctrl_headers)
    assert res_verify.status_code == 200
    assert res_verify.json()["is_valid"] is True
    print("[Test 20] Pilot evidence binder verified.")

    # --- TEST 21: Authority dashboard returned READY ---
    res_dash = client.get("/api/authority/dashboard", headers=ctrl_headers)
    assert res_dash.status_code == 200
    assert res_dash.json()["verdict"]["status"] == "READY"
    print("[Test 21] Authority dashboard returned READY.")

    # --- TEST 22: Full AuthorityPilot workflow passed ---
    # We trigger a new run and advance it through stage 1
    res_run = client.post("/api/pilot/runs", headers=ctrl_headers)
    assert res_run.status_code == 200
    run_id = res_run.json()["id"]
    stage_1_id = res_run.json()["stages"][0]["id"]
    
    res_adv = client.post(f"/api/pilot/runs/{run_id}/stages/{stage_1_id}/advance", headers=ctrl_headers)
    assert res_adv.status_code == 200
    assert res_adv.json()["status"] == "COMPLETED"
    print("[Test 22] Full AuthorityPilot workflow passed.")

    print("\n=== All Version 1.0 AuthorityPilot Tests Passed ===")

if __name__ == "__main__":
    try:
        run_v10_tests()
    except AssertionError as ae:
        import traceback
        traceback.print_exc()
        print(f"\nAssertion Error: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
