"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function OpsDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [jobsCount, setJobsCount] = useState(0);
  const [incidentsCount, setIncidentsCount] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { "Authorization": `Bearer ${token}` };

      // Fetch health
      const hRes = await fetch(`${BACKEND_URL}/health/deep`, { headers });
      if (hRes.ok) {
        setHealth(await hRes.json());
      }

      // Fetch active jobs
      const jRes = await fetch(`${BACKEND_URL}/api/jobs`, { headers });
      if (jRes.ok) {
        const jobs = await jRes.json();
        setJobsCount(jobs.filter((j: any) => j.status === "RUNNING" || j.status === "PENDING").length);
      }

      // Fetch incidents
      const iRes = await fetch(`${BACKEND_URL}/api/ops/incidents`, { headers });
      if (iRes.ok) {
        const incs = await iRes.json();
        setIncidentsCount(incs.filter((i: any) => i.status === "OPEN").length);
      }

      // Fetch metrics
      const mRes = await fetch(`${BACKEND_URL}/api/ops/metrics`, { headers });
      if (mRes.ok) {
        setMetrics(await mRes.json());
      }
    } catch (err: any) {
      setError(err.message || "Could not retrieve operations telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Operational Dashboard</h1>
          <p className="text-xs text-text-muted mt-0.5">Real-time infrastructure health, background queues, metrics, and safety switches.</p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Telemetry Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-text-muted animate-pulse">
          Loading operations telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Health Status */}
          <div className="bg-card-bg p-5 rounded-xl border border-border-color flex flex-col gap-3 justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-text-muted">SYSTEM STATUS</span>
              <span className="text-xl">🩺</span>
            </div>
            <div>
              <h3 className={`text-xl font-extrabold tracking-wide ${
                health?.status === "READY" 
                  ? "text-accent-emerald" 
                  : health?.status === "DEGRADED" 
                  ? "text-accent-amber" 
                  : "text-accent-red"
              }`}>
                {health?.status || "UNKNOWN"}
              </h3>
              <p className="text-[10px] text-text-muted mt-1">Overall infrastructure status classification.</p>
            </div>
            <Link href="/ops/health" className="text-[10px] font-bold text-accent-emerald hover:underline uppercase tracking-wider mt-2 block">
              View Checks →
            </Link>
          </div>

          {/* Background Jobs */}
          <div className="bg-card-bg p-5 rounded-xl border border-border-color flex flex-col gap-3 justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-text-muted">ACTIVE WORKERS</span>
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-wide">
                {jobsCount} Running
              </h3>
              <p className="text-[10px] text-text-muted mt-1">Tasks currently pending or processing in background queues.</p>
            </div>
            <Link href="/ops/jobs" className="text-[10px] font-bold text-accent-emerald hover:underline uppercase tracking-wider mt-2 block">
              Manage Jobs →
            </Link>
          </div>

          {/* Open Incidents */}
          <div className="bg-card-bg p-5 rounded-xl border border-border-color flex flex-col gap-3 justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-text-muted">ACTIVE ALERTS</span>
              <span className="text-xl">🚨</span>
            </div>
            <div>
              <h3 className={`text-xl font-extrabold tracking-wide ${
                incidentsCount > 0 ? "text-accent-red" : "text-accent-emerald"
              }`}>
                {incidentsCount} Open Incidents
              </h3>
              <p className="text-[10px] text-text-muted mt-1">Open systems incidents needing resolving action.</p>
            </div>
            <Link href="/ops/maintenance" className="text-[10px] font-bold text-accent-emerald hover:underline uppercase tracking-wider mt-2 block">
              Inspect Alerts →
            </Link>
          </div>

          {/* Average Latency */}
          <div className="bg-card-bg p-5 rounded-xl border border-border-color flex flex-col gap-3 justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-text-muted">API RESPONSIVENESS</span>
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-wide">
                {metrics ? `${(metrics.average_latency_seconds * 1000).toFixed(1)} ms` : "0.0 ms"}
              </h3>
              <p className="text-[10px] text-text-muted mt-1">Average server response processing time.</p>
            </div>
            <Link href="/ops/metrics" className="text-[10px] font-bold text-accent-emerald hover:underline uppercase tracking-wider mt-2 block">
              Analyze Load →
            </Link>
          </div>

        </div>
      )}

      {/* Quick Status Breakdown */}
      {health && (
        <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Subsystem Integrity Grid</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            
            <div className="bg-background/40 p-3 rounded border border-border-color/60">
              <div className="text-[10px] text-text-muted uppercase font-mono">DATABASE</div>
              <div className={`text-xs font-bold mt-1.5 ${health.database === "OK" ? "text-accent-emerald" : "text-accent-red"}`}>
                {health.database}
              </div>
            </div>

            <div className="bg-background/40 p-3 rounded border border-border-color/60">
              <div className="text-[10px] text-text-muted uppercase font-mono">REDIS CACHE</div>
              <div className={`text-xs font-bold mt-1.5 ${health.redis === "OK" ? "text-accent-emerald" : "text-accent-amber"}`}>
                {health.redis}
              </div>
            </div>

            <div className="bg-background/40 p-3 rounded border border-border-color/60">
              <div className="text-[10px] text-text-muted uppercase font-mono">STORAGE</div>
              <div className={`text-xs font-bold mt-1.5 ${health.storage === "OK" ? "text-accent-emerald" : "text-accent-red"}`}>
                {health.storage}
              </div>
            </div>

            <div className="bg-background/40 p-3 rounded border border-border-color/60">
              <div className="text-[10px] text-text-muted uppercase font-mono">WORKERS</div>
              <div className={`text-xs font-bold mt-1.5 ${health.workers === "OK" ? "text-accent-emerald" : "text-accent-amber"}`}>
                {health.workers}
              </div>
            </div>

            <div className="bg-background/40 p-3 rounded border border-border-color/60">
              <div className="text-[10px] text-text-muted uppercase font-mono">AUDIT LINK</div>
              <div className={`text-xs font-bold mt-1.5 ${health.audit_namespace === "OK" ? "text-accent-emerald" : "text-accent-red"}`}>
                {health.audit_namespace}
              </div>
            </div>

            <div className="bg-background/40 p-3 rounded border border-border-color/60">
              <div className="text-[10px] text-text-muted uppercase font-mono">KEYSPACE</div>
              <div className={`text-xs font-bold mt-1.5 ${health.keyspace === "OK" ? "text-accent-emerald" : "text-accent-amber"}`}>
                {health.keyspace}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
