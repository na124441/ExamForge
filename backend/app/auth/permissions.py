"""
Canonical Roles and Permissions for ExamForge Zero-Trust Architecture.
Single source of truth for backend RBAC and API authorization.
"""

from enum import Enum
from typing import Dict, Set, List

class CanonicalRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    PLATFORM_ADMIN = "PLATFORM_ADMIN"
    TENANT_ADMIN = "TENANT_ADMIN"
    CONTROLLER = "CONTROLLER"
    SECURITY_ADMIN = "SECURITY_ADMIN"
    CISO = "CISO"
    AUDITOR = "AUDITOR"
    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER"
    SENIOR_EVALUATOR = "SENIOR_EVALUATOR"
    EVALUATOR = "EVALUATOR"
    OFFICER = "OFFICER"
    INVIGILATOR = "INVIGILATOR"
    DISPUTE_OFFICER = "DISPUTE_OFFICER"
    VENDOR = "VENDOR"
    SECURITY_AUDITOR = "SECURITY_AUDITOR"
    OPS_ENGINEER = "OPS_ENGINEER"
    DEVOPS = "DEVOPS"
    CANDIDATE = "CANDIDATE"

# --- Master Permissions Catalog ---
ALL_PERMISSIONS: Set[str] = {
    # Public verification
    "certificate.verify.public",
    "result.verify.public",
    "receipt.verify.public",

    # Candidate self domain
    "candidate.read.self",
    "candidate.update.self",
    "identity.verification.execute.self",
    "exam.read.assigned",
    "exam.attempt",
    "exam.submit",
    "result.read.self",
    "result.integrity.read.self",
    "result.versions.read.self",
    "certificate.read.self",
    "dispute.create.self",
    "dispute.read.self",
    "dispute.update.self",

    # Examination & Question Bank domain
    "exam.read.tenant",
    "exam.read.all",
    "exam.create",
    "exam.update",
    "exam.delete",
    "exam.control",
    "exam.state.transition",
    "exam.publish",
    "question-bank.read",
    "question-bank.create",
    "question-bank.update",
    "question-bank.lock",
    "question-bank.generate-ai",

    # Center & Invigilation domain
    "center.read.tenant",
    "center.read.assigned",
    "center.create",
    "center.update",
    "center.onboard",
    "center.console.manage",
    "center.keys.ceremony",
    "center.verify.candidate",
    "center.seat.manage",
    "center.omr.scan",

    # Evaluation domain
    "evaluation.read.assigned",
    "evaluation.read.tenant",
    "evaluation.assign",
    "evaluation.grade.submit",
    "evaluation.conflict.resolve",
    "evaluation.analytics.read",
    "evaluation.marks-chain.read",
    "evaluation.omr.review",

    # Results, Credentials & Disputes domain
    "result.read.tenant",
    "result.read.all",
    "result.integrity.read.tenant",
    "result.versions.read.tenant",
    "result.publish.gate.manage",
    "certificate.read.tenant",
    "certificate.read.all",
    "dispute.read.tenant",
    "dispute.read.all",
    "dispute.ops.manage",
    "dispute.resolve",

    # Audit & Evidence domain
    "audit.ledger.read",
    "audit.export",
    "audit.evidence.read",
    "audit.report.read",
    "audit.tenant-isolation.read",

    # Security & Governance domain
    "security.read",
    "security.command.execute",
    "security.hardening.read",
    "security.threat-model.read",
    "security.incident.manage",
    "security.keys.read",
    "security.keys.manage",
    "security.approvals.execute",
    "security.access-review.manage",
    "security.assets.read",
    "security.privacy.manage",
    "security.retention.manage",
    "security.compliance.read",
    "security.pentest.execute",

    # Tenant & Platform domain
    "platform.admin.manage",
    "tenant.cross.read",
    "tenant.cross.manage",
    "institution.read.all",
    "institution.read.tenant",
    "institution.create",
    "institution.update",
    "institution.users.manage",
    "institution.settings.manage",
    "role-matrix.read",
    "role-matrix.manage",
    "communication.broadcast",

    # Ops & Infrastructure domain
    "ops.read",
    "ops.health.read",
    "ops.metrics.read",
    "ops.jobs.read",
    "ops.jobs.manage",
    "ops.config.read",
    "ops.storage.read",
    "ops.rate-limits.manage",
    "ops.backups.manage",
    "ops.maintenance.manage",

    # Vendor domain
    "vendor.read",
    "vendor.manage",
}

