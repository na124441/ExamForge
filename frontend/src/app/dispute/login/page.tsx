"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Briefcase } from "lucide-react";

const DISPUTE_CONFIG: PortalConfig = {
  portalKey: "dispute",
  portalName: "Dispute Operations Portal",
  subtitle: "Management console for student grievance triage, re-evaluation orders, and score revisions.",
  badgeText: "SLA Monitored",
  badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  accentColor: "from-blue-600 to-cyan-600",
  icon: Briefcase,
  securityNotice: "All score revisions require dual-approval and generate a new immutable entry in the result version chain.",
  defaultRedirect: "/dispute-ops",
  demoCredentials: [
    {
      role: "Dispute Operations Officer (Amina Sterling)",
      email: "dispute_officer@example.com",
      description: "Candidate grievance triage & SLA management"
    }
  ]
};

export default function DisputeLoginPage() {
  return <PortalLoginForm config={DISPUTE_CONFIG} />;
}
