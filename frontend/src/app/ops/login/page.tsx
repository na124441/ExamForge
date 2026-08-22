"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Cpu } from "lucide-react";

const OPS_CONFIG: PortalConfig = {
  portalKey: "ops",
  portalName: "Infrastructure & DevOps Operations",
  subtitle: "Telemetry health probes, asynchronous Celery queues, rate limiting, and database backups.",
  badgeText: "DevOps / Infra",
  badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  accentColor: "from-cyan-600 to-blue-600",
  icon: Cpu,
  securityNotice: "DevOps sessions are monitored for configuration modifications, cluster maintenance windows, and rate limit edits.",
  defaultRedirect: "/ops",
  demoCredentials: [
    {
      role: "Operations Engineer (Devin Forge)",
      email: "ops@example.com",
      description: "Background jobs & metrics (MFA OTP: 884920)"
    },
    {
      role: "DevOps Lead (Kiran Patel)",
      email: "devops@example.com",
      description: "Subsystem health & maintenance locks (MFA OTP: 884920)"
    }
  ]
};

export default function OpsLoginPage() {
  return <PortalLoginForm config={OPS_CONFIG} />;
}
