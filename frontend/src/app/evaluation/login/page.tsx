"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { Scale } from "lucide-react";

const EVALUATION_CONFIG: PortalConfig = {
  portalKey: "evaluation",
  portalName: "Subject Evaluation Workspace",
  subtitle: "Double-blind subjective grading environment for assigned evaluators and senior review officers.",
  badgeText: "Double-Blind Sealed",
  badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  accentColor: "from-amber-600 to-orange-600",
  icon: Scale,
  securityNotice: "Strict double-blind isolation enforced. Evaluators only receive access to randomly allocated anonymous booklets.",
  defaultRedirect: "/evaluator",
  demoCredentials: [
    {
      role: "Subject Evaluator (Prof. David Chen)",
      email: "evaluator@example.com",
      description: "Assigned active subjective batch"
    },
    {
      role: "Senior Evaluator (Dr. Beatrice Vane)",
      email: "senior_evaluator@example.com",
      description: "Arbitration & conflict resolution"
    }
  ]
};

export default function EvaluationLoginPage() {
  return <PortalLoginForm config={EVALUATION_CONFIG} />;
}
