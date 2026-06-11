# ExamForge API Reference (Version 1.0)

Welcome to the ExamForge API reference guide. ExamForge is a zero-trust examination security infrastructure. Every API request is structured around multi-tenant isolation, cryptographic audit trails, and strict role-based access control.

---

## 1. Authentication & Headers

All authenticated routes require a JSON Web Token (JWT) sent via the `Authorization` header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

To configure tenant boundaries, requests also support the tenant scope header.

---

## 2. Core API Endpoints

### 1. Authentication
* **`POST /api/auth/login`**: Authenticate credentials and retrieve JWT.
  * *Request Body*: `{"email": "controller@example.com", "password": "password123"}`
  * *Response*: `{"access_token": "...", "token_type": "bearer", "role": "CONTROLLER"}`

### 2. Institutions & Tenancy
* **`POST /api/institutions/create`**: Create a new tenant. (Super Admin only)
  * *Request Body*: `{"name": "National Scholarship Board", "tenant_slug": "nsb", "deployment_mode": "SAAS", "data_region": "IN"}`
* **`GET /api/institutions/{id}`**: Retrieve tenant profile.

### 3. Policies & Blueprints
* **`POST /api/policies/create`**: Create a new integrity policy constraint.
  * *Request Body*: `{"trust_threshold": 95.0, "requires_double_evaluation": true}`
* **`POST /api/templates/create`**: Create an exam blueprint configuration.

### 4. Exam Lifecycle & Paper Generation
* **`POST /api/exams/create`**: Initialize a new exam instance.
* **`POST /api/exams/{id}/generate-paper`**: Generate paper set content hashes.
* **`POST /api/exams/{id}/seal-package`**: Cryptographically seal booklet packages.

### 5. Candidates & Verification
* **`POST /api/candidates/verify`**: Register biometric check-in verification log.
* **`GET /api/candidates/seat-map`**: Query locked seat layout matrix.

### 6. Answer Ingestion & Evaluation
* **`POST /api/written/upload`**: Upload scanned descriptive booklets. Magic bytes verified.
* **`POST /api/evaluation/submit-marks`**: Submit evaluator marks. Triggers double evaluation variance conflict rules.
* **`POST /api/evaluation/resolve-conflict`**: Senior controller override for score conflicts.

### 7. Results & Verification
* **`GET /api/exams/{id}/gate-status`**: Check publication gate readiness checks.
* **`POST /api/exams/{id}/publish`**: Seal results and publish candidate result certificates.
* **`GET /api/certificates/verify/{cert_id}`**: Public cryptographic verify endpoint.

### 8. Disputes & Revised Results
* **`POST /api/disputes/file`**: Candidate files a result revision dispute.
* **`POST /api/disputes/{id}/resolve`**: Resolve dispute and append revised version chain.

### 9. Audits & Security
* **`GET /api/audit-namespace/verify`**: Validate audit logs ledger SHA-256 chain integrity.
* **`POST /api/compliance/report/generate`**: Compile and sign ECDSA compliance report.
* **`POST /api/compliance/pentest/simulate`**: Simulate attack vectors (SQLi, brute-force).

### 10. Pilot Runs
* **`POST /api/pilot/runs`**: Initialize stage run.
* **`POST /api/pilot/runs/{run_id}/stages/{stage_id}/advance`**: Advance stage.
* **`POST /api/pilot/evidence-binder/generate`**: Compile signed institutional binder.

---

## 3. Standard Error Codes

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `AUTH_FAILED` | 401 | Invalid login credentials. |
| `PERMISSION_DENIED` | 403 | Insufficient RBAC privileges. |
| `CROSS_TENANT_LEAK` | 403 | Tenant boundaries violation blocked. |
| `AUDIT_LEDGER_BROKEN`| 500 | Audit logs tamper detection triggered. |
| `LEGAL_HOLD_ACTIVE` | 400 | Data retention hold prevents deletion. |
