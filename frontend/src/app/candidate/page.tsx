"use client";

import React from "react";
import { ForgeCandidateOnboardingWizard } from "@/components/candidate/ForgeCandidateOnboardingWizard";

export default function CandidatePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto font-sans animate-fade-in">
      <ForgeCandidateOnboardingWizard />
    </div>
  );
}
