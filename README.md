# ExamForge

ExamForge is a zero-trust examination security platform for managing high-stakes exam lifecycles. It covers paper generation, center package release, candidate verification, OMR and written answer ingestion, double evaluation, result publication, dispute handling, certificates, evidence binders, and authority-level oversight.

The current codebase is the v1.0 AuthorityPilot build. It adds a guided 15-stage pilot workflow, executive dashboards, institutional evidence binders, expanded security hardening, deployment operations, and a large FastAPI route surface documented through OpenAPI.

## Repository Layout

```text
ExamForge/
  backend/                 FastAPI API, SQLAlchemy models, security, jobs, storage
  frontend/                Next.js app router frontend
  docs/                    Architecture, API, deployment, security, pilot docs
  postman/                 Postman collection for API testing
  EXAMFORGE_V1_REPORT.md   v1.0 AuthorityPilot validation summary
```

## Backend

The backend is a FastAPI application in `backend/app/main.py`. It uses SQLAlchemy for persistence, Pydantic for request and response models, JWT sessions, cryptographic helpers, object storage adapters, optional Redis/Celery infrastructure, and modular routers grouped by operational domain.

Core backend layers:

- `app/main.py`: FastAPI entry point, middleware registration, router registration, health endpoints, OpenAPI metadata.
- `app/models.py`: Shared SQLAlchemy domain model definitions.
- `app/database.py` and `app/db/`: database engine/session setup, PostgreSQL support, migrations, health checks, transaction helpers.
- `app/config/`: settings, environment loading, deployment mode validation, secret handling.
- `app/auth/`: login, current-user lookup, role guards, JWT integration.
- `app/tenancy/`: tenant context, tenant middleware, scoped query helpers, cross-tenant isolation errors/tests.
- `app/audit/` and `app/audit_namespace/`: append-only event ledger, timeline explanations, institution audit namespaces.
- `app/trust/` and `app/publication/`: trust score calculation and publication gate validation.
- `app/keyspace/` and `app/key_lifecycle/`: signing/decryption key domains, rotation, revocation, compromised-key handling.
- `app/storage/`: local, S3, and MinIO storage clients, file hashing, signed URL support.
- `app/jobs/`: Celery app, queue declarations, async OMR/report/certificate/audit jobs, job status APIs.
- `app/observability/`: request IDs, metrics, logging, tracing, live/ready/deep health.
- `app/security_*`, `app/privacy/`, `app/data_governance/`, `app/compliance/`, `app/retention/`: threat tracking, hardening checks, secure headers, PII redaction, asset classification, compliance reports, data retention.
- `app/pilot/` and `app/authority/`: v1.0 pilot seeding, guided workflow, evidence binder generation, executive dashboard.

## Internal Architecture

ExamForge is organized around a verifiable exam lifecycle:

1. Institutions, users, roles, centers, policies, templates, and keys are configured.
2. Question blueprints and papers are generated, sealed, and bound to center packages.
3. Candidate admit cards, seating, attendance, and verification events are recorded.
4. OMR scans and written booklets are ingested with hashes and review queues.
5. Written copies are anonymized, assigned, double-evaluated, conflict-reviewed, and locked.
6. Trust scores, audit namespace integrity, incidents, key state, and gate policies are checked before publication.
7. Results, certificates, public proofs, receipts, disputes, evidence packets, and reports remain independently verifiable.

Middleware is part of the security architecture:

- `RequestIDMiddleware` assigns trace IDs to requests for log correlation.
- `TenantMiddleware` establishes active institution context and prevents cross-tenant access.
- `SecurityHeadersMiddleware` adds browser-facing hardening headers.
- CORS is currently permissive for development and should be narrowed in production through deployment configuration.

## Security Measures

ExamForge is built around zero-trust assumptions: database rows, administrators, centers, evaluators, and result publication workflows are not treated as implicitly trustworthy.

Implemented controls include:

- Password hashing with PBKDF2-SHA256 and per-password random salts.
- JWT access tokens signed with the configured `SECRET_KEY`.
- Role-based route protection through `RoleChecker`.
- Denied authorization attempts logged to the audit ledger.
- SHA-256 hashing utilities for receipts, pages, packages, reports, and evidence artifacts.
- AES-GCM helper functions for encrypted package payloads and simulated time-lock release flows.
- Append-only audit chains where later events depend on previous hashes.
- Tenant isolation middleware and scoped tenant helpers for institution-level data separation.
- Dual-control approval workflows for sensitive operations.
- Key lifecycle state tracking for active, rotated, revoked, archived, and compromised keys.
- Security headers middleware and upload validation checks.
- Rate-limit and abuse-monitoring routes under ops/security modules.
- PII redaction and export validation for privacy-sensitive views.
- Retention policy, legal hold, and deletion dry-run flows.
- Backup manifest creation, verification, and restore dry-runs.
- Publication gates that check trust score, incidents, signing key health, and audit integrity before result release.

For production, replace development defaults such as `SECRET_KEY`, tighten `CORS_ORIGINS`, configure a production database, and use real signing key management instead of mock modes.

## Network Routes

The API runs on FastAPI and exposes interactive docs at:

