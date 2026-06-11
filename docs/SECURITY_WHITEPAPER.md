# ExamForge Security Whitepaper (Version 1.0)

## 1. ExamForge Security Philosophy
ExamForge is designed under a zero-trust model: **institutions should not blindly trust administrators, exam centers, evaluators, or databases.** Instead, every critical transition is made verifiable through cryptography, digital signatures, hash chains, operational gates, and Candidate-facing proof.

---

## 2. Zero-Trust Examination Model
In standard examination setups, database administrators can alter marks directly, center officers can leak papers, and evaluators can introduce bias or modify transcripts. ExamForge mitigates these threats by establishing immutable audit namespaces, sealing exam packages early, enforcing dual-authorizer signatures, and tracking candidate session answers using chained SHA-256 hashes.

---

## 3. Threat Model
The platform catalog tracks pipeline vulnerabilities:
- **`QUESTION_BANK_LEAKAGE`**: Prevented by sealing paper sets early and encrypting center packages.
- **`PAPER_RELEASE_ABUSE`**: Prevented by locking keys and requiring dual-approval releases.
- **`OMR_TAMPERING`**: Blocked by logging bubble coordinates and requiring auditor sign-offs on reviews.
- **`CROSS_TENANT_DATA_LEAK`**: Blocked by Tenant Isolation middleware validating memberships.

---

## 4. Cryptographic Chain of Custody
Every action generates a receipt. The signature of the receipt is computed over the event hash using ECDSA (secp256k1) keys, linking the preceding event to the current state. Breaking any node in the chain alerts the auditor and blocks the publication gate.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Setup Exam  │ ──> │ Paper Gen    │ ──> │ Package Seal │
│  (Hash: A)   │     │ (Hash: A+B)  │     │ (Hash: B+C)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 5. Paper Generation and Release Security
Papers are generated in a draft state. Content hashes are computed immediately. Decryption keys are sealed inside packages and released only during the scheduled policy window, requiring two privileged controller/administrator sign-offs.

---

## 6. Candidate Verification Security
Identity check-ins register biometric check logs signed by the invigilator. Candidates are bound to specific room and seat configurations, which are locked to prevent seat manipulation.

---

## 7. Answer Capture Integrity
Candidates receive receipts for submitted answer scripts. OMR bubbles coordinate arrays are hashed, preventing manual database adjustments from modifying the results.

---

## 8. Evaluation Integrity
Descriptive pages are anonymized, randomized, and assigned to two evaluators. Mismatches exceeding the policy variance trigger a senior reviewer conflict override. The evaluation lifecycle is sealed inside `MarksChainEvent` hashes.

---

## 9. Result Publication Gate
A gate validation checklist runs before publication. Marks can only be released if:
- Composite trust score is above policy threshold.
- No P0 incidents are unresolved.
- Signing key is active and intact.
- Audit namespace integrity is verified.

---

## 10. Audit Ledger Design
Audit events are recorded in an append-only table. The database computes `next_hash = SHA256(prev_hash + current_event_data)`. If any historical row is modified, the audit validator flags the anomaly and locks the system.

---

## 11. Multi-Tenant Isolation
FastAPI middleware intercepts requests, extracts the active tenant context, and appends filter clauses (`institution_id == tenant_id`) to all database queries.

---

## 12. Key Lifecycle
Keys transition sequentially: `ACTIVE` -> `ROTATED` -> `ARCHIVED`. If a key is marked `COMPROMISED`, a P0 incident is logged, and new signature creation is blocked immediately.

---

## 13. Privacy and PII Redaction
Sensitive columns are redacted based on the requester's role:
- Evaluator Safe: Removes candidate names, emails, photos, and center details.
- Candidate Safe: Hides evaluator names and internal rubrics metrics.

---

## 14. Dispute and Evidence System
Disputes are processed with audit log notes. Result revisions create new version chains, preserving the original version's hash signature for verification.

---

## 15. Deployment Security
Startup guards block execution if default credentials or insecure connections are utilized. IP rate limiters log warning incidents on authentication brute-force spikes.

---

## 16. Limitations and Future Work
Current versions mock biological biometric verification and physical HSM hardware integrations. Future enterprise releases will support anchoring audit chain roots to public distributed ledgers and hardware security modules (HSMs).
