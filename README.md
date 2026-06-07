# ExamForge (v0.2 - Real Ingestion & AI)

ExamForge is a universal, zero-trust, and tamper-evident examination security infrastructure designed to protect the complete examination lifecycle—from question creation to result publication. 

Unlike traditional platforms that focus solely on online proctoring, ExamForge establishes a **cryptographic chain of custody** across paper creation, exam delivery, answer capture, evaluation, and result generation.

---

## 1. Core Platform Features (v0.2)

ExamForge v0.2 implements functional ingestion, computer vision scanning, and AI-assisted grading pipelines:

- **Question Bank Pool**: Staged questions with difficulty ratings stored as AES-256-GCM encrypted payloads at rest.
- **Dynamic Paper Generation**: Configures blueprint schemas and dynamically samples, shuffles, and generates papers with unique `paper_hash` signatures.
- **Encrypted Cover Generator**: Automatically creates and exports signed Candidate Stamp covers as printable PNG attachments.
- **Time-Locked Package Bindings**: Encrypts papers and binds them to specific center IDs and release windows.
- **Timed MCQ Portal**: Candidate-facing timed test runner interface.
- **Chained Answer Events**: Every single answer selection event from the client is linked back to the prior answer event's hash, forming a cryptographic chain.
- **OpenCV OMR Scanner**: Decodes OMR scan images, aligns anchors, evaluates bubble fill density, and extracts answers, automatically flagging ambiguous double-markings.
- **Gemini Vision Grading Assistant**: Connects to the `google-generativeai` SDK. Automatically OCR-transcribes descriptive written booklet pages, checks them against the grading rubrics, alerts the evaluator to missing points, and suggests scores.
- **Pre-Result Verification Engine**: An automated checklist verifying that all paper hashes, answer logs, and grading signatures match their ledger parameters.
- **Public Verification Portal**: A public route (`/verify-result`) where third parties can input a candidate's registration and receipt hash to verify credentials directly against ledger blocks.
- **Append-Only Audit Ledger Timeline**: Visualizes system logs. Each block contains a `previous_hash` and `current_hash` establishing a hash-chained trail of all operations.
- **SQL Backdoor Tamper Simulator**: A demonstration utility allowing users to bypass business logic and directly alter records (answers, marks, logs) in SQLite to verify that the verifier catches the intrusion immediately.

---

## 2. Vulnerability Mitigation Matrix

ExamForge is built on the philosophy of **"Tamper-Evident, Not Just Tamper-Resistant"**. Below is the security threat model for v0.2:

| Target Threat | Protected Vulnerability | v0.2 Ingestion & Security Enforcement |
| :--- | :--- | :--- |
| **Paper Leakage** | Insiders, storage breaches, or transport leaks before exam start. | **Symmetric AES-GCM Simulation**: Papers are encrypted at generation. Backend time-lock check denies decryption key release until `current_time >= exam_start_time`. |
| **Center Compromise** | Early paper access or collusion at specific locations. | **Center-Bound Packages**: Decryption keys are strictly bound to a `center_id`. Packages are sealed and validated locally. |
| **Candidate Impersonation** | Proxy attempts or identity document forgery. | **Encrypted QR Stamps**: Candidate identity, exam metadata, and center bounds are encrypted and stamped on printable physical covers. |
| **OMR Sheet Tampering** | Replacing or modifying sheets after the exam. | **OpenCV Density Extraction**: Real-time CV pixel counting aligns grids and determines selected bubble choices, flagging skipped and ambiguous marks. |
| **Descriptive Script Swap** | Replacing pages in written booklets during transit. | **Page-wise Hashing**: Each uploaded page is hashed. Booklet ID is mapped to candidate `anonymous_id` hashes to remove evaluator bias. |
| **Descriptive Marks Tampering** | Manipulating grades before publishing. | **Locked Grading Hashes**: Evaluator grades are sealed and hashed as $\text{SHA256}(\text{exam} + \text{anon\_id} + \text{marks} + \text{evaluator\_id})$. Any direct database edits mismatch the signature. |
| **Database Intrusion (Insider)** | System administrators editing results or candidate answers directly in SQL. | **Hash-Chained Audit Ledger**: Every log is linked cryptographically to the preceding log block. Any alteration breaks the chain sequence. |

---

## 3. Technology Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Vanilla CSS variables.
- **Backend**: FastAPI (Python 3.14), SQLAlchemy ORM, SQLite.
- **Ingestion**: OpenCV (Python), qrcode.
- **AI Engine**: google-generativeai (Gemini 1.5 Flash).

---

## 4. Setup & Installation

### 4.1 Backend Server Setup
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

### 4.2 Run Integration Verification Tests
We have prepared two integration test suites:
- **E2E Core Verifier Test**:
  ```bash
  python test_api_flow.py
  ```
- **OpenCV & AI Ingestion Test**:
  ```bash
  python test_v02_pipeline.py
  ```

### 4.3 Frontend Development Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Start the development runner:
   ```bash
   npm run dev
   ```
   *Frontend running at `http://localhost:3000`*
