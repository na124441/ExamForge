"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function EvaluationOpsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [gateStatus, setGateStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/EXM-005/gate-status`, {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch evaluation publication gate status");
      const data = await res.json();
      setGateStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to load gate status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumbs / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 font-mono">
              <Link href="/exam-ops" className="hover:text-accent-emerald transition-colors">ExamOps</Link>
              <span>/</span>
              <span className="text-foreground">EvaluationOps</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              ⚖️ EvaluationOps Command Centre
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Enforce rubric compliance, audit anonymous written booklets, resolve conflicts, and verify MarksChain locks.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchGateStatus(token)}
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold flex items-center gap-2 cursor-pointer"
            >
              🔄 Refresh Analytics
            </button>
            <Link 
              href="/exam-ops"
              className="px-4 py-2 bg-accent-emerald text-background font-bold rounded text-sm hover:bg-accent-emerald/90 transition-colors flex items-center"
            >
              📊 Live CenterOps
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns - Quick Access & Overview */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions Navigation Cards */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Operations Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <Link href="/rubrics" className="group bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-emerald/40 transition-all hover:translate-y-[-2px] duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">📋</span>
                    <span className="text-xs text-accent-emerald font-mono bg-accent-emerald/10 px-2 py-0.5 rounded-full border border-accent-emerald/20">Config</span>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-accent-emerald transition-colors">Rubrics & Criteria Catalog</h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    Build and seal multi-criteria question rubrics. Rubric bounds lock automatically to prevent post-eval tampering.
                  </p>
                </Link>

                <Link href="/evaluator/queue" className="group bg-card-bg p-5 rounded-xl border border-border-color hover:border-fuchsia-400/40 transition-all hover:translate-y-[-2px] duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">✍️</span>
                    <span className="text-xs text-fuchsia-400 font-mono bg-fuchsia-400/10 px-2 py-0.5 rounded-full border border-fuchsia-400/20">Grading</span>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-fuchsia-400 transition-colors">Anonymous Grading Queue</h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    Access assigned anonymized booklet copies. Restricts evaluator identity access boundaries using cryptographic keys.
                  </p>
                </Link>

                <Link href="/evaluation-conflicts" className="group bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-amber/40 transition-all hover:translate-y-[-2px] duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">💥</span>
                    <span className="text-xs text-accent-amber font-mono bg-accent-amber/10 px-2 py-0.5 rounded-full border border-accent-amber/20">Conflict</span>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-accent-amber transition-colors">Double Evaluation Discrepancies</h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    Auto-flag variance &gt; 2.0. Enforce senior review reconciliation and audit trail records for grading disputes.
                  </p>
                </Link>

                <Link href="/omr-review" className="group bg-card-bg p-5 rounded-xl border border-border-color hover:border-indigo-400/40 transition-all hover:translate-y-[-2px] duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">🔵</span>
                    <span className="text-xs text-indigo-400 font-mono bg-indigo-400/10 px-2 py-0.5 rounded-full border border-indigo-400/20">Scan OMR</span>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">OMR Bubble Correction Portal</h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    Resolve low-confidence or ambiguous scans. Audit corrections logs with double-auth locks before publication.
                  </p>
                </Link>

                <Link href="/marks-chain" className="group bg-card-bg p-5 rounded-xl border border-border-color hover:border-sky-400/40 transition-all hover:translate-y-[-2px] duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">⛓️</span>
                    <span className="text-xs text-sky-400 font-mono bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">Audit Chain</span>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">MarksChain Blockchain Ledger</h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    Verify SHA-256 chained logs and ECDSA signatures. Proves no database backdoor tamper has occurred since lock.
                  </p>
                </Link>

                <Link href="/evaluator-analytics" className="group bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-red/40 transition-all hover:translate-y-[-2px] duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">📈</span>
                    <span className="text-xs text-accent-red font-mono bg-accent-red/10 px-2 py-0.5 rounded-full border border-accent-red/20">Analytics</span>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-accent-red transition-colors">Evaluator Leniency & Bias</h3>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">
                    Inspect speed alarms (&lt;10s/booklet) and high conflict rate warnings (&gt;30%) to detect outliers.
                  </p>
                </Link>
                
              </div>
            </div>

            {/* Quick stats overview */}
            {gateStatus && (
              <div className="bg-card-bg p-6 rounded-xl border border-border-color">
                <h3 className="text-sm font-semibold uppercase text-text-muted tracking-wider mb-4">Live Evaluation Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-background/50 p-4 rounded border border-border-color">
                    <div className="text-xs text-text-muted font-mono mb-1">TAMPERED LOGS</div>
                    <div className="text-2xl font-bold font-mono text-accent-emerald">0</div>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-border-color">
                    <div className="text-xs text-text-muted font-mono mb-1">TRUST SCORE</div>
                    <div className="text-2xl font-bold font-mono text-white">{gateStatus.trust_score}/100</div>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-border-color">
                    <div className="text-xs text-text-muted font-mono mb-1">CRITICAL ISSUES</div>
                    <div className={`text-2xl font-bold font-mono ${gateStatus.critical_issues.length > 0 ? 'text-accent-red' : 'text-accent-emerald'}`}>
                      {gateStatus.critical_issues.length}
                    </div>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-border-color">
                    <div className="text-xs text-text-muted font-mono mb-1">WARNINGS</div>
                    <div className={`text-2xl font-bold font-mono ${gateStatus.warnings.length > 0 ? 'text-accent-amber' : 'text-accent-emerald'}`}>
                      {gateStatus.warnings.length}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Right Column - Results Publication Gate Status */}
          <div className="space-y-8">
            <div className="bg-card-bg rounded-xl border border-border-color overflow-hidden shadow-lg">
              <div className="p-6 border-b border-border-color bg-gradient-to-r from-card-bg to-border-color/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🏁 Publication Release Gate
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Enforces automated publication readiness criteria.
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
                  <div className="animate-spin text-2xl">⏳</div>
                  <p className="text-sm">Evaluating cryptographic evidence logs...</p>
                </div>
              ) : gateStatus ? (
                <div className="p-6 space-y-6">
                  
                  {/* Allowed banner */}
                  <div className={`p-4 rounded-lg border flex items-center justify-between ${
                    gateStatus.allowed 
                      ? 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald' 
                      : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
                  }`}>
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider opacity-80">GATE STATUS</div>
                      <div className="text-lg font-extrabold">{gateStatus.allowed ? "✅ Release Allowed" : "❌ Locked / Blocked"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase font-bold tracking-wider opacity-80">TRUST SCORE</div>
                      <div className="text-lg font-extrabold font-mono">{gateStatus.trust_score}%</div>
                    </div>
                  </div>

                  {/* Checklist items */}
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase font-bold text-text-muted tracking-wider">Publication Checklist</h3>
                    {gateStatus.checklist.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start justify-between gap-3 p-2.5 rounded hover:bg-background/40 transition-colors text-xs border border-border-color/10">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white/95">{item.name}</div>
                          <div className="text-[10px] text-text-muted">{item.details}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.critical && (
                            <span className="text-[9px] bg-accent-red/10 border border-accent-red/20 text-accent-red px-1.5 py-0.2 rounded uppercase font-bold font-mono">
                              P0
                            </span>
                          )}
                          <span className={item.passed ? "text-accent-emerald" : "text-accent-red"}>
                            {item.passed ? "✓ Passed" : "✗ Failed"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning summary */}
                  {gateStatus.warnings.length > 0 && (
                    <div className="p-3 bg-accent-amber/5 border border-accent-amber/20 rounded text-xs space-y-1.5">
                      <div className="font-bold text-accent-amber flex items-center gap-1">
                        ⚠️ Security / Operational Warnings ({gateStatus.warnings.length})
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-text-muted font-mono">
                        {gateStatus.warnings.map((w: any, idx: number) => (
                          <div key={idx} className="border-b border-border-color/10 pb-1">
                            • {w.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
              ) : null}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
