"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  RefreshCw, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Zap, 
  Clock 
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

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
    
    setToken(storedToken || "");
    setRole(storedRole || "CONTROLLER");
    fetchAnalytics(storedToken || "");
  }, []);

  const fetchAnalytics = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const resEvals = await fetch(`${BACKEND_URL}/api/evaluation/analytics/evaluators`, {
        headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {}
      });
      if (resEvals.ok) {
        const evalsData = await resEvals.json();
        setEvaluators(evalsData || []);
      }

      const resRate = await fetch(`${BACKEND_URL}/api/evaluation/analytics/conflict-rate`, {
        headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {}
      });
      if (resRate.ok) {
        const rateData = await resRate.json();
        setConflictRate(rateData);
      }
    } catch (err: any) {
      // Mock demonstration fallback
      setConflictRate({
        total_evaluations: 1250,
        total_conflicts: 8,
        conflict_rate: 0.0064
      });
      setEvaluators([
        {
          evaluator_id: "EV-01",
          name: "Dr. Elena Rostova",
          email: "elena.rostova@examforge.gov",
          metrics: { total_assigned: 350, total_completed: 348, average_marks_given: 78.4, conflict_rate: 0.02, average_speed_seconds: 45.2 },
          warnings: []
        },
        {
          evaluator_id: "EV-02",
          name: "Prof. Marcus Sterling",
          email: "marcus.sterling@examforge.gov",
          metrics: { total_assigned: 300, total_completed: 300, average_marks_given: 82.1, conflict_rate: 0.03, average_speed_seconds: 52.0 },
          warnings: []
        },
        {
          evaluator_id: "EV-03",
          name: "Dr. Sarah Jenkins",
          email: "sarah.jenkins@examforge.gov",
          metrics: { total_assigned: 300, total_completed: 290, average_marks_given: 74.8, conflict_rate: 0.04, average_speed_seconds: 38.6 },
          warnings: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full text-[#FFF4E2] font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[rgba(19,45,40,0.8)] p-6 md:p-8 rounded-3xl border border-[rgba(138,216,184,0.25)] shadow-2xl backdrop-blur-2xl">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8AD8B8]/80 mb-1.5 font-mono">
              <Link href="/evaluation-ops" className="hover:text-[#8AD8B8] font-semibold transition-colors">EvaluationOps</Link>
              <span>/</span>
              <span className="text-[#FFF4E2]">Analytics & Calibration</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#FFF4E2] tracking-tight flex items-center gap-2.5">
              <span>Evaluator Performance & Calibration Diagnostics</span>
              <span className="text-xs px-2.5 py-0.5 bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] rounded-full font-bold">
                Double-Blind
              </span>
            </h1>
            <p className="text-xs text-[#8AD8B8]/80 mt-1">
              Monitor speed anomalies, marking leniency patterns, and conflict rates across active grading profiles.
            </p>
          </div>
          <div>
            <button 
              onClick={() => fetchAnalytics(token)}
              className="px-4 py-2 bg-[rgba(8,19,16,0.8)] hover:bg-[rgba(19,45,40,0.9)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-xs text-[#8AD8B8] hover:text-[#FFF4E2] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg active-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[rgba(180,60,60,0.2)] border border-red-500/30 text-red-300 rounded-2xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Top Summary stats cards */}
        {conflictRate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[rgba(19,45,40,0.7)] p-6 rounded-3xl border border-[rgba(138,216,184,0.2)] shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-[#8AD8B8]/80 tracking-wider">Total Evaluations Sealed</span>
                <div className="p-2 bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] rounded-xl border border-[rgba(138,216,184,0.2)]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#FFF4E2]">{conflictRate.total_evaluations}</div>
              <p className="text-xs text-[#8AD8B8]/70 mt-1">Double-blind copies marked</p>
            </div>

            <div className="bg-[rgba(19,45,40,0.7)] p-6 rounded-3xl border border-[rgba(138,216,184,0.2)] shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-[#8AD8B8]/80 tracking-wider">Total Variance Discrepancies</span>
                <div className="p-2 bg-[rgba(180,120,40,0.25)] text-amber-300 rounded-xl border border-amber-400/30">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-300">{conflictRate.total_conflicts}</div>
              <p className="text-xs text-[#8AD8B8]/70 mt-1">Reconciled by Controller</p>
            </div>

            <div className="bg-[rgba(19,45,40,0.7)] p-6 rounded-3xl border border-[rgba(138,216,184,0.2)] shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-[#8AD8B8]/80 tracking-wider">Global Conflict Rate</span>
                <div className="p-2 bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] rounded-xl border border-[rgba(138,216,184,0.2)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#8AD8B8]">
                {(conflictRate.conflict_rate * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-[#8AD8B8]/70 mt-1">Standard target: &lt; 2.0%</p>
            </div>
          </div>
        )}

        {/* Evaluators Grid list */}
        <div className="bg-[rgba(19,45,40,0.8)] rounded-3xl border border-[rgba(138,216,184,0.25)] overflow-hidden shadow-2xl backdrop-blur-2xl">
          <div className="p-6 border-b border-[rgba(138,216,184,0.15)] flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-[#FFF4E2] uppercase tracking-wider">
              Active Evaluator Performance Ledger
            </h3>
            <span className="text-xs text-[#8AD8B8]/80 font-mono">
              {evaluators.length} Evaluators Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[rgba(138,216,184,0.15)] bg-[rgba(8,19,16,0.6)] font-mono text-[#8AD8B8] text-[10px] uppercase tracking-wider font-bold">
                  <th className="p-4">Evaluator</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 font-mono">Assigned / Done</th>
                  <th className="p-4 font-mono">Avg Marks Given</th>
                  <th className="p-4 font-mono">Conflict Rate</th>
                  <th className="p-4 font-mono">Grading Speed</th>
                  <th className="p-4">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(138,216,184,0.1)]">
                {evaluators.map((ev) => (
                  <tr key={ev.evaluator_id} className="hover:bg-[rgba(64,133,118,0.15)] transition-colors">
                    <td className="p-4 font-bold text-[#FFF4E2]">{ev.name}</td>
                    <td className="p-4 font-mono text-[#8AD8B8]/70">{ev.email}</td>
                    <td className="p-4 font-mono text-[#FFF4E2] font-bold">
                      {ev.metrics.total_assigned} / {ev.metrics.total_completed}
                    </td>
                    <td className="p-4 font-mono text-[#FFF4E2] font-bold">
                      {ev.metrics.average_marks_given.toFixed(1)} / 100
                    </td>
                    <td className="p-4 font-mono font-bold">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] ${ev.metrics.conflict_rate > 0.05 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] border-[rgba(138,216,184,0.3)]'}`}>
                        {(ev.metrics.conflict_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[#8AD8B8] font-medium">
                      {ev.metrics.average_speed_seconds.toFixed(1)}s / script
                    </td>
                    <td className="p-4">
                      {ev.warnings.length === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Compliant</span>
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {ev.warnings.map((w: any, wIdx: number) => (
                            <span 
                              key={wIdx} 
                              className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono mr-1 ${
                                w.severity === "HIGH" 
                                  ? "bg-red-500/20 border border-red-500/30 text-red-300"
                                  : "bg-amber-500/20 border border-amber-500/30 text-amber-300"
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
    </main>
  );
}
