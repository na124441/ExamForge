"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function OMRReviewPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Correction Panel
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [finalAnswer, setFinalAnswer] = useState("A");
  const [submitting, setSubmitting] = useState(false);
  const [locking, setLocking] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<any>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole || "");
    fetchReviews(storedToken);
  }, []);

  const fetchReviews = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/omr/review-queue`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch OMR manual reviews queue");
      const data = await res.json();
      setReviews(data);
    } catch (err: any) {
      setError(err.message || "Failed to load OMR review queue");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setSubmitting(true);
    setVerifyStatus(null);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/omr/review/${selectedReview.id}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reviewer_final_answer: finalAnswer })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to finalize OMR bubble choice.");
      }

      const updated = await res.json();
      setReviews((prev) => 
        prev.map((r) => r.id === selectedReview.id ? updated : r)
      );
      setSelectedReview(updated);
      alert("OMR bubble choice finalized!");
    } catch (err: any) {
      alert(err.message || "Finalize failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLock = async () => {
    if (!selectedReview) return;
    setLocking(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/omr/review/${selectedReview.id}/lock`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to lock OMR review choice.");
      }

      const locked = await res.json();
      setReviews((prev) => 
        prev.map((r) => r.id === selectedReview.id ? locked : r)
      );
      setSelectedReview(locked);
      alert("OMR choice permanently sealed and locked in database logs!");
    } catch (err: any) {
      alert(err.message || "Lock failed");
    } finally {
      setLocking(false);
    }
  };

  const handleVerify = async (reviewId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/omr/review/${reviewId}/verify`);
      if (!res.ok) throw new Error("Failed to verify OMR lock integrity");
      const data = await res.json();
      setVerifyStatus(data);
    } catch (err: any) {
      alert(err.message || "Verification failed");
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
              <span className="text-foreground">OMR Review</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🔵 OMR Bubble Correction Portal
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Audit low-confidence scan grids and manually lock ambiguous bubble selections.
            </p>
          </div>
          <div>
            <button 
              onClick={() => fetchReviews(token)}
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold cursor-pointer"
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

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
                <div className="animate-spin text-2xl">⏳</div>
                <p className="text-sm">Fetching ambiguous OMR scan sheets...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center bg-card-bg rounded-xl border border-border-color space-y-3">
                <span className="text-4xl">🕊️</span>
                <h3 className="text-lg font-bold text-white">No OMR Corrections Pending</h3>
                <p className="text-text-muted text-sm max-w-md mx-auto">
                  All scanner bubble fillings met automatic confidence thresholds successfully.
                </p>
              </div>
            ) : (
              <div className="bg-card-bg rounded-xl border border-border-color overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border-color bg-background/50 font-mono text-text-muted text-xs uppercase">
                        <th className="p-4">Scan ID</th>
                        <th className="p-4">Question #</th>
                        <th className="p-4">Confidence</th>
                        <th className="p-4">Final Answer</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/40">
                      {reviews.map((r) => (
                        <tr key={r.id} className="hover:bg-background/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-white truncate max-w-[120px]">{r.scan_id}</td>
                          <td className="p-4 font-mono text-white/95">Q-{r.question_no}</td>
                          <td className="p-4 text-accent-amber font-mono font-bold">
                            {Math.round(r.confidence * 100)}%
                          </td>
                          <td className="p-4 font-mono text-white/95">
                            {r.reviewer_final_answer || "PENDING"}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              r.review_status === "LOCKED" 
                                ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                                : "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                            }`}>
                              {r.review_status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button 
                              onClick={() => { setSelectedReview(r); setFinalAnswer(r.reviewer_final_answer || "A"); setVerifyStatus(null); }}
                              className="px-2.5 py-1 bg-accent-emerald text-background font-bold text-xs rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
                            >
                              🔍 View Tool
                            </button>
                            {r.review_status === "LOCKED" && (
                              <button 
                                onClick={() => handleVerify(r.id)}
                                className="px-2.5 py-1 bg-card-bg border border-border-color text-white font-bold text-xs rounded hover:bg-background transition-all cursor-pointer"
                              >
                                ⛓️ Verify Lock
                              </button>
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

          {/* Right Column - Correction Tool Panel */}
          {selectedReview && (
            <div className="bg-card-bg rounded-xl border border-indigo-400/30 p-6 space-y-6 shadow-xl animate-in fade-in duration-300">
              
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🔵 Bubble Tool Console
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Evaluate low-confidence bubble grid contours. Seal corrected answers in ledger.
                </p>
              </div>

              <div className="p-4 bg-background/50 border border-border-color rounded-lg text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Detected Scan Answer:</span>
                  <span className="font-mono text-white font-bold">{selectedReview.detected_answer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Computer Confidence:</span>
                  <span className="font-mono text-accent-amber font-bold">{Math.round(selectedReview.confidence * 100)}%</span>
                </div>
              </div>

              {selectedReview.review_status !== "LOCKED" ? (
                <form onSubmit={handleFinalize} className="space-y-4">
                  <div>
                    <label className="block text-xs text-text-muted uppercase mb-1">Final Corrected Answer Bubble</label>
                    <div className="grid grid-cols-5 gap-2">
                      {["A", "B", "C", "D", "E"].map((opt) => (
                        <button 
                          key={opt}
                          type="button"
                          onClick={() => setFinalAnswer(opt)}
                          className={`py-2 text-sm font-bold font-mono border rounded transition-all cursor-pointer ${
                            finalAnswer === opt 
                              ? 'border-accent-emerald bg-accent-emerald/10 text-accent-emerald shadow-lg' 
                              : 'border-border-color bg-background/25 text-white/70 hover:bg-background'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-accent-emerald text-background font-bold text-xs rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
                  >
                    {submitting ? "Finalizing choice..." : "✓ Finalize Answer Choice"}
                  </button>

                  {selectedReview.reviewer_final_answer && (
                    <div className="pt-2 border-t border-border-color/30">
                      <button 
                        type="button"
                        onClick={handleLock}
                        disabled={locking}
                        className="w-full py-2 bg-accent-amber text-background font-bold text-xs rounded hover:bg-accent-amber/90 transition-all cursor-pointer"
                      >
                        {locking ? "Locking review..." : "🔒 Seal & Lock OMR Choice"}
                      </button>
                    </div>
                  )}

                </form>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded font-bold">
                    ✓ This OMR correction is locked and sealed.
                  </div>
                  <div className="space-y-2">
                    <div className="text-text-muted">Stored SHA-256 Lock Hash:</div>
                    <div className="font-mono text-[10px] text-white bg-background/60 p-2 border border-border-color rounded break-all">
                      {selectedReview.review_hash}
                    </div>
                  </div>
                  
                  {verifyStatus && (
                    <div className={`p-3 border rounded font-mono text-[10px] leading-relaxed ${
                      verifyStatus.hash_valid
                        ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald'
                        : 'bg-accent-red/10 border-accent-red/20 text-accent-red'
                    }`}>
                      <div>Hash Intact: {verifyStatus.hash_valid ? "YES" : "NO"}</div>
                      <div className="mt-1 break-all">Recalculated: {verifyStatus.recalculated_hash}</div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="button"
                onClick={() => setSelectedReview(null)}
                className="w-full py-2 bg-card-bg border border-border-color rounded text-xs hover:bg-background transition-colors text-white font-semibold cursor-pointer"
              >
                Close Tool Panel
              </button>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}
