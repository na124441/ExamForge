"use client";

import React from "react";
import { ForgeCandidateOnboardingWizard } from "@/components/candidate/ForgeCandidateOnboardingWizard";

export default function CandidatePage() {
  return (
    <div className="min-h-screen bg-[#081310] text-[#FFF4E2] px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto animate-in fade-in duration-200 font-sans">
      <ForgeCandidateOnboardingWizard />
    </div>
  );
}
