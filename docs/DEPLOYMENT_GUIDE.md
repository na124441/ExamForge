# ExamForge Deployment & Operations Guide

This document covers configurations for local development, production-like Docker setups, SaaS multi-tenant cloud platforms, on-premise deployments, and hybrid delivery modes.

---

## 1. System Architecture

```
                                  [ HTTPS / TLS ]
                                         │
                                   ┌─────▼─────┐
                                   │  Nginx /  │
                                   │  Traefik  │
                                   └─────┬─────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                   ┌─────▼─────┐                   ┌─────▼─────┐
                   │  FastAPI  │                   │  Next.js  │
                   │  Backend  │                   │  Frontend │
                   └─────┬─────┘                   └───────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
   ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
   │PostgreSQL │   │   Redis   │   │ MinIO /   │
   │ Database  │   │ Cache/Lock│   │ S3 Storage│
   └───────────┘   └───────────┘   └───────────┘
```

---

## 2. Deployment Delivery Modes

### 1. Local Development (Single-Host)
* **Backend**: FastAPI with Uvicorn development server (`uvicorn app.main:app --reload`).
* **Frontend**: Next.js with development server (`npm run dev`).
* **Database**: Local SQLite instance (`examforge.db`).
* **Caching**: Redis client running on `localhost:6379` with in-memory cache fallbacks active.

### 2. Docker Compose (Production-Like Sandbox)
Deploys Postgres, Redis, MinIO, Celery Workers, Backend API, and Next.js static builds under isolated subnets.
```bash
docker-compose up --build
```

### 3. Enterprise SaaS Cloud Delivery
* **Container Orchestration**: AWS ECS (Fargate) or GCP Cloud Run.
* **Database**: Managed PostgreSQL (Amazon RDS / Cloud SQL) with automatic regional replicas.
* **Storage**: Amazon S3 / Google Cloud Storage with versioning and legal hold configurations.
* **Key Management**: Keyspace rotation integrated with Cloud KMS or HashiCorp Vault.

### 4. Air-Gapped On-Premise Model
* Target: Local university/school servers.
* Delivery: Single fat Docker image bundle or Kubernetes (K3s) local installer.
* Encryption: Packages sealed locally. Decryption key releases occur offline via physical dual-signature USB logs.

### 5. Hybrid Central-Local Delivery (Recommended for Boards)
* **Central Hub (Cloud SaaS)**: Hosts the controller dashboard, policy template registry, and candidate dispute portal.
* **Local Centers (Edge Nodes)**: Hosts the seat map scanner, candidate verification console, and booklet OMR ingestion terminal.
* **Security Control**: Edge nodes verify candidate biometrics locally and upload only metadata SHA-256 event receipts back to the central hub.

---

## 3. Operations & Observability

### Health Checks
- Live, Ready, and Deep checks verify sub-system integrations:
  - `/health/live`: Basic backend connectivity.
  - `/health/deep`: Verifies database connection pools, Redis read/writes, S3 bucket storage checks, and keyspace statuses.

### Backup and Restore
1. **Trigger Backup Manifest**:
   `POST /api/backup/create` -> archives PostgreSQL tables, S3 assets, and logs with matching checksums.
2. **Verify Restore Dry-Run**:
   `POST /api/restore/dry-run` -> validates file formats and schema migrations without overwriting live records.
