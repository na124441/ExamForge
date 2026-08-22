/**
 * Master Permissions Catalog and Role-to-Permissions Mapping for ExamForge.
 * Aligned with backend permissions.py single source of truth.
 */

import { CanonicalRole } from "./roles";

export const ALL_PERMISSIONS = [
  // Public verification
  "certificate.verify.public",
  "result.verify.public",
  "receipt.verify.public",

  // Candidate self domain
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

  // Examination & Question Bank domain
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

  // Center & Invigilation domain
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

  // Evaluation domain
  "evaluation.read.assigned",
  "evaluation.read.tenant",
  "evaluation.assign",
  "evaluation.grade.submit",
  "evaluation.conflict.resolve",
  "evaluation.analytics.read",
  "evaluation.marks-chain.read",
  "evaluation.omr.review",

  // Results, Credentials & Disputes domain
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

  // Audit & Evidence domain
  "audit.ledger.read",
  "audit.export",
  "audit.evidence.read",
  "audit.report.read",
  "audit.tenant-isolation.read",

  // Security & Governance domain
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

  // Tenant & Multi-Tenant Platform domain
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

  // DevOps & Infrastructure domain
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

  // Vendor domain
  "vendor.read",
  "vendor.manage",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [CanonicalRole.SUPER_ADMIN]: [...ALL_PERMISSIONS],

  [CanonicalRole.PLATFORM_ADMIN]: [
    "platform.admin.manage",
    "institution.read.all",
    "institution.create",
    "institution.update",
    "role-matrix.read",
    "role-matrix.manage",
    "audit.tenant-isolation.read",
    "audit.ledger.read",
    "security.read",
  ],

  [CanonicalRole.TENANT_ADMIN]: [
    "institution.read.tenant",
    "institution.users.manage",
    "institution.settings.manage",
    "role-matrix.read",
    "communication.broadcast",
    "exam.read.tenant",
    "audit.report.read",
    "audit.ledger.read",
    "security.read",
  ],

  [CanonicalRole.CONTROLLER]: [
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
  ],

  [CanonicalRole.SECURITY_ADMIN]: [
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
  ],

  [CanonicalRole.CISO]: [
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
  ],

  [CanonicalRole.AUDITOR]: [
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
  ],

  [CanonicalRole.COMPLIANCE_OFFICER]: [
    "security.compliance.read",
    "security.privacy.manage",
    "security.retention.manage",
    "audit.report.read",
    "audit.evidence.read",
    "audit.ledger.read",
  ],

  [CanonicalRole.SENIOR_EVALUATOR]: [
    "evaluation.read.assigned",
    "evaluation.read.tenant",
    "evaluation.grade.submit",
    "evaluation.conflict.resolve",
    "evaluation.omr.review",
  ],

  [CanonicalRole.EVALUATOR]: [
    "evaluation.read.assigned",
    "evaluation.grade.submit",
    "evaluation.omr.review",
  ],

  [CanonicalRole.OFFICER]: [
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
  ],

  [CanonicalRole.INVIGILATOR]: [
    "center.read.assigned",
    "center.verify.candidate",
    "center.seat.manage",
    "center.omr.scan",
  ],

  [CanonicalRole.DISPUTE_OFFICER]: [
    "dispute.read.tenant",
    "dispute.read.all",
    "dispute.ops.manage",
    "dispute.resolve",
    "result.integrity.read.tenant",
    "result.versions.read.tenant",
  ],

  [CanonicalRole.VENDOR]: [
    "vendor.read",
    "vendor.manage",
  ],

  [CanonicalRole.SECURITY_AUDITOR]: [
    "security.pentest.execute",
    "security.hardening.read",
  ],

  [CanonicalRole.OPS_ENGINEER]: [
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
  ],

  [CanonicalRole.DEVOPS]: [
    "ops.read",
    "ops.health.read",
    "ops.metrics.read",
    "ops.jobs.read",
    "ops.config.read",
    "ops.storage.read",
    "ops.maintenance.manage",
  ],

  [CanonicalRole.CANDIDATE]: [
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
  ],
};

export function getRolePermissions(role: string): Set<string> {
  const normalized = role.toUpperCase();
  if (normalized === "PLATFORM_SUPER_ADMIN") {
    return new Set(ROLE_PERMISSIONS[CanonicalRole.SUPER_ADMIN]);
  }
  if (normalized === "ADMIN") {
    return new Set(ROLE_PERMISSIONS[CanonicalRole.TENANT_ADMIN]);
  }
  return new Set(ROLE_PERMISSIONS[normalized] || []);
}

export function hasPermission(role: string, permission: string): boolean {
  const perms = getRolePermissions(role);
  return perms.has(permission);
}
