# ExamForge System Architecture Guide

This document describes the directory structures, sub-systems, and backend module layouts.

---

## 1. Directory Structure

```
ExamForge/
├── backend/
│   ├── app/
│   │   ├── authority/          # Executive dashboard APIs
│   │   ├── pilot/              # Pilot run stage engines & evidence binders
│   │   ├── docs_support/       # OpenAPI/Swagger tags and error codes
│   │   ├── main.py             # FastAPI entrypoint
│   │   ├── models.py           # Database models
│   │   └── ...                 # Previous version sub-systems
│   ├── test_v10_authoritypilot.py  # E2E test file
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── authority/      # Executive console portal
│   │   │   ├── pilot-run/      # Guided workflow panel
│   │   │   └── ...             # Previous version portals
│   └── ...
└── docs/
    ├── API_REFERENCE.md
    ├── DEPLOYMENT_GUIDE.md
    ├── SECURITY_WHITEPAPER.md
    ├── PILOT_DEMO_SCRIPT.md
    └── ARCHITECTURE.md
```

---

## 2. Core Modules

### 1. Tenancy Isolation Layer (`app/tenancy/`)
Appends tenant filters (`institution_id == context_tenant`) to prevent data leakage between exam bodies.

### 2. Secrets Keyspace & Rotation (`app/keyspace/`, `app/key_lifecycle/`)
Generates signing and decryption keys, tracking their transition states (ACTIVE, ROTATED, COMPROMISED).

### 3. Trust Score Engine & Gates (`app/trust/`, `app/publication/`)
Calculates composite integrity scores and asserts checklist constraints before publishing results.

### 4. Interactive Pilot Run (`app/pilot/`)
Maintains the 15-stage workflow state machine and compiles signed, institutional-level evidence binders.
