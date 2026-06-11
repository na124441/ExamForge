# ExamForge Pilot Demo Script

Use this script to deliver pitch presentations and guide live platform reviews.

---

## 1. Opening Statement (1 Minute)
> "Good morning. Today, we are presenting ExamForge, a zero-trust examination trust infrastructure.
> Existing platforms ask you to blindly trust databases, centers, evaluators, and system administrators.
> ExamForge changes this paradigm by making every critical step cryptographically verifiable through signatures, append-only hash chains, and operational gates."

---

## 2. Platform Value Pitch
- **Problem**: Insider tampering, paper leaks, and evaluator bias ruin the credibility of examinations.
- **Solution**: ExamForge tracks the full exam lifecycle from institution setup to paper creation, verification, evaluations, disputes, and compliance reporting. Every event is signed, hashed, and verified.

---

## 3. Guided Demo Stages (Walkthrough via `/pilot-run`)

### Stage 1: Setup & Initialization
- **Action**: Reset database and click "Start Pilot Run".
- **Narrative**: "We initialize a clean, multi-tenant keyspace for the National Scholarship Board and register our ECDSA signing keys."
- **Verification**: Point out the active signing key ID in logs.

### Stage 2: Create Exam & blueprint
- **Action**: Click "Execute Exam Creation".
- **Narrative**: "We create a new hybrid examination and lock its blueprint config."

### Stage 3 & 4: Paper Generation & Sealing
- **Action**: Execute generation and sealing.
- **Narrative**: "The question papers are generated and sealed into encrypted packages. The hashes are registered in the audit ledger before center distribution."

### Stage 5 & 6: Center Release & Candidate verification
- **Action**: Execute release and verification.
- **Narrative**: "Keyspace keys are released to the Delhi center. Candidate check-ins verify identity logs."

### Stage 7 to 10: Submission, OMR Ingestion, Descriptive Grading, and Conflicts
- **Action**: Advance through stages.
- **Narrative**: "Answers are submitted, scanned, and double-graded anonymously. Mismatch conflict flags trigger senior reviews."

### Stage 11 & 12: Publication Gate & Publish
- **Action**: Advance to publication.
- **Narrative**: "The publication gate checks 15 security and operational rules. Results are signed and result certificates are registered."

### Stage 13 & 15: Dispute, Audit Validation, and Compliance Report
- **Action**: Finalize stages and generate binder.
- **Narrative**: "Disputes update version chains. We check the logs append-only chain and sign a final compliance report."

---

## 4. Closing Statement (1 Minute)
> "ExamForge provides institutional trust that cannot be compromised by single administrators or compromised servers.
> Let's look at the generated **Evidence Binder** — a single signed document proving the integrity of the entire exam."
