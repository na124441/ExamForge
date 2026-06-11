"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function EvaluatorAnalyticsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [conflictRate, setConflictRate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    
    if (!storedToken || (storedRole !== "CONTROLLER" && storedRole !== "AUDITOR")) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole);
    fetchAnalytics(storedToken);
  }, []);

  const fetchAnalytics = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Evaluators list
      const resEvals = await fetch(`${BACKEND_URL}/api/evaluation/analytics/evaluators`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!resEvals.ok) throw new Error("Failed to fetch evaluators performance analytics");
      const evalsData = await resEvals.json();
      setEvaluators(evalsData);

      // 2. Fetch Conflict Rate
      const resRate = await fetch(`${BACKEND_URL}/api/evaluation/analytics/conflict-rate`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (resRate.ok) {
        const rateData = await resRate.json();
        setConflictRate(rateData);
      }

    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 font-mono">
              <Link href="/evaluation-ops" className="hover:text-accent-emerald transition-colors">EvaluationOps</Link>
              <span>/</span>
              <span className="text-foreground">Analytics</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              📈 Evaluator Performance & Bias Diagnostics
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Monitor speed anomalies, marking leniency patterns, and conflict rates across active grading profiles.
            </p>
          </div>
          <div>
            <button 
              onClick={() => fetchAnalytics(token)}
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold cursor-pointer"
            >
              🔄 Refresh Analytics
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Top Summary stats cards */}
        {conflictRate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card-bg p-5 rounded-xl border border-border-color">
              <h3 className="text-xs uppercase font-bold text-text-muted tracking-wider mb-2">Total Evaluations Sealed</h3>
              <div className="text-3xl font-bold font-mono text-white">{conflictRate.total_evaluations}</div>
            </div>
            <div className="bg-card-bg p-5 rounded-xl border border-border-color">
              <h3 className="text-xs uppercase font-bold text-text-muted tracking-wider mb-2">Total Disputes Triggered</h3>
              <div className="text-3xl font-bold font-mono text-accent-amber">{conflictRate.total_conflicts}</div>
            </div>
            <div className="bg-card-bg p-5 rounded-xl border border-border-color">
              <h3 className="text-xs uppercase font-bold text-text-muted tracking-wider mb-2">Global Conflict Rate</h3>
              <div className="text-3xl font-bold font-mono text-accent-red">
                {Math.round(conflictRate.conflict_rate * 100)}%
              </div>
            </div>
          </div>
        )}

        {/* Evaluators Grid list */}
        {loading ? (
          <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm">Retrieving evaluator profiles metrics...</p>
          </div>
        ) : evaluators.length === 0 ? (
          <div className="p-8 border border-dashed border-border-color rounded text-center text-text-muted text-sm">
            No active evaluators found. Ensure evaluators have registered and completed grading tasks.
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">Active Evaluator Ledger</h3>
            <div className="bg-card-bg rounded-xl border border-border-color overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-color bg-background/50 font-mono text-text-muted text-xs uppercase">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 font-mono">Assigned / Completed</th>
                      <th className="p-4 font-mono">Avg Marks Given</th>
                      <th className="p-4 font-mono">Conflict Rate</th>
                      <th className="p-4 font-mono">Speed (sec)</th>
                      <th className="p-4">Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/40">
                    {evaluators.map((ev) => (
                      <tr key={ev.evaluator_id} className="hover:bg-background/20 transition-colors">
                        <td className="p-4 font-bold text-white">{ev.name}</td>
                        <td className="p-4 font-mono text-text-muted">{ev.email}</td>
                        <td className="p-4 font-mono text-white/90">
                          {ev.metrics.total_assigned} / {ev.metrics.total_completed}
                        </td>
                        <td className="p-4 font-mono text-white/90">
                          {ev.metrics.average_marks_given.toFixed(2)}
                        </td>
                        <td className={`p-4 font-mono font-bold ${ev.metrics.conflict_rate > 0.30 ? 'text-accent-red' : 'text-accent-emerald'}`}>
                          {Math.round(ev.metrics.conflict_rate * 100)}%
                        </td>
                        <td className={`p-4 font-mono font-bold ${ev.metrics.average_speed_seconds < 10.0 ? 'text-accent-red' : 'text-text-muted'}`}>
                          {ev.metrics.average_speed_seconds.toFixed(1)}s
                        </td>
                        <td className="p-4">
                          {ev.warnings.length === 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-xs font-semibold">
                              ✓ Compliant
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {ev.warnings.map((w: any, wIdx: number) => (
                                <span 
                                  key={wIdx} 
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono mr-1 ${
                                    w.severity === "HIGH" 
                                      ? "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                                      : "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                                  }`}
                                  title={w.message}
                                >
                                  ⚠️ {w.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
