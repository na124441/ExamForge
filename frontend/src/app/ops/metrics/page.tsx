"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/ops/metrics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch metrics logs.");
      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const metricCards = [
    { key: "examforge_api_requests_total", name: "Total API Requests", desc: "Aggregated requests processed by the ASGI middleware." },
    { key: "examforge_auth_failures_total", name: "Authentication Failures", desc: "Throttled credential checks or bad key accesses." },
    { key: "examforge_package_release_attempts_total", name: "Package Release Attempts", desc: "Total attempts to download encrypted NEET/exam papers." },
    { key: "examforge_audit_events_total", name: "Audit Ledger Logged Events", desc: "Total immutable events seals compiled to DB logs." },
    { key: "examforge_candidate_sessions_active", name: "Active Heartbeat Portals", desc: "Live heartbeats being reported by active candidates." },
    { key: "examforge_tenant_violations_total", name: "Cross-Tenant Intrusions", desc: "Logged security blockages for out-of-scope requests." }
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">API Metrics & Telemetry</h1>
          <p className="text-xs text-text-muted mt-0.5">Live request counts, average latency, and active connection metrics.</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-3 py-1.5 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold"
        >
          🔄 Refresh Telemetry
        </button>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Telemetry Fetch Failed:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-text-muted animate-pulse">
          Opening operational registry metrics...
        </div>
      ) : !metrics ? (
        <div className="bg-card-bg p-8 rounded-xl border border-border-color text-center text-xs text-text-muted">
          No metrics compiled.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Average Latency Widget */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-color flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Average response delay</span>
              <h3 className="text-2xl font-extrabold text-white">
                {(metrics.average_latency_seconds * 1000).toFixed(2)} ms
              </h3>
            </div>
            <span className="text-3xl">⚡</span>
          </div>

          {/* Grid of Counters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricCards.map((m) => {
              const val = metrics.counters[m.key] ?? 0;
              return (
                <div
                  key={m.key}
                  className="bg-card-bg p-5 rounded-xl border border-border-color hover:border-border-color/85 transition flex justify-between items-start"
                >
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    <span className="text-[10px] text-text-muted font-mono uppercase font-semibold">{m.key}</span>
                    <h4 className="text-white font-bold text-sm tracking-wide mt-1">{m.name}</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">{m.desc}</p>
                  </div>
                  
                  <span className="text-xl font-extrabold font-mono text-white bg-background border border-border-color px-3.5 py-1 rounded-lg">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
