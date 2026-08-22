"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Layers } from "lucide-react";

const VENDOR_CONFIG: PortalConfig = {
  portalKey: "vendor",
  portalName: "Vendor Partner Portal",
  subtitle: "Partner directory, biometric hardware compliance attestations, and service agreements.",
  badgeText: "Partner Scoped",
  badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  accentColor: "from-orange-600 to-amber-600",
  icon: Layers,
  securityNotice: "Vendor credentials only permit access to partner organization data and contracted examination centers.",
  defaultRedirect: "/vendor",
  demoCredentials: [
    {
      role: "Vendor Partner Lead (Apex Proctors)",
      email: "vendor@example.com",
      description: "Partner compliance and hardware verification"
    }
  ]
};

export default function VendorLoginPage() {
  return <PortalLoginForm config={VENDOR_CONFIG} />;
}
