"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  description: string;
  status: string;
  triaged_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  incident_id: string;
  event_type: string;
  message: string;
  actor_id: string | null;
  created_at: string;
}

export default function IncidentsTriagePage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [selectedIncId, setSelectedIncId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [triageNotes, setTriageNotes] = useState("");

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/security-incidents`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
        if (data.length > 0) {
          setSelectedIncId(data[0].id);
          fetchTimeline(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (incId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/security-incidents/${incId}/timeline`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch (err) {
      console.error("Failed to load timeline", err);
    }
  };

  const handleSelectIncident = (incId: string) => {
    setSelectedIncId(incId);
    fetchTimeline(incId);
  };

  const handleAction = async (action: "triage" | "contain" | "resolve") => {
    if (!selectedIncId) return;
    setError("");
    setSuccess("");
    setActioning(true);

    try {
      const token = localStorage.getItem("access_token");
      const body = action === "triage" ? JSON.stringify({ notes: triageNotes }) : undefined;
      
      const res = await fetch(`${BACKEND_URL}/api/security-incidents/${selectedIncId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to execute ${action}.`);
      }

      setSuccess(`Incident updated: status is now ${data.status}`);
      setTriageNotes("");
      fetchIncidents();
      fetchTimeline(selectedIncId);
    } catch (err: any) {
      setError(err.message || "Incident update failed.");
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2"></span>
        DECRYPTING INCIDENT RESPONSE TELEMETRY...
      </div>
    );
  }

  const activeInc = incidents.find((i) => i.id === selectedIncId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Incidents List (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Security Incidents Console</h2>
          <p className="text-xs text-text-muted mt-1">Review alerts raised by rates checkers, privacy guards, or HSM signatures.</p>
        </div>

        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal font-mono">
             ERROR: {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs leading-normal">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {incidents.length === 0 ? (
            <div className="p-8 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs">
              No security incidents reported. System is nominal.
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncId === inc.id;
              const isP0 = inc.severity === "P0";
              const isResolved = inc.status === "RESOLVED";
              return (
                <div
                  key={inc.id}
                  onClick={() => handleSelectIncident(inc.id)}
                  className={`p-5 rounded-2xl border bg-card-bg cursor-pointer shadow-sm transition ${
                    isSelected ? "border-accent-emerald/30 shadow-md" : "border-border-color hover:border-border-color/80"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isP0 ? "bg-accent-red/10 text-accent-red border border-accent-red/25 animate-pulse" : "bg-accent-amber/10 text-accent-amber border border-accent-amber/25"
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{inc.incident_type}</span>
                        <span className={`text-[10px] font-mono font-bold ml-auto px-2 py-0.5 rounded ${
                          isResolved ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-red/15 text-accent-red"
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-mono text-white mt-3 break-all">Incident ID: {inc.id}</h4>
                      <p className="text-xs text-text-muted mt-2 leading-relaxed">{inc.description}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Incident Timeline */}
        {activeInc && (
          <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-mono">
              Containment Timeline & Events
            </h3>
            
            <div className="flex flex-col gap-3 font-mono text-[11px] max-h-[300px] overflow-y-auto">
              {timeline.length === 0 ? (
                <div className="text-center text-text-muted py-4">No containment events logged.</div>
              ) : (
                timeline.map((evt) => (
                  <div key={evt.id} className="p-3 bg-background/50 border border-border-color rounded-xl flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] text-text-muted">
                      <span>Event: <span className="text-white font-bold">{evt.event_type}</span></span>
                      <span>{new Date(evt.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-white/90 leading-relaxed">{evt.message}</div>
                    {evt.actor_id && <div className="text-[9px] text-text-muted">Actor: {evt.actor_id}</div>}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Incident Triage Tools */}
      <div className="flex flex-col gap-6">
        {activeInc && activeInc.status !== "RESOLVED" && (
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-red animate-pulse"></span> Triage Response
            </h3>

            {activeInc.status === "OPEN" && (
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Triage Notes</label>
                <textarea
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Notes about threat validation..."
                  rows={2}
                  className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald leading-relaxed"
                />
                <button
                  onClick={() => handleAction("triage")}
                  disabled={actioning || !triageNotes}
                  className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase font-mono mt-3"
                >
                  Triage Incident
                </button>
              </div>
            )}

            {activeInc.status === "TRIAGED" && (
              <button
                onClick={() => handleAction("contain")}
                disabled={actioning}
                className="w-full py-2 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition text-xs cursor-pointer uppercase font-mono mt-2"
              >
                Contain Incident
              </button>
            )}

            {activeInc.status === "CONTAINED" && (
              <button
                onClick={() => handleAction("resolve")}
                disabled={actioning}
                className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase font-mono mt-2"
              >
                Resolve Incident
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
