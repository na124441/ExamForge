from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.db.session import auto_migrate_sqlite_schema
import app.models as models # Register models with Base

# Import Routers
from app.auth.routes import router as auth_router
from app.questions.routes import router as questions_router
from app.candidates.routes import router as candidates_router
from app.ingestion.routes import router as ingestion_router
from app.results.routes import router as results_router
from app.exams.lifecycle import router as lifecycle_router
from app.packages.center_package import router as package_router
from app.verification.routes import router as verification_router
from app.incidents.routes import router as incidents_router
from app.ops.routes import router as ops_router
from app.audit.timeline import router as timeline_router
from app.written.routes import router as written_router
from app.rubrics.routes import router as rubrics_router
from app.evaluation.routes import router as evaluation_router
from app.omr_review.routes import router as omr_review_router
from app.evaluation_analytics.routes import router as evaluation_analytics_router
from app.transparency.routes import router as transparency_router
from app.certificates.routes import router as certificates_router
from app.disputes.routes import router as disputes_router
from app.evidence.routes import router as evidence_router
from app.reports.routes import router as reports_router
from app.institutions.routes import router as institutions_router
from app.access.routes import router as access_router
from app.policies.routes import router as policies_router
from app.templates.routes import router as templates_router
from app.centers.routes import router as centers_router
from app.keyspace.routes import router as keyspace_router
from app.audit_namespace.routes import router as audit_namespace_router


from app.tenancy.tenant_middleware import TenantMiddleware
from app.observability.request_id import RequestIDMiddleware

# Import Version 0.8 Routers
from app.jobs.routes import router as jobs_router
from app.storage.routes import router as storage_router
from app.observability.routes import router as observability_router
from app.backup.routes import router as backup_router
from app.security_ops.routes import router as security_router

# Import Version 0.9 Routers
from app.security_review.routes import router as security_review_router
from app.data_governance.routes import router as data_governance_router
from app.privacy.routes import router as privacy_router
from app.approvals.routes import router as approvals_router
from app.security_hardening.routes import router as security_hardening_router
from app.key_lifecycle.routes import router as key_lifecycle_router
from app.access_review.routes import router as access_review_router
from app.retention.routes import router as retention_router
from app.security_incidents.routes import router as security_incidents_router
from app.compliance.routes import router as compliance_router

# Import Version 1.0 Routers
from app.pilot.routes import router as pilot_router
from app.authority.routes import router as authority_router
from app.docs_support.api_tags import TAGS_METADATA

# Import Version 2.0 Enterprise Routers
from app.warroom.router import router as warroom_router
from app.ai_security.routes import router as ai_security_router
from app.crypto_vault.routes import router as crypto_vault_router

try:
    from app.ops.real_attack_engine import router as real_attack_router
except ImportError:
    real_attack_router = None

from app.vendors.routes import router as vendors_router
from app.safebatch.routes import router as safebatch_router
from app.pentest.routes import router as pentest_router

from app.security_hardening.headers import SecurityHeadersMiddleware

# Initialize SQLite tables and auto-migrate missing columns on startup
Base.metadata.create_all(bind=engine)
auto_migrate_sqlite_schema(engine, Base)

app = FastAPI(
    title="ExamForge API",
    description="Zero-Trust Examination Security Infrastructure API",
    version="1.0.0",
    openapi_tags=TAGS_METADATA
)

# Request ID tracing middleware, then Tenancy isolation middleware, then CORS, then Security Headers
app.add_middleware(RequestIDMiddleware)
app.add_middleware(TenantMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.auth.v1_routes import router as auth_v1_router
from app.identity.routes import router as identity_router
from app.messaging.vendor_routes import router as vendor_messaging_router
from app.exams.routes import router as exam_catalogs_router
from app.payments.routes import router as payments_router

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(exam_catalogs_router)
app.include_router(payments_router)
app.include_router(auth_v1_router)
app.include_router(identity_router)
app.include_router(vendor_messaging_router)
app.include_router(questions_router)
app.include_router(candidates_router)
app.include_router(ingestion_router)
app.include_router(results_router)
app.include_router(lifecycle_router)
app.include_router(package_router)
app.include_router(verification_router)
app.include_router(incidents_router)
app.include_router(ops_router)
app.include_router(timeline_router)
app.include_router(written_router)
app.include_router(rubrics_router)
app.include_router(evaluation_router)
app.include_router(omr_review_router)
app.include_router(evaluation_analytics_router)
app.include_router(transparency_router)
app.include_router(certificates_router)
app.include_router(disputes_router)
app.include_router(evidence_router)
app.include_router(reports_router)
app.include_router(institutions_router)

app.include_router(access_router)
app.include_router(policies_router)
app.include_router(templates_router)
app.include_router(centers_router)
app.include_router(keyspace_router)
app.include_router(audit_namespace_router)

# Version 0.8 Routers
app.include_router(jobs_router)
app.include_router(storage_router)
app.include_router(observability_router)
app.include_router(backup_router)
app.include_router(security_router)

# Version 0.9 Routers
app.include_router(security_review_router)
app.include_router(data_governance_router)
app.include_router(privacy_router)
app.include_router(approvals_router)
app.include_router(security_hardening_router)
app.include_router(key_lifecycle_router)
app.include_router(access_review_router)
app.include_router(retention_router)
app.include_router(security_incidents_router)
app.include_router(compliance_router)

# Version 1.0 Routers
app.include_router(pilot_router)
app.include_router(authority_router)
app.include_router(vendors_router)

# Version 2.0 Enterprise Routers
app.include_router(warroom_router)
app.include_router(ai_security_router)
app.include_router(crypto_vault_router)
if real_attack_router is not None:
    app.include_router(real_attack_router)
app.include_router(pentest_router)
app.include_router(safebatch_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ExamForge API Core",
        "database_connected": True
    }

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the ExamForge Zero-Trust Examination Infrastructure API",
        "docs_url": "/docs"
    }
