"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function EvaluatorQueuePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");

    if (!storedToken || role !== "EVALUATOR") {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setUserName(name || "Evaluator");
    fetchQueue(storedToken);
  }, []);

  const fetchQueue = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluation/my-queue`, {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch evaluator queue");
      const data = await res.json();
      setQueue(data);
    } catch (err: any) {
      setError(err.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 font-mono">
              <Link href="/evaluation-ops" className="hover:text-accent-emerald transition-colors">EvaluationOps</Link>
              <span>/</span>
              <span className="text-foreground">My Queue</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              📥 Assigned Grading Queue
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Active grading copy assignments for <span className="text-white font-semibold">{userName}</span>.
            </p>
          </div>
          <div>
            <button 
              onClick={() => fetchQueue(token)}
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold flex items-center gap-2 cursor-pointer"
            >
              🔄 Refresh Queue
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Queue List */}
        {loading ? (
          <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm">Retrieving secure assignments ledger...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center bg-card-bg rounded-xl border border-border-color space-y-3">
            <span className="text-4xl">📭</span>
            <h3 className="text-lg font-bold text-white">Queue Empty</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              You currently have no booklet copies assigned. Check the controller panel to assign anonymous sheets to your profile.
            </p>
          </div>
        ) : (
          <div className="bg-card-bg rounded-xl border border-border-color overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-color bg-background/50 font-mono text-text-muted text-xs uppercase">
                    <th className="p-4">Anonymous Booklet ID</th>
                    <th className="p-4">Target Exam ID</th>
                    <th className="p-4">Page Count</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/40">
                  {queue.map((copy: any) => (
                    <tr key={copy.anonymous_id} className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">{copy.anonymous_id}</td>
                      <td className="p-4 text-white/95">{copy.exam_id}</td>
                      <td className="p-4 text-text-muted font-mono">{copy.booklet_hash ? "Fully Ingested" : "Scan Pending"}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          copy.status === "LOCKED" 
                            ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                            : copy.status === "EVALUATING"
                            ? "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                            : "bg-blue-400/10 border border-blue-400/20 text-blue-400"
                        }`}>
                          {copy.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/evaluator/copy/${copy.anonymous_id}`}
                          className={`inline-block px-3 py-1.5 rounded text-xs font-bold transition-all ${
                            copy.status === "LOCKED"
                              ? "bg-card-bg border border-border-color text-text-muted hover:bg-background"
                              : "bg-accent-emerald text-background hover:bg-accent-emerald/90"
                          }`}
                        >
                          {copy.status === "LOCKED" ? "🔍 View Details" : "✍️ Start Grading"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
