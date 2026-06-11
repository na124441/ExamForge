import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.security import hash_password, calculate_sha256
from app.certificates.certificate_signer import sign_certificate_hash
from app.written.page_hashing import compute_booklet_hash
from app.database import SessionLocal
from app.models import (
    User, Institution, InstitutionMembership, PolicyTemplate, ExamTemplate,
    ExamCenter, CenterAssignment, InstitutionKey, AuditNamespace, ExamState,
    Question, GeneratedPaper, EncryptedPackage, Candidate, SeatAssignment, CandidateVerification,
    WrittenBooklet, WrittenPage, AnonymousCopy, Rubric, RubricCriterion,
    EvaluationAssignment, EvaluationDraft, EvaluationMark, EvaluationLock,
    DoubleEvaluation, EvaluationConflict, ConflictResolution, OMRManualReview,
    Result, ResultCertificate, Dispute, DisputeEvent, DisputeNote, EvidencePacket,
    EvidencePacketSection, ResultVersion, InstitutionReport, ReportSection,
    ThreatModel, SecurityAsset, SecurityHardeningCheck, AccessReviewCycle,
    SecurityIncident, ComplianceReport, ComplianceReportSection, PentestSimulation,
    FinalGateDecision, AuditLog, DemoSeedRun, OMRScan
)

