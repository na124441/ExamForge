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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 text-xs gap-3 font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Connecting to Exam Operations Feed...</span>
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
    <div className="space-y-6 font-sans">
      {/* Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Exam Control Operations</span>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-medium">
              Live Feed
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Operational control tracking key releases, candidate verification status, and incident logs.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-md text-slate-700 font-medium transition flex items-center gap-1.5 text-xs shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-md transition font-medium shadow-xs"
          >
            Authority Console
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Row 1: Active State Control Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exam Lifecycle State</span>
          <div className="text-xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{examState.replace(/_/g, " ")}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Advancing the lifecycle creates immutable cryptographically signed proof block records. Decryption packages remain sealed until scheduled release.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto text-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider text-center md:text-left">Advance Next State</span>
          <div className="flex gap-2">
            {possibleTransitions.length === 0 ? (
              <span className="text-xs text-slate-500 bg-slate-100 px-4 py-2 border border-slate-200 rounded-md font-medium">
                Stages Concluded
              </span>
            ) : (
              possibleTransitions.map(st => (
                <button
                  key={st}
                  onClick={() => handleTransition(st)}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition text-xs shadow-xs cursor-pointer active-press"
                >
                  Advance to {st.replace(/_/g, " ")}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Centers</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">{summary?.stats.total_centers ?? 0}</span>
          <span className="text-[11px] text-emerald-700 font-medium mt-1">All servers online</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Candidates</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.stats.verified_candidates ?? 0} <span className="text-xs font-normal text-slate-500">/ {summary?.stats.total_candidates ?? 0}</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1">
            Verification active
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.stats.attendance_present ?? 0} <span className="text-xs font-normal text-slate-500">present</span>
          </span>
          <span className="text-[11px] text-amber-700 font-medium mt-1">
            {summary?.stats.attendance_absent ?? 0} absent
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Packages</span>
          <span className="text-2xl font-bold text-indigo-700 mt-1">
            {summary?.stats.packages_released ?? 0} <span className="text-xs font-normal text-slate-500">released</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1">
            {summary?.stats.packages_sealed ?? 0} sealed
          </span>
        </div>
      </div>

      {/* Row 3: Center List Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-600" />
          <span>Center Live Registry</span>
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-3">Center Node</th>
                <th className="py-3 px-3">Key State</th>
                <th className="py-3 px-3">Candidate Verification</th>
                <th className="py-3 px-3">Total Logs</th>
                <th className="py-3 px-3">Active Incidents</th>
                <th className="py-3 px-3">Node Status</th>
                <th className="py-3 px-3 text-right">Console</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.centers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                    No centers loaded. Seal packages to instantiate registries.
                  </td>
                </tr>
              ) : (
                summary?.centers.map(c => (
                  <tr key={c.center_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-900 font-semibold">{c.center_id}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.package_status === "RELEASED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        c.package_status === "REVOKED" ? "bg-red-50 text-red-700 border border-red-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>{c.package_status}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{c.verified_candidates} present</td>
                    <td className="py-3 px-3 text-slate-500">{c.incidents_count} records</td>
                    <td className="py-3 px-3">
                      <span className={c.unresolved_incidents > 0 ? "text-red-700 font-semibold" : "text-slate-500"}>
                        {c.unresolved_incidents} active
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => router.push(`/center-console?center=${c.center_id}`)}
                        className="text-xs px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-50 transition shadow-xs font-medium"
                      >
                        Officer Console
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Security Incident Queue</span>
        </h2>
        
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-200 rounded-lg">
              ✓ All nodes clear. No unresolved incident warnings in queue.
            </div>
          ) : (
            incidents.map(inc => {
              const isResolved = inc.status === "RESOLVED";
              return (
                <div
                  key={inc.incident_id}
                  className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between gap-4 items-start md:items-center transition-all ${
                    isResolved
                      ? "border-slate-200 bg-slate-50 opacity-70"
                      : inc.severity === "P0_CRITICAL"
                      ? "border-red-200 bg-red-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                        isResolved ? "bg-slate-100 text-slate-600 border-slate-200" :
                        inc.severity === "P0_CRITICAL" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}>{inc.severity}</span>
                      <span className="text-slate-900 font-bold">{inc.incident_type}</span>
                      <span className="text-slate-500">Center: {inc.center_id}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{inc.description}</p>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      Event ID: {inc.incident_id} • Reported at: {new Date(inc.created_at).toLocaleString()}
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
                          className="p-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 shadow-xs"
                        />
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleResolveIncident(inc.incident_id)}
                            className="flex-1 text-xs py-1.5 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleEscalateIncident(inc.incident_id, inc.severity)}
                            className="flex-1 text-xs py-1.5 bg-amber-600 text-white font-semibold rounded hover:bg-amber-700 transition cursor-pointer shadow-xs"
                          >
                            Escalate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-medium text-xs flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
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
