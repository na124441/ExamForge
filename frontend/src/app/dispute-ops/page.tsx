"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Scale, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  ChevronRight,
  Database,
  Inbox,
  FolderOpen
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";

export default function DisputeOpsQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`${BACKEND_URL}/api/dispute-ops/queue`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not load dispute officer queue.");
      const data = await res.json();
      setDisputes(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load dispute logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueue();
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenReview = async (dispId: string) => {
    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`${BACKEND_URL}/api/dispute-ops/${dispId}/open-review`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Review activation failed.");
      fetchQueue();
    } catch (err: any) {
      alert(err.message || "Error opening review.");
    }
  };

  if (loading && disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚖️</span>
        <span>QUERYING DISPUTE QUEUE RECORDS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>DisputeOps Workspace</span>
            <span className="text-[9px] px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded uppercase font-mono font-bold tracking-widest">
              Disputes
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Coordinate independent reviews, resolve recheck claims, and authorize verified MarksChain revisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync Queue</span>
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

      {/* Main Queue */}
      {disputes.length === 0 ? (
        <div className="bg-slate-900 p-12 rounded-2xl border border-slate-850 text-center flex flex-col items-center justify-center gap-4 shadow-lg min-h-[260px]">
          <div className="p-3 bg-slate-950 border border-slate-850 rounded-full text-slate-500">
            <Inbox className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">Zero Disputes Pending</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              All candidate filed recheck claims have been resolved, updated in the ledger, or closed.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-850 overflow-hidden shadow-lg font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-850 text-slate-500 font-bold text-[9px] uppercase tracking-widest">
                  <th className="p-4">Dispute ID</th>
                  <th className="p-4">Exam ID</th>
                  <th className="p-4">Dispute Type</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {disputes.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-950/20 transition group">
                    <td className="p-4 font-mono text-slate-500">{d.id.slice(0, 8)}...</td>
                    <td className="p-4 font-mono font-bold text-white">{d.exam_id}</td>
                    <td className="p-4 font-sans text-slate-200">{d.dispute_type.replace(/_/g, " ")}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        d.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse" :
                        d.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/25" :
                        "bg-slate-850 text-slate-500"
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        d.status === "CLOSED" ? "bg-slate-950 border-slate-850 text-slate-500" :
                        d.status.startsWith("RESOLVED") ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" :
                        "bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse"
                      }`}>{d.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2.5 justify-end">
                        {d.status === "SUBMITTED" && (
                          <button 
                            onClick={() => handleOpenReview(d.id)} 
                            className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/25 text-amber-400 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Review</span>
                          </button>
                        )}
                        <Link 
                          href={`/dispute-ops/${d.id}`} 
                          className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:border-slate-750 hover:text-white text-slate-400 rounded font-bold transition flex items-center gap-1"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Workspace</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