- `GET /docs`
- `GET /openapi.json`
- `GET /api/health`

Main API route families:

- Auth: `/api/auth/login`, `/api/auth/me`
- Questions and papers: `/api/questions`, `/api/exams/{exam_id}/blueprint`, `/api/exams/{exam_id}/generate-paper`
- Exam lifecycle and packages: `/api/exams/{exam_id}/state`, `/api/exams/{exam_id}/transition`, `/api/packages/*`
- Candidates and sessions: `/api/candidates/*`, `/api/sessions/*`, `/api/receipts/verify`
- Center operations: `/api/center/*`, `/api/centers/*`
- OMR and ingestion: `/api/omr/scans/upload`, `/api/omr/review-*`
- Written booklets: `/api/written/booklets/*`
- Evaluation: `/api/evaluation/*`
- Evaluation analytics: `/api/evaluation/analytics/*`
- Results and publication: `/api/exams/{exam_id}/publish-results`, `/api/exams/{exam_id}/gate-status`, `/api/results/*`
- Trust, risk, and audit: `/api/trust/*`, `/api/risk/*`, `/api/audit/*`, `/api/audit-namespaces/*`
- Institutions and access: `/api/institutions/*`, `/api/access/*`, `/api/access-review/*`
- Policies, templates, rubrics: `/api/policies/*`, `/api/templates/*`, `/api/rubrics/*`
- Key management: `/api/keyspace/*`, `/api/keys/*`
- Certificates and public verification: `/api/certificates/*`, `/api/transparency/*`
- Disputes: `/api/disputes/*`, `/api/dispute-ops/*`
- Evidence and reports: `/api/evidence/*`, `/api/reports/*`
- Storage and jobs: `/api/storage/*`, `/api/jobs/*`
- Ops and observability: `/api/ops/*`, `/health/live`, `/health/ready`, `/health/deep`
- Security and compliance: `/api/security/*`, `/api/security-incidents/*`, `/api/privacy/*`, `/api/retention/*`, `/api/compliance/*`, `/api/approvals/*`
- Pilot and authority: `/api/pilot/*`, `/api/authority/dashboard`

Use the Postman collection at `postman/ExamForge_v1.postman_collection.json` for grouped API exploration.

## Frontend

The frontend is a Next.js App Router application in `frontend/src/app`. It includes consoles for candidates, evaluators, controllers, auditors, centers, institutions, security teams, operations, authority users, and public verification flows.

Important frontend routes include:

- `/pilot-run`: guided 15-stage AuthorityPilot workflow.
- `/authority`: executive readiness and trust dashboard.
- `/platform-admin`, `/institutions`, `/institution-users`, `/role-matrix`: institution and access administration.
- `/exam-ops`, `/exam-templates`, `/publication-gate`: exam setup and release operations.
- `/center-console`, `/centers`, `/seat-map`: center operations.
- `/omr-review`, `/evaluator`, `/evaluation-ops`, `/evaluation-conflicts`, `/marks-chain`: evaluation workflows.
- `/result-portal`, `/result-integrity/[result_id]`, `/result-versions/[result_id]`: result transparency.
- `/verify-certificate/[certificate_id]`, `/receipt-verify`: public verification.
- `/disputes`, `/dispute-ops`: dispute filing and operations.
- `/security/*` and `/ops/*`: hardening, keys, incidents, privacy, retention, metrics, health, jobs, storage, backups.

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed_v10_authority_pilot.py
uvicorn app.main:app --reload --port 8000
```

On macOS/Linux, activate the virtual environment with:

```bash
source .venv/bin/activate
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`
- Backend health: `http://localhost:8000/api/health`

## Configuration

Backend settings are loaded from environment variables through `backend/app/config/settings.py`.

Common settings:

- `DATABASE_URL`: defaults to `sqlite:///./examforge.db`.
- `REDIS_URL`: defaults to `redis://localhost:6379/0`.
- `SECRET_KEY`: JWT and local crypto root secret. Must be changed outside development.
- `STORAGE_BACKEND`: `LOCAL`, `S3`, or `MINIO`.
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`: object storage settings.
- `DEPLOYMENT_MODE`: `SAAS` or `ON_PREMISE`.
- `CORS_ORIGINS`: allowed browser origins.
- `RATE_LIMIT_ENABLED`, `OBSERVABILITY_ENABLED`, `BACKUP_ENABLED`: operational feature toggles.
- `SIGNING_KEY_MODE`: `MOCK` or signing implementation mode.

## Verification

Backend test suites:

```bash
cd backend
pytest
```

Focused v1.0 pilot validation:

```bash
cd backend
pytest test_v10_authoritypilot.py
```

Frontend build:

```bash
cd frontend
npm run build
```

The v1.0 report records successful AuthorityPilot validation and frontend static generation in `EXAMFORGE_V1_REPORT.md`.

## Documentation

Additional documentation:

- `docs/ARCHITECTURE.md`
- `docs/API_REFERENCE.md`
- `docs/SECURITY_WHITEPAPER.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/PILOT_DEMO_SCRIPT.md`
- `docs/TROUBLESHOOTING.md`
