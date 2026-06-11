"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    if (!storedToken || storedRole !== "CONTROLLER") {
      router.push("/");
      return;
    }
    setToken(storedToken);
    fetchData();
    const interval = setInterval(fetchData, 4000);
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
    }
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
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">INITIALIZING OPERATIONS CONTROLS...</div>
      </div>
    );
  }

  const examState = summary?.exam_state ?? "DRAFT";
  
  // Determine next valid states based on current state
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-card-bg border-b border-border-color p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse">🛰️</span>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              ExamForge CenterOps <span className="text-xs px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald font-mono rounded">Live Control</span>
            </h1>
            <p className="text-xs text-text-muted">Central authority monitoring room for time-locked exam release & check-ins</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => router.push("/risk-dashboard")} className="text-xs px-3 py-1.5 bg-accent-amber/10 border border-accent-amber/30 text-accent-amber rounded hover:bg-accent-amber/20 transition cursor-pointer font-bold">
            📡 Trust Dashboard
          </button>
          <button onClick={() => router.push("/publication-gate")} className="text-xs px-3 py-1.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald rounded hover:bg-accent-emerald/20 transition cursor-pointer font-bold">
            🚧 Release Gate
          </button>
          <button onClick={() => router.push("/audit-timeline")} className="text-xs px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded hover:bg-indigo-500/20 transition cursor-pointer font-bold">
            🔬 Audit Evidence
          </button>
          <button onClick={() => router.push("/controller")} className="text-xs px-3 py-1.5 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer font-bold">
            📋 Paper builder
          </button>
          <button onClick={() => { localStorage.clear(); router.push("/"); }} className="text-xs px-3 py-1.5 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded hover:bg-accent-red/20 transition cursor-pointer font-bold">
            Logout
          </button>
        </div>
      </header>

      {/* Main ops cockpit */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-xs font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* Lifecycle State Banner & Action row */}
        <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Exam lifecycle stage</div>
            <div className="text-2xl font-extrabold text-white flex items-center gap-2.5 mt-1 font-mono">
              <span className="w-3.5 h-3.5 rounded-full bg-accent-emerald animate-pulse"></span>
              {examState}
            </div>
            <p className="text-xs text-text-muted mt-1 max-w-md leading-normal">
              State transitions log cryptographically chained block markers. Center packages cannot be unlocked until window time opens.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider text-center md:text-left">TRANSITION LIFE STAGE</span>
            <div className="flex gap-2">
              {possibleTransitions.length === 0 ? (
                <span className="text-xs text-text-muted bg-border-color/30 px-4 py-2 border border-border-color rounded font-mono">
                  LOCKED OR ARCHIVED
                </span>
              ) : (
                possibleTransitions.map(st => (
                  <button
                    key={st}
                    onClick={() => handleTransition(st)}
                    className="text-xs px-4 py-2 bg-accent-emerald text-background font-extrabold rounded hover:bg-accent-emerald/90 transition cursor-pointer shadow-md shadow-accent-emerald/10 font-mono"
                  >
                    ADVANCE TO {st}
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card-bg p-4 rounded-xl border border-border-color flex flex-col justify-between">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Centers Online</span>
            <span className="text-3xl font-extrabold text-white mt-2 font-mono">{summary?.stats.total_centers ?? 0}</span>
            <span className="text-[9px] text-accent-emerald">Sealed center packages</span>
          </div>
          <div className="bg-card-bg p-4 rounded-xl border border-border-color flex flex-col justify-between">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Candidates check-in</span>
            <span className="text-3xl font-extrabold text-white mt-2 font-mono">
              {summary?.stats.verified_candidates ?? 0} / {summary?.stats.total_candidates ?? 0}
            </span>
            <span className="text-[9px] text-text-muted">Verification Rate: {summary?.stats.total_candidates ? Math.round(((summary?.stats.verified_candidates ?? 0)/summary?.stats.total_candidates)*100) : 0}%</span>
          </div>
          <div className="bg-card-bg p-4 rounded-xl border border-border-color flex flex-col justify-between">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Attendance Rate</span>
            <span className="text-3xl font-extrabold text-white mt-2 font-mono">
              {summary?.stats.attendance_present ?? 0} present
            </span>
            <span className="text-[9px] text-accent-amber">{summary?.stats.attendance_absent ?? 0} absent checkins</span>
          </div>
          <div className="bg-card-bg p-4 rounded-xl border border-border-color flex flex-col justify-between">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Packages Unlocked</span>
            <span className="text-3xl font-extrabold text-white mt-2 font-mono text-accent-emerald">
              {summary?.stats.packages_released ?? 0} released
            </span>
            <span className="text-[9px] text-text-muted">{summary?.stats.packages_sealed ?? 0} sealed envelopes</span>
          </div>
        </div>

        {/* Center Operations Details */}
        <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald"></span> Center-by-Center Live Status
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-color text-text-muted">
                  <th className="py-3 px-2">Center ID</th>
                  <th className="py-3 px-2">Package status</th>
                  <th className="py-3 px-2">Verified present</th>
                  <th className="py-3 px-2">Total incidents</th>
                  <th className="py-3 px-2">Unresolved incidents</th>
                  <th className="py-3 px-2">Operational state</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/50 font-mono">
                {summary?.centers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-text-muted">No centers registered. Sealing packages...</td>
                  </tr>
                ) : (
                  summary?.centers.map(c => (
                    <tr key={c.center_id} className="hover:bg-white/2">
                      <td className="py-3 px-2 text-white font-bold">{c.center_id}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.package_status === "RELEASED" ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20" :
                          c.package_status === "REVOKED" ? "bg-accent-red/10 text-accent-red border border-accent-red/20" :
                          "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
                        }`}>{c.package_status}</span>
                      </td>
                      <td className="py-3 px-2 text-white">{c.verified_candidates} candidates</td>
                      <td className="py-3 px-2 text-text-muted">{c.incidents_count} reports</td>
                      <td className="py-3 px-2 text-accent-red">{c.unresolved_incidents} active</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "ONLINE" ? "bg-accent-emerald text-background" :
                          c.status === "READY" ? "bg-accent-amber text-background" :
                          "bg-accent-red text-background animate-pulse"
                        }`}>{c.status}</span>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => router.push(`/center-console?center=${c.center_id}`)}
                          className="text-[10px] px-2 py-0.5 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer"
                        >
                          Drill center
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Incidents management feed */}
        <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-accent-red">
            ⚠️ Live Incident Response Center
          </h2>
          <div className="flex flex-col gap-4">
            {incidents.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-xs font-mono">
                🟢 ALL EXAM CENTERS SECURE. NO ACTIVE INCIDENT CHANNELS.
              </div>
            ) : (
              incidents.map(inc => (
                <div
                  key={inc.incident_id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 items-start md:items-center ${
                    inc.status === "RESOLVED"
                      ? "border-border-color bg-background/20 opacity-75"
                      : inc.severity === "P0_CRITICAL"
                      ? "border-accent-red bg-accent-red/5"
                      : "border-accent-amber/40 bg-accent-amber/5"
                  }`}
                >
                  <div className="flex-1 font-mono text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded ${
                        inc.status === "RESOLVED" ? "bg-border-color text-white" :
                        inc.severity === "P0_CRITICAL" ? "bg-accent-red text-background" : "bg-accent-amber text-background"
                      }`}>{inc.severity}</span>
                      <span className="text-white font-bold">{inc.incident_type}</span>
                      <span className="text-text-muted">@ Center: {inc.center_id}</span>
                    </div>
                    <p className="text-xs text-text-primary mt-2 leading-relaxed">{inc.description}</p>
                    <div className="text-[10px] text-text-muted mt-1">Incident ID: {inc.incident_id} | Reported at: {new Date(inc.created_at).toLocaleTimeString()}</div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col gap-2">
                    {inc.status === "OPEN" ? (
                      <>
                        <input
                          type="text"
                          placeholder="Resolution details..."
                          value={resolutionNotes[inc.incident_id] || ""}
                          onChange={(e) => setResolutionNotes(prev => ({ ...prev, [inc.incident_id]: e.target.value }))}
                          className="p-1.5 bg-background border border-border-color rounded text-xs text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveIncident(inc.incident_id)}
                            className="flex-1 text-xs py-1 px-3 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleEscalateIncident(inc.incident_id, inc.severity)}
                            className="flex-1 text-xs py-1 px-3 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition cursor-pointer"
                          >
                            Escalate
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-accent-emerald font-bold text-xs uppercase flex items-center gap-1.5 font-mono">
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
