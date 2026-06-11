"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function CreatePolicy() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState("90");
  const [doubleEval, setDoubleEval] = useState(false);
  const [dualRelease, setDualRelease] = useState(false);
  const [emergencyRelease, setEmergencyRelease] = useState(true);
  const [disputeWindow, setDisputeWindow] = useState("7");
  const [certRequired, setCertRequired] = useState(true);
  const [reportRequired, setReportRequired] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Please specify a policy name.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();

      const res = await fetch(`${BACKEND_URL}/api/policies/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_id: me.institution_id || "INS-GENESIS",
          name,
          trust_threshold: parseFloat(threshold),
          requires_double_evaluation: doubleEval,
          requires_dual_package_release: dualRelease,
          allow_emergency_release: emergencyRelease,
          dispute_window_days: parseInt(disputeWindow),
          certificate_required: certRequired,
          audit_report_required: reportRequired
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create policy.");
      }

      router.push("/policies");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-md w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Create Exam Policy</h1>
          <p className="text-xs text-text-muted mt-0.5 font-sans">Set publication gates, evaluations rules and dispute periods.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Policy Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-text-muted mb-1 font-semibold">Policy Name</label>
            <input
              type="text"
              placeholder="e.g. CBSE-Style Theory Exam Policy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Trust Score req (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Dispute window (Days)</label>
              <input
                type="number"
                value={disputeWindow}
                onChange={(e) => setDisputeWindow(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-background/30 p-4 rounded border border-border-color/60">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={doubleEval}
                onChange={(e) => setDoubleEval(e.target.checked)}
                className="rounded border-border-color text-accent-emerald focus:ring-accent-emerald"
              />
              <span>Require Double Evaluation for descriptive answers</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dualRelease}
                onChange={(e) => setDualRelease(e.target.checked)}
                className="rounded border-border-color text-accent-emerald focus:ring-accent-emerald"
              />
              <span>Require Dual Approval for center package release</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyRelease}
                onChange={(e) => setEmergencyRelease(e.target.checked)}
                className="rounded border-border-color text-accent-emerald focus:ring-accent-emerald"
              />
              <span>Allow Emergency Package Release</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition cursor-pointer text-xs uppercase tracking-wider mt-2"
          >
            {loading ? "Saving Policy..." : "Create Policy"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/policies" className="text-xs text-text-muted hover:text-white transition">
            ← Cancel and Return
          </Link>
        </div>
      </div>
    </div>
  );
}
