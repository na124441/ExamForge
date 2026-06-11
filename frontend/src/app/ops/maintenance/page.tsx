"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function MaintenanceDashboard() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [description, setDescription] = useState("Database migration adjustments.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/ops/incidents`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch active system incidents.");
      const data = await res.json();
      setIncidents(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleToggleMaintenance = async (isActive: boolean) => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/ops/maintenance/toggle`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: isActive, description })
      });
      if (!res.ok) throw new Error("Failed to change maintenance mode status.");
      setMaintenanceMode(isActive);
      setSuccess(`Maintenance lock set to ${isActive ? "ACTIVE" : "INACTIVE"}.`);
      fetchIncidents();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/ops/incidents/${incidentId}/resolve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to resolve incident.");
      setSuccess("Incident marked as RESOLVED.");
      fetchIncidents();
    } catch (err: any) {
      setError(err.message || "Resolve failed.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Operational controls & Maintenance</h1>
          <p className="text-xs text-text-muted mt-0.5">Simulate hardware outages, set maintenance mode locks, and resolve systems incidents.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Incident Action Failure:</strong> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs">
          <strong>Action Confirmed:</strong> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Maintenance Toggle Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Maintenance Lock</h2>
            
            <p className="text-xs text-text-muted leading-relaxed">
              Activating the maintenance lock immediately restricts candidate submissions and result publications across all scoped tenants.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted font-mono">Lock Reason</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border border-border-color rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-emerald"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                disabled={actionLoading || maintenanceMode}
                onClick={() => handleToggleMaintenance(true)}
                className="flex-1 py-2 bg-accent-red text-white font-extrabold rounded text-xs hover:bg-accent-red/90 transition uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                🔐 Lock
              </button>
              <button
                disabled={actionLoading || !maintenanceMode}
                onClick={() => handleToggleMaintenance(false)}
                className="flex-1 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                🔓 Unlock
              </button>
            </div>
          </div>

        </div>

        {/* Incidents feed list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider px-1">Incidents Feed</h2>

          {loading ? (
            <div className="text-center py-20 text-xs text-text-muted animate-pulse">
              Parsing open ops incidents...
            </div>
          ) : incidents.length === 0 ? (
            <div className="bg-card-bg p-12 rounded-xl border border-border-color text-center flex flex-col items-center gap-4">
              <span className="text-4xl opacity-40">🚨</span>
              <h3 className="text-white font-bold text-xs uppercase tracking-wider">No active incidents</h3>
              <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                System is healthy. No hardware outages, lock timeouts, or verification alerts currently open.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-emerald/30 transition flex flex-col gap-3 shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono text-text-muted">{inc.id}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <strong className="text-xs text-white uppercase tracking-wide">{inc.incident_type}</strong>
                        <span className={`px-2 py-0.2 rounded text-[8px] font-bold font-mono ${
                          inc.severity === "P0"
                            ? "bg-accent-red/20 border border-accent-red/35 text-accent-red"
                            : "bg-accent-amber/20 border border-accent-amber/35 text-accent-amber"
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
                      inc.status === "OPEN"
                        ? "bg-accent-red/10 border border-accent-red/20 text-accent-red animate-pulse"
                        : "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted leading-normal">{inc.description}</p>

                  <div className="flex justify-between items-center border-t border-border-color/60 pt-3 mt-1 text-[10px]">
                    <span className="text-text-muted">Reported: {new Date(inc.created_at).toLocaleString()}</span>
                    
                    {inc.status === "OPEN" && (
                      <button
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-3 py-1 bg-accent-emerald/10 border border-accent-emerald/25 hover:bg-accent-emerald/20 text-accent-emerald font-semibold rounded transition cursor-pointer"
                      >
                        Acknowledge & Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
