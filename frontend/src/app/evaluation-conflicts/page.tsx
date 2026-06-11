"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function ConflictsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Resolution Form States
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [finalMarks, setFinalMarks] = useState<number>(0.0);
  const [notes, setNotes] = useState("");
  const [policy, setPolicy] = useState("SENIOR_RECONCILIATION");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole || "");
    fetchConflicts(storedToken);
  }, []);

  const fetchConflicts = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluation/conflicts`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch evaluation conflicts list");
      const data = await res.json();
      setConflicts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load conflicts list");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConflict) return;
    setSubmitting(true);

    try {
      // Determine if senior review is needed (variance > 5.0) or standard controller resolution
      const endpoint = selectedConflict.variance > 5.0 
        ? `${BACKEND_URL}/api/evaluation/conflicts/${selectedConflict.id}/senior-review`
        : `${BACKEND_URL}/api/evaluation/conflicts/${selectedConflict.id}/resolve`;

      const payload = selectedConflict.variance > 5.0
        ? { final_marks: finalMarks, decision_notes: notes }
        : { final_marks: finalMarks, resolution_policy: policy, notes: notes };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to resolve conflict.");
      }

      // Update locally
      setConflicts((prev) => 
        prev.map((c) => c.id === selectedConflict.id ? { ...c, status: "RESOLVED" } : c)
      );
      setSelectedConflict(null);
      setNotes("");
      alert("Double evaluation variance conflict resolved successfully!");
    } catch (err: any) {
      alert(err.message || "Conflict resolution failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectConflict = (c: any) => {
    setSelectedConflict(c);
    // Suggest average marks as default
    const average = (c.marks_a + c.marks_b) / 2;
    setFinalMarks(average);
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
              <span className="text-foreground">Conflicts</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              💥 Grading Discrepancies Resolution
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Audit double-evaluation grading variances exceeding the 2.0 marks compliance limit.
            </p>
          </div>
          <div>
            <button 
              onClick={() => fetchConflicts(token)}
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold cursor-pointer"
            >
              🔄 Refresh Disputes
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Conflicts Table list */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
                <div className="animate-spin text-2xl">⏳</div>
                <p className="text-sm">Fetching double evaluation conflicts ledger...</p>
              </div>
            ) : conflicts.length === 0 ? (
              <div className="p-12 text-center bg-card-bg rounded-xl border border-border-color space-y-3">
                <span className="text-4xl">🕊️</span>
                <h3 className="text-lg font-bold text-white">No Grading Conflicts</h3>
                <p className="text-text-muted text-sm max-w-md mx-auto">
                  Excellent! There are currently no double-evaluation variance conflicts in the system.
                </p>
              </div>
            ) : (
              <div className="bg-card-bg rounded-xl border border-border-color overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border-color bg-background/50 font-mono text-text-muted text-xs uppercase">
                        <th className="p-4">Anonymous ID</th>
                        <th className="p-4">Question</th>
                        <th className="p-4">Evaluator A vs B</th>
                        <th className="p-4">Variance</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/40">
                      {conflicts.map((c) => (
                        <tr key={c.id} className="hover:bg-background/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-white">{c.anonymous_id}</td>
                          <td className="p-4 font-mono text-white/90">Q: {c.question_id}</td>
                          <td className="p-4 text-text-muted font-mono">
                            {c.marks_a} vs {c.marks_b}
                          </td>
                          <td className={`p-4 font-bold font-mono ${c.variance > 5.0 ? 'text-accent-red' : 'text-accent-amber'}`}>
                            {c.variance} marks
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              c.status === "RESOLVED" 
                                ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                                : c.status === "SENIOR_REVIEW"
                                ? "bg-accent-red/10 border border-accent-red/20 text-accent-red animate-pulse"
                                : "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {c.status !== "RESOLVED" && role === "CONTROLLER" ? (
                              <button 
                                onClick={() => handleSelectConflict(c)}
                                className="px-3 py-1.5 bg-accent-emerald text-background font-bold text-xs rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
                              >
                                ⚖️ Resolve
                              </button>
                            ) : (
                              <span className="text-xs text-text-muted">No actions</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Resolution Console */}
          {selectedConflict && (
            <div className="bg-card-bg rounded-xl border border-accent-emerald/30 p-6 space-y-6 shadow-xl animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  ⚖️ Resolution Console
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Decide final marks weightage for anonymous ID <span className="font-mono text-white">{selectedConflict.anonymous_id}</span> on question <span className="font-mono text-white">{selectedConflict.question_id}</span>.
                </p>
              </div>

              {selectedConflict.variance > 5.0 && (
                <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
                  ⚠️ <strong>P0 Critical Variance Alert:</strong> This conflict has a variance exceeding 5 marks. A Senior Review decision will be submitted, recording your credentials in the ledger.
                </div>
              )}

              <form onSubmit={handleResolveConflict} className="space-y-4">
                
                {selectedConflict.variance <= 5.0 && (
                  <div>
                    <label className="block text-xs text-text-muted uppercase mb-1">Resolution Policy</label>
                    <select 
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value)}
                      className="w-full p-2 bg-background border border-border-color rounded text-sm text-white focus:outline-none focus:border-accent-emerald"
                    >
                      <option value="SENIOR_RECONCILIATION">Senior Reconciliation</option>
                      <option value="AVERAGE">Mathematical Average</option>
                      <option value="THIRD_EVALUATION">Third Evaluator Panel</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-text-muted uppercase mb-1">Final Marks Approved</label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={finalMarks}
                    onChange={(e) => setFinalMarks(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-background border border-border-color rounded text-sm text-white focus:outline-none focus:border-accent-emerald font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-muted uppercase mb-1">Justification Notes</label>
                  <textarea 
                    rows={4}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter audit-ready justification..."
                    className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-accent-emerald text-background font-bold text-sm rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "✓ Approve Marks"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedConflict(null)}
                    className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
