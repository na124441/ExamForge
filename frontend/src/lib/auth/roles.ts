/**
 * Canonical Roles for ExamForge Zero-Trust Architecture.
 */

export enum CanonicalRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN",
  CONTROLLER = "CONTROLLER",
  SECURITY_ADMIN = "SECURITY_ADMIN",
  CISO = "CISO",
  AUDITOR = "AUDITOR",
  COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER",
  SENIOR_EVALUATOR = "SENIOR_EVALUATOR",
  EVALUATOR = "EVALUATOR",
  OFFICER = "OFFICER",
  INVIGILATOR = "INVIGILATOR",
  DISPUTE_OFFICER = "DISPUTE_OFFICER",
  VENDOR = "VENDOR",
  SECURITY_AUDITOR = "SECURITY_AUDITOR",
  OPS_ENGINEER = "OPS_ENGINEER",
  DEVOPS = "DEVOPS",
  CANDIDATE = "CANDIDATE",
}

export interface RoleMetadata {
  role: CanonicalRole;
  label: string;
  category: "Platform" | "Authority" | "Center" | "Evaluation" | "Audit" | "Security" | "Ops" | "Vendor" | "Candidate";
  description: string;
  defaultRoute: string;
}

export const ROLE_METADATA_LIST: Record<CanonicalRole, RoleMetadata> = {
  [CanonicalRole.SUPER_ADMIN]: {
    role: CanonicalRole.SUPER_ADMIN,
    label: "Platform Super Admin",
    category: "Platform",
    description: "Root platform administrator with full auditable capability",
    defaultRoute: "/platform-admin",
  },
  [CanonicalRole.PLATFORM_ADMIN]: {
    role: CanonicalRole.PLATFORM_ADMIN,
    label: "Platform Administrator",
    category: "Platform",
    description: "Multi-tenant platform management and institution provisioning",
    defaultRoute: "/platform-admin",
  },
  [CanonicalRole.TENANT_ADMIN]: {
    role: CanonicalRole.TENANT_ADMIN,
    label: "Institution Administrator",
    category: "Authority",
    description: "Institution staff, tenant policies, and emergency alerts",
    defaultRoute: "/institution-users",
  },
  [CanonicalRole.CONTROLLER]: {
    role: CanonicalRole.CONTROLLER,
    label: "Exam Controller",
    category: "Authority",
    description: "Blueprints, examination execution, and pre-publication safety gate",
    defaultRoute: "/authority",
  },
  [CanonicalRole.SECURITY_ADMIN]: {
    role: CanonicalRole.SECURITY_ADMIN,
    label: "Security Operations Lead",
    category: "Security",
    description: "Threat models, cryptographic key lifecycle, and security incident response",
    defaultRoute: "/security",
  },
  [CanonicalRole.CISO]: {
    role: CanonicalRole.CISO,
    label: "Chief Information Security Officer",
    category: "Security",
    description: "Executive compliance, legal data retention, and audit sign-offs",
    defaultRoute: "/security/compliance-report",
  },
  [CanonicalRole.AUDITOR]: {
    role: CanonicalRole.AUDITOR,
    label: "Independent Auditor",
    category: "Audit",
    description: "Read-only forensic Merkle ledger and evidence verification",
    defaultRoute: "/audit-timeline",
  },
  [CanonicalRole.COMPLIANCE_OFFICER]: {
    role: CanonicalRole.COMPLIANCE_OFFICER,
    label: "Compliance Officer",
    category: "Audit",
    description: "Regulatory compliance and privacy protection auditor",
    defaultRoute: "/institution-audit-report",
  },
  [CanonicalRole.SENIOR_EVALUATOR]: {
    role: CanonicalRole.SENIOR_EVALUATOR,
    label: "Senior Subject Evaluator",
    category: "Evaluation",
    description: "Double-blind evaluation arbitration and variance conflict resolution",
    defaultRoute: "/evaluation-conflicts",
  },
  [CanonicalRole.EVALUATOR]: {
    role: CanonicalRole.EVALUATOR,
    label: "Subject Evaluator",
    category: "Evaluation",
    description: "Double-blind subjective booklet grading in assigned queue",
    defaultRoute: "/evaluator",
  },
  [CanonicalRole.OFFICER]: {
    role: CanonicalRole.OFFICER,
    label: "Centre Superintendent",
    category: "Center",
    description: "Center readiness attestation, package decryption, and hall operations",
    defaultRoute: "/center-console",
  },
  [CanonicalRole.INVIGILATOR]: {
    role: CanonicalRole.INVIGILATOR,
    label: "Hall Invigilator",
    category: "Center",
    description: "Biometric photo matching, admit QR scanning, and seat mapping",
    defaultRoute: "/candidate-verification",
  },
  [CanonicalRole.DISPUTE_OFFICER]: {
    role: CanonicalRole.DISPUTE_OFFICER,
    label: "Dispute Operations Officer",
    category: "Authority",
    description: "Candidate dispute triage, re-evaluation orders, and score revisions",
    defaultRoute: "/dispute-ops",
  },
  [CanonicalRole.VENDOR]: {
    role: CanonicalRole.VENDOR,
    label: "Vendor Partner User",
    category: "Vendor",
    description: "Third-party vendor directory and compliance management",
    defaultRoute: "/vendor",
  },
  [CanonicalRole.SECURITY_AUDITOR]: {
    role: CanonicalRole.SECURITY_AUDITOR,
    label: "External Security Auditor",
    category: "Security",
    description: "Penetration testing and third-party security verification",
    defaultRoute: "/security-pentest",
  },
  [CanonicalRole.OPS_ENGINEER]: {
    role: CanonicalRole.OPS_ENGINEER,
    label: "Operations Engineer",
    category: "Ops",
    description: "Infrastructure jobs, telemetry metrics, and rate limit rules",
    defaultRoute: "/ops",
  },
  [CanonicalRole.DEVOPS]: {
    role: CanonicalRole.DEVOPS,
    label: "DevOps Engineer",
    category: "Ops",
    description: "Deployment operations, maintenance locks, and deep health probes",
    defaultRoute: "/ops/health",
  },
  [CanonicalRole.CANDIDATE]: {
    role: CanonicalRole.CANDIDATE,
    label: "Candidate / Student",
    category: "Candidate",
    description: "Distraction-free CBT exam, personal scorecard, and dispute tracking",
    defaultRoute: "/student-exam",
  },
};
