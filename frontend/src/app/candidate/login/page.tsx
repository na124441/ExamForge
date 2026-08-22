"use client";

import React from "react";
import { PortalLoginForm, PortalConfig } from "@/components/auth/PortalLoginForm";
import { GraduationCap } from "lucide-react";

const CANDIDATE_CONFIG: PortalConfig = {
  portalKey: "candidate",
  portalName: "Candidate Examination Portal",
  subtitle: "Sign in to take scheduled CBT exams, view scorecards, or file score disputes.",
  badgeText: "Student Access",
  badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  accentColor: "from-emerald-600 to-teal-600",
  icon: GraduationCap,
  securityNotice: "Please ensure your webcam and browser fullscreen permissions are ready for scheduled proctoring.",
  defaultRedirect: "/student-exam",
  demoCredentials: [
    {
      role: "Candidate 1 (Alex Vance)",
      email: "candidate@example.com",
      description: "Assigned to Physics CBT Exam"
    },
    {
      role: "Candidate 2 (Sarah Connor)",
      email: "candidate2@example.com",
      description: "Verified examinee profile"
    }
  ]
};

export default function CandidateLoginPage() {
  return <PortalLoginForm config={CANDIDATE_CONFIG} />;
}
