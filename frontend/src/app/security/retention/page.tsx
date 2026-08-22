"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface DeletionPlanItem {
  exam_id: string;
  policy_type: string;
  duration_days: number;
  status: string; // HOLD, ELIGIBLE_FOR_PURGE
  reason: string | null;
}

export default function RetentionPage() {
  const [plan, setPlan] = useState<DeletionPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hold states
  const [holdTargetId, setHoldTargetId] = useState("");
  const [holdReason, setHoldReason] = useState("");

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/retention/deletion-plan`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (err) {
      console.error("Failed to load deletion plan", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/retention/legal-hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: "EXAM",
          target_id: holdTargetId,
          reason: holdReason
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to apply legal hold.");
      }

      setSuccess("Legal hold applied successfully!");
      setHoldTargetId("");
      setHoldReason("");
      fetchPlan();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunDry = async (examId: string) => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/retention/run-dry?exam_id=${examId}`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Deletion dry run failed.");
      }

      setSuccess(` SUCCESS: Dry-run passed. Affected records count: ${data.affected_records}. details: ${data.details}`);
      fetchPlan();
    } catch (err: any) {
      setError(err.message || "Deletion dry run failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2"></span>
        DECRYPTING RETENTION & HOLD POLICIES...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Deletion Plan & Policies (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Data Retention Policies</h2>
          <p className="text-xs text-text-muted mt-1">Audit active rules and run dry-run sweeps to preview purge processes.</p>
        </div>

        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal font-mono">
             BLOCKED: {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs leading-normal">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {plan.length === 0 ? (
            <div className="p-8 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs">
              No retention policies active.
            </div>
          ) : (
            plan.map((item) => {
              const hasHold = item.status === "HOLD";
              return (
                <div key={item.exam_id} className={`p-5 rounded-2xl border bg-card-bg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  hasHold ? "border-accent-amber/25" : "border-border-color"
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        hasHold ? "bg-accent-amber/10 text-accent-amber border border-accent-amber/25 animate-pulse" : "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/25"
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">{item.policy_type} ({item.duration_days} days)</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">Exam: {item.exam_id}</h4>
                    {item.reason && <p className="text-xs text-text-muted mt-1">Block Reason: {item.reason}</p>}
                  </div>

                  <button
                    disabled={submitting}
                    onClick={() => handleRunDry(item.exam_id)}
                    className="px-3 py-1.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald text-xs font-bold rounded hover:bg-accent-emerald/20 transition cursor-pointer"
                  >
                    Run Purge Dry-Run
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Apply Legal Hold Form */}
      <div className="flex flex-col gap-6">
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-amber animate-pulse"></span> Apply Legal Hold
          </h3>
          <p className="text-[11px] text-text-muted mb-4">
            litigation blocks prevent database purges, dry-run deletes, and compliance exports of specified exam identifiers.
          </p>

          <form onSubmit={handleApplyHold} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Target Exam ID</label>
              <input
                type="text"
                required
                value={holdTargetId}
                onChange={(e) => setHoldTargetId(e.target.value)}
                placeholder="e.g. EXM-201"
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Hold Description/Reason</label>
              <textarea
                required
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Details about litigation hold..."
                rows={3}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition text-xs cursor-pointer uppercase mt-2 font-mono"
            >
              {submitting ? "Applying Hold..." : "Apply Legal Hold Block"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
