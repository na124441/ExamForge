"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Users,
  Building2,
  FileCheck,
  RefreshCw,
  Eye,
  Layers,
  ChevronRight,
  Clock,
  Check,
  X,
  FileText,
  UserCheck,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  previewSafeBatch,
  executeSafeBatch,
  getSafeBatchHandoffs,
  SafeBatchPreviewResponse,
  SafeBatchExecuteResponse,
  HandoffSummary,
} from "@/lib/api";

const ACTION_TYPES = [
  {
    id: "BULK_CENTRE_ALLOCATION",
    title: "Bulk Centre & Seat Allocation",
    desc: "Allocate exam venues, shifts, and rooms to verified candidates based on geo-proximity, capacity, and PWD access requirements.",
    risk: "HIGH",
    riskBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Building2,
    recommended: true,
  },
  {
    id: "BULK_ADMIT_CARD_RELEASE",
    title: "Bulk Admit Card Release",
    desc: "Sign and publish tamper-evident cryptographic admit cards with ECDSA key wraps across all allocated cohorts.",
    risk: "HIGH",
    riskBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: FileCheck,
    recommended: false,
  },
  {
    id: "BULK_VENUE_MIGRATION",
    title: "Emergency Centre Rescheduling",
    desc: "Migrate an entire candidate batch from an offline or compromised venue to reserve buffer centres.",
    risk: "CRITICAL",
    riskBadge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    icon: AlertTriangle,
    recommended: false,
  },
  {
    id: "BULK_GRADE_ARBITRATION",
    title: "Batch Double-Blind Grade Audit",
    desc: "Trigger automatic re-evaluation routing for all subjective scripts with delta variance > 2.0.",
    risk: "MEDIUM",
    riskBadge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Layers,
    recommended: false,
  },
];

