/**
 * Central Route Authorization Registry for ExamForge.
 * Defines classification, required permissions, and sensitivity for all 89 routes.
 * Enforces DEFAULT = DENY for any route not explicitly declared.
 */

export type RouteSensitivity = "SYSTEM" | "PUBLIC" | "CONFIDENTIAL" | "RESTRICTED" | "CRITICAL";

export interface RouteRule {
  pathPattern: string;
  regex: RegExp;
  sensitivity: RouteSensitivity;
  requiredPermissions: string[];
  description: string;
  resourceScope?: "self" | "assigned" | "tenant" | "global" | "public";
}

// Convert Next.js route patterns (e.g. /centers/[center_id]) to strict RegExp
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/\//g, "\\/")
    .replace(/\[\.\.\.[^\]]+\]/g, ".*")
    .replace(/\[[^\]]+\]/g, "[^\\/]+");
  return new RegExp(`^${escaped}$`);
}

function makeRule(
  pathPattern: string,
  sensitivity: RouteSensitivity,
  requiredPermissions: string[],
  description: string,
  resourceScope: "self" | "assigned" | "tenant" | "global" | "public" = "tenant"
): RouteRule {
  return {
    pathPattern,
    regex: patternToRegex(pathPattern),
    sensitivity,
    requiredPermissions,
    description,
    resourceScope,
  };
}

