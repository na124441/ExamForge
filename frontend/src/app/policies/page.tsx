"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function PoliciesDashboard() {
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchPolicies = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();

      const res = await fetch(`${BACKEND_URL}/api/policies/institution/${me.institution_id || "INS-GENESIS"}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch policies registry.");
      const data = await res.json();
      setPolicies(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleLock = async (id: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/policies/${id}/lock`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to lock policy.");
      fetchPolicies();
    } catch (err: any) {
      setError(err.message || "Lock action failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Institution policies Registry</h1>
              <p className="text-xs text-text-muted mt-0.5">Define locked security rules applied to examination publication gates.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/policies/create" className="px-4 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider">
              Create Policy
            </Link>
            <Link href="/platform-admin" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
              Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Policy Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Connecting to isolated policy registry...
          </div>
        ) : policies.length === 0 ? (
          <div className="bg-card-bg p-12 rounded-2xl border border-border-color text-center flex flex-col items-center gap-4">
            <span className="text-5xl opacity-40">🔒</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">No policies created</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              Your institution has not configured any exam policies yet. Create one to bound trust limits and rechecking rules.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((p) => (
              <div key={p.id} className="bg-card-bg p-6 rounded-xl border border-border-color hover:border-accent-emerald/40 transition flex flex-col gap-4 shadow-md justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-text-muted">{p.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === "LOCKED" 
                        ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" 
                        : "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-base tracking-wide mt-1">{p.name}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-[11px] text-text-muted font-mono bg-background/30 p-3 rounded border border-border-color/60">
                    <div>Trust score req: <span className="text-white font-bold">{p.trust_threshold}%</span></div>
                    <div>Double eval: <span className="text-white">{p.requires_double_evaluation ? "Yes" : "No"}</span></div>
                    <div>Dual release: <span className="text-white">{p.requires_dual_package_release ? "Yes" : "No"}</span></div>
                    <div>Dispute days: <span className="text-white">{p.dispute_window_days} Days</span></div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-border-color pt-3 mt-2">
                  {p.status === "DRAFT" && (
                    <button
                      onClick={() => handleLock(p.id)}
                      className="px-3 py-1.5 bg-accent-emerald text-background font-extrabold rounded text-[10px] hover:bg-accent-emerald/90 transition uppercase tracking-wider cursor-pointer"
                    >
                      🔒 Lock Policy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
