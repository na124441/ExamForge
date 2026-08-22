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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 text-xs gap-3 font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Querying Dispute Officer Queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dispute Operations Queue</span>
            <span className="text-xs px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-medium">
              Disputes
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate independent reviews, resolve recheck claims, and authorize verified score revisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Sync Queue</span>
          </button>
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-md transition font-medium cursor-pointer shadow-xs"
          >
            Authority Console
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Main Queue */}
      {disputes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 shadow-xs min-h-[260px]">
          <div className="p-3 bg-slate-100 rounded-full text-slate-400">
            <Inbox className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-sm">Zero Pending Disputes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              All candidate filed recheck claims have been resolved, updated in the ledger, or closed.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">Dispute ID</th>
                  <th className="p-4">Exam ID</th>
                  <th className="p-4">Dispute Type</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {disputes.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono text-slate-500">{d.id.slice(0, 8)}...</td>
                    <td className="p-4 font-semibold text-slate-900">{d.exam_id}</td>
                    <td className="p-4 text-slate-800 font-medium">{d.dispute_type.replace(/_/g, " ")}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        d.priority === "CRITICAL" ? "bg-red-50 text-red-700 border border-red-200" :
                        d.priority === "HIGH" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {d.status === "SUBMITTED" && (
                          <button 
                            onClick={() => handleOpenReview(d.id)} 
                            className="px-2.5 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded font-semibold transition text-xs cursor-pointer"
                          >
                            Open Review
                          </button>
                        )}
                        <Link 
                          href={`/dispute-ops/${d.id}`} 
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-semibold transition text-xs flex items-center gap-1 shadow-xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
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
