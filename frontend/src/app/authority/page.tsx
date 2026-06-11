"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function AuthorityDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/authority/dashboard`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error("Authentication failed or unauthorized role. Please log in as a Controller or Platform Admin.");
      }

      if (!res.ok) {
        throw new Error("Failed to load authority dashboard data.");
      }

      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text-muted font-mono text-xs">
        <span className="animate-spin text-xl mb-3">⚙️</span>
        DECRYPTING EXECUTIVE TELEMETRY CHAIN...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 text-center">
        <div className="bg-card-bg p-8 rounded-2xl border border-accent-red/30 max-w-md w-full shadow-2xl">
          <span className="text-4xl mb-4 block">🚨</span>
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-xs text-text-muted mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-accent-emerald text-background text-xs font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const status = metrics?.verdict.status ?? "NOT_READY";

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-card-bg/50 p-5 rounded-2xl border border-border-color shadow-sm backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              🛡️ ExamForge <span className="text-accent-emerald text-xs px-2.5 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded font-mono uppercase">Authority Console</span>
            </h1>
            <p className="text-xs text-text-muted mt-1 leading-normal">
              Active Tenant: <span className="text-white font-mono">{metrics?.institution.name}</span> | Slug: <span className="text-white font-mono">{metrics?.institution.tenant_slug}</span>
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => router.push("/pilot-run")}
              className="text-xs px-3 py-2 bg-accent-emerald text-background rounded-xl font-bold hover:bg-accent-emerald/90 transition cursor-pointer shrink-0 uppercase tracking-wide"
            >
              🚀 Pilot Guided Demo
            </button>
            <button
              onClick={() => router.push("/exam-ops")}
              className="text-xs px-3 py-2 bg-border-color hover:bg-white/5 border border-border-color text-white rounded-xl transition cursor-pointer shrink-0"
            >
              🏢 Operations
            </button>
          </div>
        </header>

        {/* Top Status & Verdict Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pilot Verdict */}
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pilot Readiness Status</div>
              <div className={`text-3xl font-extrabold mt-2 font-sans tracking-tight ${
                status === "READY" ? "text-accent-emerald" : status === "DEGRADED" ? "text-accent-amber" : "text-accent-red"
              }`}>
                {status === "READY" ? "✓ READY" : status === "DEGRADED" ? "⚠ DEGRADED" : "❌ BLOCKED"}
              </div>
            </div>
            <div className="text-[10px] text-text-muted mt-3 leading-relaxed">
              {metrics?.verdict.reasons.length === 0 ? (
                "All operational gates, trust parameters, and compliance checklists verified."
              ) : (
                <div className="text-accent-amber/90 font-mono">
                  Flags: {metrics?.verdict.reasons.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Trust Score */}
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Exam Trust Score</div>
              <div className="text-4xl font-black text-white mt-2 font-mono">
                {metrics?.trust_ops.score}%
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-text-muted">
              <span className={`w-2 h-2 rounded-full ${metrics?.trust_ops.gate_allowed ? "bg-accent-emerald" : "bg-accent-red"}`}></span>
              <span>{metrics?.trust_ops.gate_allowed ? "Publication Gate Approved" : "Gate Blocked"}</span>
            </div>
          </div>

          {/* Security Readiness */}
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Compliance Readiness</div>
              <div className="text-4xl font-black text-white mt-2 font-mono">
                {metrics?.security_ops.compliance_score}%
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-text-muted font-mono">
              <span>Threats: {metrics?.security_ops.unmitigated_threats} unmitigated</span>
            </div>
          </div>

        </div>

        {/* Detailed Metrics Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Institution Status Card */}
          <div className="bg-card-bg/60 p-5 rounded-2xl border border-border-color flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color/30 pb-2">
              🔑 Cryptographic Settings
            </h3>
            <div className="text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Policy Engine:</span>
                <span className="text-white truncate max-w-[150px]">{metrics?.policy.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Keyspace Keys:</span>
                <span className="text-white font-bold">{metrics?.institution.keyspace_keys} active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Audit Namespace:</span>
                <span className="text-accent-emerald">nsb-audit-ns</span>
              </div>
            </div>
          </div>

          {/* Exam Lifecycle Card */}
          <div className="bg-card-bg/60 p-5 rounded-2xl border border-border-color flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color/30 pb-2">
              📝 Exam Lifecycle
            </h3>
            <div className="text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Exam ID:</span>
                <span className="text-white">{metrics?.exam_lifecycle.exam_id || "EXM-PILOT-001"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Workflow State:</span>
                <span className="text-accent-emerald font-bold">{metrics?.exam_lifecycle.state}</span>
              </div>
            </div>
          </div>

          {/* CenterOps Card */}
          <div className="bg-card-bg/60 p-5 rounded-2xl border border-border-color flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color/30 pb-2">
              🏢 Center Operations
            </h3>
            <div className="text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Packages Released:</span>
                <span className="text-white">{metrics?.center_ops.released_packages} / {metrics?.center_ops.total_packages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Candidates Verified:</span>
                <span className="text-white">{metrics?.center_ops.verified_candidates} / {metrics?.center_ops.total_candidates}</span>
              </div>
            </div>
          </div>

          {/* Evaluation Integrity Card */}
          <div className="bg-card-bg/60 p-5 rounded-2xl border border-border-color flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color/30 pb-2">
              ⚖️ Evaluation Integrity
            </h3>
            <div className="text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Scanned Booklets:</span>
                <span className="text-white">{metrics?.evaluation_ops.locked_booklets} / {metrics?.evaluation_ops.total_booklets} locked</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">OMR Finalized:</span>
                <span className="text-white">{metrics?.evaluation_ops.omr_finalized} resolved</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Double Eval Conflicts:</span>
                <span className="text-accent-amber font-bold">{metrics?.evaluation_ops.conflicts_resolved} / {metrics?.evaluation_ops.conflicts_total} resolved</span>
              </div>
            </div>
          </div>

          {/* Dispute Ledger Card */}
          <div className="bg-card-bg/60 p-5 rounded-2xl border border-border-color flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color/30 pb-2">
              👁️ Candidate Disputes
            </h3>
            <div className="text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Open Claims:</span>
                <span className="text-white font-bold">{metrics?.dispute_ops.open} pending</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Resolved Claims:</span>
                <span className="text-accent-emerald">{metrics?.dispute_ops.resolved} closed</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="bg-card-bg/60 p-5 rounded-2xl border border-border-color flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color/30 pb-2">
              ⚙️ Deployment Health
            </h3>
            <div className="text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Database Connection:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metrics?.deployment_ops.db_status === "OK" ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-red/10 text-accent-red"}`}>
                  {metrics?.deployment_ops.db_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Redis Caching:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metrics?.deployment_ops.redis_status === "OK" ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-red/10 text-accent-red"}`}>
                  {metrics?.deployment_ops.redis_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Object Storage (S3):</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metrics?.deployment_ops.storage_status === "OK" ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-red/10 text-accent-red"}`}>
                  {metrics?.deployment_ops.storage_status}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
