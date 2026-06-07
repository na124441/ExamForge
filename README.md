# ExamForge (v0.1 - MVP)

ExamForge is a universal, zero-trust, and tamper-evident examination security infrastructure designed to protect the complete examination lifecycle—from question creation to result publication. 

Unlike traditional platforms that focus solely on online proctoring, ExamForge establishes a **cryptographic chain of custody** across paper creation, exam delivery, answer capture, evaluation, and result generation.

---

## 1. Core MVP Features (v0.1)

The v0.1 MVP demonstrates the end-to-end trust pipeline through a fully integrated Next.js frontend and FastAPI backend:

- **Question Bank Pool**: Adds questions with metadata (subject, topic, difficulty) stored as AES-256-GCM encrypted payloads at rest.
- **Dynamic Paper Generation**: Configures paper blueprints (marks, questions, subject/difficulty distribution) and dynamically samples, shuffles, and generates papers with unique `paper_hash` signatures.
- **Time-Locked Package Bindings**: Encrypts papers and binds them to specific center IDs and release time windows.
- **Timed MCQ Portal**: Candidate-facing timed test runner interface.
- **Chained Answer Events**: Every single answer selection event from the client is linked back to the prior answer event's hash, forming a cryptographic chain.
- **Double-Blind Written Evaluation**: Simulated descriptive scan booklet ingestion, generating page hashes and masking candidate identity with random `anonymous_id` hashes for evaluator grading.
- **Pre-Result Verification Engine**: An automated checklist verifying that all paper hashes, answer logs, and grading signatures match their ledger parameters.
- **Append-Only Audit Ledger Timeline**: Visualizes system logs. Each block contains a `previous_hash` and `current_hash` establishing a hash-chained trail of all operations.
- **SQL Backdoor Tamper Simulator**: A demonstration utility allowing users to bypass business logic and directly alter records (answers, marks, logs) in SQLite to verify that the verifier catches the intrusion immediately.

---

## 2. Vulnerability Mitigation Matrix

ExamForge is built on the philosophy of **"Tamper-Evident, Not Just Tamper-Resistant"**. Below is the security threat model for v0.1:

| Target Threat | Protected Vulnerability | MVP Enforcement Level (v0.1) | Production Upgrade Path |
| :--- | :--- | :--- | :--- |
| **Paper Leakage** | Insiders, storage breaches, or transport leaks before exam start. | **Symmetric AES-GCM Simulation**: Papers are encrypted at generation. Backend time-lock check denies decryption key release until `current_time >= exam_start_time`. | **Threshold Cryptography**: Split the decryption key into multi-party secret shares (Shamir's Secret Sharing) released by independent entities. |
| **Center Compromise** | Early paper access or collusion at specific locations. | **Center-Bound Packages**: Decryption keys are strictly bound to a `center_id`. Packages are sealed and validated locally. | **Hardware Key Attestation**: Package decryption bound to physical device security keys or local HSMs. |
| **Candidate Impersonation** | Proxy attempts or identity document forgery. | **Status Check Integration**: Exam sessions can only be initialized if candidate status is updated to `VERIFIED` by center officers. | **Biometric Verification**: Automated face match algorithms comparing live photos to registered databases. |
| **OMR Sheet Tampering** | Replacing or modifying sheets after the exam. | **Upload File Hashing**: Generates SHA-256 hashes of scanned OMR images on upload, verifying they match the original ingestion signatures. | **OpenCV Alignment**: Automated computer vision bubble contour checking and confidence scores flagging ambiguous marks. |
| **Descriptive Script Swap** | Replacing pages in written booklets during transit. | **Page-wise Hashing**: Each uploaded page is hashed. Booklet ID is mapped to candidate `anonymous_id` hashes to remove evaluator bias. | **QR-Coded Page Layouts**: Embedded cryptographic identifiers on page corners to verify booklet integrity. |
| **Descriptive Marks Tampering** | Manipulating grades before publishing. | **Locked Grading Hashes**: Evaluator grades are sealed and hashed as $\text{SHA256}(\text{exam} + \text{anon\_id} + \text{marks} + \text{evaluator\_id})$. Any direct database edits mismatch the signature. | **Asymmetric Signatures**: Evaluators sign the evaluation object using private keys (Ed25519) on their browser. |
| **Database Intrusion (Insider)** | System administrators editing results or candidate answers directly in SQL. | **Hash-Chained Audit Ledger**: Every log is linked cryptographically to the preceding log block. Any alteration breaks the chain sequence. | **Distributed Ledgers**: Anchoring audit log block hashes to a public blockchain or distributed consortium ledger. |

---

## 3. Technology Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Vanilla CSS variables.
- **Backend**: FastAPI (Python 3.14), SQLAlchemy ORM.
- **Database**: SQLite (MVP) / PostgreSQL (Production ready).
- **Security**: AES-256-GCM AEAD, SHA-256 Hashing, PyJWT.

---

## 4. Repository Layout

```
ExamForge/
├── backend/
│   ├── app/
│   │   ├── auth/          # Login routing & access tokens
│   │   ├── audit/         # Hash chain logging ledger
│   │   ├── candidates/    # Verification and exam sessions
│   │   ├── ingestion/     # OMR scan & written grading
│   │   ├── questions/     # Question pool & blueprints
│   │   ├── results/       # Verification verifier & tamper simulation
│   │   ├── config.py      # Environment configurations
│   │   ├── database.py    # SQLite connections
│   │   └── models.py      # SQLAlchemy schemas
│   ├── requirements.txt   # Dependencies
│   └── test_api_flow.py   # E2E integration test suite
│
├── frontend/
│   ├── src/app/
│   │   ├── layout.tsx     # Custom CSS & frame
│   │   ├── page.tsx       # Demo Login portal
│   │   ├── controller/    # Controller dashboard
│   │   ├── candidate/     # Timer test room
│   │   ├── evaluator/     # Anonymous grading
│   │   ├── auditor/       # Timeline chain viewer & simulator
│   │   └── globals.css    # Color tokens
│   └── package.json
```

---

## 5. Setup & Installation

### 5.1 Backend Server Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate virtual environment:
   - **Windows**: `.venv\Scripts\activate`
   - **Mac/Linux**: `source .venv/bin/activate`
3. Start the FastAPI API server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   *Docs available at `http://localhost:8000/docs`*

### 5.2 Frontend Development Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Start the development runner:
   ```bash
   npm run dev
   ```
   *Frontend running at `http://localhost:3000`*
