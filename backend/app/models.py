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
    password_hash = Column(String, nullable=False)
    institution_id = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
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
    status = Column(String, default="SEALED") # SEALED, RELEASED
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