def run_pilot_seeder(db: Session):
    print("[SEED] Seeding v1.0 AuthorityPilot database...")

    # 1. Create default Institution
    inst = Institution(
        id="INS-NSB-001",
        name="National Scholarship Board",
        institution_type="GOVERNMENT_EXAM_BODY",
        tenant_slug="nsb",
        deployment_mode="SAAS",
        data_region="IN"
    )
    db.add(inst)
    db.commit()

    # 2. Seed Users
    # 1 admin, 1 controller, 4 center officers, 4 invigilators, 5 evaluators, 1 auditor, 1 dispute officer
    users_data = [
        {"email": "platform_admin@example.com", "name": "Platform Super Admin", "role": "PLATFORM_SUPER_ADMIN"},
        {"email": "controller@example.com", "name": "Exam Controller", "role": "CONTROLLER"},
        {"email": "officer@example.com", "name": "Primary Center Officer", "role": "OFFICER"},
        {"email": "officer2@example.com", "name": "Officer Beta", "role": "OFFICER"},
        {"email": "officer3@example.com", "name": "Officer Gamma", "role": "OFFICER"},
        {"email": "officer4@example.com", "name": "Officer Delta", "role": "OFFICER"},
        {"email": "invigilator@example.com", "name": "Primary Invigilator", "role": "INVIGILATOR"},
        {"email": "invigilator2@example.com", "name": "Invigilator Beta", "role": "INVIGILATOR"},
        {"email": "invigilator3@example.com", "name": "Invigilator Gamma", "role": "INVIGILATOR"},
        {"email": "invigilator4@example.com", "name": "Invigilator Delta", "role": "INVIGILATOR"},
        {"email": "evaluator@example.com", "name": "Lead Evaluator", "role": "EVALUATOR"},
        {"email": "evaluator2@example.com", "name": "Evaluator Beta", "role": "EVALUATOR"},
        {"email": "evaluator3@example.com", "name": "Evaluator Gamma", "role": "EVALUATOR"},
        {"email": "evaluator4@example.com", "name": "Evaluator Delta", "role": "EVALUATOR"},
        {"email": "evaluator5@example.com", "name": "Evaluator Epsilon", "role": "EVALUATOR"},
        {"email": "auditor@example.com", "name": "System Auditor", "role": "AUDITOR"},
        {"email": "dispute_officer@example.com", "name": "Dispute Officer", "role": "DISPUTE_OFFICER"},
    ]

    users = {}
    for ud in users_data:
        u = User(
            name=ud["name"],
            email=ud["email"],
            password_hash=hash_password("password123"),
            status="ACTIVE",
            institution_id="INS-NSB-001"
        )
        db.add(u)
        db.commit()
        users[ud["email"]] = u

        # Add membership
        memb = InstitutionMembership(
            user_id=u.id,
            institution_id="INS-NSB-001",
            role=ud["role"]
        )
        db.add(memb)
        db.commit()

    # 3. Seed Keyspace and Namespaces
    pub_key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0y1e"
    priv_key = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBA"
    
    signing_key = InstitutionKey(
        id="KEY-SIG-001",
        institution_id="INS-NSB-001",
        key_type="CERTIFICATE_SIGNING",
        public_key=pub_key,
        private_key=priv_key,
        status="ACTIVE"
    )
    db.add(signing_key)
    
    package_key = InstitutionKey(
        id="KEY-PKG-001",
        institution_id="INS-NSB-001",
        key_type="PACKAGE_DECRYPTION",
        public_key=pub_key,
        private_key=priv_key,
        status="ACTIVE"
    )
    db.add(package_key)

    ns = AuditNamespace(
        id="NS-NSB-001",
        institution_id="INS-NSB-001",
        status="VALID"
    )
    db.add(ns)
    db.commit()

    # 4. Seed Policy Template
    policy = PolicyTemplate(
        id="POL-PILOT-001",
        institution_id="INS-NSB-001",
        name="National Scholarship Exam Integrity Policy",
        trust_threshold=95.0,
        requires_double_evaluation=True,
        requires_dual_package_release=True,
        certificate_required=True,
        audit_report_required=True,
        status="LOCKED"
    )
    db.add(policy)
    db.commit()

    # 5. Seed Exam Template
    exam_tmpl = ExamTemplate(
        id="TMP-PILOT-001",
        institution_id="INS-NSB-001",
        name="National Scholarship Hybrid Blueprint",
        exam_type="HYBRID",
        default_duration_minutes=180,
        default_sections=json.dumps([{"name": "MCQ", "weight": 50}, {"name": "Written", "weight": 50}]),
        default_policy_id="POL-PILOT-001",
        blueprint_schema=json.dumps({
            "mcq_sections": 1,
            "mcq_count": 20,
            "written_sections": 1,
            "written_pages": 4,
            "total_marks": 100
        }),
        status="LOCKED"
    )
    db.add(exam_tmpl)
    db.commit()

    # 6. Seed Exam Center
    centers = [
        ExamCenter(id="CNT-001", institution_id="INS-NSB-001", name="Delhi Central Examination Hub", city="New Delhi", state="Delhi", capacity=100, rooms=5, device_count=100),
        ExamCenter(id="CNT-002", institution_id="INS-NSB-001", name="Mumbai Tech Institute Center", city="Mumbai", state="Maharashtra", capacity=100, rooms=5, device_count=100)
    ]
    for c in centers:
        db.add(c)
    db.commit()

    # 7. Seed Exam State
    exam = ExamState(
        exam_id="EXM-PILOT-001",
        institution_id="INS-NSB-001",
        policy_id="POL-PILOT-001",
        template_id="TMP-PILOT-001",
        state="RESULT_PUBLISHED",
        scheduled_start=datetime.now(timezone.utc) - timedelta(days=1),
        scheduled_end=datetime.now(timezone.utc) - timedelta(days=1, hours=22)
    )
    db.add(exam)
    db.commit()

    # 8. Seed Questions (20 MCQ Questions)
    questions = []
    subjects = ["Mathematics", "Science", "English", "Social Studies", "General Knowledge"]
    for i in range(1, 21):
        q = Question(
            id=f"QST-PILOT-{i:03d}",
            subject=subjects[(i - 1) % len(subjects)],
            topic=f"Topic {i}",
            difficulty="MEDIUM",
            question_type="MCQ_SINGLE",
            marks=2,
            encrypted_content=calculate_sha256(f"question_content_{i}"),
            encrypted_answer=calculate_sha256(f"answer_{i}"),
            status="APPROVED",
            author_id="USR-CTRL-001"
        )
        db.add(q)
        questions.append(q)
    db.commit()


    # 9. Seed Papers & Packages
    paper_1 = GeneratedPaper(
        id="PPR-PILOT-001",
        exam_id="EXM-PILOT-001",
        blueprint_id=None,
        set_id="SET-A",
        question_order="[]",
        option_order_map="{}",
        difficulty_score=1.0,
        paper_hash=calculate_sha256("set_a_content"),
        status="GENERATED"
    )
    paper_2 = GeneratedPaper(
        id="PPR-PILOT-002",
        exam_id="EXM-PILOT-001",
        blueprint_id=None,
        set_id="SET-B",
        question_order="[]",
        option_order_map="{}",
        difficulty_score=1.0,
        paper_hash=calculate_sha256("set_b_content"),
        status="GENERATED"
    )
    db.add(paper_1)
    db.add(paper_2)
    db.commit()

    package_1 = EncryptedPackage(
        id="PKG-PILOT-001",
        exam_id="EXM-PILOT-001",
        paper_id="PPR-PILOT-001",
        center_id="CNT-001",
        encrypted_payload="encrypted_payload_delhi",
        package_hash=calculate_sha256("delhi_pkg"),
        valid_from=datetime.now(timezone.utc) - timedelta(hours=2),
        valid_until=datetime.now(timezone.utc) + timedelta(hours=2),
        status="RELEASED"
    )
    package_2 = EncryptedPackage(
        id="PKG-PILOT-002",
        exam_id="EXM-PILOT-001",
        paper_id="PPR-PILOT-002",
        center_id="CNT-002",
        encrypted_payload="encrypted_payload_mumbai",
        package_hash=calculate_sha256("mumbai_pkg"),
        valid_from=datetime.now(timezone.utc) - timedelta(hours=2),
        valid_until=datetime.now(timezone.utc) + timedelta(hours=2),
        status="RELEASED"
    )
    db.add(package_1)
    db.add(package_2)
    db.commit()

    # 10. Seed 30 Candidates
    candidates = []
    for i in range(1, 31):
        center_id = "CNT-001" if i <= 15 else "CNT-002"
        c = Candidate(
            id=f"CND-PILOT-{i:03d}",
            exam_id="EXM-PILOT-001",
            name=f"Scholarship Candidate {i}",
            registration_number=f"REG-NSB-{i:03d}",
            anonymous_id=f"ANON-NSB-{i:03d}",
            status="VERIFIED"
        )
        db.add(c)
        candidates.append(c)
        db.commit()

        # Seat assignment
        seat = SeatAssignment(
            exam_id="EXM-PILOT-001",
            candidate_id=c.id,
            center_id=center_id,
            seat_id=f"Room 101-S-{i:02d}",
            status="LOCKED",
            assignment_hash=calculate_sha256(f"{c.id}|{center_id}|S-{i:02d}"),
            locked=True
        )
        db.add(seat)

        # Candidate verification log
        verif = CandidateVerification(
            candidate_id=c.id,
            anonymous_id=c.anonymous_id,
            exam_id="EXM-PILOT-001",
            center_id=center_id,
            seat_id=f"Room 101-S-{i:02d}",
            verified_by=users["officer@example.com" if center_id == "CNT-001" else "officer2@example.com"].id,
            verification_status="VERIFIED",
            verification_hash=calculate_sha256(f"{c.id}|{center_id}|BIOMETRIC_MOCK")
        )
        db.add(verif)
    db.commit()

    # 11. Seed Answer Booklets, Rubrics, Marks, Conflicts
    # Let's seed written booklets for evaluators to score
    rubric = Rubric(
        id="RBC-PILOT-001",
        exam_id="EXM-PILOT-001",
        question_id="QST-PILOT-001",
        max_marks=50,
        status="LOCKED"
    )
    db.add(rubric)
    db.commit()

    criterion = RubricCriterion(
        id="CRT-PILOT-001",
        rubric_id=rubric.id,
        title="Analytical depth",
        max_marks=50
    )
    db.add(criterion)
    db.commit()

    # We will score candidate 1
    scan = OMRScan(
        id="SCN-PILOT-001",
        candidate_id="CND-PILOT-001",
        exam_id="EXM-PILOT-001",
        image_hash=calculate_sha256("omr_scan_001"),
        detected_answers=json.dumps({"1": "AB"}),
        confidence_report=json.dumps({"1": 0.95}),
        status="PROCESSED"
    )
    db.add(scan)
    db.commit()

    # Add manual OMR review
    omr_review = OMRManualReview(
        id="OMR-PILOT-001",
        scan_id=scan.id,
        exam_id="EXM-PILOT-001",
        candidate_id="CND-PILOT-001",
        question_no=1,
        detected_answer="AB",
        confidence=0.95,
        reviewer_final_answer="A",
        reviewed_by=users["officer@example.com"].id,
        review_status="FINALIZED",
        review_hash=calculate_sha256("OMR-PILOT-001|A")
    )
    db.add(omr_review)
    db.commit()

    # Seed Written Booklet for Candidate 1
    page_hash = calculate_sha256("page_1_data")
    booklet = WrittenBooklet(
        id="BKL-PILOT-001",
        candidate_id="CND-PILOT-001",
        exam_id="EXM-PILOT-001",
        anonymous_id="ANON-NSB-001",
        center_id="CNT-001",
        total_pages=1,
        booklet_hash=compute_booklet_hash([page_hash]),
        status="LOCKED"
    )
    db.add(booklet)
    db.commit()

    page = WrittenPage(
        id="PGE-PILOT-001",
        booklet_id=booklet.id,
        page_number=1,
        image_hash=calculate_sha256("page_1_image"),
        image_url="/storage/booklets/cnd-001-p1.png",
        page_hash=page_hash
    )
    db.add(page)
    db.commit()

    copy = AnonymousCopy(
        id="CPY-PILOT-001",
        booklet_id=booklet.id,
        anonymous_id="ANON-NSB-001",
        exam_id="EXM-PILOT-001",
        status="ASSIGNED"
    )
    db.add(copy)
    db.commit()

    # Evaluators Double Marking
    eval_1 = EvaluationAssignment(
        id="EVA-PILOT-001",
        anonymous_id=copy.anonymous_id,
        evaluator_id=users["evaluator@example.com"].id,
        exam_id="EXM-PILOT-001",
        status="COMPLETED"
    )
    eval_2 = EvaluationAssignment(
        id="EVA-PILOT-002",
        anonymous_id=copy.anonymous_id,
        evaluator_id=users["evaluator2@example.com"].id,
        exam_id="EXM-PILOT-001",
        status="COMPLETED"
    )
    db.add(eval_1)
    db.add(eval_2)
    db.commit()

    # Marks with mismatch (Conflict!)
    mark_1 = EvaluationMark(
        id="MRK-PILOT-001",
        anonymous_id=copy.anonymous_id,
        question_id="QST-PILOT-001",
        evaluator_id=users["evaluator@example.com"].id,
        criteria_scores=json.dumps({criterion.id: 45.0}),
        total_marks=45.0,
        rubric_id=rubric.id,
        evaluation_hash=calculate_sha256("MRK-PILOT-001|45"),
        status="LOCKED"
    )
    mark_2 = EvaluationMark(
        id="MRK-PILOT-002",
        anonymous_id=copy.anonymous_id,
        question_id="QST-PILOT-001",
        evaluator_id=users["evaluator2@example.com"].id,
        criteria_scores=json.dumps({criterion.id: 35.0}),
        total_marks=35.0, # 10 mark variance!
        rubric_id=rubric.id,
        evaluation_hash=calculate_sha256("MRK-PILOT-002|35"),
        status="LOCKED"
    )
    db.add(mark_1)
    db.add(mark_2)
    db.commit()

    conflict = EvaluationConflict(
        id="CFL-PILOT-001",
        anonymous_id=copy.anonymous_id,
        question_id="QST-PILOT-001",
        evaluator_a=users["evaluator@example.com"].id,
        marks_a=45.0,
        evaluator_b=users["evaluator2@example.com"].id,
        marks_b=35.0,
        variance=10.0,
        status="RESOLVED",
        resolution_required=True
    )
    db.add(conflict)
    db.commit()

    resolution = ConflictResolution(
        id="RES-PILOT-001",
        conflict_id=conflict.id,
        resolved_by=users["controller@example.com"].id,
        resolution_policy="SENIOR_DECISION",
        final_marks=42.0,
        notes="Senior review finalized marks at 42."
    )
    db.add(resolution)
    db.commit()

    # 12. Seed results and certificates
    # Let's seed a result record for Candidate 1
    payload_res = "EXM-PILOT-001|CND-PILOT-001|92.0|PASS"
    res_hash = calculate_sha256(payload_res)
    cert_payload_hash = calculate_sha256(f"RSL-PILOT-001|ANON-NSB-001|EXM-PILOT-001|{res_hash}")
    sig_res = sign_certificate_hash(cert_payload_hash)

    result = Result(
        id="RSL-PILOT-001",
        exam_id="EXM-PILOT-001",
        candidate_id="CND-PILOT-001",
        marks_obtained=92.0,
        max_marks=100.0,
        result_hash=res_hash,
        status="PUBLISHED"
    )
    db.add(result)
    db.commit()

    # Certificate
    cert = ResultCertificate(
        id="CRT-PILOT-001",
        result_id=result.id,
        candidate_anonymous_id="ANON-NSB-001",
        exam_id="EXM-PILOT-001",
        result_hash=res_hash,
        certificate_hash=cert_payload_hash,
        signature=sig_res,
        verification_url="/api/certificates/verify/CRT-PILOT-001",
        status="VALID"
    )
    db.add(cert)
    db.commit()

    # Versioning
    ver_1 = ResultVersion(
        id="VER-PILOT-001",
        result_id=result.id,
        version_number=1,
        previous_result_hash=None,
        new_result_hash=res_hash,
        change_reason="Initial publication",
        changed_by=users["controller@example.com"].id,
        signature=sig_res,
        created_at=datetime.now(timezone.utc) - timedelta(hours=2)
    )
    db.add(ver_1)
    db.commit()

    # 13. Seed Dispute
    dispute = Dispute(
        id="DSP-PILOT-001",
        exam_id="EXM-PILOT-001",
        result_id=result.id,
        candidate_id="CND-PILOT-001",
        anonymous_id="ANON-NSB-001",
        dispute_type="MARKS_REVIEW",
        description="My marks mismatch analytical depth expectation.",
        status="RESOLVED"
    )
    db.add(dispute)
    db.commit()

    dispute_event = DisputeEvent(
        id="DEV-PILOT-001",
        dispute_id=dispute.id,
        action="DECISION_RECORDED",
        actor_id=users["dispute_officer@example.com"].id,
        from_status="UNDER_REVIEW",
        to_status="RESOLVED",
        notes="Decision: Revised score from 90 to 92. Signed: dispute_officer@example.com"
    )
    db.add(dispute_event)
    db.commit()

    # 14. Seed Redacted Evidence Packet
    packet = EvidencePacket(
        id="PKT-PILOT-001",
        exam_id="EXM-PILOT-001",
        result_id=result.id,
        anonymous_id="ANON-NSB-001",
        redaction_level="CANDIDATE_SAFE",
        packet_hash=calculate_sha256(json.dumps({}, sort_keys=True)),
        signature=sign_certificate_hash(calculate_sha256(json.dumps({}, sort_keys=True)))
    )
    db.add(packet)
    db.commit()

    # 15. Seed Threat Model & Incident
    threat = ThreatModel(
        id="THR-PILOT-001",
        institution_id="INS-NSB-001",
        threat_id="THR-001",
        category="QUESTION_BANK_LEAKAGE",
        asset="QuestionBank",
        attack_vector="SQL Injection on bank endpoint",
        impact="CRITICAL",
        likelihood="MEDIUM",
        mitigation=json.dumps(["ORM binding", "WAF"]),
        status="MITIGATED"
    )
    db.add(threat)

    incident = SecurityIncident(
        id="INC-PILOT-001",
        institution_id="INS-NSB-001",
        incident_type="KEY_COMPROMISE",
        severity="P0",
        status="RESOLVED",
        description="Rotated compromised key.",
        created_at=datetime.now(timezone.utc) - timedelta(hours=5),
        resolved_at=datetime.now(timezone.utc) - timedelta(hours=4)
    )
    db.add(incident)

    hardening = SecurityHardeningCheck(
        id="HRD-PILOT-001",
        institution_id="INS-NSB-001",
        check_type="OWASP_SECURITY_HEADERS",
        status="PASSED",
        details="SecurityHeadersMiddleware active."
    )
    db.add(hardening)
    db.commit()

    # 16. Seed Audit Log events
    previous_hash = "0" * 64
    for act in ["SETUP_EXAM", "BLUEPRINT_LOCK", "PAPER_GENERATION", "PACKAGE_SEAL", "PUBLISH_RESULTS"]:
        payload_data = json.dumps({"info": f"Pilot run audit event {act}"})
        payload_hash = calculate_sha256(payload_data)
        current_hash = calculate_sha256(f"controller@example.com|{act}|{payload_hash}|{previous_hash}")
        evt = AuditLog(
            actor_id="controller@example.com",
            action=act,
            resource_type="Exam",
            resource_id="EXM-PILOT-001",
            payload_hash=payload_hash,
            previous_hash=previous_hash,
            current_hash=current_hash
        )
        db.add(evt)
        previous_hash = current_hash
    db.commit()

    # 17. Seed Final Gate Decision
    payload_gate = "EXM-PILOT-001|97|PUBLISH_ALLOWED"
    gate_hash = calculate_sha256(payload_gate)
    gate_sig = sign_certificate_hash(gate_hash)

    gate_dec = FinalGateDecision(
        id="GTE-PILOT-001",
        exam_id="EXM-PILOT-001",
        institution_id="INS-NSB-001",
        release_allowed=True,
        trust_score=97,
        required_threshold=95,
        security_readiness="PASS",
        ops_status="READY",
        audit_chain="VALID",
        final_verdict="PUBLISH_ALLOWED",
        signed_by="INS-NSB-001-signing-key",
        gate_hash=gate_hash,
        created_at=datetime.now(timezone.utc) - timedelta(hours=3)
    )
    db.add(gate_dec)
    db.commit()

    # 18. Seed Compliance Report
    payload_report = "REP-PILOT-001|97|PASS|controller@example.com"
    report_hash = calculate_sha256(payload_report)
    report_sig = sign_certificate_hash(report_hash)

    report = ComplianceReport(
        id="REP-PILOT-001",
        institution_id="INS-NSB-001",
        exam_id="EXM-PILOT-001",
        readiness_score=97,
        verdict="PASS",
        hash_signature=report_sig,
        created_by=users["controller@example.com"].id
    )
    db.add(report)
    db.commit()

    rep_sec_1 = ComplianceReportSection(
        report_id=report.id,
        section_name="Threat Model Registry",
        status="PASSED",
        details="All threats fully mitigated."
    )
    rep_sec_2 = ComplianceReportSection(
        report_id=report.id,
        section_name="OWASP API Hardening",
        status="PASSED",
        details="CORS rules and CSP headers verified active."
    )
    db.add(rep_sec_1)
    db.add(rep_sec_2)
    db.commit()

    # Record seeder run
    seed_run = DemoSeedRun(
        id="SDR-PILOT-001",
        status="SUCCESS",
        summary="Successfully seeded National Scholarship Board authority demo dataset."
    )
    db.add(seed_run)
    db.commit()

    print("[SEED] Seeding v1.0 AuthorityPilot database completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        run_pilot_seeder(db)
    finally:
        db.close()
