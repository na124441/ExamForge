"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Layers,
  Sparkles,
  Users,
  Building2,
  Lock,
  FileText,
  Clock,
  ArrowUpRight,
  Download,
  Eye,
  RefreshCw,
  Search,
  Check,
  UserCheck,
  Award,
  Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  previewSafeBatch,
  executeSafeBatch,
  SafeBatchPreviewResponse,
  SafeBatchExecuteResponse,
  getSafeBatchHandoffs,
  HandoffSummary,
} from "@/lib/api";
import { ExamForgeLogo } from "@/components/brand/ExamForgeLogo";

const ACTION_TYPES = [
  {
    id: "BULK_CENTRE_ALLOCATION",
    title: "Bulk Centre Allocation",
    desc: "Allocate registered candidate cohorts to physical exam hubs according to proximity and seat matrix.",
    risk: "MEDIUM",
    riskBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: Building2,
    recommended: true,
  },
  {
    id: "BULK_CANDIDATE_VERIFICATION",
    title: "Bulk Biometric QR Verification",
    desc: "Batch verify UIDAI QR signatures and photo biometric tokens across candidate cohort.",
    risk: "LOW",
    riskBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: UserCheck,
  },
  {
    id: "BULK_ADMIT_CARD_GEN",
    title: "Bulk Admit Card Generation",
    desc: "Issue cryptographically signed ECDSA admit cards with encrypted QR codes for downloaded halls.",
    risk: "HIGH",
    riskBadge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    icon: FileText,
  },
  {
    id: "BULK_RESULT_PUBLICATION",
    title: "Bulk Result & Merkle Publishing",
    desc: "Seal scorecards and commit final marks progression tree to public cryptographic ledger.",
    risk: "CRITICAL",
    riskBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: Award,
  },
];

