"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Server } from "lucide-react";

const ADMIN_CONFIG: PortalConfig = {
  portalKey: "admin",
  portalName: "Platform Administration Control",
  subtitle: "SaaS institution provisioning, tenant policies, quota limits, and system administration.",
  badgeText: "Root Governance",
  badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  accentColor: "from-violet-600 to-purple-600",
  icon: Server,
  securityNotice: "Platform administrator actions cross institutional boundaries and are recorded in the immutable genesis ledger.",
  defaultRedirect: "/platform-admin",
  demoCredentials: [
    {
      role: "Platform Super Admin (Genesis Admin)",
      email: "superadmin@example.com",
      description: "Root SaaS multi-tenant governance (MFA OTP: 884920)"
    },
    {
      role: "Platform Administrator",
      email: "platform_admin@example.com",
      description: "Institution onboarding & quota management"
    },
    {
      role: "Institution Tenant Admin (Dean Henderson)",
      email: "tenant_admin@example.com",
      description: "University staff & tenant policies"
    }
  ]
};

export default function AdminLoginPage() {
  return <PortalLoginForm config={ADMIN_CONFIG} />;
}
