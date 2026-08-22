"use client";

import React from "react";
import {
  User,
  ShieldCheck,
  CreditCard,
  Building2,
  Monitor,
  ClipboardCheck,
  Award,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface LifecycleStage {
  step: number;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  { step: 1, label: "Registration", desc: "Candidate portal & profile creation", icon: User },
  { step: 2, label: "Verification", desc: "UIDAI QR & biometric validation", icon: ShieldCheck },
  { step: 3, label: "Payments", desc: "Instant gateway reconciliation", icon: CreditCard },
  { step: 4, label: "Centre Allocation", desc: "Capacity & proximity mapping", icon: Building2 },
  { step: 5, label: "Examination", desc: "Tamper-proof offline/online CBT", icon: Monitor },
  { step: 6, label: "Evaluation", desc: "Double-blind grading & dispute ops", icon: ClipboardCheck },
  { step: 7, label: "Results", desc: "Merkle-signed verifiable transcripts", icon: Award },
];

export function ExamLifecycle() {
  return (
    <section id="lifecycle" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 select-none">
      <div className="text-center mb-10">
        <span className="px-3 py-1 rounded-full bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.25)] text-[#8AD8B8] font-mono text-xs uppercase tracking-widest inline-block mb-3">
          END-TO-END AUTOMATION
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FFF4E2] tracking-tight font-sans">
          A Complete Examination Lifecycle
        </h2>
        <p className="text-sm text-[#8AD8B8]/80 max-w-2xl mx-auto mt-2 font-sans">
          Every phase from registration to credential issuance operates inside a single unified trust perimeter.
        </p>
      </div>

      {/* Horizontal Flow Pipeline */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 relative z-10">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isLast = idx === LIFECYCLE_STAGES.length - 1;

            return (
              <div key={stage.label} className="relative flex flex-col items-center">
                {/* Step Glass Card */}
                <div
                  className={cn(
                    "w-full p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center transition-all duration-300 group",
                    "bg-[rgba(19,45,40,0.6)] border border-[rgba(138,216,184,0.18)] hover:border-[rgba(138,216,184,0.45)]",
                    "backdrop-blur-xl hover:-translate-y-1.5 hover:bg-[rgba(64,133,118,0.25)] shadow-md hover:shadow-xl"
                  )}
                  style={{
                    boxShadow:
                      "0 15px 35px -10px rgba(0,0,0,0.6), inset 0 1px 1px 0 rgba(255,255,255,0.12)",
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[rgba(64,133,118,0.3)] border border-[rgba(138,216,184,0.25)] flex items-center justify-center text-[#8AD8B8] mb-3 group-hover:scale-110 group-hover:bg-[#8AD8B8] group-hover:text-[#132D28] transition-all duration-300 shadow-xs">
                    <Icon size={22} />
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[#FFF4E2] mb-1 font-sans">
                    {stage.label}
                  </h3>

                  <p className="text-[11px] text-[#8AD8B8]/70 line-clamp-2 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                {/* Arrow connector for desktop */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 text-[#8AD8B8]/60 pointer-events-none">
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Motto Tagline */}
      <div className="text-center mt-10">
        <p className="text-base sm:text-lg font-bold text-[#FFF4E2] font-sans">
          One Platform. <span className="text-[#8AD8B8]">One Workflow.</span> Zero Complexity.
        </p>
      </div>
    </section>
  );
}
