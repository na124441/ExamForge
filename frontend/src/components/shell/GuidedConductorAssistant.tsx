"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Radio, 
  Lock, 
  ArrowRight, 
  FileCheck, 
  Compass, 
  Play, 
  HelpCircle,
  Zap,
  RotateCcw
} from "lucide-react";

interface GuideStep {
  phase: number;
  title: string;
  subtitle: string;
  status: "COMPLETED" | "ACTIVE" | "UPCOMING";
  recommendation: string;
  actionText: string;
  actionRoute: string;
  explanation: string;
}

const LIFECYCLE_STEPS: GuideStep[] = [
  {
    phase: 1,
    title: "Pre-Exam Setup & Sealing",
    subtitle: "Blueprint, Question Bank & Keyring Envelopes",
    status: "COMPLETED",
    recommendation: "Exam blueprint locked. HSM keyrings generated for Paper Sets A, B, and C.",
    actionText: "Inspect Blueprint & Keys",
    actionRoute: "/controller",
    explanation: "Ensures question packages are encrypted with AES-256 and locked with cryptographic Merkle hashes before transit."
  },
  {
    phase: 2,
    title: "Live Conduction & Center Verification",
    subtitle: "Biometric Check-in & Node Telemetry",
    status: "ACTIVE",
    recommendation: "4 of 5 centers synchronized. 96% candidate check-in rate. Ready for paper release.",
    actionText: "Open Conductor Control Room",
    actionRoute: "/exams/EXM-001/control-room",
    explanation: "Monitors real-time desk seating, center node heartbeats, and decrypts exam packages at scheduled start time."
  },
  {
    phase: 3,
    title: "Evaluation & Dispute Reconciliation",
    subtitle: "Double-Blind Grading & OMR Scans",
    status: "UPCOMING",
    recommendation: "Review ambiguous OMR bubble contours and reconcile double-evaluator variances.",
    actionText: "Reconcile Evaluation Queue",
    actionRoute: "/evaluation-conflicts",
    explanation: "Two independent evaluators score every copy blindly. Variances >2.0 marks are automatically escalated for senior review."
  },
  {
    phase: 4,
    title: "Publication Gate & Verifiable Results",
    subtitle: "Zero-Knowledge Result Attestation",
    status: "UPCOMING",
    recommendation: "All ledger blocks intact. Verify Merkle root certificate and publish results.",
    actionText: "Open Publication Gate",
    actionRoute: "/publication-gate",
    explanation: "Locks results into an immutable cryptographic ledger and provides students with zero-knowledge verifiable transcript receipts."
  }
];

export function GuidedConductorAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-detect phase from route
  useEffect(() => {
    if (pathname.includes("controller") || pathname.includes("create-exam") || pathname.includes("keyspace")) {
      setActiveStepIndex(0);
    } else if (pathname.includes("control-room") || pathname.includes("candidate-verification") || pathname.includes("center-console") || pathname.includes("center-risk")) {
      setActiveStepIndex(1);
    } else if (pathname.includes("evaluation") || pathname.includes("omr") || pathname.includes("evaluator")) {
      setActiveStepIndex(2);
    } else if (pathname.includes("publication-gate") || pathname.includes("receipt-verify") || pathname.includes("result")) {
      setActiveStepIndex(3);
    }
  }, [pathname]);

  const currentStep = LIFECYCLE_STEPS[activeStepIndex] || LIFECYCLE_STEPS[1];

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans select-none animate-fade-in">
      {/* Floating Trigger Pill when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer active-press hover-lift border border-indigo-400/30"
        >
          <div className="p-1 bg-white/20 rounded-full animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight">Conductor Co-Pilot</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
            Phase {activeStepIndex + 1}/4
          </span>
          <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Expanded Assistant Card */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all animate-scale-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4.5 text-white flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/15 rounded-xl shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
                  <span>Conductor Guidance Co-Pilot</span>
                  <span className="text-[9px] px-2 py-0.2 bg-emerald-400/20 text-emerald-200 rounded-full font-bold border border-emerald-300/30">
                    Live
                  </span>
                </h3>
                <span className="text-[10px] text-indigo-100/80 block mt-0.5">
                  Exam: <strong>National Scholarship Test (EXM-001)</strong>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4-Phase Stepper Tracker */}
          <div className="grid grid-cols-4 p-2 bg-slate-100/70 border-b border-slate-200 gap-1 text-center">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isSelected = activeStepIndex === idx;
              const isDone = idx < activeStepIndex;

              return (
                <button
                  key={step.phase}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                      : isDone
                      ? "text-emerald-700 hover:bg-white/50"
                      : "text-slate-400 hover:bg-white/50"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isSelected ? "bg-indigo-600 text-white" : isDone ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <span className="truncate max-w-[75px]">Phase {idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-5 flex flex-col gap-4 text-xs">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                  Phase {currentStep.phase} of 4
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                  {currentStep.status}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                {currentStep.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>

            {/* Plain-English Recommendation Box */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
              <div className="p-1 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="text-[11px] text-indigo-950 font-bold block">
                  Next Recommended Action:
                </strong>
                <p className="text-[11px] text-slate-700 leading-relaxed mt-0.5">
                  {currentStep.recommendation}
                </p>
              </div>
            </div>

            {/* Why This Matters Explainer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                🛡️ Zero-Trust Security Guarantee:
              </span>
              <p>{currentStep.explanation}</p>
            </div>

            {/* Primary Action Button */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  router.push(currentStep.actionRoute);
                  setIsOpen(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-xs active-press flex items-center justify-center gap-1.5"
              >
                <span>{currentStep.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Footer Links */}
          <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-medium px-4">
            <button 
              onClick={() => router.push("/authority")} 
              className="hover:text-indigo-600 font-bold cursor-pointer"
            >
              Authority Console →
            </button>
            <button 
              onClick={() => router.push("/pilot-run")} 
              className="hover:text-indigo-600 font-bold cursor-pointer"
            >
              15-Stage Simulator →
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
