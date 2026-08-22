import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="CANDIDATE")
    institution_id = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    authz_version = Column(Integer, default=1, nullable=False)
    assigned_roles = Column(Text, default="[]", nullable=True) # JSON array of allowed roles
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String, nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    difficulty = Column(String, nullable=False) # EASY, MEDIUM, HARD
    question_type = Column(String, nullable=False) # MCQ_SINGLE, WRITTEN
    marks = Column(Integer, nullable=False)
    encrypted_content = Column(Text, nullable=False) # Ciphertext of content JSON
    encrypted_answer = Column(Text, nullable=False) # Ciphertext of answer JSON
    status = Column(String, default="DRAFT") # DRAFT, APPROVED
    author_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PaperBlueprint(Base):
    __tablename__ = "paper_blueprints"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=True)
    total_marks = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    subject_distribution = Column(Text, nullable=False) # JSON block
    difficulty_distribution = Column(Text, nullable=False) # JSON block
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GeneratedPaper(Base):
    __tablename__ = "generated_papers"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    blueprint_id = Column(String, ForeignKey("paper_blueprints.id"), nullable=True)
    set_id = Column(String, nullable=False) # A, B, C...
    question_order = Column(Text, nullable=False) # JSON list of IDs
    option_order_map = Column(Text, nullable=False) # JSON map of QST-ID -> options
    difficulty_score = Column(Float, nullable=True)
    paper_hash = Column(String, nullable=False)
    status = Column(String, default="GENERATED") # GENERATED, LOCKED, ENCRYPTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EncryptedPackage(Base):
    __tablename__ = "encrypted_packages"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    paper_id = Column(String, ForeignKey("generated_papers.id"), nullable=True)
    center_id = Column(String, nullable=False)
    encrypted_payload = Column(Text, nullable=False) # AES encrypted payload
    package_hash = Column(String, nullable=False)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="SEALED") # SEALED, RELEASED, REVOKED
    released_by = Column(String, nullable=True)
    release_signature = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    registration_number = Column(String, unique=True, nullable=False)
    anonymous_id = Column(String, unique=True, nullable=False)
    status = Column(String, default="VERIFIED") # VERIFIED, COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CandidateAnswerEvent(Base):
    __tablename__ = "candidate_answer_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    exam_id = Column(String, nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    event_type = Column(String, nullable=False) # ANSWER_SAVED, SUBMITTED
    selected_answer = Column(Text, nullable=True)
    previous_event_hash = Column(String, nullable=True)
    current_event_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OMRScan(Base):
    __tablename__ = "omr_scans"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    exam_id = Column(String, nullable=False)
    image_hash = Column(String, nullable=False)
    detected_answers = Column(Text, nullable=False) # JSON mock
    confidence_report = Column(Text, nullable=False) # JSON mock
    status = Column(String, default="PROCESSED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WrittenPage(Base):
    __tablename__ = "written_pages"

    id = Column(String, primary_key=True, default=generate_uuid)
    booklet_id = Column(String, nullable=False)
    page_number = Column(Integer, nullable=False)
    image_hash = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    page_hash = Column(String, nullable=True)
    upload_status = Column(String, default="LOCKED") # PENDING, LOCKED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    anonymous_id = Column(String, nullable=False)
    evaluator_id = Column(String, ForeignKey("users.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    marks_awarded = Column(Float, nullable=False)
    max_marks = Column(Float, nullable=False)
    evaluation_hash = Column(String, nullable=False)
    status = Column(String, default="LOCKED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Result(Base):
    __tablename__ = "results"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, nullable=False)
    status = Column(String, default="VERIFIED") # VERIFIED, BLOCKED
    result_hash = Column(String, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

class AIEvaluationInsight(Base):
    __tablename__ = "ai_evaluation_insights"

    id = Column(String, primary_key=True, default=generate_uuid)
    evaluation_id = Column(String, ForeignKey("evaluations.id"), nullable=True)
    ocr_extracted_text = Column(Text, nullable=True)
    suggested_marks = Column(Float, nullable=True)
    rubric_mismatch_flags = Column(Text, nullable=True) # JSON list
    plagiarism_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=False)
    payload_hash = Column(String, nullable=False)
    previous_hash = Column(String, nullable=False)
    current_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RiskSimulation(Base):
    __tablename__ = "risk_simulations"

    id = Column(String, primary_key=True, default=generate_uuid)
    vector = Column(String, nullable=False) # "early_release", "package_mismatch", "seat_change", "omr_swap", "db_tamper"
    details = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExamState(Base):
    __tablename__ = "exam_states"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, unique=True, nullable=False)
    state = Column(String, default="DRAFT") # e.g. DRAFT, CONFIG_LOCKED, PAPER_GENERATED, etc.
    policy_id = Column(String, ForeignKey("policy_templates.id"), nullable=True)
    institution_id = Column(String, index=True, nullable=True)
    template_id = Column(String, nullable=True)
    scheduled_start = Column(DateTime(timezone=True), nullable=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CandidateVerification(Base):
    __tablename__ = "candidate_verifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    anonymous_id = Column(String, nullable=False)
    exam_id = Column(String, nullable=False)
    center_id = Column(String, nullable=False)
    seat_id = Column(String, nullable=True)
    verification_status = Column(String, default="VERIFIED") # VERIFIED, FAILED, SUSPICIOUS
    verified_by = Column(String, ForeignKey("users.id"), nullable=False)
    verification_hash = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class SeatAssignment(Base):
    __tablename__ = "seat_assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    center_id = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    seat_id = Column(String, nullable=False)
    status = Column(String, default="ASSIGNED") # ASSIGNED, VERIFIED, ABSENT, FLAGGED
    assignment_hash = Column(String, nullable=False)
    locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    center_id = Column(String, nullable=False)
    reported_by = Column(String, ForeignKey("users.id"), nullable=False)
    incident_type = Column(String, nullable=False) # e.g. SUSPICIOUS_BEHAVIOR, LATE_ENTRY, OMR_DAMAGE, etc.
    severity = Column(String, nullable=False) # e.g. INFO, LOW, MEDIUM, HIGH, P0_CRITICAL
    description = Column(Text, nullable=True)
    evidence_hash = Column(String, nullable=True)
    status = Column(String, default="OPEN") # OPEN, RESOLVED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)

class WrittenBooklet(Base):
    __tablename__ = "written_booklets"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    anonymous_id = Column(String, unique=True, nullable=False)
    center_id = Column(String, nullable=False)
    total_pages = Column(Integer, nullable=False)
    booklet_hash = Column(String, nullable=False)
    status = Column(String, default="SCANNED") # SCANNED, LOCKED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AnonymousCopy(Base):
    __tablename__ = "anonymous_copies"

    id = Column(String, primary_key=True, default=generate_uuid)
    anonymous_id = Column(String, unique=True, nullable=False)
    booklet_id = Column(String, ForeignKey("written_booklets.id"), nullable=False)
    exam_id = Column(String, nullable=False)
    assigned_evaluator_id = Column(String, ForeignKey("users.id"), nullable=True)
    identity_visible = Column(Boolean, default=False)
    status = Column(String, default="ANONYMIZED") # ANONYMIZED, ASSIGNED, EVALUATING, COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    max_marks = Column(Float, nullable=False)
    status = Column(String, default="DRAFT") # DRAFT, LOCKED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RubricCriterion(Base):
    __tablename__ = "rubric_criteria"

    id = Column(String, primary_key=True, default=generate_uuid)
    rubric_id = Column(String, ForeignKey("rubrics.id"), nullable=False)
    title = Column(String, nullable=False)
    max_marks = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EvaluationAssignment(Base):
    __tablename__ = "evaluation_assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    anonymous_id = Column(String, nullable=False)
    evaluator_id = Column(String, ForeignKey("users.id"), nullable=False)
    exam_id = Column(String, nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="ASSIGNED") # ASSIGNED, COMPLETED, REASSIGNED
    reassigned_from = Column(String, nullable=True)
    reassignment_reason = Column(Text, nullable=True)

class EvaluationDraft(Base):
    __tablename__ = "evaluation_drafts"

    id = Column(String, primary_key=True, default=generate_uuid)
    anonymous_id = Column(String, nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    evaluator_id = Column(String, ForeignKey("users.id"), nullable=False)
    criteria_scores = Column(Text, nullable=False) # JSON string mapping criterion_id -> Float
    total_marks = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class EvaluationMark(Base):
    __tablename__ = "evaluation_marks"

    id = Column(String, primary_key=True, default=generate_uuid)
    anonymous_id = Column(String, nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    evaluator_id = Column(String, ForeignKey("users.id"), nullable=False)
    criteria_scores = Column(Text, nullable=False) # JSON string mapping criterion_id -> Float
    total_marks = Column(Float, nullable=False)
    rubric_id = Column(String, ForeignKey("rubrics.id"), nullable=False)
    notes = Column(Text, nullable=True)
    evaluation_hash = Column(String, nullable=False)
    status = Column(String, default="SUBMITTED") # SUBMITTED, LOCKED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EvaluationLock(Base):
    __tablename__ = "evaluation_locks"

    id = Column(String, primary_key=True, default=generate_uuid)
    evaluation_id = Column(String, ForeignKey("evaluation_marks.id"), nullable=False)
    anonymous_id = Column(String, nullable=False)
    marks_hash = Column(String, nullable=False)
    locked_by = Column(String, ForeignKey("users.id"), nullable=False)
    locked_at = Column(DateTime(timezone=True), server_default=func.now())
    signature = Column(String, nullable=False)
    status = Column(String, default="LOCKED")

class DoubleEvaluation(Base):
    __tablename__ = "double_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    anonymous_id = Column(String, nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    evaluator_a = Column(String, ForeignKey("users.id"), nullable=False)
    evaluator_b = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="ASSIGNED") # ASSIGNED, COMPLETED

class EvaluationConflict(Base):
    __tablename__ = "evaluation_conflicts"

    id = Column(String, primary_key=True, default=generate_uuid)
    anonymous_id = Column(String, nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    evaluator_a = Column(String, ForeignKey("users.id"), nullable=False)
    marks_a = Column(Float, nullable=False)
    evaluator_b = Column(String, ForeignKey("users.id"), nullable=False)
    marks_b = Column(Float, nullable=False)
    variance = Column(Float, nullable=False)
    status = Column(String, default="OPEN") # OPEN, RESOLVED, SENIOR_REVIEW
    resolution_required = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ConflictResolution(Base):
    __tablename__ = "conflict_resolutions"

    id = Column(String, primary_key=True, default=generate_uuid)
    conflict_id = Column(String, ForeignKey("evaluation_conflicts.id"), nullable=False)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=False)
    resolved_at = Column(DateTime(timezone=True), server_default=func.now())
    resolution_policy = Column(String, nullable=False) # e.g. AVERAGE, SENIOR_DECISION, THIRD_EVALUATION
    final_marks = Column(Float, nullable=False)
    notes = Column(Text, nullable=False)

class SeniorReview(Base):
    __tablename__ = "senior_reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    conflict_id = Column(String, ForeignKey("evaluation_conflicts.id"), nullable=False)
    senior_evaluator_id = Column(String, ForeignKey("users.id"), nullable=False)
    final_marks = Column(Float, nullable=False)
    decision_notes = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OMRManualReview(Base):
    __tablename__ = "omr_manual_reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    scan_id = Column(String, ForeignKey("omr_scans.id"), nullable=False)
    exam_id = Column(String, nullable=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    question_no = Column(Integer, nullable=False)
    detected_answer = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    reviewer_final_answer = Column(String, nullable=True)
    review_status = Column(String, default="PENDING") # PENDING, LOCKED
    review_hash = Column(String, nullable=True)
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MarksChainEvent(Base):
    __tablename__ = "marks_chain_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anonymous_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False) # MARKS_LOCKED, CONFLICT_RESOLVED, OMR_REVIEW_LOCKED
    details = Column(Text, nullable=False)
    previous_hash = Column(String, nullable=False)
    current_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EvaluatorMetric(Base):
    __tablename__ = "evaluator_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    evaluator_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    total_assigned = Column(Integer, default=0)
    total_completed = Column(Integer, default=0)
    average_marks_given = Column(Float, default=0.0)
    conflict_rate = Column(Float, default=0.0)
    average_speed_seconds = Column(Float, default=0.0)
    lock_delay_seconds = Column(Float, default=0.0)
    reopen_requests = Column(Integer, default=0)

class ResultCertificate(Base):
    __tablename__ = "result_certificates"

    id = Column(String, primary_key=True, default=generate_uuid)
    result_id = Column(String, ForeignKey("results.id"), nullable=False)
    candidate_anonymous_id = Column(String, nullable=False)
    exam_id = Column(String, nullable=False)
    result_hash = Column(String, nullable=False)
    certificate_hash = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    verification_url = Column(String, nullable=False)
    status = Column(String, default="VALID") # VALID, SUPERSEDED, REVOKED
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def certificate_id(self):
        return self.id

class CertificateVerificationLog(Base):
    __tablename__ = "certificate_verifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    certificate_id = Column(String, ForeignKey("result_certificates.id"), nullable=False)
    verifier_ip = Column(String, nullable=True)
    status = Column(String, nullable=False)
    verified_at = Column(DateTime(timezone=True), server_default=func.now())

class CandidateResultView(Base):
    __tablename__ = "candidate_result_views"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    result_id = Column(String, ForeignKey("results.id"), nullable=False)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    anonymous_id = Column(String, nullable=False)
    result_id = Column(String, ForeignKey("results.id"), nullable=False)
    dispute_type = Column(String, nullable=False)
    priority = Column(String, default="NORMAL")
    description = Column(Text, nullable=False)
    status = Column(String, default="SUBMITTED") # SUBMITTED, UNDER_REVIEW, RESOLVED_CONFIRMED, RESOLVED_UPDATED, REJECTED, CLOSED
    evidence_packet_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DisputeEvent(Base):
    __tablename__ = "dispute_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    dispute_id = Column(String, ForeignKey("disputes.id"), nullable=False)
    action = Column(String, nullable=False)
    actor_id = Column(String, nullable=False)
    from_status = Column(String, nullable=False)
    to_status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DisputeNote(Base):
    __tablename__ = "dispute_notes"

    id = Column(String, primary_key=True, default=generate_uuid)
    dispute_id = Column(String, ForeignKey("disputes.id"), nullable=False)
    actor_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EvidencePacket(Base):
    __tablename__ = "evidence_packets"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    result_id = Column(String, ForeignKey("results.id"), nullable=False)
    anonymous_id = Column(String, nullable=False)
    packet_type = Column(String, default="CANDIDATE_RESULT_PROOF")
    redaction_level = Column(String, default="CANDIDATE_SAFE") # CANDIDATE_SAFE, AUDITOR_FULL, PUBLIC_SAFE, LEGAL_EXPORT
    packet_hash = Column(String, nullable=False)
    signature = Column(String, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

class EvidencePacketSection(Base):
    __tablename__ = "evidence_packet_sections"

    id = Column(String, primary_key=True, default=generate_uuid)
    packet_id = Column(String, ForeignKey("evidence_packets.id"), nullable=False)
    section_name = Column(String, nullable=False)
    content = Column(Text, nullable=False) # JSON string

class ResultVersion(Base):
    __tablename__ = "result_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    result_id = Column(String, ForeignKey("results.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    previous_result_hash = Column(String, nullable=True)
    new_result_hash = Column(String, nullable=False)
    change_reason = Column(Text, nullable=False)
    changed_by = Column(String, ForeignKey("users.id"), nullable=False)
    linked_dispute_id = Column(String, ForeignKey("disputes.id"), nullable=True)
    signature = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def result_hash(self):
        return self.new_result_hash

    @result_hash.setter
    def result_hash(self, value):
        self.new_result_hash = value

class InstitutionReport(Base):
    __tablename__ = "institution_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, nullable=False)
    report_hash = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

class ReportSection(Base):
    __tablename__ = "report_sections"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("institution_reports.id"), nullable=False)
    section_name = Column(String, nullable=False)
    content = Column(Text, nullable=False) # JSON string


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    institution_type = Column(String, nullable=False)
    tenant_slug = Column(String, unique=True, nullable=False)
    status = Column(String, default="ACTIVE")
    deployment_mode = Column(String, default="SAAS")
    data_region = Column(String, default="IN")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class InstitutionSetting(Base):
    __tablename__ = "institution_settings"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(String, nullable=False)


class InstitutionMembership(Base):
    __tablename__ = "institution_memberships"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    role = Column(String, nullable=False) # ADMIN, MEMBER
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserInvitation(Base):
    __tablename__ = "user_invitations"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, nullable=False)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, ACCEPTED, EXPIRED
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PolicyTemplate(Base):
    __tablename__ = "policy_templates"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    name = Column(String, nullable=False)
    trust_threshold = Column(Float, default=90.0)
    requires_double_evaluation = Column(Boolean, default=False)
    requires_dual_package_release = Column(Boolean, default=False)
    allow_emergency_release = Column(Boolean, default=True)
    dispute_window_days = Column(Integer, default=7)
    certificate_required = Column(Boolean, default=True)
    audit_report_required = Column(Boolean, default=True)
    status = Column(String, default="DRAFT") # DRAFT, LOCKED
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExamTemplate(Base):
    __tablename__ = "exam_templates"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    name = Column(String, nullable=False)
    exam_type = Column(String, nullable=False) # MCQ, OMR, WRITTEN, HYBRID
    default_duration_minutes = Column(Integer, default=180)
    default_sections = Column(Text, nullable=False) # JSON list of sections
    default_policy_id = Column(String, ForeignKey("policy_templates.id"), nullable=True)
    blueprint_schema = Column(Text, nullable=False) # JSON blueprint configuration
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExamCenter(Base):
    __tablename__ = "exam_centers"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    rooms = Column(Integer, nullable=False)
    device_count = Column(Integer, nullable=False)
    network_mode = Column(String, default="HYBRID") # ONLINE, OFFLINE, HYBRID
    security_level = Column(String, default="HIGH") # STANDARD, HIGH
    status = Column(String, default="APPROVED") # DRAFT, PENDING_REVIEW, APPROVED, SUSPENDED, BLACKLISTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CenterAssignment(Base):
    __tablename__ = "center_assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    center_id = Column(String, ForeignKey("exam_centers.id"), nullable=False)
    exam_id = Column(String, nullable=False)
    assigned_capacity = Column(Integer, nullable=False)
    status = Column(String, default="ASSIGNED") # ASSIGNED, REMOVED


class InstitutionKey(Base):
    __tablename__ = "institution_keys"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    key_type = Column(String, nullable=False) # CERTIFICATE_SIGNING, RECEIPT_SIGNING, etc.
    algorithm = Column(String, default="ECDSA_P256")
    public_key = Column(Text, nullable=False)
    private_key = Column(Text, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, ROTATED, REVOKED
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditNamespace(Base):
    __tablename__ = "audit_namespaces"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    current_head_hash = Column(String, nullable=True)
    event_count = Column(Integer, default=0)
    status = Column(String, default="VALID") # VALID, INVALID


class TenantSecurityViolation(Base):
    __tablename__ = "tenant_security_violations"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    user_id = Column(String, nullable=False)
    violation_type = Column(String, nullable=False) # CROSS_TENANT_ACCESS, etc.
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# ==========================================
# Version 0.8: DeploymentOps & Reliability Models
# ==========================================

class BackgroundJob(Base):
    __tablename__ = "background_jobs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    job_type = Column(String, nullable=False) # e.g. GENERATE_AUDIT_REPORT, PROCESS_OMR_SCAN, etc.
    status = Column(String, default="PENDING") # PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    progress = Column(Integer, default=0)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_reason = Column(Text, nullable=True)


class JobEvent(Base):
    __tablename__ = "job_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("background_jobs.id"), nullable=False)
    event_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StorageObject(Base):
    __tablename__ = "storage_objects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    bucket = Column(String, nullable=False)
    object_key = Column(String, nullable=False, index=True)
    content_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String, nullable=False)
    storage_backend = Column(String, nullable=False) # LOCAL, S3, MINIO
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StorageAccessLog(Base):
    __tablename__ = "storage_access_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    object_id = Column(String, ForeignKey("storage_objects.id"), nullable=False)
    action = Column(String, nullable=False) # READ, WRITE, DELETE
    actor_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class SystemHealthCheck(Base):
    __tablename__ = "system_health_checks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    status = Column(String, nullable=False) # OK, DEGRADED, UNHEALTHY
    api_status = Column(String, nullable=False)
    database_status = Column(String, nullable=False)
    redis_status = Column(String, nullable=False)
    storage_status = Column(String, nullable=False)
    workers_status = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    checked_at = Column(DateTime(timezone=True), server_default=func.now())


class OpsIncident(Base):
    __tablename__ = "ops_incidents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    incident_type = Column(String, nullable=False) # DB_OUTAGE, REDIS_LOCK_FAILURE, JOB_FAILED, STORAGE_HASH_MISMATCH, etc.
    severity = Column(String, default="P2") # P0, P1, P2
    description = Column(Text, nullable=False)
    status = Column(String, default="OPEN") # OPEN, ACKNOWLEDGED, RESOLVED
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BackupManifest(Base):
    __tablename__ = "backup_manifests"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    backup_type = Column(String, default="FULL") # FULL, INCREMENTAL
    db_snapshot_hash = Column(String, nullable=False)
    object_manifest_hash = Column(String, nullable=False)
    audit_head_hash = Column(String, nullable=True)
    status = Column(String, default="PENDING") # PENDING, COMPLETED, FAILED
    error_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BackupEvent(Base):
    __tablename__ = "backup_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    backup_id = Column(String, ForeignKey("backup_manifests.id"), nullable=False)
    event_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RestoreDryRun(Base):
    __tablename__ = "restore_dry_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    backup_id = Column(String, ForeignKey("backup_manifests.id"), nullable=False)
    status = Column(String, default="PENDING") # PENDING, PASSED, FAILED
    verification_details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RateLimitEvent(Base):
    __tablename__ = "rate_limit_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    fingerprint = Column(String, nullable=True)
    blocked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AbuseEvent(Base):
    __tablename__ = "abuse_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, nullable=True)
    abuse_type = Column(String, nullable=False) # BRUTE_FORCE, SCRAPING_ATTEMPT
    description = Column(Text, nullable=False)
    ip_address = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DeploymentConfig(Base):
    __tablename__ = "deployment_configs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    config_key = Column(String, unique=True, nullable=False)
    config_value = Column(Text, nullable=False)
    is_secret = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MaintenanceWindow(Base):
    __tablename__ = "maintenance_windows"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemMetricsSnapshot(Base):
    __tablename__ = "system_metrics_snapshots"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    api_requests_total = Column(Integer, default=0)
    api_request_duration_avg = Column(Float, default=0.0)
    auth_failures_total = Column(Integer, default=0)
    package_release_attempts = Column(Integer, default=0)
    audit_events_total = Column(Integer, default=0)
    candidate_sessions_active = Column(Integer, default=0)
    captured_at = Column(DateTime(timezone=True), server_default=func.now())


class ThreatModel(Base):
    __tablename__ = "threat_models"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    threat_id = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=False)
    asset = Column(String, nullable=False)
    attack_vector = Column(String, nullable=False)
    impact = Column(String, nullable=False)
    likelihood = Column(String, nullable=False)
    mitigation = Column(Text, nullable=True) # JSON list
    status = Column(String, default="UNMITIGATED") # UNMITIGATED, MITIGATED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SecurityAsset(Base):
    __tablename__ = "security_assets"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    asset_id = Column(String, unique=True, index=True, nullable=False)
    resource_type = Column(String, nullable=False)
    field_name = Column(String, nullable=False)
    classification = Column(String, nullable=False) # PUBLIC, INTERNAL, CONFIDENTIAL, SECRET, PII, EVIDENCE, CRYPTO_MATERIAL
    encryption_required = Column(Boolean, default=False)
    redaction_required = Column(Boolean, default=False)
    access_audit_required = Column(Boolean, default=False)
    retention_policy = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PIIAccessLog(Base):
    __tablename__ = "pii_access_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    actor_id = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=False)
    accessed_fields = Column(String, nullable=False)
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())

class RedactionPolicy(Base):
    __tablename__ = "redaction_policies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    mode = Column(String, nullable=False)
    rules = Column(Text, nullable=True) # JSON rules
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    requested_by = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    required_approvals = Column(Integer, default=2)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    request_id = Column(String, ForeignKey("approval_requests.id"), nullable=False)
    user_id = Column(String, nullable=False)
    action = Column(String, nullable=False) # APPROVE, REJECT
    signature = Column(String, nullable=True)
    decided_at = Column(DateTime(timezone=True), server_default=func.now())

class SecurityHardeningCheck(Base):
    __tablename__ = "security_hardening_checks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    check_type = Column(String, nullable=False)
    status = Column(String, default="FAILED") # PASSED, FAILED
    details = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class KeyLifecycleEvent(Base):
    __tablename__ = "key_lifecycle_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    key_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False) # ROTATE_REQUEST, ROTATE_APPROVE, REVOKE, MARK_COMPROMISED
    old_state = Column(String, nullable=True)
    new_state = Column(String, nullable=False)
    actor_id = Column(String, nullable=False)
    details = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AccessReviewCycle(Base):
    __tablename__ = "access_review_cycles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    scope = Column(String, default="INSTITUTION")
    status = Column(String, default="OPEN") # OPEN, COMPLETED
    users_reviewed = Column(Integer, default=0)
    stale_roles_found = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class AccessReviewItem(Base):
    __tablename__ = "access_review_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    cycle_id = Column(String, ForeignKey("access_review_cycles.id"), nullable=False)
    user_id = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REVOKED
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

class RetentionPolicy(Base):
    __tablename__ = "retention_policies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    exam_id = Column(String, index=True, nullable=True)
    policy_type = Column(String, nullable=False) # EXAM_PLUS_180_DAYS, INDEFINITE, etc.
    duration_days = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LegalHold(Base):
    __tablename__ = "legal_holds"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    target_type = Column(String, nullable=False) # EXAM, CANDIDATE
    target_id = Column(String, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, RELEASED
    reason = Column(String, nullable=True)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DeletionDryRun(Base):
    __tablename__ = "deletion_dry_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    policy_id = Column(String, nullable=False)
    affected_records_count = Column(Integer, default=0)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SecurityIncident(Base):
    __tablename__ = "security_incidents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    incident_type = Column(String, nullable=False)
    severity = Column(String, default="P2") # P0, P1, P2
    description = Column(Text, nullable=False)
    status = Column(String, default="OPEN") # OPEN, TRIAGED, CONTAINED, RESOLVED
    triaged_by = Column(String, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class IncidentTimelineEvent(Base):
    __tablename__ = "incident_timeline_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("security_incidents.id"), nullable=False)
    event_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    actor_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ComplianceReport(Base):
    __tablename__ = "compliance_reports"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    exam_id = Column(String, index=True, nullable=True)
    readiness_score = Column(Integer, default=0)
    verdict = Column(String, nullable=False) # PASS, FAIL
    hash_signature = Column(String, nullable=True)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ComplianceReportSection(Base):
    __tablename__ = "compliance_report_sections"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("compliance_reports.id"), nullable=False)
    section_name = Column(String, nullable=False)
    status = Column(String, nullable=False) # PASSED, FAILED
    details = Column(Text, nullable=True)

class PentestSimulation(Base):
    __tablename__ = "pentest_simulations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    attack_type = Column(String, nullable=False)
    status = Column(String, nullable=False) # DETECTED_AND_BLOCKED, EXPLOITED
    findings = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PilotRun(Base):
    __tablename__ = "pilot_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, FAILED
    readiness_score = Column(Integer, nullable=True)

class PilotStage(Base):
    __tablename__ = "pilot_stages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    pilot_run_id = Column(String, ForeignKey("pilot_runs.id"), nullable=False)
    stage_name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="PENDING") # PENDING, IN_PROGRESS, COMPLETED, FAILED
    sequence = Column(Integer, nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class PilotStageEvent(Base):
    __tablename__ = "pilot_stage_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    pilot_stage_id = Column(String, ForeignKey("pilot_stages.id"), nullable=False)
    event_name = Column(String, nullable=False)
    status = Column(String, nullable=False) # SUCCESS, FAILURE
    actor = Column(String, nullable=False)
    action = Column(String, nullable=False)
    proof_hash = Column(String, nullable=True)
    signature = Column(String, nullable=True)
    risk_effect = Column(String, nullable=True)
    audit_event_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PilotEvidenceBinder(Base):
    __tablename__ = "pilot_evidence_binders"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    pilot_run_id = Column(String, ForeignKey("pilot_runs.id"), nullable=True)
    binder_hash = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    metadata_json = Column(Text, nullable=False)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PilotReadinessReport(Base):
    __tablename__ = "pilot_readiness_reports"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    verdict = Column(String, nullable=False) # READY, DEGRADED, NOT_READY
    score = Column(Integer, default=0)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DemoSeedRun(Base):
    __tablename__ = "demo_seed_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    seeded_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, nullable=False) # SUCCESS, FAILED
    summary = Column(Text, nullable=True)

class AuthorityDashboardSnapshot(Base):
    __tablename__ = "authority_dashboard_snapshots"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, index=True, nullable=True)
    snapshot_time = Column(DateTime(timezone=True), server_default=func.now())
    data_json = Column(Text, nullable=False)

class FinalGateDecision(Base):
    __tablename__ = "final_gate_decisions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    exam_id = Column(String, index=True, nullable=False)
    institution_id = Column(String, index=True, nullable=True)
    release_allowed = Column(Boolean, default=False)
    trust_score = Column(Integer, default=0)
    required_threshold = Column(Integer, default=90)
    security_readiness = Column(String, nullable=False) # PASS, FAIL
    ops_status = Column(String, nullable=False) # READY, DEGRADED, UNHEALTHY
    audit_chain = Column(String, nullable=False) # VALID, INVALID
    final_verdict = Column(String, nullable=False) # PUBLISH_ALLOWED, BLOCKED
    signed_by = Column(String, nullable=True)
    gate_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Performance Indexes for Production
from sqlalchemy import Index

Index("idx_exams_institution_id", ExamState.institution_id)
Index("idx_candidates_exam_id", Candidate.exam_id)
Index("idx_audit_logs_institution_id", AuditLog.institution_id)
Index("idx_audit_logs_resource", AuditLog.resource_type, AuditLog.resource_id)
Index("idx_results_exam_candidate", Result.exam_id, Result.candidate_id)
Index("idx_disputes_result_id", Dispute.result_id)
Index("idx_packages_center_id", EncryptedPackage.center_id)


# ==========================================
# Vendor EaaS & Candidate Application Models
# ==========================================

class VendorOrganization(Base):
    __tablename__ = "vendor_organizations"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    legal_name = Column(String, nullable=False)
    registration_number = Column(String, unique=True, nullable=False)
    tenant_slug = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    google_oauth_key = Column(Text, nullable=True)
    dlt_sms_key = Column(String, nullable=True)
    payment_upi_id = Column(String, nullable=True)
    payment_bank_name = Column(String, nullable=True)
    payment_account_number = Column(String, nullable=True)
    payment_ifsc_code = Column(String, nullable=True)
    status = Column(String, default="APPROVED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VendorMembership(Base):
    __tablename__ = "vendor_memberships"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(String, ForeignKey("vendor_organizations.id"), nullable=False)
    role = Column(String, default="VENDOR_ADMIN")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    candidate_student_id = Column(String, unique=True, nullable=False)
    registration_state = Column(String, default="ACCOUNT_CREATED") # ACCOUNT_CREATED, EMAIL_VERIFIED, PHONE_VERIFIED, PROFILE_COMPLETED, ADDRESS_COMPLETED, EDUCATION_COMPLETED, IDENTITY_VERIFIED, APPLICATION_REVIEWED, PAYMENT_COMPLETED, CENTRE_ALLOCATED, ADMIT_CARD_READY
    full_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    alternate_phone = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    dob = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    nationality = Column(String, default="Indian")
    category = Column(String, nullable=True) # General, OBC-NCL, SC, ST, EWS
    pwd_status = Column(String, default="NO") # YES, NO
    domicile_state = Column(String, nullable=True)
    guardian_name = Column(String, nullable=True)
    address_line1 = Column(Text, nullable=True)
    address_line2 = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    # Educational Background
    qualification_level = Column(String, nullable=True) # Class 10, Class 12, Diploma, Undergraduate, Postgraduate
    board_university = Column(String, nullable=True)
    passing_year = Column(String, nullable=True)
    roll_number = Column(String, nullable=True)
    percentage_cgpa = Column(String, nullable=True)
    # Identity & Biometrics
    aadhaar_status = Column(String, default="UNVERIFIED")
    aadhaar_number_masked = Column(String, nullable=True)
    photo_match_percent = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    destination = Column(String, nullable=False)
    otp_hash = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    attempt_count = Column(Integer, default=0)
    status = Column(String, default="PENDING")
    expires_at = Column(DateTime(timezone=True), nullable=False)
class ExamCatalog(Base):
    __tablename__ = "exam_catalogs"

    id = Column(String, primary_key=True, default=generate_uuid)
    vendor_id = Column(String, ForeignKey("vendor_organizations.id"), nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    purpose = Column(Text, nullable=False)
    category = Column(String, nullable=False) # ENGINEERING, MEDICAL, CIVIL_SERVICES, IT_AI, MANAGEMENT, APPLIED_SCIENCES
    academic_cycle = Column(String, default="2026-2027")
    application_start_date = Column(DateTime(timezone=True), nullable=True)
    application_end_date = Column(DateTime(timezone=True), nullable=True)
    exam_date = Column(String, nullable=False)
    exam_mode = Column(String, default="COMPUTER_BASED_TEST") # COMPUTER_BASED_TEST, OMR_PEN_PAPER, HYBRID
    duration_minutes = Column(Integer, default=180)
    total_marks = Column(Float, default=300.0)
    total_questions = Column(Integer, default=90)
    negative_marking = Column(String, default="+4 for correct, -1 for incorrect")
    fee_general = Column(Float, default=1000.0)
    fee_reserved = Column(Float, default=500.0)
    
    # Detailed Eligibility Criteria
    eligibility_min_qualification = Column(String, nullable=False) # Class 10, Class 12, Diploma, Undergraduate, Postgraduate
    eligibility_min_percentage = Column(Float, default=60.0)
    eligibility_age_limit = Column(String, nullable=True)
    eligibility_subjects_required = Column(String, nullable=True)
    
    # Detailed Pattern & Shifts
    syllabus_summary = Column(Text, nullable=True)
    shifts_json = Column(Text, nullable=True) # JSON list of shift timings
    status = Column(String, default="REGISTRATION_OPEN") # REGISTRATION_OPEN, UPCOMING, CLOSED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExamApplication(Base):
    __tablename__ = "exam_applications"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_number = Column(String, unique=True, nullable=False)
    exam_id = Column(String, nullable=False)
    candidate_id = Column(String, ForeignKey("candidate_profiles.id"), nullable=False)
    vendor_id = Column(String, ForeignKey("vendor_organizations.id"), nullable=True)
    fee_amount = Column(Float, default=0.0)
    payment_status = Column(String, default="PENDING")
    payment_reference = Column(String, nullable=True)
    allocated_center_id = Column(String, ForeignKey("exam_centers.id"), nullable=True)
    allocated_slot = Column(String, nullable=True)
    admit_card_hash = Column(String, nullable=True)
    status = Column(String, default="SUBMITTED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, ForeignKey("exam_applications.id"), nullable=True)
    candidate_id = Column(String, ForeignKey("candidate_profiles.id"), nullable=True)
    exam_id = Column(String, nullable=True)
    vendor_id = Column(String, ForeignKey("vendor_organizations.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    provider = Column(String, default="NPCI_UPI") # NPCI_UPI, RAZORPAY, CASHFREE, PHONEPE, SBI_EPAY
    transaction_ref = Column(String, unique=True, nullable=False)
    gateway_order_id = Column(String, nullable=True)
    gateway_payment_id = Column(String, nullable=True)
    bank_ref_no = Column(String, nullable=True) # UTR / RRN (Bank Reference Number)
    payment_method = Column(String, default="UPI") # UPI, CARD, NETBANKING
    upi_vpa = Column(String, nullable=True)
    signature = Column(String, nullable=True)
    status = Column(String, default="PENDING") # PENDING, PAID, FAILED, REFUNDED
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdmitCardRecord(Base):
    __tablename__ = "admit_cards"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, ForeignKey("exam_applications.id"), unique=True, nullable=False)
    candidate_id = Column(String, ForeignKey("candidate_profiles.id"), nullable=False)
    exam_id = Column(String, nullable=False)
    center_id = Column(String, ForeignKey("exam_centers.id"), nullable=False)
    reporting_time = Column(String, nullable=False)
    admit_card_hash = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    status = Column(String, default="VALID")
    generated_at = Column(DateTime(timezone=True), server_default=func.now())


# ==============================================================================
# Centralized Identity, OTP & Auth Infrastructure Models
# ==============================================================================

class OTPChallenge(Base):
    __tablename__ = "otp_challenges"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    channel = Column(String, nullable=False) # EMAIL, SMS
    destination = Column(String, nullable=False) # E.164 phone or email
    purpose = Column(String, nullable=False) # REGISTRATION, LOGIN, PASSWORD_RESET, HIGH_RISK_ACTION, CHANGE_EMAIL, CHANGE_PHONE
    otp_hash = Column(String, nullable=False) # HMAC-SHA256 hashed
    expires_at = Column(DateTime(timezone=True), nullable=False)
    attempt_count = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    last_sent_at = Column(DateTime(timezone=True), server_default=func.now())
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    session_token_hash = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    device_metadata = Column(Text, nullable=True) # JSON metadata

class AuthEvent(Base):
    __tablename__ = "auth_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    event_type = Column(String, nullable=False) # ACCOUNT_CREATED, EMAIL_OTP_SENT, EMAIL_VERIFIED, PHONE_OTP_SENT, PHONE_VERIFIED, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, SESSION_REVOKED, HIGH_RISK_AUTH
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    device_id = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class CommunicationProviderConfig(Base):
    __tablename__ = "communication_provider_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    vendor_id = Column(String, ForeignKey("vendor_organizations.id"), nullable=True)
    provider_type = Column(String, nullable=False)
    provider_name = Column(String, nullable=False)
    api_key_encrypted = Column(Text, nullable=True)
    sender_id = Column(String, nullable=True)
    dlt_entity_id = Column(String, nullable=True)
    dlt_template_id = Column(String, nullable=True)
    is_default = Column(Boolean, default=True)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==============================================================================
# UIDAI Secure QR & Identity Verification Engine Models
# ==============================================================================

class IdentityVerificationRecord(Base):
    __tablename__ = "identity_verifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidate_profiles.id"), nullable=False)
    verification_type = Column(String, default="AADHAAR_SECURE_QR") # AADHAAR_SECURE_QR, OFFLINE_EKYC_XML, AUTHORIZED_AUTH
    status = Column(String, default="PENDING") # PENDING, VERIFIED, MANUAL_REVIEW, REJECTED
    aadhaar_last4 = Column(String, nullable=True)
    document_hash = Column(String, nullable=False) # SHA256(uploadedDocument)
    qr_signature_valid = Column(Boolean, default=False)
    payload_valid = Column(Boolean, default=False)
    name_match_status = Column(String, default="EXACT_MATCH") # EXACT_MATCH, PARTIAL_MATCH, MISMATCH
    dob_match_status = Column(String, default="EXACT_MATCH") # EXACT_MATCH, MISMATCH
    gender_match_status = Column(String, default="EXACT_MATCH") # EXACT_MATCH, MISMATCH
    overall_match_score = Column(Float, default=1.0)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VerificationAttempt(Base):
    __tablename__ = "verification_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    verification_id = Column(String, ForeignKey("identity_verifications.id"), nullable=False)
    method = Column(String, nullable=False) # SECURE_QR_DECODE, EKYC_ZIP_DECRYPT
    quality_score = Column(Float, default=100.0) # Blur score & illumination check
    error_code = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VerificationEvidence(Base):
    __tablename__ = "verification_evidences"

    id = Column(String, primary_key=True, default=generate_uuid)
    verification_id = Column(String, ForeignKey("identity_verifications.id"), unique=True, nullable=False)
    uidai_cert_thumbprint = Column(String, nullable=False)
    payload_sha256 = Column(String, nullable=False)
    signature_algorithm = Column(String, default="RSA-2048-SHA256")
    timestamp_signature = Column(String, nullable=True)
    engine_version = Column(String, default="v2.0-UIDAI-QR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class IdentityVerificationEvent(Base):
    __tablename__ = "identity_verification_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    verification_id = Column(String, ForeignKey("identity_verifications.id"), nullable=False)
    event_type = Column(String, nullable=False) # DOCUMENT_UPLOADED, QR_DETECTED, QR_SIGNATURE_CHECK_STARTED, QR_SIGNATURE_VALID, DATA_MATCH_SUCCESS, VERIFICATION_COMPLETED
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())




