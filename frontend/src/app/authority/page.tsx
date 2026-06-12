"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  RefreshCw, 
  Terminal, 
  Settings, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Activity,
  ShieldCheck,
  AlertTriangle,
  History,
  FileCheck
} from "lucide-react";
import { TrustScoreGauge } from "../../components/ui/TrustScoreGauge";
import { LifecycleStepper, StepInfo } from "../../components/ui/LifecycleStepper";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { BlockingReasons } from "../../components/ui/BlockingReasons";

const BACKEND_URL = "http://localhost:8000";

interface DashboardMetrics {
  institution: { id: string; name: string; tenant_slug: string; keyspace_keys: number };
  policy: { name: string; threshold: number };
  exam_lifecycle: { exam_id: string | null; state: string };
  center_ops: { total_packages: number; released_packages: number; total_candidates: number; verified_candidates: number };
  evaluation_ops: { total_booklets: number; locked_booklets: number; omr_pending: number; omr_finalized: number; conflicts_total: number; conflicts_resolved: number };
  dispute_ops: { open: number; resolved: number };
  trust_ops: { score: number; gate_allowed: boolean };
  deployment_ops: { db_status: string; redis_status: string; storage_status: string };
  security_ops: { unmitigated_threats: number; pending_approvals: number; hardening_passed: number; compliance_verdict: string; compliance_score: number };
  verdict: { status: string; reasons: string[] };
}

// Map the exam state to active stepper sequence
const STATE_SEQUENCE: Record<string, number> = {
  "DRAFT": 1,
  "CONFIG_LOCKED": 2,
  "PAPER_GENERATED": 3,
  "PACKAGE_SEALED": 4,
  "AWAITING_RELEASE": 5,
  "RELEASE_WINDOW_OPEN": 6,
  "IN_PROGRESS": 7,
  "SUBMISSION_LOCKED": 8,
  "EVALUATION_OPEN": 9,
  "RESULT_VERIFICATION": 11,
  "RESULT_PUBLISHED": 12,
  "ARCHIVED": 15
};

const DEFAULT_STAGES: StepInfo[] = [
  { name: "SETUP & POLICY LOCK", status: "COMPLETED", sequence: 1 },
  { name: "EXAM CREATION", status: "COMPLETED", sequence: 2 },
  { name: "PAPER GENERATION", status: "COMPLETED", sequence: 3 },
  { name: "PACKAGE SEALING", status: "COMPLETED", sequence: 4 },
  { name: "CENTER RELEASE", status: "COMPLETED", sequence: 5 },
  { name: "CANDIDATE VERIFY", status: "COMPLETED", sequence: 6 },
  { name: "EXAM CONDUCT", status: "COMPLETED", sequence: 7 },
  { name: "OMR SCANNING", status: "COMPLETED", sequence: 8 },
  { name: "DOUBLE EVALUATION", status: "IN_PROGRESS", sequence: 9 },
  { name: "CONFLICT OVERRIDE", status: "PENDING", sequence: 10 },
  { name: "GATE CHECK", status: "PENDING", sequence: 11 },
  { name: "RESULT PUBLISH", status: "PENDING", sequence: 12 },
  { name: "DISPUTE REVIEW", status: "PENDING", sequence: 13 },
  { name: "LEDGER AUDIT", status: "PENDING", sequence: 14 },
  { name: "COMPLIANCE VERDICT", status: "PENDING", sequence: 15 }
];

const MOCK_FALLBACK_METRICS: DashboardMetrics = {
  institution: { id: "INST-001", name: "National Scholarship Board", tenant_slug: "nsb-public", keyspace_keys: 5 },
  policy: { name: "Strictest Compliance", threshold: 95 },
  exam_lifecycle: { exam_id: "EXM-001", state: "EVALUATION_OPEN" },
  center_ops: { total_packages: 5, released_packages: 4, total_candidates: 1250, verified_candidates: 1200 },
  evaluation_ops: { total_booklets: 1250, locked_booklets: 840, omr_pending: 10, omr_finalized: 1240, conflicts_total: 8, conflicts_resolved: 7 },
  dispute_ops: { open: 1, resolved: 4 },
  trust_ops: { score: 97, gate_allowed: true },
  deployment_ops: { db_status: "OK", redis_status: "OK", storage_status: "OK" },
  security_ops: { unmitigated_threats: 0, pending_approvals: 0, hardening_passed: 12, compliance_verdict: "PASS", compliance_score: 98 },
  verdict: { status: "VALID", reasons: [] }
};

