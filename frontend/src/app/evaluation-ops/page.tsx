"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Scale, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  FileCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FolderLock,
  Lock,
  ListFilter,
  CheckCircle
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";

export default function EvaluationOpsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [gateStatus, setGateStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole || "");
    fetchGateStatus(storedToken);
  }, []);

  const fetchGateStatus = async (authToken: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/EXM-001/gate-status`);
      if (!res.ok) throw new Error("Failed to fetch evaluation publication gate status");
      const data = await res.json();
      setGateStatus(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load gate status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGateStatus(token);
  };

  if (loading && !gateStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚙️</span>
        <span>ACQUIRING EVALUATION TRACKER TELEMETRY...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>EvaluationOps Command Centre</span>
            <span className="text-[9px] px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded uppercase font-mono font-bold tracking-widest">
              Evaluation
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Enforce rubric compliance, audit anonymous written booklets, resolve conflicts, and verify MarksChain locks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => router.push("/exam-ops")}
            className="text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-lg transition"
          >
            🏢 CenterOps
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/10 border border-red-900/20 text-red-400 rounded-xl text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Access Modules (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-blue-400" />
              <span>Operations Modules</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Link href="/rubrics" className="group bg-slate-950/40 p-4.5 rounded-xl border border-slate-850 hover:border-blue-500/30 hover:bg-slate-900/40 transition duration-150 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl">📋</span>
                  <span className="text-[9px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold uppercase">
                    Config
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                    Rubrics & Criteria Catalog
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                    Build and lock multi-criteria question rubrics. Rubric bounds lock automatically to prevent post-eval tampering.
                  </p>
                </div>
              </Link>

              <Link href="/evaluator/queue" className="group bg-slate-950/40 p-4.5 rounded-xl border border-slate-850 hover:border-blue-500/30 hover:bg-slate-900/40 transition duration-150 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl">✍️</span>
                  <span className="text-[9px] text-violet-400 font-mono bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20 font-bold uppercase">
                    Grading
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                    Anonymous Grading Queue
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                    Access assigned anonymized booklet copies. Restricts evaluator identity access boundaries using cryptographic key checks.
                  </p>
                </div>
              </Link>

              <Link href="/evaluation-conflicts" className="group bg-slate-950/40 p-4.5 rounded-xl border border-slate-850 hover:border-blue-500/30 hover:bg-slate-900/40 transition duration-150 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl">💥</span>
                  <span className="text-[9px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase">
                    Conflicts
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                    Evaluation Discrepancies
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                    Auto-flag variance overrides &gt; 2.0. Enforce senior review reconciliation and audit trail logs for disputes.
                  </p>
                </div>
              </Link>

              <Link href="/omr-review" className="group bg-slate-950/40 p-4.5 rounded-xl border border-slate-850 hover:border-blue-500/30 hover:bg-slate-900/40 transition duration-150 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl">🔵</span>
                  <span className="text-[9px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold uppercase">
                    Scan OMR
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                    OMR Bubble Correction Portal
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                    Resolve low-confidence or ambiguous scans. Audit corrections logs with double-auth security logs.
                  </p>
                </div>
              </Link>

              <Link href="/marks-chain" className="group bg-slate-950/40 p-4.5 rounded-xl border border-slate-850 hover:border-blue-500/30 hover:bg-slate-900/40 transition duration-150 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl">⛓️</span>
                  <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase">
                    Audit Chain
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                    MarksChain Ledger
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                    Verify SHA-256 chained logs and signatures. Proves no database backdoor tamper has occurred since evaluation lock.
                  </p>
                </div>
              </Link>

              <Link href="/evaluator-analytics" className="group bg-slate-950/40 p-4.5 rounded-xl border border-slate-850 hover:border-blue-500/30 hover:bg-slate-900/40 transition duration-150 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl">📈</span>
                  <span className="text-[9px] text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 font-bold uppercase">
                    Analytics
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                    Bias & Performance Alerts
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                    Inspect speed alarms (&lt;10s/booklet) and high conflict rate warnings (&gt;30%) to detect outliers.
                  </p>
                </div>
              </Link>
              
            </div>
          </div>

          {/* Quick Stats Grid */}
          {gateStatus && (
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">Live Evaluation Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-xs">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tampered Blocks</div>
                  <div className="text-xl font-black text-emerald-400">0</div>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Integrity score</div>
                  <div className="text-xl font-black text-white">{gateStatus.trust_score}%</div>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Unresolved issues</div>
                  <div className={`text-xl font-black ${gateStatus.critical_issues.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {gateStatus.critical_issues.length}
                  </div>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Warnings</div>
                  <div className={`text-xl font-black ${gateStatus.warnings.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {gateStatus.warnings.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Release Gate Checklist (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-850 overflow-hidden shadow-lg flex flex-col h-full justify-between min-h-[480px]">
            
            <div>
              <div className="p-5 border-b border-slate-850 bg-slate-950/20">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <FolderLock className="w-4 h-4 text-violet-400" />
                  <span>Release Checklist</span>
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-normal">
                  Automatic checks gating the publication of final score results.
                </p>
              </div>

              {gateStatus ? (
                <div className="p-5 space-y-4">
                  {/* Verdict badge */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between font-mono text-xs ${
                    gateStatus.allowed 
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/25 text-red-400'
                  }`}>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider opacity-60 block font-bold">RELEASE VERDICT</span>
                      <span className="font-extrabold uppercase mt-0.5 block">{gateStatus.allowed ? "Allowed" : "Blocked"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] uppercase tracking-wider opacity-60 block font-bold">TRUST INDEX</span>
                      <span className="font-black mt-0.5 block">{gateStatus.trust_score}%</span>
                    </div>
                  </div>

                  {/* Checklist items */}
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {gateStatus.checklist.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs flex justify-between gap-3 items-start font-mono">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-200 block text-[11px] truncate">{item.name}</span>
                          <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">{item.details}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.critical && (
                            <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                              P0
                            </span>
                          )}
                          <span className={item.passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {item.passed ? "Pass" : "Fail"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning summary panel */}
                  {gateStatus.warnings.length > 0 && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs space-y-1 font-mono">
                      <div className="font-bold text-amber-400 flex items-center gap-1 text-[10px] uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Warnings ({gateStatus.warnings.length})</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 text-[9px] text-slate-500 leading-normal">
                        {gateStatus.warnings.map((w: any, idx: number) => (
                          <div key={idx} className="border-b border-slate-850 pb-1">
                            • {w.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="p-10 text-center text-slate-500 font-mono text-xs italic">
                  Checklist data unavailable.
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-850 bg-slate-950/20">
              <button 
                onClick={() => router.push("/publication-gate")}
                className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-800 transition"
              >
                Inspect Release Gate
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
