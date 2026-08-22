"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Building2 } from "lucide-react";

const STAFF_CONFIG: PortalConfig = {
  portalKey: "staff",
  portalName: "Examination Operations Portal",
  subtitle: "Restricted entry for Examination Controllers, Center Superintendents, and Invigilators.",
  badgeText: "Official Staff Only",
  badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  accentColor: "from-indigo-600 to-blue-600",
  icon: Building2,
  securityNotice: "All exam day actions, key ceremonies, and candidate check-ins are cryptographically sealed in the immutable audit ledger.",
  defaultRedirect: "/authority",
  demoCredentials: [
    {
      role: "Exam Controller (Dr. Aris Thorne)",
      email: "controller@example.com",
      description: "Full exam lifecycle & blueprint authority"
    },
    {
      role: "Centre Superintendent (Major Vikram Roy)",
      email: "officer@example.com",
      description: "Center console & package decryption"
    },
    {
      role: "Exam Invigilator (Elena Rostova)",
      email: "invigilator@example.com",
      description: "Hall verification & seat mapping"
    }
  ]
};

export default function StaffLoginPage() {
  return <PortalLoginForm config={STAFF_CONFIG} />;
}
