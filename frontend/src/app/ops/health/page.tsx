"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function DeepHealthDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHealth = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/health/deep`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not retrieve deep health report.");
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const components = [
    { key: "database", name: "Database Service (PostgreSQL)", desc: "Main SQL persistent store containing SaaS registries and audit logs." },
    { key: "redis", name: "Redis Caching Layer", desc: "Lock manager and session heartbeats cache." },
    { key: "storage", name: "Object Storage Subsystem (MinIO/S3)", desc: "File server for OMR scans, booklets, and audit packets." },
    { key: "workers", name: "Celery Background Job Workers", desc: "Processes OMR coordinate evaluation and report signature generation." },
    { key: "audit_namespace", name: "Tenant Audit Ledger (Namespace)", desc: "Main logs namespace verifying the cryptographic chain sequence." },
    { key: "keyspace", name: "Institution Keyspace (ECDSA)", desc: "Public/private cryptographic keys for certificate validity." }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Deep Health check Console</h1>
          <p className="text-xs text-text-muted mt-0.5">Aggregated readiness reports of database connections, caching locks, workers, and namespaces.</p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-3 py-1.5 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider"
        >
          Check Now
        </button>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Health Query Failure:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-text-muted animate-pulse">
          Performing hardware and connection audits...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Status Banner */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-color flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">System Verdict</span>
              <h3 className={`text-xl font-extrabold ${
                health.status === "READY" ? "text-accent-emerald" : health.status === "DEGRADED" ? "text-accent-amber" : "text-accent-red"
              }`}>
                {health.status === "READY" ? "🟢 SYSTEM FULLY READY" : health.status === "DEGRADED" ? "🟡 SYSTEM DEGRADED" : "🔴 SYSTEM UNHEALTHY"}
              </h3>
            </div>
            <div className="text-right text-[11px] text-text-muted font-mono">
              Last audit: {new Date(health.checked_at).toLocaleString()}
            </div>
          </div>

          {/* Component breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {components.map((comp) => {
              const statusVal = health[comp.key] || "UNKNOWN";
              return (
                <div
                  key={comp.key}
                  className="bg-card-bg p-5 rounded-xl border border-border-color hover:border-border-color/80 transition flex justify-between items-start"
                >
                  <div className="flex flex-col gap-1.5 max-w-[75%]">
                    <h4 className="text-white font-bold text-sm tracking-wide">{comp.name}</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">{comp.desc}</p>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                    statusVal === "OK" 
                      ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" 
                      : statusVal === "DEGRADED" 
                      ? "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber" 
                      : "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                  }`}>
                    {statusVal}
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