# --- Role-to-Permissions Mapping ---
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    # 1. SUPER_ADMIN: Gets all permissions explicitly defined in catalog + cross-tenant capabilities
    CanonicalRole.SUPER_ADMIN.value: set(ALL_PERMISSIONS),

    # 2. PLATFORM_ADMIN: SaaS multi-tenant platform administrator
    CanonicalRole.PLATFORM_ADMIN.value: {
        "platform.admin.manage",
        "institution.read.all",
        "institution.create",
        "institution.update",
        "role-matrix.read",
        "role-matrix.manage",
        "audit.tenant-isolation.read",
        "audit.ledger.read",
        "security.read",
    },

    # 3. TENANT_ADMIN: Institutional tenant administrator
    CanonicalRole.TENANT_ADMIN.value: {
        "institution.read.tenant",
        "institution.users.manage",
        "institution.settings.manage",
        "role-matrix.read",
        "communication.broadcast",
        "exam.read.tenant",
        "audit.report.read",
        "audit.ledger.read",
        "security.read",
    },

    # 4. CONTROLLER: Exam lifecycle controller
    CanonicalRole.CONTROLLER.value: {
        "exam.read.tenant",
        "exam.create",
        "exam.update",
        "exam.delete",
        "exam.control",
        "exam.state.transition",
        "exam.publish",
        "question-bank.read",
        "question-bank.create",
        "question-bank.update",
        "question-bank.lock",
        "question-bank.generate-ai",
        "center.read.tenant",
        "center.create",
        "center.update",
        "center.seat.manage",
        "evaluation.read.tenant",
        "evaluation.assign",
        "evaluation.conflict.resolve",
        "evaluation.analytics.read",
        "evaluation.marks-chain.read",
        "evaluation.omr.review",
        "result.read.tenant",
        "result.integrity.read.tenant",
        "result.versions.read.tenant",
        "result.publish.gate.manage",
        "certificate.read.tenant",
        "dispute.read.tenant",
        "dispute.ops.manage",
        "dispute.resolve",
        "audit.ledger.read",
        "audit.evidence.read",
        "security.read",
        "security.approvals.execute",
        "communication.broadcast",
        "vendor.read",
    },

    # 5. SECURITY_ADMIN: Security operations and key manager
    CanonicalRole.SECURITY_ADMIN.value: {
        "security.read",
        "security.command.execute",
        "security.hardening.read",
        "security.threat-model.read",
        "security.incident.manage",
        "security.keys.read",
        "security.keys.manage",
        "security.approvals.execute",
        "security.access-review.manage",
        "security.assets.read",
        "security.privacy.manage",
        "security.retention.manage",
        "security.compliance.read",
        "security.pentest.execute",
        "audit.ledger.read",
        "audit.tenant-isolation.read",
        "center.read.tenant",
    },

    # 6. CISO: Executive security officer
    CanonicalRole.CISO.value: {
        "security.read",
        "security.command.execute",
        "security.hardening.read",
        "security.threat-model.read",
        "security.incident.manage",
        "security.keys.read",
        "security.keys.manage",
        "security.access-review.manage",
        "security.assets.read",
        "security.privacy.manage",
        "security.retention.manage",
        "security.compliance.read",
        "audit.report.read",
        "audit.ledger.read",
        "audit.evidence.read",
    },

    # 7. AUDITOR: Independent auditor (Forensic Read-Only)
    CanonicalRole.AUDITOR.value: {
        "audit.ledger.read",
        "audit.export",
        "audit.evidence.read",
        "audit.report.read",
        "audit.tenant-isolation.read",
        "exam.read.tenant",
        "evaluation.marks-chain.read",
        "result.integrity.read.tenant",
        "result.versions.read.tenant",
        "certificate.read.tenant",
        "security.read",
        "security.hardening.read",
        "security.threat-model.read",
    },

    # 8. COMPLIANCE_OFFICER: Regulatory compliance & privacy
    CanonicalRole.COMPLIANCE_OFFICER.value: {
        "security.compliance.read",
        "security.privacy.manage",
        "security.retention.manage",
        "audit.report.read",
        "audit.evidence.read",
        "audit.ledger.read",
    },

    # 9. SENIOR_EVALUATOR: Senior subjective evaluator with conflict arbitration
    CanonicalRole.SENIOR_EVALUATOR.value: {
        "evaluation.read.assigned",
        "evaluation.read.tenant",
        "evaluation.grade.submit",
        "evaluation.conflict.resolve",
        "evaluation.omr.review",
    },

    # 10. EVALUATOR: Double-blind subjective grader (Assigned copy only)
    CanonicalRole.EVALUATOR.value: {
        "evaluation.read.assigned",
        "evaluation.grade.submit",
        "evaluation.omr.review",
    },

    # 11. OFFICER: Center Superintendent
    CanonicalRole.OFFICER.value: {
        "center.read.tenant",
        "center.read.assigned",
        "center.create",
        "center.update",
        "center.onboard",
        "center.console.manage",
        "center.keys.ceremony",
        "center.verify.candidate",
        "center.seat.manage",
        "center.omr.scan",
        "evaluation.omr.review",
    },

    # 12. INVIGILATOR: Hall Invigilator
    CanonicalRole.INVIGILATOR.value: {
        "center.read.assigned",
        "center.verify.candidate",
        "center.seat.manage",
        "center.omr.scan",
    },

    # 13. DISPUTE_OFFICER: Dispute resolution officer
    CanonicalRole.DISPUTE_OFFICER.value: {
        "dispute.read.tenant",
        "dispute.read.all",
        "dispute.ops.manage",
        "dispute.resolve",
        "result.integrity.read.tenant",
        "result.versions.read.tenant",
    },

    # 14. VENDOR: Partner service vendor
    CanonicalRole.VENDOR.value: {
        "vendor.read",
        "vendor.manage",
    },

    # 15. SECURITY_AUDITOR: External pentester
    CanonicalRole.SECURITY_AUDITOR.value: {
        "security.pentest.execute",
        "security.hardening.read",
    },

    # 16. OPS_ENGINEER: Infrastructure ops
    CanonicalRole.OPS_ENGINEER.value: {
        "ops.read",
        "ops.health.read",
        "ops.metrics.read",
        "ops.jobs.read",
        "ops.jobs.manage",
        "ops.config.read",
        "ops.storage.read",
        "ops.rate-limits.manage",
        "ops.backups.manage",
        "security.incident.manage",
    },

    # 17. DEVOPS: Deployment and infrastructure engineer
    CanonicalRole.DEVOPS.value: {
        "ops.read",
        "ops.health.read",
        "ops.metrics.read",
        "ops.jobs.read",
        "ops.config.read",
        "ops.storage.read",
        "ops.maintenance.manage",
    },

    # 18. CANDIDATE: Least-privileged student role
    CanonicalRole.CANDIDATE.value: {
        "candidate.read.self",
        "candidate.update.self",
        "identity.verification.execute.self",
        "exam.read.assigned",
        "exam.attempt",
        "exam.submit",
        "result.read.self",
        "result.integrity.read.self",
        "result.versions.read.self",
        "certificate.read.self",
        "dispute.create.self",
        "dispute.read.self",
        "dispute.update.self",
    },
}

def get_role_permissions(role: str) -> Set[str]:
    """Resolve permissions for a given canonical role."""
    # Normalize legacy role names if present
    normalized_role = role.upper()
    if normalized_role == "PLATFORM_SUPER_ADMIN":
        normalized_role = CanonicalRole.SUPER_ADMIN.value
    elif normalized_role == "ADMIN":
        normalized_role = CanonicalRole.TENANT_ADMIN.value
        
    return ROLE_PERMISSIONS.get(normalized_role, set())

def has_permission(role: str, permission: str) -> bool:
    """Check if a role possesses a specific permission."""
    perms = get_role_permissions(role)
    return permission in perms
