"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function RubricsCatalogPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockLoading, setLockLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole || "");
    fetchRubrics(storedToken);
  }, []);

  const fetchRubrics = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/rubrics/exam/EXM-005`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch exam rubrics catalog");
      const data = await res.json();
      setRubrics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rubrics catalog");
    } finally {
      setLoading(false);
    }
  };

  const handleLockRubric = async (rubricId: string) => {
    setLockLoading((prev) => ({ ...prev, [rubricId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/rubrics/${rubricId}/lock`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to lock rubric.");
      
      // Update local state
      setRubrics((prev) => 
        prev.map((r) => r.id === rubricId ? { ...r, status: "LOCKED" } : r)
      );
      alert("Rubric locked and sealed successfully!");
    } catch (err: any) {
      alert(err.message || "Rubric lock operation failed.");
    } finally {
      setLockLoading((prev) => ({ ...prev, [rubricId]: false }));
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 font-mono">
              <Link href="/evaluation-ops" className="hover:text-accent-emerald transition-colors">EvaluationOps</Link>
              <span>/</span>
              <span className="text-foreground">Rubrics</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              📋 Rubrics & Criteria Catalog
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Active grading schemas locked for exam <span className="font-mono text-white">EXM-005</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchRubrics(token)}
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold flex items-center gap-2 cursor-pointer"
            >
              🔄 Refresh Catalog
            </button>
            {role === "CONTROLLER" && (
              <Link 
                href="/rubrics/create"
                className="px-4 py-2 bg-accent-emerald text-background font-bold rounded text-sm hover:bg-accent-emerald/90 transition-colors flex items-center"
              >
                ➕ Create Rubric
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Rubrics Grid */}
        {loading ? (
          <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm">Loading active grading rubrics...</p>
          </div>
        ) : rubrics.length === 0 ? (
          <div className="p-12 text-center bg-card-bg rounded-xl border border-border-color space-y-3">
            <span className="text-4xl">📭</span>
            <h3 className="text-lg font-bold text-white">No Rubrics Defined</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              There are currently no rubrics defined for exam EXM-005. Define a rubric to start grading.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rubrics.map((r) => (
              <div key={r.id} className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4 shadow-lg hover:border-border-color/80 transition-colors">
                
                {/* Rubric Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg font-mono">Question: {r.question_id}</h3>
                    <div className="text-xs text-text-muted mt-1">
                      Max marks allowed: <span className="text-white font-bold">{r.max_marks}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    r.status === "LOCKED" 
                      ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                      : "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                  }`}>
                    {r.status}
                  </span>
                </div>

                {/* Criteria List */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Scoring Rubric Criteria</h4>
                  <div className="divide-y divide-border-color/30 bg-background/30 rounded border border-border-color/60 overflow-hidden">
                    {r.criteria.map((c: any, cIdx: number) => (
                      <div key={c.id || cIdx} className="flex justify-between items-center p-3 text-xs">
                        <span className="text-white/90 font-medium">{c.title}</span>
                        <span className="text-text-muted font-mono font-bold">{c.max_marks} Max</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rubric Footer Action */}
                {r.status !== "LOCKED" && role === "CONTROLLER" && (
                  <button 
                    onClick={() => handleLockRubric(r.id)}
                    disabled={lockLoading[r.id]}
                    className="w-full py-2 bg-accent-amber text-background font-bold text-xs rounded hover:bg-accent-amber/90 transition-all cursor-pointer"
                  >
                    {lockLoading[r.id] ? "Locking..." : "🔒 Seal and Lock Rubric Parameters"}
                  </button>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
