"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function DisputeOpsQueue() {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/dispute-ops/queue`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not load dispute officer queue.");
      const data = await res.json();
      setDisputes(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenReview = async (dispId: string) => {
    try {
      const token = localStorage.getItem("token") || "";
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-5xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">⚖️</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">DisputeOps Workspace</h1>
              <p className="text-xs text-text-muted mt-0.5">Manage result complaints, coordinate independent reviews, and authorize mark updates.</p>
            </div>
          </div>
          <Link href="/controller" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            Return to Controller
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12 text-xs text-text-muted animate-pulse">
            Querying secure review queue logs...
          </div>
        )}

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
            {error}
          </div>
        )}

        {!loading && disputes.length === 0 && (
          <div className="bg-card-bg p-12 rounded-2xl border border-border-color text-center flex flex-col items-center gap-4">
            <span className="text-5xl opacity-40">🟢</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Zero disputes pending</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              All filed disputes have been successfully resolved, updated, or closed.
            </p>
          </div>
        )}

        {disputes.length > 0 && (
          <div className="bg-card-bg rounded-2xl border border-border-color overflow-hidden shadow-lg text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border-color text-text-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-4">Dispute ID</th>
                  <th className="p-4">Exam ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/40 text-text-primary">
                {disputes.map((d: any) => (
                  <tr key={d.id} className="hover:bg-background/20 transition">
                    <td className="p-4 font-mono text-text-muted">{d.id.slice(0, 8)}...</td>
                    <td className="p-4 font-mono font-bold text-white">{d.exam_id}</td>
                    <td className="p-4">{d.dispute_type.replace(/_/g, " ")}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        d.priority === "CRITICAL" ? "bg-accent-red/10 text-accent-red" :
                        d.priority === "HIGH" ? "bg-accent-amber/10 text-accent-amber" :
                        "bg-border-color text-text-muted"
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        d.status === "CLOSED" ? "bg-background border border-border-color text-text-muted" :
                        d.status.startsWith("RESOLVED") ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" :
                        "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      {d.status === "SUBMITTED" && (
                        <button onClick={() => handleOpenReview(d.id)} className="px-2.5 py-1 bg-accent-amber/15 border border-accent-amber/30 text-accent-amber hover:bg-accent-amber/25 rounded text-[10px] font-bold transition">
                          Open Review
                        </button>
                      )}
                      <Link href={`/dispute-ops/${d.id}`} className="px-2.5 py-1 bg-card-bg border border-border-color hover:border-accent-emerald text-white rounded text-[10px] font-bold transition">
                        Open Workspace
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