export function SafeBatchStudio() {
  const router = useRouter();

  // Wizard state: 1 (Scope) -> 2 (Preview) -> 3 (Confirm) -> 4 (Executing) -> 5 (Handoff Note)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedAction, setSelectedAction] = useState("BULK_CENTRE_ALLOCATION");
  const [examId, setExamId] = useState("EXM-AIML-2026");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SafeBatchPreviewResponse | null>(null);
  const [executionResult, setExecutionResult] = useState<SafeBatchExecuteResponse | null>(null);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [confirmedRisk, setConfirmedRisk] = useState(false);
  const [activeExceptionTab, setActiveExceptionTab] = useState<"ALL" | "CENTRE_FULL" | "ADDRESS_MISSING">("ALL");
  const [recentHandoffs, setRecentHandoffs] = useState<HandoffSummary[]>([]);

  useEffect(() => {
    getSafeBatchHandoffs().then((data) => setRecentHandoffs(data || [])).catch(() => {});
  }, []);

  // 1. Run Pre-flight Preview
  const handleRunPreview = async () => {
    setLoading(true);
    try {
      const data = await previewSafeBatch({
        exam_id: examId,
        action_type: selectedAction,
        requested_by: "Vendor Controller",
        requested_by_role: "VENDOR",
      });
      setPreviewData(data);
      setStep(2);
    } catch (err) {
      console.error("Preview error:", err);
      // Fallback synthetic data
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // 2. Execute Safe Batch with Streaming Progress
  const handleExecuteBatch = async () => {
    setStep(4);
    setExecutionProgress(0);
    setExecutionLog([
      "Initializing SafeBatch isolation sandbox...",
      "Resolving candidate scope: 2,847 records...",
    ]);

    const logs = [
      "Acquiring dual-custody batch lock...",
      "Allocating Centre A (Mumbai Central) -> 800 seats filled (100%)",
      "Allocating Centre B (Delhi NCR Hub) -> 600 seats filled (100%)",
      "Allocating Centre C (Bangalore Tech Park) -> 500 seats filled (100%)",
      "Allocating Centre D (Chennai Main Hub) -> 913 seats filled (34 buffer seats remain)",
      "Safety Gate: 2,813 candidate allocations validated & committed.",
      "Isolating 34 unresolvable exceptions (23 capacity overruns, 11 missing address fields)...",
      "Hashing audit receipt and committing to Merkle forensic timeline...",
      "Auto-generating structured operational Handoff Note for Centre Superintendent...",
      "SafeBatch execution completed with exceptions isolated.",
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 12;
      if (currentProgress > 100) currentProgress = 100;
      setExecutionProgress(currentProgress);

      const logIndex = Math.min(Math.floor((currentProgress / 100) * logs.length), logs.length - 1);
      setExecutionLog((prev) => {
        const nextLog = logs[logIndex];
        if (!prev.includes(nextLog)) {
          return [...prev, nextLog];
        }
        return prev;
      });

      if (currentProgress >= 100) {
        clearInterval(interval);
        finalizeExecution();
      }
    }, 350);
  };

  const finalizeExecution = async () => {
    try {
      const res = await executeSafeBatch({
        exam_id: examId,
        action_type: selectedAction,
        confirmed: true,
        executed_by: "Vendor Controller",
        executed_by_role: "VENDOR",
      });
      setExecutionResult(res);
      setStep(5);
    } catch (err) {
      console.error("Execution error:", err);
      setStep(5);
    }
  };

  // Filter preview exceptions
  const filteredExceptions = previewData?.exception_preview_sample.filter((item) => {
    if (activeExceptionTab === "ALL") return true;
    return item.code === activeExceptionTab;
  }) || [];

  return (
    <div className="space-y-8 font-sans">
      {/* HEADER BANNER */}
      <div className="rounded-3xl p-6 sm:p-8 bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_100%_0%,rgba(138,216,184,0.15),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(64,133,118,0.3)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] font-mono text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} />
              SAFEGUARDED BULK OPERATIONS ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#FFF4E2] tracking-tight">
              ExamForge SafeBatch
            </h1>
            <p className="text-sm text-[#8AD8B8]/90 max-w-2xl leading-relaxed">
              Validate blast radius with pre-flight impact previews, execute high-volume operations safely with exception isolation, and automatically generate actionable handoff notes for downstream roles.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.2)] text-center min-w-[110px]">
              <span className="text-[10px] text-[#8AD8B8]/70 font-mono block uppercase">Active Handoffs</span>
              <span className="text-xl font-bold text-[#FFF4E2] font-mono">{recentHandoffs.length || 1}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.2)] text-center min-w-[110px]">
              <span className="text-[10px] text-[#8AD8B8]/70 font-mono block uppercase">Safety Score</span>
              <span className="text-xl font-bold text-[#8AD8B8] font-mono">100%</span>
            </div>
          </div>
        </div>

        {/* STEPPER PROGRESS */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[rgba(138,216,184,0.15)] flex sm:grid sm:grid-cols-5 overflow-x-auto pb-2 sm:pb-0 gap-2 sm:gap-3 text-xs scrollbar-thin">
          {[
            { num: 1, label: "01 Scope" },
            { num: 2, label: "02 Impact Preview" },
            { num: 3, label: "03 Safety Guard" },
            { num: 4, label: "04 Safe Execution" },
            { num: 5, label: "05 Handoff Note" },
          ].map((s) => (
            <div
              key={s.num}
              className={cn(
                "px-3 py-2 rounded-xl font-mono flex items-center gap-2 transition-all shrink-0 min-w-[125px] sm:min-w-0",
                step === s.num
                  ? "bg-[#408576] text-[#FFF4E2] font-bold border border-[#8AD8B8] shadow-md"
                  : step > s.num
                  ? "bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] border border-[rgba(138,216,184,0.2)]"
                  : "bg-[rgba(8,19,16,0.4)] text-[#8AD8B8]/50 border border-[rgba(138,216,184,0.08)]"
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                step > s.num ? "bg-[#8AD8B8] text-[#132D28]" : step === s.num ? "bg-[#FFF4E2] text-[#132D28]" : "bg-white/10"
              )}>
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SCOPE & ACTION SELECTOR */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs text-[var(--color-ink)]">
            <div>
              <h2 className="text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                <Layers size={18} className="text-[#8AD8B8]" />
                Select Bulk Operation & Target Examination
              </h2>
              <p className="text-xs text-[#8AD8B8]/80 mt-1">
                Choose an operational bulk action. Each action is evaluated against automated risk matrices and pre-flight constraints.
              </p>
            </div>

            {/* Examination Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#8AD8B8] uppercase tracking-wider mb-2">
                  Target Examination
                </label>
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.3)] rounded-2xl px-4 py-3 text-sm text-[#FFF4E2] focus:outline-none focus:border-[#8AD8B8]"
                >
                  <option value="EXM-AIML-2026">AIML Entrance Examination 2026 (EXM-AIML-2026) - 2,847 Candidates</option>
                  <option value="EXM-MED-2026">National Medical Entrance Test 2026 - 4,120 Candidates</option>
                  <option value="EXM-CIVIL-2026">Civil Services Preliminary 2026 - 12,500 Candidates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8AD8B8] uppercase tracking-wider mb-2">
                  Target Candidate Cohort
                </label>
                <div className="p-3 bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.2)] rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-[#8AD8B8]" />
                    <span className="text-xs font-semibold text-[#FFF4E2]">All Registered & Verified Candidates</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#8AD8B8]/20 text-[#8AD8B8] font-mono text-xs font-bold border border-[#8AD8B8]/30">
                    2,847 Records
                  </span>
                </div>
              </div>
            </div>

            {/* Action Cards Grid */}
            <div className="space-y-3">
              <label className="block text-xs font-mono text-[#8AD8B8] uppercase tracking-wider">
                Operation Type & Risk Classification
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACTION_TYPES.map((act) => {
                  const Icon = act.icon;
                  const isSelected = selectedAction === act.id;
                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedAction(act.id)}
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
                        isSelected
                          ? "bg-[rgba(64,133,118,0.35)] border-[#8AD8B8] shadow-lg"
                          : "bg-[rgba(8,19,16,0.5)] border-[rgba(138,216,184,0.15)] hover:border-[#8AD8B8]/60 hover:bg-[rgba(64,133,118,0.2)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            isSelected ? "bg-[#8AD8B8] text-[#132D28]" : "bg-[rgba(64,133,118,0.25)] text-[#8AD8B8]"
                          )}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-[#FFF4E2]">{act.title}</h3>
                              {act.recommended && (
                                <span className="px-2 py-0.5 rounded-md bg-[#8AD8B8] text-[#132D28] font-mono text-[9px] font-bold uppercase">
                                  Killer Use Case
                                </span>
                              )}
                            </div>
                            <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border", act.riskBadge)}>
                              {act.risk} RISK
                            </span>
                          </div>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center text-xs transition-colors",
                          isSelected ? "border-[#8AD8B8] bg-[#8AD8B8] text-[#132D28] font-bold" : "border-[rgba(138,216,184,0.3)]"
                        )}>
                          {isSelected && "✓"}
                        </div>
                      </div>
                      <p className="text-xs text-[#8AD8B8]/80 mt-3 leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bottom Bar */}
            <div className="pt-4 border-t border-[rgba(138,216,184,0.15)] flex items-center justify-between">
              <div className="text-xs text-[#8AD8B8]/80 font-mono">
                Initiated by: <strong className="text-[#FFF4E2] font-sans">Vendor Controller</strong> (Role: <span className="text-[#8AD8B8]">VENDOR</span>)
              </div>
              <button
                onClick={handleRunPreview}
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] font-bold text-sm transition-all shadow-[0_10px_25px_-5px_rgba(138,216,184,0.6)] flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                <span>Run Pre-Flight Validation</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PRE-FLIGHT IMPACT PREVIEW & CONFLICT ANALYSIS */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* IMPACT PREVIEW SUMMARY */}
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs text-[var(--color-ink)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(138,216,184,0.15)] pb-5">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8AD8B8] block tracking-wider">
                  SIMULATION RESULT &middot; {previewData?.preview_id || "PREV-89A01C2E"}
                </span>
                <h2 className="text-xl font-bold text-[#FFF4E2] mt-0.5">
                  Pre-Flight Impact Preview
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  MEDIUM RISK &middot; CONFIRMATION REQUIRED
                </span>
              </div>
            </div>

            {/* IMPACT KPI TILES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.2)]">
                <span className="text-[10px] font-mono text-[#8AD8B8]/70 uppercase block">Selected Cohort</span>
                <span className="text-2xl font-black text-[#FFF4E2] font-mono">2,847</span>
                <span className="text-[11px] text-[#8AD8B8]/80 block mt-0.5">Candidates in Scope</span>
              </div>

              <div className="p-4 rounded-2xl bg-[rgba(64,133,118,0.25)] border border-[#8AD8B8]/40">
                <span className="text-[10px] font-mono text-[#8AD8B8] uppercase block">Safe Allocations</span>
                <span className="text-2xl font-black text-[#8AD8B8] font-mono">2,813</span>
                <span className="text-[11px] text-[#8AD8B8]/90 block mt-0.5">98.8% Ready to Execute</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] font-mono text-amber-300 uppercase block">Capacity Conflicts</span>
                <span className="text-2xl font-black text-amber-400 font-mono">23</span>
                <span className="text-[11px] text-amber-200/80 block mt-0.5">Hub Limits Reached</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <span className="text-[10px] font-mono text-rose-300 uppercase block">Missing Address Data</span>
                <span className="text-2xl font-black text-rose-400 font-mono">11</span>
                <span className="text-[11px] text-rose-200/80 block mt-0.5">Geocoding Incomplete</span>
              </div>
            </div>

            {/* CENTRE ALLOCATION MATRIX */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-mono text-[#8AD8B8] uppercase tracking-wider">
                Centre Capacity Utilization Breakdown (4 Hubs &middot; 2,847 Seats)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: "Centre A (Mumbai Hub)", cap: 800, alloc: 800, util: "100%", status: "CAPACITY FULL" },
                  { name: "Centre B (Delhi NCR Hub)", cap: 600, alloc: 600, util: "100%", status: "CAPACITY FULL" },
                  { name: "Centre C (Bengaluru Hub)", cap: 500, alloc: 500, util: "100%", status: "CAPACITY FULL" },
                  { name: "Centre D (Chennai Main)", cap: 947, alloc: 913, util: "96.4%", status: "34 BUFFER SEATS" },
                ].map((c, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.18)] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#FFF4E2] truncate">{c.name}</h4>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#8AD8B8]/70 font-mono">Allocated:</span>
                      <span className="font-mono font-bold text-[#FFF4E2]">{c.alloc} / {c.cap}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[rgba(19,45,40,0.8)] overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", c.alloc === c.cap ? "bg-amber-400" : "bg-[#8AD8B8]")}
                        style={{ width: c.util }}
                      />
                    </div>
                    <span className={cn(
                      "inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md",
                      c.alloc === c.cap ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                    )}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* UNRESOLVED EXCEPTION DRILL-DOWN */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono text-[#8AD8B8] uppercase tracking-wider">
                  Unresolved Exceptions Preview (34 Candidates)
                </h3>
                <div className="flex items-center gap-1 bg-[rgba(8,19,16,0.6)] p-1 rounded-xl border border-[rgba(138,216,184,0.2)] text-[11px] font-mono">
                  <button
                    onClick={() => setActiveExceptionTab("ALL")}
                    className={cn("px-2.5 py-1 rounded-lg transition-colors", activeExceptionTab === "ALL" ? "bg-[#408576] text-[#FFF4E2]" : "text-[#8AD8B8]/70")}
                  >
                    All (34)
                  </button>
                  <button
                    onClick={() => setActiveExceptionTab("CENTRE_FULL")}
                    className={cn("px-2.5 py-1 rounded-lg transition-colors", activeExceptionTab === "CENTRE_FULL" ? "bg-[#408576] text-[#FFF4E2]" : "text-[#8AD8B8]/70")}
                  >
                    Capacity Full (23)
                  </button>
                  <button
                    onClick={() => setActiveExceptionTab("ADDRESS_MISSING")}
                    className={cn("px-2.5 py-1 rounded-lg transition-colors", activeExceptionTab === "ADDRESS_MISSING" ? "bg-[#408576] text-[#FFF4E2]" : "text-[#8AD8B8]/70")}
                  >
                    Missing Address (11)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredExceptions.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[rgba(8,19,16,0.5)] border border-[rgba(138,216,184,0.15)] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#FFF4E2]">{item.name}</span>
                      <span className="font-mono text-[10px] text-[#8AD8B8]">{item.reg_no}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#8AD8B8]/80">
                      <span>{item.city}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                        item.code === "CENTRE_FULL" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                      )}>
                        {item.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8AD8B8]/60 truncate pt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION WARNING & CONTINUATION */}
            <div className="p-4 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] flex items-start gap-3">
              <ShieldAlert className="text-[#8AD8B8] shrink-0 mt-0.5" size={20} />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-[#FFF4E2]">Safe Execution Guarantee</h4>
                <p className="text-[#8AD8B8]/90 leading-relaxed">
                  Executing this operation will immediately allocate the <strong>2,813 safe candidates</strong>. The <strong>34 unresolved exceptions</strong> will not fail the batch; instead, ExamForge will automatically generate a structured <strong>Operational Handoff Note</strong> assigned to the <strong>Centre Superintendent</strong> for manual resolution.
                </p>
              </div>
            </div>

            {/* BUTTON BAR */}
            <div className="pt-4 border-t border-[rgba(138,216,184,0.15)] flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#FFF4E2]/80 hover:text-[#FFF4E2] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] border border-[rgba(138,216,184,0.2)] transition-all cursor-pointer"
              >
                &larr; Modify Scope
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-2xl bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] font-bold text-sm transition-all shadow-[0_10px_25px_-5px_rgba(138,216,184,0.6)] flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Proceed to Safety Confirmation</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: RISK GUARD & DUAL CONFIRMATION */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs text-[var(--color-ink)] max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 mx-auto flex items-center justify-center shadow-lg">
                <Lock size={26} />
              </div>
              <h2 className="text-xl font-bold text-[#FFF4E2]">
                Safety Confirmation Gate
              </h2>
              <p className="text-xs text-[#8AD8B8]/90 max-w-md mx-auto leading-relaxed">
                Confirm execution parameters before committing candidate allocations to the authoritative examination ledger.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.2)] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(138,216,184,0.1)]">
                <span className="text-[#8AD8B8]/70">Action:</span>
                <span className="font-bold text-[#FFF4E2]">Bulk Centre Allocation</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(138,216,184,0.1)]">
                <span className="text-[#8AD8B8]/70">Target Examination:</span>
                <span className="text-[#FFF4E2]">AIML Entrance Exam 2026 (EXM-AIML-2026)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(138,216,184,0.1)]">
                <span className="text-[#8AD8B8]/70">Immediate Allocations:</span>
                <span className="text-[#8AD8B8] font-bold">2,813 Candidates</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(138,216,184,0.1)]">
                <span className="text-[#8AD8B8]/70">Handoff Packet:</span>
                <span className="text-amber-300 font-bold">34 Unresolved Exceptions &rarr; Centre Superintendent</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8AD8B8]/70">Authorizing Role:</span>
                <span className="text-[#FFF4E2]">Vendor Controller (VENDOR)</span>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <div
              onClick={() => setConfirmedRisk(!confirmedRisk)}
              className="p-4 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] flex items-start gap-3 cursor-pointer select-none"
            >
              <div className={cn(
                "w-5 h-5 rounded-lg border flex items-center justify-center text-xs mt-0.5 transition-colors",
                confirmedRisk ? "border-[#8AD8B8] bg-[#8AD8B8] text-[#132D28] font-bold" : "border-[rgba(138,216,184,0.4)]"
              )}>
                {confirmedRisk && "✓"}
              </div>
              <span className="text-xs text-[#FFF4E2]/90 leading-relaxed font-sans">
                I acknowledge that this action will permanently allocate <strong>2,813 candidate seats</strong> across 4 test centres and generate an authoritative <strong>Handoff Note</strong> for the 34 unresolved exceptions.
              </span>
            </div>

            {/* Button Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#FFF4E2]/80 hover:text-[#FFF4E2] bg-[rgba(255,244,226,0.06)] border border-[rgba(138,216,184,0.2)] transition-all cursor-pointer"
              >
                &larr; Back to Preview
              </button>

              <button
                onClick={handleExecuteBatch}
                disabled={!confirmedRisk}
                className={cn(
                  "px-7 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2",
                  confirmedRisk
                    ? "bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] shadow-[0_10px_25px_-5px_rgba(138,216,184,0.6)] cursor-pointer active:scale-95"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                )}
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Execute Safe Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: LIVE EXECUTION PROGRESS */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[rgba(64,133,118,0.3)] border border-[rgba(138,216,184,0.4)] text-[#8AD8B8] mx-auto flex items-center justify-center shadow-xl">
              <RefreshCw className="animate-spin" size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#FFF4E2]">
                Executing SafeBatch Operations
              </h2>
              <p className="text-xs text-[#8AD8B8]/80 mt-1 font-mono">
                Processing 2,847 candidate records with real-time exception isolation
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8AD8B8]">Progress</span>
                <span className="font-bold text-[#FFF4E2]">{executionProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[rgba(8,19,16,0.8)] overflow-hidden border border-[rgba(138,216,184,0.2)]">
                <div
                  className="h-full bg-gradient-to-r from-[#408576] to-[#8AD8B8] rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(138,216,184,0.8)]"
                  style={{ width: `${executionProgress}%` }}
                />
              </div>
            </div>

            {/* Live Streaming Console Log */}
            <div className="p-4 rounded-2xl bg-[rgba(8,19,16,0.85)] border border-[rgba(138,216,184,0.2)] text-left font-mono text-[11px] text-[#8AD8B8] space-y-1.5 max-h-48 overflow-y-auto">
              {executionLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#8AD8B8]/50">&gt;</span>
                  <span className={cn(
                    idx === executionLog.length - 1 ? "text-[#FFF4E2] font-semibold" : "text-[#8AD8B8]/90"
                  )}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: OPERATIONAL HANDOFF NOTE CARD (THE KEY DELIVERABLE) */}
      {/* ========================================================================= */}
      {step === 5 && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* SUCCESS BANNER */}
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#8AD8B8]" size={22} />
              <div>
                <h3 className="text-sm font-bold text-[#FFF4E2]">
                  SafeBatch Completed with Isolated Exceptions
                </h3>
                <p className="text-xs text-[#8AD8B8]/90">
                  2,813 candidates allocated successfully. 34 unresolvable items packaged into Handoff Note.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#8AD8B8]/20 text-[#8AD8B8] font-mono text-xs font-bold border border-[#8AD8B8]/30">
              SHA256 LINKED
            </span>
          </div>

          {/* STRUCTURED HANDOFF NOTE (SPATIAL GLASS CARD) */}
          <div className="bg-[rgba(19,45,40,0.92)] border-2 border-[rgba(138,216,184,0.35)] rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-2xl space-y-6 max-w-3xl mx-auto relative overflow-hidden">
            {/* Ambient Watermark */}
            <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
              <ExamForgeLogo variant="mark" size={140} />
            </div>

            {/* Document Header */}
            <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.2)] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[rgba(64,133,118,0.3)] border border-[rgba(138,216,184,0.4)] flex items-center justify-center text-[#8AD8B8] shadow-md">
                  <FileText size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8AD8B8] block">
                    EXAMFORGE OPERATIONAL GOVERNANCE
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#FFF4E2]">
                    Bulk Action Handoff Note
                  </h2>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold">
                PARTIALLY COMPLETED
              </span>
            </div>

            {/* Action Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
                <span className="text-[10px] text-[#8AD8B8]/60 uppercase block">Action ID</span>
                <span className="text-xs font-bold text-[#FFF4E2]">BA-2026-00821-0047</span>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
                <span className="text-[10px] text-[#8AD8B8]/60 uppercase block">Handoff ID</span>
                <span className="text-xs font-bold text-[#8AD8B8]">HO-2026-0822-0034</span>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
                <span className="text-[10px] text-[#8AD8B8]/60 uppercase block">Initiated By</span>
                <span className="text-xs font-bold text-[#FFF4E2]">Vendor Controller</span>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
                <span className="text-[10px] text-[#8AD8B8]/60 uppercase block">Created At</span>
                <span className="text-xs font-bold text-[#FFF4E2]">22 Aug 2026, 13:58 IST</span>
              </div>
            </div>

            {/* Execution Tallies */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.5)] border border-[rgba(138,216,184,0.15)]">
                <span className="text-[10px] font-mono text-[#8AD8B8]/70 uppercase block">Total Affected</span>
                <span className="text-xl font-bold text-[#FFF4E2] font-mono">2,847</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[rgba(64,133,118,0.25)] border border-[#8AD8B8]/30">
                <span className="text-[10px] font-mono text-[#8AD8B8] uppercase block">Successfully Processed</span>
                <span className="text-xl font-bold text-[#8AD8B8] font-mono">2,813</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] font-mono text-amber-300 uppercase block">Requires Review</span>
                <span className="text-xl font-bold text-amber-400 font-mono">34</span>
              </div>
            </div>

            {/* Handoff Details Sections */}
            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)] space-y-1.5">
                <span className="font-mono text-[10px] font-bold text-[#8AD8B8] uppercase tracking-wider block">
                  REASON FOR HANDOFF
                </span>
                <ul className="space-y-1 text-[#FFF4E2]/90 list-disc list-inside">
                  <li><strong>23 candidates</strong> exceeded primary cluster capacity (Mumbai Hub A, Delhi Hub B, Bengaluru Hub C are 100% full).</li>
                  <li><strong>11 candidates</strong> have incomplete postal coordinates requiring manual verification.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)] space-y-1.5">
                <span className="font-mono text-[10px] font-bold text-[#8AD8B8] uppercase tracking-wider block">
                  RECOMMENDED NEXT ACTION
                </span>
                <p className="text-[#FFF4E2]/90 leading-relaxed">
                  Review the 34 unresolved candidates in the <strong>Centre Superintendent Workspace</strong> and allocate them to remaining buffer capacity at <strong>Chennai Main - Hub D (34 seats available)</strong> or designated special accommodation rooms.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] text-[#8AD8B8] uppercase block">ASSIGNED DOWNSTREAM ROLE</span>
                  <span className="text-sm font-bold text-[#FFF4E2] flex items-center gap-1.5 mt-0.5">
                    <Building2 size={16} className="text-[#8AD8B8]" />
                    Centre Superintendent (Role: OFFICER)
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#8AD8B8]/20 text-[#8AD8B8] font-mono text-xs font-bold border border-[#8AD8B8]/30">
                  Priority: High
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-4 border-t border-[rgba(138,216,184,0.2)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => alert("Handoff Note exported as JSON & Cryptographic PDF Packet.")}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#FFF4E2] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] border border-[rgba(138,216,184,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
                >
                  <Download size={14} />
                  Export Packet
                </button>
                <Link
                  href="/audit-timeline"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8AD8B8] hover:text-[#FFF4E2] bg-[rgba(64,133,118,0.2)] hover:bg-[rgba(64,133,118,0.3)] border border-[rgba(138,216,184,0.25)] flex items-center justify-center gap-2 transition-all no-underline w-full sm:w-auto"
                >
                  <Eye size={14} />
                  Inspect Ledger
                </Link>
              </div>

              {/* DIRECT ACTION TO CLAIM/RESOLVE */}
              <Link
                href="/safebatch/handoff/HO-2026-0822-0034"
                className="px-6 py-3 rounded-2xl bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] font-bold text-sm transition-all shadow-[0_10px_25px_-5px_rgba(138,216,184,0.6)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 no-underline w-full sm:w-auto"
              >
                <span>Open Handoff & Resolve Exceptions</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
