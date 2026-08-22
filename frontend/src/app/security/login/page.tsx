"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Shield } from "lucide-react";

const SECURITY_CONFIG: PortalConfig = {
  portalKey: "security",
  portalName: "Security Operations Command",
  subtitle: "Critical enclave entry for Security Admins, CISO, and authorized penetration testers.",
  badgeText: "High-Security Critical",
  badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  accentColor: "from-rose-600 to-red-600",
  icon: Shield,
  securityNotice: "Step-up Multi-Factor Authentication is mandatory. All terminal commands, key rotations, and emergency lockdown actions are audited.",
  defaultRedirect: "/security",
  demoCredentials: [
    {
      role: "Security Operations Lead (Cipher Zero)",
      email: "security_admin@example.com",
      description: "HSM key management & emergency lockdown (MFA OTP: 884920)"
    },
    {
      role: "Chief Information Security Officer (Evelyn Cross)",
      email: "ciso@example.com",
      description: "Compliance & risk sign-offs (MFA OTP: 884920)"
    },
    {
      role: "Security Auditor (RedTeam Lead)",
      email: "security_auditor@example.com",
      description: "Penetration test execution"
    }
  ]
};

export default function SecurityLoginPage() {
  return <PortalLoginForm config={SECURITY_CONFIG} />;
}
