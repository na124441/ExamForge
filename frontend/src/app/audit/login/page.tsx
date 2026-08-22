"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Search } from "lucide-react";

const AUDIT_CONFIG: PortalConfig = {
  portalKey: "audit",
  portalName: "Forensic Audit & Compliance Portal",
  subtitle: "Independent read-only access for certified auditors and compliance inspectors.",
  badgeText: "Forensic Read-Only",
  badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  accentColor: "from-purple-600 to-indigo-600",
  icon: Search,
  securityNotice: "Audit sessions are strictly read-only and cryptographically bound to protect the integrity of the Merkle ledger.",
  defaultRedirect: "/audit-timeline",
  demoCredentials: [
    {
      role: "System Auditor (Sarah Jenkins)",
      email: "auditor@example.com",
      description: "Forensic Merkle audit trail inspection"
    },
    {
      role: "Compliance Officer (Marcus Vance)",
      email: "compliance@example.com",
      description: "Regulatory binder & privacy oversight"
    }
  ]
};

export default function AuditLoginPage() {
  return <PortalLoginForm config={AUDIT_CONFIG} />;
}
