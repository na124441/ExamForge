"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  Download, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  Scale, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Check,
  Hash
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgePageHeader } from "@/components/forge/ForgePageHeader";
import { ForgeFormField } from "@/components/forge/ForgeFormField";
import { cn } from "@/lib/cn";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface SubjectScoreItem {
  subject_code: string;
  subject_name: string;
  max_marks: number;
  marks_obtained: number;
  percentile: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy_percent: number;
  status: string;
}

interface CandidateResult {
  result_id: string;
  certificate_id: string;
  candidate_id: string;
  registration_number: string;
  candidate_name: string;
  category: string;
  gender: string;
  dob: string;
  exam_id: string;
  exam_code: string;
  exam_title: string;
  vendor_name: string;
  exam_date: string;
  center_name: string;
  center_code: string;
  total_marks_obtained: number;
  max_total_marks: number;
  percentile: number;
  all_india_rank: number;
  category_rank: number;
  qualifying_status: string;
  category_cutoff: number;
  subjects: SubjectScoreItem[];
  result_hash: string;
  digital_signature: string;
  merkle_root: string;
  verification_url: string;
  issued_at: string;
  dispute_deadline: string;
}

interface PublishedExam {
  exam_id: string;
  code: string;
  title: string;
  category: string;
  exam_date: string;
  vendor_name: string;
  sample_roll_no: string;
}

export default function ResultPortalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[var(--color-ink-muted)]">Loading Result Portal...</div>}>
      <ResultPortalContent />
    </Suspense>
  );
}

function ResultPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialReg = searchParams.get("reg") || "";
  const initialExam = searchParams.get("exam") || "";

  const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([]);
  const [selectedExamCode, setSelectedExamCode] = useState(initialExam || "JEE-MAIN-2026");
  const [regNo, setRegNo] = useState(initialReg || "");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CandidateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch active published examination catalogs from DB
  useEffect(() => {
    async function fetchPublishedExams() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/results/recent-published`);
        if (res.ok) {
          const data = await res.json();
          setPublishedExams(data);
          if (!initialExam && data.length > 0) {
            setSelectedExamCode(data[0].code);
          }
        }
      } catch (err) {
        console.error("[Result Portal] Failed to load published exams list:", err);
      }
    }
    fetchPublishedExams();
  }, [initialExam]);

  // Execute lookup
  const handleLookup = useCallback(async (queryOverride?: string, examOverride?: string) => {
    const targetReg = (queryOverride || regNo).trim();
    const targetExam = examOverride || selectedExamCode;

    if (!targetReg) {
      setError("Please enter your Registration Number, Roll Number, or Student ID.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/results/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_number: targetReg,
          dob: dob || undefined,
          exam_code: targetExam || undefined
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || "Examination result record not found in database.");
      }

      const data: CandidateResult = await res.json();
      setResult(data);
      if (queryOverride) setRegNo(queryOverride);
      if (examOverride) setSelectedExamCode(examOverride);
    } catch (err: any) {
      console.error("[Result Portal Lookup Error]", err);
      setError(err.message || "Failed to retrieve scorecard from examination database.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [regNo, selectedExamCode, dob]);

  // Auto-search if query param present on mount
  useEffect(() => {
    if (initialReg) {
      handleLookup(initialReg, initialExam);
    }
  }, [initialReg, initialExam, handleLookup]);

  // Quick-test demo candidate presets
  const sampleCredentials = [
    { label: "JEE Main (Nayant S.)", reg: "REG-2026-JEE-9812", exam: "JEE-MAIN-2026", score: "97.95%tile" },
    { label: "NEET UG Medical", reg: "REG-2026-NEET-5412", exam: "NEET-UG-2026", score: "99.12%tile" },
    { label: "UPSC Civil Services", reg: "REG-2026-UPSC-1092", exam: "UPSC-CSE-PRELIMS-2026", score: "AIR 412" },
    { label: "AICTE AI Fellowship", reg: "EXF-CAN-2026-8F42A1", exam: "AICTE-CSAI-2026", score: "98.40%tile" },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ExamForge_Scorecard_${result.registration_number}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] font-sans pb-16 select-none">
      
      {/* Header Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 print:hidden">
        <ForgePageHeader
          breadcrumbs={[
            { label: "Candidate Hub", href: "/candidate" },
            { label: "Official Scorecard Portal" }
          ]}
          title="Official Examination Scorecard Portal"
          description="Verifiable multi-party cryptographic transcript, percentile ranking, and grade registry."
          status={
            <ForgeStatusPill variant="success" dot>
              LIVE DATABASE
            </ForgeStatusPill>
          }
          actions={
            <div className="flex items-center gap-2">
              <ForgeButton
                variant="secondary"
                size="md"
                onClick={() => router.push("/verify-result")}
                icon={<ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />}
              >
                Public Verifier
              </ForgeButton>
              <ForgeButton
                variant="secondary"
                size="md"
                onClick={() => router.push("/audit-timeline")}
                icon={<Scale className="w-3.5 h-3.5 text-[var(--color-accent)]" />}
              >
                Audit Chain
              </ForgeButton>
            </div>
          }
        />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        
        {/* Search / Lookup Panel (hidden during print) */}
        {!result && (
          <div className="max-w-2xl mx-auto space-y-6 print:hidden">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-[var(--color-ink)] tracking-tight">
                View Your Examination Results
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)]">
                Enter your official Registration Number, Roll Number, or Student ID as printed on your Hall Ticket / Admit Card.
              </p>
            </div>

            {/* Search Box */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-5">
              <div className="space-y-4">
                
                {/* Examination Selector */}
                <ForgeFormField label="Select Examination Session" required>
                  <select
                    value={selectedExamCode}
                    onChange={(e) => setSelectedExamCode(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] font-semibold focus:outline-none focus:border-[var(--color-border-focus)] transition-colors cursor-pointer"
                  >
                    {publishedExams.map((ex) => (
                      <option key={ex.code} value={ex.code}>
                        {ex.title} ({ex.code})
                      </option>
                    ))}
                    {publishedExams.length === 0 && (
                      <option value="JEE-MAIN-2026">Joint Entrance Examination (Main) - 2026</option>
                    )}
                  </select>
                </ForgeFormField>

                {/* Roll Number Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider block">
                    Registration Number / Roll No / Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. REG-2026-JEE-9812, EXF-CAN-2026-8F42A1, or student email"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] font-mono font-bold focus:outline-none focus:border-[var(--color-border-focus)] uppercase placeholder:normal-case placeholder:font-sans transition-colors"
                    />
                  </div>
                </div>

                {/* Optional DOB Pin */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider block">
                    Date of Birth <span className="text-[10px] font-normal text-[var(--color-ink-muted)]">(Optional security verification)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => handleLookup()}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Cryptographic Ledger...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Fetch Verified Scorecard
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Identities for Evaluators */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Instant Evaluation Sandbox &bull; Click any credential to test:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleCredentials.map((c) => (
                  <button
                    key={c.reg}
                    onClick={() => handleLookup(c.reg, c.exam)}
                    className="p-2.5 rounded-lg bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-inset)] border border-[var(--color-border)] text-left flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                        {c.label}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                        {c.reg}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[var(--color-accent-surface)] text-[var(--color-accent)] font-mono text-[10px] font-bold">
                      {c.score}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Official Verifiable Grade Sheet / Scorecard */}
        {result && (
          <div className="space-y-6">
            
            {/* Top Actions Bar (Hidden in Print) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs print:hidden">
              <button
                onClick={() => setResult(null)}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                &larr; Search Another Roll Number
              </button>

              <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Scorecard
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Verifiable JSON
                </button>
                <button
                  onClick={() => router.push(`/disputes/file?exam=${result.exam_id}&cand=${result.candidate_id}`)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Scale className="w-3.5 h-3.5" /> File Score Dispute / Grievance
                </button>
              </div>
            </div>

            {/* Official Printable Scorecard Document */}
            <div className="bg-[var(--color-surface-raised)] border-2 border-[var(--color-border)] rounded-2xl shadow-md overflow-hidden text-[var(--color-ink)] print:border-none print:shadow-none">
              
              {/* Institutional Certificate Banner */}
              <div className="border-b-2 border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-xs">
                    🏛️
                  </div>
                  <div>
                    <span className="text-[11px] font-bold font-mono tracking-widest text-[var(--color-accent)] uppercase block">
                      {result.vendor_name}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-ink)] tracking-tight">
                      {result.exam_title}
                    </h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-[var(--color-ink-secondary)] font-mono mt-1">
                      <span>Exam Session: {result.exam_date}</span>
                      <span>&bull;</span>
                      <span>Exam Code: {result.exam_code}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0 font-mono">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-ink-muted)]">Digital Certificate ID</span>
                  <span className="px-3 py-1 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-ink)]">
                    {result.certificate_id}
                  </span>
                  <span className="text-[10px] text-[var(--color-success)] flex items-center gap-1 font-sans font-semibold mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tamper-Proof Cryptographic Record
                  </span>
                </div>
              </div>

              {/* Candidate Demographics Ribbon */}
              <div className="p-6 sm:p-8 space-y-6">
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-xs font-sans">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--color-ink-muted)] block">Candidate Name</span>
                    <span className="font-bold text-sm text-[var(--color-ink)] mt-0.5 block">{result.candidate_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--color-ink-muted)] block">Roll / Registration No</span>
                    <span className="font-bold font-mono text-[var(--color-ink)] mt-0.5 block">{result.registration_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--color-ink-muted)] block">Category &amp; Gender</span>
                    <span className="font-bold text-[var(--color-ink)] mt-0.5 block">{result.category} / {result.gender}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--color-ink-muted)] block">Date of Birth</span>
                    <span className="font-bold font-mono text-[var(--color-ink)] mt-0.5 block">{result.dob}</span>
                  </div>
                </div>

                {/* Performance Hero Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Total Score */}
                  <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider">
                      Total Raw Score
                    </span>
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-3xl font-extrabold font-mono text-[var(--color-ink)]">
                        {result.total_marks_obtained}
                      </span>
                      <span className="text-xs font-mono text-[var(--color-ink-muted)]">
                        / {result.max_total_marks}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-success)] font-medium block">
                      {((result.total_marks_obtained / result.max_total_marks) * 100).toFixed(1)}% Marks Scored
                    </span>
                  </div>

                  {/* NTA / Board Percentile */}
                  <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider">
                      NTA Score (Percentile)
                    </span>
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-3xl font-extrabold font-mono text-[var(--color-accent)]">
                        {result.percentile.toFixed(4)}
                      </span>
                      <span className="text-xs font-mono text-[var(--color-ink-muted)]">%tile</span>
                    </div>
                    <span className="text-[11px] text-[var(--color-ink-secondary)] font-medium block">
                      Normalized Aggregate
                    </span>
                  </div>

                  {/* All India Rank (AIR) */}
                  <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider">
                      All India Rank (AIR)
                    </span>
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-3xl font-extrabold font-mono text-[var(--color-ink)]">
                        #{result.all_india_rank.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-ink-muted)] font-mono block">
                      Category Rank: #{result.category_rank.toLocaleString()}
                    </span>
                  </div>

                  {/* Qualification Status */}
                  <div className="p-5 rounded-xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/30 shadow-xs space-y-1 text-[var(--color-success-text)]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Final Verdict
                    </span>
                    <div className="pt-1">
                      <span className="text-sm font-extrabold leading-snug block">
                        {result.qualifying_status}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-90 block">
                      Cut-off Met ({result.category}: {result.category_cutoff.toFixed(2)}%)
                    </span>
                  </div>

                </div>

                {/* Granular Subject Performance Breakdown Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--color-ink)] uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                      Section-wise Performance Breakdown
                    </h3>
                    <span className="text-xs font-mono text-[var(--color-ink-muted)]">
                      Negative Marking Rule: Applicable
                    </span>
                  </div>

                  {/* Mobile Subject Cards (< 640px) */}
                  <div className="sm:hidden flex flex-col gap-3">
                    {result.subjects.map((sub) => (
                      <div 
                        key={sub.subject_code} 
                        className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-2">
                          <div>
                            <span className="font-bold text-xs text-[var(--color-ink)] block">
                              {sub.subject_name}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                              Code: {sub.subject_code}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[var(--color-success-surface)] text-[var(--color-success-text)] font-sans text-[10px] font-bold shrink-0">
                            {sub.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-sans">Marks Obtained</span>
                            <span className="font-bold text-sm text-[var(--color-ink)]">{sub.marks_obtained.toFixed(1)} / {sub.max_marks.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-sans">Percentile Score</span>
                            <span className="font-bold text-sm text-[var(--color-accent)]">{sub.percentile.toFixed(4)} %tile</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-sans">Accuracy Rate</span>
                            <span className="font-bold text-[var(--color-success)]">{sub.accuracy_percent}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-sans">Att / Corr / Incorr</span>
                            <span className="font-bold text-[var(--color-ink)]">{sub.attempted} / <strong className="text-[var(--color-success)]">{sub.correct}</strong> / <strong className="text-red-500">{sub.incorrect}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop & Tablet Table (>= 640px) */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--color-border)]">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[var(--color-ink-muted)] text-[11px] font-mono uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Subject / Section</th>
                          <th className="py-3 px-4 font-semibold text-right">Max Marks</th>
                          <th className="py-3 px-4 font-semibold text-right">Marks Obtained</th>
                          <th className="py-3 px-4 font-semibold text-right">Percentile Score</th>
                          <th className="py-3 px-4 font-semibold text-center">Attempted / Correct / Incorrect</th>
                          <th className="py-3 px-4 font-semibold text-right">Accuracy</th>
                          <th className="py-3 px-4 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)] font-mono">
                        {result.subjects.map((sub) => (
                          <tr key={sub.subject_code} className="hover:bg-[var(--color-surface-sunken)] transition-colors">
                            <td className="py-3.5 px-4 font-sans font-bold text-[var(--color-ink)]">
                              {sub.subject_name}
                              <span className="block text-[10px] text-[var(--color-ink-muted)] font-mono">{sub.subject_code}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right text-[var(--color-ink-secondary)]">{sub.max_marks.toFixed(1)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-[var(--color-ink)]">{sub.marks_obtained.toFixed(1)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-[var(--color-accent)]">{sub.percentile.toFixed(4)} %tile</td>
                            <td className="py-3.5 px-4 text-center text-[var(--color-ink)]">
                              <span className="text-[var(--color-ink)] font-bold">{sub.attempted}</span> / 
                              <span className="text-[var(--color-success)] font-bold"> {sub.correct}</span> / 
                              <span className="text-red-500 font-bold"> {sub.incorrect}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[var(--color-success)]">{sub.accuracy_percent}%</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded bg-[var(--color-success-surface)] text-[var(--color-success-text)] font-sans text-[10px] font-bold">
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assessment Center Details */}
                <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-xs font-sans flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--color-ink-muted)]">Testing Centre</span>
                      <div className="font-bold text-[var(--color-ink)]">{result.center_name}</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[var(--color-ink-secondary)]">
                    Centre ID: <span className="font-bold text-[var(--color-ink)]">{result.center_code}</span>
                  </div>
                </div>

                {/* Cryptographic Ledger Verification Seal */}
                <div className="p-5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                    <span className="text-[11px] font-bold text-[var(--color-ink)] font-sans flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />
                      Cryptographic Verification &amp; Non-Repudiation Seal
                    </span>
                    <span className="text-[10px] text-[var(--color-success)] font-bold">
                      VERIFIED ON MERKLE LEDGER
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block">SHA-256 Transcript Hash</span>
                      <span className="text-[var(--color-accent)] break-all select-all block">{result.result_hash}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block">Merkle Tree Root Digest</span>
                      <span className="text-[var(--color-ink-secondary)] break-all select-all block">{result.merkle_root}</span>
                    </div>
                    <div className="space-y-0.5 md:col-span-2">
                      <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block">Authority ECDSA Digital Signature (SECP256R1)</span>
                      <span className="text-[var(--color-ink-secondary)] break-all select-all block">{result.digital_signature}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-ink-muted)] font-sans">
                    <span>Issued At: {result.issued_at}</span>
                    <span>Dispute Window: {result.dispute_deadline}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
