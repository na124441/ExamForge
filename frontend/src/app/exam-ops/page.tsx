"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Radio, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle,
  Database,
  Users,
  AlertTriangle,
  Play,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Inbox,
  CheckSquare
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";
const EXAM_ID = "EXM-001";

interface Center {
  center_id: string;
  package_status: string;
  verified_candidates: number;
  incidents_count: number;
  unresolved_incidents: number;
  status: string;
}

interface SummaryStats {
  total_centers: number;
  total_candidates: number;
  verified_candidates: number;
  attendance_present: number;
  attendance_absent: number;
  packages_sealed: number;
  packages_released: number;
  packages_revoked: number;
  unresolved_incidents: number;
  submission_completed: number;
  submission_pending: number;
}

interface SummaryData {
  exam_id: string;
  exam_state: string;
  stats: SummaryStats;
  trust_score: number;
  publication_allowed: boolean;
  centers: Center[];
}

interface Incident {
  incident_id: string;
  exam_id: string;
  center_id: string;
  reported_by: string;
  incident_type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
}

export default function ExamOpsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    if (!storedToken || storedRole !== "CONTROLLER") {
      router.push("/");
      return;
    }
    setToken(storedToken);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const resSum = await fetch(`${BACKEND_URL}/api/ops/exam-ops-summary/${EXAM_ID}`);
      if (!resSum.ok) throw new Error("Failed to load operations aggregator summary");
      const summaryData = await resSum.json();
      setSummary(summaryData);

      const resInc = await fetch(`${BACKEND_URL}/api/incidents`);
      if (resInc.ok) {
        const incData = await resInc.json();
        setIncidents(incData || []);
      }
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to sync ops dashboard metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTransition = async (nextState: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${EXAM_ID}/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ new_state: nextState })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "State transition rejected.");
      }
      fetchData();
    } catch (err: any) {
      alert(`Lifecycle Transition Error: ${err.message}`);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    const notes = resolutionNotes[incidentId] || "Incident reviewed and resolved by controller.";
    try {
      const res = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          resolution_notes: notes,
          evidence_text: `Evidence compiled and certified by Controller.`
        })
      });
      if (!res.ok) throw new Error("Failed to resolve incident");
      
      setResolutionNotes(prev => {
        const copy = { ...prev };
        delete copy[incidentId];
        return copy;
      });
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEscalateIncident = async (incidentId: string, currentSeverity: string) => {
    let nextSev = "P0_CRITICAL";
    if (currentSeverity === "INFO") nextSev = "LOW";
    else if (currentSeverity === "LOW") nextSev = "MEDIUM";
    else if (currentSeverity === "MEDIUM") nextSev = "HIGH";
    else if (currentSeverity === "HIGH") nextSev = "P0_CRITICAL";

    try {
      const res = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/escalate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ severity: nextSev })
      });
      if (!res.ok) throw new Error("Failed to escalate incident");
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">🛰️</span>
        <span>CONNECTING TO LIVE EXAM DAY OPERATIONS FEED...</span>
      </div>
    );
  }

  const examState = summary?.exam_state ?? "DRAFT";
  
  const nextStates: Record<string, string[]> = {
    "DRAFT": ["CONFIG_LOCKED"],
    "CONFIG_LOCKED": ["PAPER_GENERATED"],
    "PAPER_GENERATED": ["PACKAGE_SEALED"],
    "PACKAGE_SEALED": ["AWAITING_RELEASE"],
    "AWAITING_RELEASE": ["RELEASE_WINDOW_OPEN"],
    "RELEASE_WINDOW_OPEN": ["IN_PROGRESS"],
    "IN_PROGRESS": ["SUBMISSION_LOCKED"],
    "SUBMISSION_LOCKED": ["EVALUATION_OPEN"],
    "EVALUATION_OPEN": ["RESULT_VERIFICATION"],
    "RESULT_VERIFICATION": ["RESULT_PUBLISHED"],
    "RESULT_PUBLISHED": ["ARCHIVED"],
    "ARCHIVED": []
  };
  const possibleTransitions = nextStates[examState] || [];

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Live CenterOps Control</span>
            <span className="text-[9px] px-2 py-0.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded uppercase font-mono font-bold tracking-widest animate-pulse">
              Live Monitor
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Operational dashboard tracking key releases, candidate verification status, and incident logs.
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
            onClick={() => router.push("/authority")}
            className="text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-lg transition"
          >
            🏢 Authority Console
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/10 border border-red-900/20 text-red-400 rounded-xl text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Row 1: Active State Control Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Exam State Controller</span>
          <div className="text-xl font-black text-white flex items-center gap-2.5 mt-1 font-mono uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{examState}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-lg leading-relaxed">
            Advancing the lifecycle creates immutable cryptographically signed proof block records. Decryption packages are sealed until scheduled release.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto font-mono text-xs">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center md:text-left">Commit Next Stage</span>
          <div className="flex gap-2">
            {possibleTransitions.length === 0 ? (
              <span className="text-[11px] text-slate-500 bg-slate-950/50 px-4 py-2 border border-slate-850 rounded-lg">
                STAGES FULLY CONCLUDED
              </span>
            ) : (
              possibleTransitions.map(st => (
                <button
                  key={st}
                  onClick={() => handleTransition(st)}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-lg hover:bg-emerald-400 transition font-mono uppercase tracking-wider text-xs shadow-md shadow-emerald-500/5 cursor-pointer"
                >
                  ADVANCE TO {st.replace(/_/g, " ")}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Active Centers</span>
          <span className="text-2xl font-black text-white mt-1 font-mono">{summary?.stats.total_centers ?? 0}</span>
          <span className="text-[9px] text-emerald-400 font-medium">All servers synced</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Verified Check-ins</span>
          <span className="text-2xl font-black text-white mt-1 font-mono">
            {summary?.stats.verified_candidates ?? 0} <span className="text-xs text-slate-500">/ {summary?.stats.total_candidates ?? 0}</span>
          </span>
          <span className="text-[9px] text-slate-500 font-medium">
            Candidate verification matching is active
          </span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Attendance Rate</span>
          <span className="text-2xl font-black text-white mt-1 font-mono">
            {summary?.stats.attendance_present ?? 0} <span className="text-xs text-slate-500">present</span>
          </span>
          <span className="text-[9px] text-amber-400 font-medium">
            {summary?.stats.attendance_absent ?? 0} absent flags
          </span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Packages Keys</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {summary?.stats.packages_released ?? 0} <span className="text-xs text-slate-500">released</span>
          </span>
          <span className="text-[9px] text-slate-500 font-medium">
            {summary?.stats.packages_sealed ?? 0} sealed envelopes
          </span>
        </div>
      </div>

      {/* Row 3: Center List Table */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Center-by-Center Live Registries</span>
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono">
                <th className="py-3 px-3">Center Node</th>
                <th className="py-3 px-3">Key State</th>
                <th className="py-3 px-3">Candidates Checkin</th>
                <th className="py-3 px-3">Total Logs</th>
                <th className="py-3 px-3">Active Incidents</th>
                <th className="py-3 px-3">Node Status</th>
                <th className="py-3 px-3 text-right">Console</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 font-mono">
              {summary?.centers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 italic font-sans">
                    No centers loaded. Seal packages to instantiate registries.
                  </td>
                </tr>
              ) : (
                summary?.centers.map(c => (
                  <tr key={c.center_id} className="hover:bg-slate-950/20 group">
                    <td className="py-3 px-3 text-white font-bold">{c.center_id}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        c.package_status === "RELEASED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        c.package_status === "REVOKED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>{c.package_status}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{c.verified_candidates} present</td>
                    <td className="py-3 px-3 text-slate-500">{c.incidents_count} records</td>
                    <td className="py-3 px-3">
                      <span className={c.unresolved_incidents > 0 ? "text-red-400 font-bold animate-pulse" : "text-slate-500"}>
                        {c.unresolved_incidents} active
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => router.push(`/center-console?center=${c.center_id}`)}
                        className="text-[10px] px-2.5 py-1 bg-slate-950 border border-slate-850 text-slate-300 rounded hover:border-slate-700 transition"
                      >
                        Launch Officer Console
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Live Incidents Response Center */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg">
        <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          <span>Live Security Incident Response Queue</span>
        </h2>
        
        <div className="space-y-4">
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono border border-dashed border-slate-850 rounded-xl">
              🟢 ALL NODES SECURE. NO ACTIVE INCIDENT WARNINGS IN QUEUE.
            </div>
          ) : (
            incidents.map(inc => {
              const isResolved = inc.status === "RESOLVED";
              return (
                <div
                  key={inc.incident_id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 items-start md:items-center transition-all ${
                    isResolved
                      ? "border-slate-850 bg-slate-950/20 opacity-60"
                      : inc.severity === "P0_CRITICAL"
                      ? "border-red-500 bg-red-950/5"
                      : "border-amber-500/30 bg-amber-950/5"
                  }`}
                >
                  <div className="flex-1 font-mono text-xs">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                        isResolved ? "bg-slate-900 text-slate-400 border-slate-800" :
                        inc.severity === "P0_CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/25 animate-pulse" : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      }`}>{inc.severity}</span>
                      <span className="text-white font-extrabold">{inc.incident_type}</span>
                      <span className="text-slate-500">Node: {inc.center_id}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">{inc.description}</p>
                    <div className="text-[10px] text-slate-500 mt-2">
                      Event ID: {inc.incident_id} | Created at: {new Date(inc.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col gap-2 shrink-0">
                    {!isResolved ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Log override remarks..."
                          value={resolutionNotes[inc.incident_id] || ""}
                          onChange={(e) => setResolutionNotes(prev => ({ ...prev, [inc.incident_id]: e.target.value }))}
                          className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono w-48"
                        />
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleResolveIncident(inc.incident_id)}
                            className="flex-1 text-[11px] py-1 bg-emerald-500 text-slate-950 font-bold rounded hover:bg-emerald-400 transition cursor-pointer font-mono uppercase"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleEscalateIncident(inc.incident_id, inc.severity)}
                            className="flex-1 text-[11px] py-1 bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400 transition cursor-pointer font-mono uppercase"
                          >
                            Escalate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5 font-mono bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