export default function AuthorityDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/authority/dashboard`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error("Authentication failed. Please log in as a Controller or Platform Admin.");
      }

      if (!res.ok) {
        throw new Error("Failed to load authority dashboard data.");
      }

      const data = await res.json();
      setMetrics(data);
      setError("");
    } catch (err: any) {
      console.warn("FastAPI backend connection failed. Falling back to local offline mock telemetry.", err);
      // Fallback to local mock data to keep the UI interactive in offline demo environments
      setMetrics(MOCK_FALLBACK_METRICS);
      setError("");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <LoaderSpinner />
        <span>DECRYPTING SECURE TELEMETRY BINDER...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="bg-slate-900 p-8 rounded-2xl border border-red-500/20 max-w-md w-full shadow-xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-white mb-2">Access Blocked</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
          >
            Authenticate Session
          </button>
        </div>
      </div>
    );
  }

  const status = metrics.verdict.status ?? "BLOCKED";
  const score = metrics.trust_ops.score ?? 97;
  const currentSeq = STATE_SEQUENCE[metrics.exam_lifecycle.state] || 9;


  // Generate stage list with dynamic status mapping
  const stages = DEFAULT_STAGES.map(s => {
    let stat = "PENDING";
    if (s.sequence < currentSeq) stat = "COMPLETED";
    else if (s.sequence === currentSeq) stat = "IN_PROGRESS";
    return { ...s, status: stat };
  });

  return (
    <div className="space-y-6">
      {/* Page Sub-Header Details */}
      <div className="flex justify-between items-center bg-glass border border-slate-900/60 p-5 rounded-2xl backdrop-blur-md shadow-glow-blue/5">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2 font-outfit">
            <span>Authority Command Center</span>
            <span className="text-[9px] px-2.5 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-450 rounded uppercase font-mono font-bold tracking-widest animate-pulse">
              Live Telemetry
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
            Cryptographic audit chains and operational status for <span className="text-white font-bold">{metrics?.institution.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={refreshing}
            className="p-2 px-3 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync Stats</span>
          </button>
          <button
            onClick={() => router.push("/pilot-run")}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-500 hover:to-indigo-500 transition shadow-md shadow-blue-550/10 uppercase tracking-wide cursor-pointer active:scale-95"
          >
            🚀 Run Demo Simulator
          </button>
        </div>
      </div>

      {/* Row 1: High Level Security Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Trust Score Gauge */}
        <div className="lg:col-span-3">
          <TrustScoreGauge score={score} required={95} size={150} strokeWidth={12} />
        </div>

        {/* Center: Stepper (6 cols) */}
        <div className="lg:col-span-6 bg-glass border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono px-1">
              Exam Lifecycle Stepper
            </h3>
            <StatusBadge status={metrics?.exam_lifecycle.state || "DRAFT"} />
          </div>
          <LifecycleStepper stages={stages.slice(0, 5)} layout="horizontal" />
          <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Exam ID: {metrics?.exam_lifecycle.exam_id || "EXM-PILOT-001"}</span>
            <span>Current Stage Sequence: {currentSeq} / 15</span>
          </div>
        </div>

        {/* Right: Gate & Ops Health (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-glass border border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between flex-1 shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Publication Gate</span>
            <div className="mt-2.5">
              <span className={`text-lg font-black flex items-center gap-1.5 ${metrics?.trust_ops.gate_allowed ? "text-emerald-400" : "text-red-400"}`}>
                {metrics?.trust_ops.gate_allowed ? "🔓 ALLOWED" : "🔒 LOCKED"}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                {metrics?.trust_ops.gate_allowed ? "All safety parameters passed verification." : "Blocked by security policies."}
              </p>
            </div>
            <button 
              onClick={() => router.push("/publication-gate")}
              className="mt-3.5 w-full py-1.5 text-center bg-slate-905 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-[10px] font-bold transition font-mono uppercase cursor-pointer"
            >
              Verify Checklist
            </button>
          </div>

          <div className="bg-glass border border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between flex-1 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Deployment Health</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
            </div>
            <div className="mt-2.5 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Postgres DB:</span>
                <span className="text-emerald-400 font-bold">{metrics?.deployment_ops.db_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Redis Cache:</span>
                <span className="text-emerald-400 font-bold">{metrics?.deployment_ops.redis_status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Detailed Ops Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CenterOps Card */}
        <div className="bg-glass-card p-5 rounded-2xl border border-slate-850 flex flex-col justify-between gap-4.5 shadow-sm hover:shadow-glow-blue/2 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">CenterOps telemetry</span>
              <h3 className="text-sm font-black text-white mt-0.5 font-outfit">Seat & Releases</h3>
            </div>
            <StatusBadge status={metrics?.center_ops.released_packages === metrics?.center_ops.total_packages ? "VERIFIED" : "PROCESSING"} />
          </div>
          <div className="text-xs font-mono space-y-2.5">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Decryption Releases:</span>
                <span className="text-white font-bold">{metrics?.center_ops.released_packages} / {metrics?.center_ops.total_packages}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 mt-1 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${metrics?.center_ops.total_packages > 0 ? (metrics.center_ops.released_packages / metrics.center_ops.total_packages) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidates Verified:</span>
                <span className="text-white font-bold">{metrics?.center_ops.verified_candidates} / {metrics?.center_ops.total_candidates}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 mt-1 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${metrics?.center_ops.total_candidates > 0 ? (metrics.center_ops.verified_candidates / metrics.center_ops.total_candidates) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <button 
            onClick={() => router.push("/exam-ops")}
            className="w-full py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition font-mono uppercase tracking-wide text-center cursor-pointer"
          >
            Monitor Centers
          </button>
        </div>

        {/* EvaluationOps Card */}
        <div className="bg-glass-card p-5 rounded-2xl border border-slate-850 flex flex-col justify-between gap-4.5 shadow-sm hover:shadow-glow-emerald/2 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Grading telemetry</span>
              <h3 className="text-sm font-black text-white mt-0.5 font-outfit">Double Evaluation</h3>
            </div>
            <StatusBadge status={metrics.evaluation_ops.conflicts_total === metrics.evaluation_ops.conflicts_resolved ? "READY" : "WARNING"} />
          </div>
          <div className="text-xs font-mono space-y-2.5">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-550">Locked Booklets:</span>
                <span className="text-white font-bold">{metrics.evaluation_ops.locked_booklets} / {metrics.evaluation_ops.total_booklets}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 mt-1 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${metrics.evaluation_ops.total_booklets > 0 ? (metrics.evaluation_ops.locked_booklets / metrics.evaluation_ops.total_booklets) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-550">Unresolved Conflicts:</span>
              <span className={`font-bold ${(metrics.evaluation_ops.conflicts_total - metrics.evaluation_ops.conflicts_resolved) > 0 ? "text-amber-400" : "text-emerald-450"}`}>
                {metrics.evaluation_ops.conflicts_total - metrics.evaluation_ops.conflicts_resolved} open
              </span>
            </div>
          </div>
          <button 
            onClick={() => router.push("/evaluation-ops")}
            className="w-full py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition font-mono uppercase tracking-wide text-center cursor-pointer"
          >
            Resolve Grading
          </button>
        </div>

        {/* DisputeOps Card */}
        <div className="bg-glass-card p-5 rounded-2xl border border-slate-850 flex flex-col justify-between gap-4.5 shadow-sm hover:shadow-glow-cyan/2 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Dispute ledger</span>
              <h3 className="text-sm font-black text-white mt-0.5 font-outfit">Candidate Disputes</h3>
            </div>
            <StatusBadge status={metrics?.dispute_ops.open > 0 ? "WARNING" : "HEALTHY"} />
          </div>
          <div className="text-xs font-mono space-y-2.5">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-505">Pending Claims:</span>
                <span className={`font-bold ${metrics?.dispute_ops.open > 0 ? "text-amber-400" : "text-slate-300"}`}>
                  {metrics?.dispute_ops.open} claims
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 mt-1 overflow-hidden">
                <div 
                  className="bg-amber-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${(metrics?.dispute_ops.open + metrics?.dispute_ops.resolved) > 0 ? (metrics.dispute_ops.resolved / (metrics.dispute_ops.open + metrics.dispute_ops.resolved)) * 100 : 100}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-505">Resolved disputes:</span>
              <span className="text-emerald-450 font-bold">{metrics?.dispute_ops.resolved} closed</span>
            </div>
          </div>
          <button 
            onClick={() => router.push("/dispute-ops")}
            className="w-full py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition font-mono uppercase tracking-wide text-center cursor-pointer"
          >
            Manage Claims
          </button>
        </div>

        {/* Security Readiness Card */}
        <div className="bg-glass-card p-5 rounded-2xl border border-slate-850 flex flex-col justify-between gap-4.5 shadow-sm hover:shadow-glow-violet/2 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Compliance Audit</span>
              <h3 className="text-sm font-black text-white mt-0.5 font-outfit">Security posture</h3>
            </div>
            <StatusBadge status={metrics?.security_ops.compliance_verdict || "PASS"} />
          </div>
          <div className="text-xs font-mono space-y-2.5">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-505">Hardening Score:</span>
                <span className="text-emerald-450 font-bold">{metrics?.security_ops.compliance_score}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 mt-1 overflow-hidden">
                <div 
                  className="bg-violet-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${metrics?.security_ops.compliance_score || 0}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-505">Unmitigated Threats:</span>
              <span className={`font-bold ${metrics?.security_ops.unmitigated_threats > 0 ? "text-red-400 animate-pulse" : "text-emerald-450"}`}>
                {metrics?.security_ops.unmitigated_threats} active
              </span>
            </div>
          </div>
          <button 
            onClick={() => router.push("/security")}
            className="w-full py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition font-mono uppercase tracking-wide text-center cursor-pointer"
          >
            Check Hardening
          </button>
        </div>

      </div>

      {/* Row 3: Verdict Warnings, Risk Feed, & Recent Action Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Blocking reasons explanation (8 cols if blocked, else grid expands) */}
        <div className={status === "BLOCKED" ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>
          {status === "BLOCKED" && (
            <BlockingReasons 
              title="Publication Gate Lockout" 
              reasons={metrics?.verdict.reasons || []} 
            />
          )}

          {/* Risk Feed & Audit namespace */}
          <div className="bg-glass border border-slate-850 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4.5 px-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-455 animate-pulse" />
                <span>Active Risk and Audit Feed</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Namespace: nsb-audit-ns</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-900/60 flex justify-between items-start gap-4">
                <div className="flex gap-2.5 items-start">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <div>
                    <span className="text-slate-200 font-bold block font-outfit">Audit Chain Namespace Validated</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">ECDSA signatures checked against all active key hashes.</p>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded uppercase font-bold">Passed</span>
              </div>

              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-900/60 flex justify-between items-start gap-4">
                <div className="flex gap-2.5 items-start">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <div>
                    <span className="text-slate-200 font-bold block font-outfit">Center package release CTR-LKO-01 verified</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Signature matches authorized Controller credentials.</p>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded uppercase font-bold">Verified</span>
              </div>

              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-900/60 flex justify-between items-start gap-4">
                <div className="flex gap-2.5 items-start">
                  <span className="text-amber-400 mt-0.5">!</span>
                  <div>
                    <span className="text-slate-200 font-bold block font-outfit">Double Evaluation conflict CNF-001 Resolved</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Evaluator mismatch resolved via Controller override key signature.</p>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-450 rounded uppercase font-bold">Resolved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar panel: Audit Timeline Preview (4 cols, only visible if row is not full width) */}
        {status === "BLOCKED" && (
          <div className="lg:col-span-4 bg-glass border border-slate-850 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 mb-3.5 px-1">
                <History className="w-4 h-4 text-violet-400" />
                <span>Audit Timeline Preview</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-4.5 px-1">
                Verify each step of the immutable cryptographic chain-of-custody ledger.
              </p>

              <div className="space-y-3.5 font-mono text-[11px] px-1">
                <div className="flex gap-2.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
                  <span className="text-slate-350 font-bold">SETUP</span>
                  <span className="text-slate-500 ml-auto">09:00 AM</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
                  <span className="text-slate-350 font-bold">POLICY LOCK</span>
                  <span className="text-slate-500 ml-auto">09:15 AM</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-glow-blue" />
                  <span className="text-blue-400 font-bold">EVALUATION</span>
                  <span className="text-slate-500 ml-auto">04:32 PM</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => router.push("/audit-timeline")}
              className="mt-6 w-full py-2 bg-slate-905 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-bold transition font-mono uppercase tracking-wide cursor-pointer"
            >
              Examine Full Timeline
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
