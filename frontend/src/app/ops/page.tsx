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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 text-xs gap-3 font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Acquiring Subsystem Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Platform Operations Health</span>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-medium">
              Live Health
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production health status, background worker tasks, and API latency metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-medium">
          ⚠️ Telemetry Warning: {error}
        </div>
      )}

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Deep health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[140px] shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Health</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight uppercase font-mono ${
              health?.status === "READY" ? "text-emerald-700" : "text-amber-700"
            }`}>
              {health?.status || "UNKNOWN"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Subsystem health classification.</p>
          </div>
          <Link href="/ops/health" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider block">
            Subsystems →
          </Link>
        </div>

        {/* Worker Pool */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[140px] shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tasks</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {jobsCount} Tasks
            </h3>
            <p className="text-xs text-slate-500 mt-1">Pending or processing backend tasks.</p>
          </div>
          <Link href="/ops/jobs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider block">
            Job Ledger →
          </Link>
        </div>

        {/* Alert incident count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[140px] shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight font-mono ${
              incidentsCount > 0 ? "text-red-700" : "text-emerald-700"
            }`}>
              {incidentsCount} Incidents
            </h3>
            <p className="text-xs text-slate-500 mt-1">Unresolved alert response files.</p>
          </div>
          <Link href="/ops/maintenance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider block">
            Investigate →
          </Link>
        </div>

        {/* Latency */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[140px] shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Responsiveness</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {metrics ? `${(metrics.average_latency_seconds * 1000).toFixed(1)} ms` : "0.0 ms"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Average API roundtrip processing time.</p>
          </div>
          <Link href="/ops/metrics" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider block">
            Diagnostics →
          </Link>
        </div>

      </div>

      {/* Row 2: Subsystem Status Grid */}
      {health && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Platform Subsystem Status Grid</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            {[
              { name: "POSTGRES DB", status: health.database },
              { name: "REDIS CACHE", status: health.redis },
              { name: "S3 STORAGE", status: health.storage },
              { name: "QUEUE WORKERS", status: health.workers },
              { name: "AUDIT LEDGER", status: health.audit_namespace },
              { name: "KEYSPACE VAULT", status: health.keyspace },
            ].map((sub, idx) => (
              <div key={idx} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{sub.name}</div>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sub.status === "OK" || sub.status === "READY" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
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
