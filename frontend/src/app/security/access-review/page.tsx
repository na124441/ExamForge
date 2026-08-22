"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface ReviewCycle {
  id: string;
  scope: string;
  status: string;
  users_reviewed: number;
  stale_roles_found: number;
  started_at: string;
  completed_at: string | null;
}

interface ReviewItem {
  id: string;
  cycle_id: string;
  user_id: string;
  role: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export default function AccessReviewPage() {
  const [cycle, setCycle] = useState<ReviewCycle | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Attempt starting or fetching open cycle
    handleStartReview(true);
  }, []);

  const handleStartReview = async (isInit = false) => {
    if (!isInit) {
      setLoading(true);
      setError("");
      setSuccess("");
    }
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/access-review/start`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCycle(data);
        fetchCycleItems(data.id);
        if (!isInit) {
          setSuccess("Access Review Cycle started successfully!");
        }
      }
    } catch (err) {
      console.error("Failed to start review cycle", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycleItems = async (cycleId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/access-review/${cycleId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load cycle items", err);
    }
  };

  const handleAction = async (userId: string, action: "approve" | "revoke") => {
    if (!cycle) return;
    setError("");
    setSuccess("");
    setActioning(true);

    try {
      const token = localStorage.getItem("access_token");
      const endpoint = action === "approve" ? "approve-user" : "revoke-user-role";
      
      const res = await fetch(`${BACKEND_URL}/api/access-review/${cycle.id}/${endpoint}?user_id=${userId}`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to execute ${action} role.`);
      }

      setSuccess(`User role ${action}d successfully!`);
      fetchCycleItems(cycle.id);
      
      // refresh cycle metadata
      handleStartReview(true);
    } catch (err: any) {
      setError(err.message || "Action error.");
    } finally {
      setActioning(false);
    }
  };

  const handleCompleteReview = async () => {
    if (!cycle) return;
    setError("");
    setSuccess("");
    setActioning(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/access-review/${cycle.id}/complete`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to finalize review.");
      }

      setSuccess(" SUCCESS: Access review cycle successfully sealed and logged.");
      setCycle(data);
    } catch (err: any) {
      setError(err.message || "Seal cycle error.");
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2"></span>
        DECRYPTING ACCESS SNAPSHOT LEDGER...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Access Review items (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Identity Access Reviews</h2>
            <p className="text-xs text-text-muted mt-1">Audit active assignments and revoke memberships of stale users.</p>
          </div>
          
          {(!cycle || cycle.status === "COMPLETED") && (
            <button
              onClick={() => handleStartReview(false)}
              className="px-3 py-2 bg-accent-emerald text-background text-xs font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer uppercase shrink-0"
            >
              Start New Cycle
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal font-mono">
             {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs leading-normal">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {!cycle ? (
            <div className="p-8 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs">
              No access review cycle started yet.
            </div>
          ) : (
            items.map((item) => {
              const isPending = item.status === "PENDING";
              return (
                <div key={item.id} className="p-4 rounded-xl border border-border-color bg-card-bg flex justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/25 px-2 py-0.5 rounded uppercase">
                        {item.role}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">User: {item.user_id}</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-2">
                      Status: <span className={`font-bold ${item.status === "APPROVED" ? "text-accent-emerald" : item.status === "REVOKED" ? "text-accent-red" : "text-accent-amber"}`}>{item.status}</span>
                    </div>
                  </div>
                  
                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        disabled={actioning}
                        onClick={() => handleAction(item.user_id, "approve")}
                        className="px-2.5 py-1 bg-accent-emerald text-background text-[10px] font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        disabled={actioning}
                        onClick={() => handleAction(item.user_id, "revoke")}
                        className="px-2.5 py-1 bg-accent-red/10 border border-accent-red/30 text-accent-red text-[10px] font-bold rounded hover:bg-accent-red/20 transition cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cycle summary metadata */}
      <div className="flex flex-col gap-6">
        {cycle && (
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald"></span> Cycle Progress
            </h3>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between border-b border-border-color/30 pb-2">
                <span className="text-text-muted">Cycle Status</span>
                <span className="text-white font-bold font-mono">{cycle.status}</span>
              </div>
              <div className="flex justify-between border-b border-border-color/30 pb-2">
                <span className="text-text-muted">Users Reviewed</span>
                <span className="text-white font-bold font-mono">{cycle.users_reviewed}</span>
              </div>
              <div className="flex justify-between border-b border-border-color/30 pb-2">
                <span className="text-text-muted">Stale Roles Found</span>
                <span className="text-accent-amber font-bold font-mono">{cycle.stale_roles_found}</span>
              </div>
            </div>

            {cycle.status === "OPEN" && (
              <button
                onClick={handleCompleteReview}
                disabled={actioning}
                className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase font-mono mt-2"
              >
                Seal Access Review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
