"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  Cpu, 
  Database, 
  Key, 
  Network, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Server
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";

export default function OpsDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [jobsCount, setJobsCount] = useState(0);
  const [incidentsCount, setIncidentsCount] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token") || "";
      const headers = { "Authorization": `Bearer ${token}` };

      const [hRes, jRes, iRes, mRes] = await Promise.all([
        fetch(`${BACKEND_URL}/health/deep`, { headers }),
        fetch(`${BACKEND_URL}/api/jobs`, { headers }),
        fetch(`${BACKEND_URL}/api/ops/incidents`, { headers }),
        fetch(`${BACKEND_URL}/api/ops/metrics`, { headers })
      ]);

      if (hRes.ok) setHealth(await hRes.json());
      
      if (jRes.ok) {
        const jobs = await jRes.json();
        setJobsCount(jobs.filter((j: any) => j.status === "RUNNING" || j.status === "PENDING").length);
      }

      if (iRes.ok) {
        const incs = await iRes.json();
        setIncidentsCount(incs.filter((i: any) => i.status === "OPEN").length);
      }

      if (mRes.ok) setMetrics(await mRes.json());
      
      setError("");
    } catch (err: any) {
      setError(err.message || "Could not retrieve operations telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !health) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚙️</span>
        <span>ACQUIRING PLATFORM SUBSYSTEM HEARTBEAT...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Operations Command Centre</span>
            <span className="text-[9px] px-2 py-0.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded uppercase font-mono font-bold tracking-widest">
              Live Health
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Production health status, background task worker pools, and API latency checks.
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
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/10 border border-red-900/20 text-red-400 rounded-xl text-xs font-mono">
          ⚠️ Telemetry Warning: {error}
        </div>
      )}

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Deep health */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col gap-3 justify-between min-h-[140px] shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Telemetry Health</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className={`text-2xl font-black tracking-tight font-mono uppercase ${
              health?.status === "READY" ? "text-emerald-400" : "text-amber-400"
            }`}>
              {health?.status || "UNKNOWN"}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Subsystem health classification.</p>
          </div>
          <Link href="/ops/health" className="text-[9px] font-bold text-blue-400 hover:underline uppercase tracking-wider block font-mono">
            Subsystems →
          </Link>
        </div>

        {/* Worker Pool */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col gap-3 justify-between min-h-[140px] shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Active Jobs</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white font-mono">
              {jobsCount} Tasks
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Pending or processing backend tasks.</p>
          </div>
          <Link href="/ops/jobs" className="text-[9px] font-bold text-blue-400 hover:underline uppercase tracking-wider block font-mono">
            Job Ledger →
          </Link>
        </div>

        {/* Alert incident count */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col gap-3 justify-between min-h-[140px] shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Open Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className={`text-2xl font-black tracking-tight font-mono ${
              incidentsCount > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"
            }`}>
              {incidentsCount} Incidents
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Unresolved alert response files.</p>
          </div>
          <Link href="/ops/maintenance" className="text-[9px] font-bold text-blue-400 hover:underline uppercase tracking-wider block font-mono">
            Investigate →
          </Link>
        </div>

        {/* Latency */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col gap-3 justify-between min-h-[140px] shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Mean Responsiveness</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white font-mono">
              {metrics ? `${(metrics.average_latency_seconds * 1000).toFixed(1)} ms` : "0.0 ms"}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Average transaction roundtrip processing time.</p>
          </div>
          <Link href="/ops/metrics" className="text-[9px] font-bold text-blue-400 hover:underline uppercase tracking-wider block font-mono">
            Diagnostics →
          </Link>
        </div>

      </div>

      {/* Row 2: Subsystem Status Grid */}
      {health && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Platform Subsystem Status Grid</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono text-center">
            {[
              { name: "POSTGRES DB", status: health.database },
              { name: "REDIS CACHE", status: health.redis },
              { name: "S3 STORAGE", status: health.storage },
              { name: "QUEUE WORKERS", status: health.workers },
              { name: "AUDIT LEDGER", status: health.audit_namespace },
              { name: "KEYSPACE VAULT", status: health.keyspace },
            ].map((sub, idx) => (
              <div key={idx} className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{sub.name}</div>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    sub.status === "OK" || sub.status === "READY" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                  }`}>{sub.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