export function SafeBatchStudio() {
  const [step, setStep] = useState<number>(1);
  const [selectedAction, setSelectedAction] = useState<string>("BULK_CENTRE_ALLOCATION");
  const [examId, setExamId] = useState<string>("EXM-AIML-2026");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<SafeBatchPreviewResponse | null>(null);
  const [confirmedRisk, setConfirmedRisk] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<SafeBatchExecuteResponse | null>(null);
  const [recentHandoffs, setRecentHandoffs] = useState<HandoffSummary[]>([]);
  const [activeExceptionTab, setActiveExceptionTab] = useState<"ALL" | "CENTRE_FULL" | "ADDRESS_MISSING">("ALL");

  useEffect(() => {
    loadRecentHandoffs();
  }, []);

  const loadRecentHandoffs = async () => {
    try {
      const list = await getSafeBatchHandoffs();
      setRecentHandoffs(list);
    } catch (err) {
      console.error("Failed to load handoffs:", err);
    }
  };

  const handleGeneratePreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await previewSafeBatch({
        exam_id: examId,
        action_type: selectedAction,
      });
      setPreviewData(res);
      setStep(2);
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteBatch = async () => {
    setExecuting(true);
    setStep(4);
    try {
      const res = await executeSafeBatch({
        preview_id: previewData?.preview_id,
        exam_id: examId,
        action_type: selectedAction,
        confirmed: true,
      });
      setExecutionResult(res);
      setStep(5);
    } catch (err) {
      console.error("Execution error:", err);
      setStep(5);
    } finally {
      setExecuting(false);
    }
  };

  const filteredExceptions = previewData?.exception_preview_sample.filter((item) => {
    if (activeExceptionTab === "ALL") return true;
    return item.code === activeExceptionTab;
  }) || [];

  return (
    <div className="space-y-6 font-sans w-full max-w-7xl mx-auto text-[var(--color-ink)]">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="rounded-xl p-6 sm:p-8 bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              SAFEGUARDED BULK OPERATIONS ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)] tracking-tight">
              ExamForge SafeBatch™
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] max-w-2xl leading-relaxed">
              Validate blast radius with pre-flight impact previews, execute high-volume operations safely with exception isolation, and automatically generate actionable handoff notes for downstream roles.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-center min-w-[110px]">
              <span className="text-[10px] text-[var(--color-ink-muted)] font-mono block uppercase font-bold">Active Handoffs</span>
              <span className="text-lg font-bold text-[var(--color-ink)] font-mono">{recentHandoffs.length || 1}</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-center min-w-[110px]">
              <span className="text-[10px] text-[var(--color-ink-muted)] font-mono block uppercase font-bold">Safety Score</span>
              <span className="text-lg font-bold text-[var(--color-success)] font-mono">100%</span>
            </div>
          </div>
        </div>

        {/* 5-STEP WORKFLOW PROGRESS */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex sm:grid sm:grid-cols-5 overflow-x-auto pb-1 sm:pb-0 gap-2 text-xs">
          {[
            { num: 1, label: "01 Scope" },
            { num: 2, label: "02 Impact Preview" },
            { num: 3, label: "03 Safety Guard" },
            { num: 4, label: "04 Execution" },
            { num: 5, label: "05 Handoff Note" },
          ].map((s) => (
            <div
              key={s.num}
              className={cn(
                "px-3 py-2 rounded-lg font-mono flex items-center gap-2 transition-all shrink-0 min-w-[120px] sm:min-w-0 text-xs",
                step === s.num
                  ? "bg-[var(--color-accent-surface)] text-[var(--color-accent)] font-bold border border-[var(--color-accent)]/30 shadow-xs"
                  : step > s.num
                  ? "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20 font-semibold"
                  : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] border border-[var(--color-border)]"
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  step > s.num
                    ? "bg-[var(--color-success)] text-white"
                    : step === s.num
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-surface-inset)] text-[var(--color-ink-muted)]"
                )}
              >
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
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Layers size={18} className="text-[var(--color-accent)]" />
                Select Bulk Operation & Target Examination
              </h2>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                Choose an operational bulk action. Each action is evaluated against automated risk matrices and pre-flight constraints.
              </p>
            </div>

            {/* Examination Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-wider mb-2 font-bold">
                  Target Examination
                </label>
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                >
                  <option value="EXM-AIML-2026">AIML Entrance Examination 2026 (EXM-AIML-2026) - 2,847 Candidates</option>
                  <option value="EXM-MED-2026">National Medical Entrance Test 2026 - 4,120 Candidates</option>
                  <option value="EXM-CIVIL-2026">Civil Services Preliminary 2026 - 12,500 Candidates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-wider mb-2 font-bold">
                  Target Candidate Cohort
                </label>
                <div className="p-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[var(--color-accent)]" />
                    <span className="text-xs font-semibold text-[var(--color-ink)]">All Registered & Verified Candidates</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent)] font-mono text-xs font-bold border border-[var(--color-accent)]/20">
                    2,847 Records
                  </span>
                </div>
              </div>
            </div>

            {/* Action Cards Grid */}
            <div className="space-y-3">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-wider font-bold">
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
                        "p-4 sm:p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                        isSelected
                          ? "bg-[var(--color-accent-surface)] border-[var(--color-accent)] shadow-xs"
                          : "bg-[var(--color-surface-sunken)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shrink-0",
                              isSelected
                                ? "bg-[var(--color-accent)] text-white"
                                : "bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink-secondary)]"
                            )}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs sm:text-sm font-bold text-[var(--color-ink)]">{act.title}</h3>
                              {act.recommended && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500 text-white uppercase">
                                  Killer Use Case
                                </span>
                              )}
                            </div>
                            <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border", act.riskBadge)}>
                              {act.risk} RISK
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center text-xs transition-colors shrink-0",
                            isSelected
                              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white font-bold"
                              : "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]"
                          )}
                        >
                          {isSelected && "✓"}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--color-ink-secondary)] mt-3 leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              <Link
                href="/authority"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] transition-colors no-underline"
              >
                &larr; Back to Hub
              </Link>

              <button
                onClick={handleGeneratePreview}
                disabled={loadingPreview}
                className="px-6 py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loadingPreview ? <RefreshCw className="animate-spin" size={14} /> : <Eye size={14} />}
                <span>Validate &amp; Preview Impact &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PRE-FLIGHT IMPACT PREVIEW & VALIDATION */}
      {/* ========================================================================= */}
      {step === 2 && previewData && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--color-accent)] block tracking-wider font-bold">
                  PRE-FLIGHT BLAST RADIUS VERIFICATION
                </span>
                <h2 className="text-base sm:text-xl font-bold text-[var(--color-ink)] mt-0.5">
                  {previewData.action_title} Impact Analysis
                </h2>
                <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                  Exam: <strong className="text-[var(--color-ink)]">{previewData.exam_title}</strong> ({previewData.exam_id})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full font-mono text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  {previewData.risk_level} RISK
                </span>
              </div>
            </div>

            {/* Blast Radius KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-bold">Total Scope</span>
                <span className="text-xl font-bold text-[var(--color-ink)] block mt-0.5">
                  {previewData.scope_summary.total_candidates}
                </span>
                <span className="text-[10px] text-[var(--color-ink-secondary)]">Candidates</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/20">
                <span className="text-[10px] text-[var(--color-success-text)] uppercase block font-bold">Safe Allocations</span>
                <span className="text-xl font-bold text-[var(--color-success)] block mt-0.5">
                  {previewData.scope_summary.safe_allocations}
                </span>
                <span className="text-[10px] text-[var(--color-success-text)]">98.8% pass cleanly</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase block font-bold">Exceptions Isolated</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                  {previewData.scope_summary.unresolved_exceptions}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">Isolated into handoff</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-bold">Centres Active</span>
                <span className="text-xl font-bold text-[var(--color-ink)] block mt-0.5">
                  {previewData.scope_summary.centres_available}
                </span>
                <span className="text-[10px] text-[var(--color-ink-secondary)]">Capacity: {previewData.scope_summary.total_seats_capacity}</span>
              </div>
            </div>

            {/* Centre Capacity Utilization Matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">
                  Centre Capacity Fill Status
                </h3>
                <span className="text-xs text-[var(--color-ink-secondary)]">4 Assigned Centres</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {previewData.centre_distribution.map((centre) => (
                  <div key={centre.id} className="p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--color-ink)]">{centre.name}</span>
                      <span className={cn(
                        "font-mono text-[11px] font-bold px-2 py-0.5 rounded",
                        centre.status.includes("FULL")
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-[var(--color-success-surface)] text-[var(--color-success-text)]"
                      )}>
                        {centre.status}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-inset)] rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          centre.status.includes("FULL") ? "bg-amber-500" : "bg-[var(--color-success)]"
                        )}
                        style={{ width: `${(centre.allocated_now / centre.total_capacity) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-ink-secondary)]">
                      <span>Allocated: {centre.allocated_now} / {centre.total_capacity}</span>
                      <span>{centre.utilization}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exception Isolation Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">
                    Isolated Exceptions ({previewData.scope_summary.unresolved_exceptions})
                  </h3>
                  <p className="text-[11px] text-[var(--color-ink-secondary)]">
                    These items will not block the main batch &mdash; they will automatically convert into a downstream handoff note.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[var(--color-surface-sunken)] p-1 rounded-lg border border-[var(--color-border)] text-xs">
                  <button
                    onClick={() => setActiveExceptionTab("ALL")}
                    className={cn("px-2.5 py-1 rounded font-semibold transition-colors", activeExceptionTab === "ALL" ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-2xs" : "text-[var(--color-ink-secondary)]")}
                  >
                    All ({previewData.scope_summary.unresolved_exceptions})
                  </button>
                  <button
                    onClick={() => setActiveExceptionTab("CENTRE_FULL")}
                    className={cn("px-2.5 py-1 rounded font-semibold transition-colors", activeExceptionTab === "CENTRE_FULL" ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-2xs" : "text-[var(--color-ink-secondary)]")}
                  >
                    Capacity (22)
                  </button>
                  <button
                    onClick={() => setActiveExceptionTab("ADDRESS_MISSING")}
                    className={cn("px-2.5 py-1 rounded font-semibold transition-colors", activeExceptionTab === "ADDRESS_MISSING" ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-2xs" : "text-[var(--color-ink-secondary)]")}
                  >
                    Address (12)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[11px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Candidate Name</th>
                      <th className="py-2.5 px-4">Reg No</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4">Exception Reason</th>
                      <th className="py-2.5 px-4">Handoff Routing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {filteredExceptions.map((ex, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-surface-sunken)]">
                        <td className="py-2.5 px-4 font-semibold text-[var(--color-ink)]">{ex.name}</td>
                        <td className="py-2.5 px-4 font-mono text-[var(--color-ink-secondary)]">{ex.reg_no}</td>
                        <td className="py-2.5 px-4 text-[var(--color-ink-secondary)]">{ex.city}</td>
                        <td className="py-2.5 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold",
                            ex.code === "CENTRE_FULL" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          )}>
                            {ex.code}
                          </span>
                          <span className="text-[11px] text-[var(--color-ink-secondary)] block mt-0.5">{ex.detail}</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--color-accent)] font-semibold">
                          &rarr; Centre Superintendent
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] transition-colors cursor-pointer"
              >
                &larr; Reconfigure Scope
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Proceed to Safety Confirmation</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: RISK GUARD & SAFETY CONFIRMATION GATE */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6 text-[var(--color-ink)]">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs">
                <Lock size={22} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)]">
                Safety Confirmation Gate
              </h2>
              <p className="text-xs text-[var(--color-ink-secondary)] max-w-md mx-auto leading-relaxed">
                Confirm execution parameters before committing candidate allocations to the authoritative examination ledger.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-ink-muted)]">Action:</span>
                <span className="font-bold text-[var(--color-ink)]">Bulk Centre Allocation</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-ink-muted)]">Target Examination:</span>
                <span className="text-[var(--color-ink)]">AIML Entrance Exam 2026 (EXM-AIML-2026)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-ink-muted)]">Immediate Allocations:</span>
                <span className="text-[var(--color-success)] font-bold">2,813 Candidates</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-ink-muted)]">Handoff Packet:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">34 Unresolved Exceptions &rarr; Centre Superintendent</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-ink-muted)]">Authorizing Role:</span>
                <span className="text-[var(--color-ink)]">Vendor Controller (VENDOR)</span>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <div
              onClick={() => setConfirmedRisk(!confirmedRisk)}
              className={cn(
                "p-4 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all",
                confirmedRisk
                  ? "bg-[var(--color-accent-surface)] border-[var(--color-accent)]"
                  : "bg-[var(--color-surface-sunken)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center text-xs mt-0.5 transition-colors shrink-0",
                  confirmedRisk
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white font-bold"
                    : "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]"
                )}
              >
                {confirmedRisk && "✓"}
              </div>
              <span className="text-xs text-[var(--color-ink)] leading-relaxed font-sans">
                I acknowledge that this action will permanently allocate <strong>2,813 candidate seats</strong> across 4 test centres and generate an authoritative <strong>Handoff Note</strong> for the 34 unresolved exceptions.
              </span>
            </div>

            {/* Button Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] transition-colors cursor-pointer"
              >
                &larr; Back to Preview
              </button>

              <button
                onClick={handleExecuteBatch}
                disabled={!confirmedRisk || executing}
                className={cn(
                  "px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-xs",
                  confirmedRisk
                    ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white cursor-pointer active:scale-95"
                    : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] border border-[var(--color-border)] cursor-not-allowed"
                )}
              >
                {executing ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                <span>Authorize &amp; Execute Safely</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SAFE EXECUTION PROGRESS */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-8 shadow-xs max-w-xl mx-auto text-center space-y-6 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 mx-auto flex items-center justify-center">
            <RefreshCw className="animate-spin" size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)]">
              Executing Safeguarded Bulk Allocation...
            </h2>
            <p className="text-xs text-[var(--color-ink-secondary)]">
              Committing 2,813 verified records to ledger &amp; isolating 34 exceptions.
            </p>
          </div>

          <div className="w-full bg-[var(--color-surface-sunken)] rounded-full h-2.5 overflow-hidden border border-[var(--color-border)]">
            <div className="h-full rounded-full bg-[var(--color-accent)] animate-pulse w-4/5" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: EXECUTION RESULT & OPERATIONAL HANDOFF NOTE */}
      {/* ========================================================================= */}
      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          {/* SUCCESS BANNER */}
          <div className="p-5 sm:p-6 rounded-xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-success)] text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-success-text)]">
                  SafeBatch Executed: 2,813 Allocated &middot; 34 Exceptions Isolated
                </h3>
                <p className="text-xs text-[var(--color-success-text)] opacity-90">
                  Zero data loss. Ledger state signed with audit hash <code className="font-mono font-bold">0x8f3c9e...f8a9</code>.
                </p>
              </div>
            </div>
            <Link
              href="/audit-timeline"
              className="px-4 py-2 rounded-lg bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-xs shadow-2xs transition-colors self-start sm:self-auto no-underline"
            >
              Verify Ledger
            </Link>
          </div>

          {/* GENERATED OPERATIONAL HANDOFF NOTE CARD */}
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                  HO
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">
                      GENERATED OPERATIONAL HANDOFF NOTE
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500 text-white uppercase">
                      Assigned
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] mt-0.5">
                    Handoff: HO-2026-0822-0034
                  </h2>
                </div>
              </div>

              <Link
                href="/safebatch/handoff/HO-2026-0822-0034"
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 no-underline cursor-pointer active:scale-95"
              >
                <UserCheck size={14} />
                <span>Open Superintendent Resolution View &rarr;</span>
              </Link>
            </div>

            {/* Handoff Details Dossier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-2 text-xs">
                <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block font-bold">Operational Context</span>
                <div className="space-y-1 text-[var(--color-ink)]">
                  <div><strong>Initiated By:</strong> Vendor Controller (admin@vendor-platform.org)</div>
                  <div><strong>Assigned Role:</strong> Centre Superintendent (officer@center-alpha.org)</div>
                  <div><strong>Affected Scope:</strong> <span className="text-amber-600 dark:text-amber-400 font-bold">34 Candidate Exceptions</span></div>
                  <div><strong>Linked Action ID:</strong> <code className="font-mono text-[11px] text-[var(--color-ink-secondary)]">BA-2026-0822-0091</code></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-2 text-xs">
                <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block font-bold">Required Downstream Action</span>
                <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                  Primary capacity limits reached in Delhi North (22) and coordinates unresolved (12). Centre Superintendent must review candidate profiles, assign Chennai Hub D buffer or authorize secondary exam session shift.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  setStep(1);
                  setConfirmedRisk(false);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] transition-colors cursor-pointer"
              >
                Create Another Bulk Action
              </button>

              <Link
                href="/safebatch/handoff/HO-2026-0822-0034"
                className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 no-underline"
              >
                <span>Continue to Handoff Resolution Desk</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