export const ROUTE_REGISTRY: RouteRule[] = [
  // ---------------------------------------------------------------------------
  // 1. PUBLIC PORTALS & VERIFICATION ROUTES
  // ---------------------------------------------------------------------------
  makeRule("/", "PUBLIC", [], "Landing page and workspace switcher", "public"),
  makeRule("/portals", "PUBLIC", [], "Portal Discovery Hub (Where are you signing in?)", "public"),
  makeRule("/candidate/login", "PUBLIC", [], "Candidate / Student Specialized Login Portal", "public"),
  makeRule("/staff/login", "PUBLIC", [], "Examination Staff & Operations Login Portal", "public"),
  makeRule("/evaluation/login", "PUBLIC", [], "Double-Blind Evaluation Workspace Login Portal", "public"),
  makeRule("/security/login", "PUBLIC", [], "Security Command & HSM Login Portal", "public"),
  makeRule("/audit/login", "PUBLIC", [], "Forensic Merkle Audit Login Portal", "public"),
  makeRule("/dispute/login", "PUBLIC", [], "Dispute Operations & Appeals Login Portal", "public"),
  makeRule("/vendor/login", "PUBLIC", [], "Vendor & External Partner Login Portal", "public"),
  makeRule("/admin/login", "PUBLIC", [], "Platform Super Admin Control Login Portal", "public"),
  makeRule("/ops/login", "PUBLIC", [], "Infrastructure & DevOps Operations Login Portal", "public"),
  makeRule("/workspace/select", "CONFIDENTIAL", [], "Multi-Role Workspace Selector", "self"),
  makeRule("/demo", "PUBLIC", [], "Interactive sandboxed product tour", "public"),
  makeRule("/unauthorized", "PUBLIC", [], "403 Forbidden generic error page", "public"),
  makeRule("/verify-certificate/[certificate_id]", "PUBLIC", ["certificate.verify.public"], "Public certificate cryptographic verification", "public"),
  makeRule("/verify-result", "PUBLIC", ["result.verify.public"], "Public scorecard Merkle proof verification", "public"),
  makeRule("/receipt-verify", "PUBLIC", ["receipt.verify.public"], "Candidate submission receipt signature verification", "public"),
  makeRule("/safebatch", "PUBLIC", [], "SafeBatch: Safeguarded Bulk Operations with Operational Handoff", "public"),
  makeRule("/safebatch/handoff/[handoff_id]", "PUBLIC", [], "SafeBatch Operational Handoff Resolution Console", "public"),

  // ---------------------------------------------------------------------------
  // 2. CANDIDATE / STUDENT DOMAIN
  // ---------------------------------------------------------------------------
  makeRule("/candidate", "PUBLIC", [], "Candidate onboarding and UIDAI verification wizard", "public"),
  makeRule("/student-exam", "PUBLIC", [], "Distraction-free CBT exam taking console", "public"),
  makeRule("/result-portal", "CONFIDENTIAL", ["result.read.self"], "Candidate personal scorecard portal", "self"),
  makeRule("/result-certificate/[certificate_id]", "CONFIDENTIAL", ["certificate.read.self", "certificate.read.tenant"], "Personal digital award certificate", "self"),
  makeRule("/result-integrity/[result_id]", "CONFIDENTIAL", ["result.integrity.read.self", "result.integrity.read.tenant"], "Cryptographic score breakdown & hash inspector", "self"),
  makeRule("/result-versions/[result_id]", "CONFIDENTIAL", ["result.versions.read.self", "result.versions.read.tenant"], "Score revision and dispute version chain", "self"),
  makeRule("/disputes/file", "CONFIDENTIAL", ["dispute.create.self"], "Candidate dispute filing form", "self"),
  makeRule("/disputes", "CONFIDENTIAL", ["dispute.read.self", "dispute.read.tenant"], "Candidate personal dispute tracker / global inbox", "self"),
  makeRule("/disputes/[dispute_id]", "CONFIDENTIAL", ["dispute.read.self", "dispute.read.tenant"], "Dispute investigation detail view", "self"),

  // ---------------------------------------------------------------------------
  // 3. DISPUTE OPERATIONS
  // ---------------------------------------------------------------------------
  makeRule("/dispute-ops", "RESTRICTED", ["dispute.ops.manage"], "Dispute management operations console and SLA tracker", "tenant"),
  makeRule("/dispute-ops/[dispute_id]", "RESTRICTED", ["dispute.resolve"], "Dispute resolution and re-evaluation order workflow", "tenant"),

  // ---------------------------------------------------------------------------
  // 4. EXAMINATION CONTROLLER & LIFECYCLE
  // ---------------------------------------------------------------------------
  makeRule("/authority", "PUBLIC", [], "Executive mission control and readiness trust dashboard", "public"),
  makeRule("/controller", "PUBLIC", [], "Exam controller operations and administration hub", "public"),
  makeRule("/pilot-run", "PUBLIC", [], "Guided 15-stage interactive AuthorityPilot exam simulator", "public"),
  makeRule("/create-exam", "PUBLIC", [], "New examination creation and scheduling wizard", "public"),
  makeRule("/examinations", "PUBLIC", [], "Master directory of all examinations", "public"),
  makeRule("/exams/[exam_id]/control-room", "RESTRICTED", ["exam.control"], "Live exam day telemetry and execution control room", "tenant"),
  makeRule("/exam-ops", "RESTRICTED", ["exam.state.transition"], "Exam operations, state transitions, and package dispatch", "tenant"),
  makeRule("/exam-templates", "RESTRICTED", ["exam.read.tenant", "exam.read.all"], "Exam structural template library", "tenant"),
  makeRule("/exam-templates/create", "RESTRICTED", ["exam.create"], "Exam template creator studio", "tenant"),
  makeRule("/question-bank", "CRITICAL", ["question-bank.read"], "Secure question bank and cryptographic blueprint generator", "tenant"),
  makeRule("/publication-gate", "CRITICAL", ["result.publish.gate.manage"], "Pre-publication safety gate and trust score validator", "tenant"),
  makeRule("/rubrics", "RESTRICTED", ["evaluation.read.tenant", "evaluation.read.all"], "Grading rubric master definitions", "tenant"),
  makeRule("/rubrics/create", "RESTRICTED", ["evaluation.assign"], "Grading rubric creator and variance rule studio", "tenant"),
  makeRule("/policies", "RESTRICTED", ["exam.read.tenant", "exam.read.all"], "Security and exam execution policy directory", "tenant"),
  makeRule("/policies/create", "RESTRICTED", ["exam.create"], "Custom security policy builder", "tenant"),
  makeRule("/risk-dashboard", "RESTRICTED", ["security.read"], "Systemic risk and integrity red flag monitor", "tenant"),
  makeRule("/war-room", "CRITICAL", ["security.command.execute"], "Live high-stakes exam day incident war room", "tenant"),

  // ---------------------------------------------------------------------------
  // 5. CENTER MANAGEMENT & PHYSICAL OPERATIONS
  // ---------------------------------------------------------------------------
  makeRule("/centers", "RESTRICTED", ["center.read.tenant"], "Examination center registry and readiness overview", "tenant"),
  makeRule("/centers/[center_id]", "RESTRICTED", ["center.read.tenant"], "Center infrastructure and decryption key status", "tenant"),
  makeRule("/centers/onboard", "RESTRICTED", ["center.create"], "New exam center onboarding form", "tenant"),
  makeRule("/center-onboarding", "PUBLIC", [], "Center superintendent readiness checklist", "public"),
  makeRule("/center-console", "PUBLIC", [], "Live center command console and attendance tracker", "public"),
  makeRule("/center-risk", "RESTRICTED", ["center.read.tenant"], "Center vulnerability, CCTV, and network risk monitor", "tenant"),
  makeRule("/candidate-verification", "PUBLIC", [], "Biometric & UIDAI QR check-in station", "public"),
  makeRule("/seat-map", "PUBLIC", [], "Hall layout, randomized seating & desk lock matrix", "public"),
  makeRule("/omr-scanner", "PUBLIC", [], "Physical OMR sheet scanner and edge ingestion station", "public"),

  // ---------------------------------------------------------------------------
  // 6. EVALUATION, GRADING & OMR PROCESSING
  // ---------------------------------------------------------------------------
  makeRule("/evaluator", "PUBLIC", [], "Evaluator dashboard and batch assignments", "public"),
  makeRule("/evaluator/queue", "PUBLIC", [], "Active subjective booklet grading queue", "public"),
  makeRule("/evaluator/copy/[anonymous_id]", "PUBLIC", [], "Double-blind descriptive booklet grading workspace", "public"),
  makeRule("/evaluation-ops", "RESTRICTED", ["evaluation.assign"], "Evaluation operations and evaluator allocation hub", "tenant"),
  makeRule("/evaluation-conflicts", "RESTRICTED", ["evaluation.conflict.resolve"], "Double-blind score variance and conflict review", "tenant"),
  makeRule("/evaluator-analytics", "PUBLIC", [], "Evaluator grading bias, speed, and variance analytics", "public"),
  makeRule("/marks-chain", "PUBLIC", [], "Immutable marks audit chain and progression ledger", "public"),
  makeRule("/omr-review", "PUBLIC", [], "OMR scan anomaly and ambiguous bubble review queue", "public"),

  // ---------------------------------------------------------------------------
  // 7. VENDOR & PARTNER SECURITY PORTAL
  // ---------------------------------------------------------------------------
  makeRule("/vendor", "PUBLIC", [], "Vendor organization directory and partner compliance", "public"),
  makeRule("/security-pentest", "PUBLIC", [], "Automated security pentest suite and breach simulator", "public"),

  // ---------------------------------------------------------------------------
  // 8. AUDIT, FORENSIC EVIDENCE & MERKLE LEDGER
  // ---------------------------------------------------------------------------
  makeRule("/auditor", "PUBLIC", [], "Auditor mission control and forensic verification tools", "public"),
  makeRule("/audit-timeline", "PUBLIC", [], "Forensic append-only Merkle audit timeline", "public"),
  makeRule("/evidence-packet/[packet_id]", "RESTRICTED", ["audit.evidence.read"], "Sealed cryptographic legal evidence packet exporter", "tenant"),
  makeRule("/institution-audit-report", "RESTRICTED", ["audit.report.read"], "Institutional exam security audit report card", "tenant"),
  makeRule("/tenant-audit", "RESTRICTED", ["audit.tenant-isolation.read"], "Cross-tenant boundary and data isolation auditor", "global"),

  // ---------------------------------------------------------------------------
  // 9. SECURITY, GOVERNANCE & THREAT DEFENSE
  // ---------------------------------------------------------------------------
  makeRule("/security", "RESTRICTED", ["security.read"], "Security command center and threat defense overview", "tenant"),
  makeRule("/security/command", "CRITICAL", ["security.command.execute"], "Emergency lockdown and rapid-response command console", "tenant"),
  makeRule("/security/hardening", "RESTRICTED", ["security.hardening.read"], "Platform hardening, TLS, headers, and crypto checks", "tenant"),
  makeRule("/security/threat-model", "RESTRICTED", ["security.threat-model.read"], "Live threat model and mitigation matrix", "tenant"),
  makeRule("/security/incidents", "RESTRICTED", ["security.incident.manage"], "P0/P1 security incident registry and triage log", "tenant"),
  makeRule("/security/keys", "CRITICAL", ["security.keys.manage"], "Cryptographic key lifecycle and HSM enclave state", "tenant"),
  makeRule("/security/approvals", "CRITICAL", ["security.approvals.execute"], "Dual-control multi-party authorization queue", "tenant"),
  makeRule("/security/access-review", "RESTRICTED", ["security.access-review.manage"], "IAM privilege and periodic access review console", "tenant"),
  makeRule("/security/assets", "RESTRICTED", ["security.assets.read"], "Information asset classification and sensitivity dictionary", "tenant"),
  makeRule("/security/privacy", "RESTRICTED", ["security.privacy.manage"], "Privacy protection, PII redaction, and data minimization", "tenant"),
  makeRule("/security/retention", "RESTRICTED", ["security.retention.manage"], "Data retention policies and legal hold locks", "tenant"),
  makeRule("/security/compliance-report", "RESTRICTED", ["security.compliance.read"], "Compliance reporting for ISO 27001, SOC 2, and GDPR", "tenant"),
  makeRule("/incidents", "RESTRICTED", ["security.incident.manage"], "Operational outages and platform incident tracker", "tenant"),
  makeRule("/keyspace", "CRITICAL", ["security.keys.manage"], "Secrets keyspace, HSM vault, and rotation schedules", "tenant"),

  // ---------------------------------------------------------------------------
  // 10. PLATFORM & TENANT ADMINISTRATION
  // ---------------------------------------------------------------------------
  makeRule("/platform-admin", "CRITICAL", ["platform.admin.manage"], "Multi-tenant SaaS platform master administration", "global"),
  makeRule("/institutions", "CRITICAL", ["institution.read.all"], "Institutional examination bodies master directory", "global"),
  makeRule("/institutions/[institution_id]", "CRITICAL", ["institution.update"], "Institution profile, quota, and key configuration", "global"),
  makeRule("/institutions/create", "CRITICAL", ["institution.create"], "New institution onboarding and tenant provisioning wizard", "global"),
  makeRule("/institution-users", "RESTRICTED", ["institution.users.manage"], "Institution staff directory and role management", "tenant"),
  makeRule("/institution-settings", "RESTRICTED", ["institution.settings.manage"], "Tenant branding, policies, and notification defaults", "tenant"),
  makeRule("/role-matrix", "RESTRICTED", ["role-matrix.read"], "Granular RBAC role-permission matrix inspector", "tenant"),
  makeRule("/admin/communication", "RESTRICTED", ["communication.broadcast"], "Emergency SMS, email, and in-app broadcast dispatch", "tenant"),

  // ---------------------------------------------------------------------------
  // 11. DEVOPS, INFRASTRUCTURE & OBSERVABILITY
  // ---------------------------------------------------------------------------
  makeRule("/ops", "CRITICAL", ["ops.read"], "Infrastructure operations center and server load monitor", "global"),
  makeRule("/ops/health", "RESTRICTED", ["ops.health.read"], "Subsystem health monitoring probes (live, ready, deep)", "global"),
  makeRule("/ops/metrics", "RESTRICTED", ["ops.metrics.read"], "Real-time throughput, latency, and error rate telemetry", "global"),
  makeRule("/ops/jobs", "RESTRICTED", ["ops.jobs.read"], "Background asynchronous Celery job queue inspector", "global"),
  makeRule("/ops/jobs/[job_id]", "RESTRICTED", ["ops.jobs.read"], "Detailed job trace and error stack log", "global"),
  makeRule("/ops/config", "CRITICAL", ["ops.config.read"], "Sanitized environment configuration metadata inspector", "global"),
  makeRule("/ops/storage", "RESTRICTED", ["ops.storage.read"], "Object storage bucket and content hash inspector", "global"),
  makeRule("/ops/rate-limits", "RESTRICTED", ["ops.rate-limits.manage"], "IP rate limiting rules and abuse defense monitor", "global"),
  makeRule("/ops/backups", "CRITICAL", ["ops.backups.manage"], "Database snapshot manifests and restore dry-run simulators", "global"),
  makeRule("/ops/maintenance", "CRITICAL", ["ops.maintenance.manage"], "Scheduled maintenance windows and read-only locks", "global"),
];

/**
 * Checks if a route path is a system / infrastructure asset that should bypass application authorization.
 */
export function isSystemRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") || // API endpoints are authoritatively validated on the FastAPI backend
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/sw.js" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  );
}

/**
 * Finds matching route rule from the registry.
 * Returns null if the route is unknown (Default = Deny).
 */
export function findRouteRule(pathname: string): RouteRule | null {
  // Normalize trailing slashes (except root)
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  for (const rule of ROUTE_REGISTRY) {
    if (rule.regex.test(normalized)) {
      return rule;
    }
  }
  return null;
}
