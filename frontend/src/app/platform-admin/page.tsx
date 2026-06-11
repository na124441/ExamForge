"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function PlatformAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchInstitutions = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/institutions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not load institutions.");
      const data = await res.json();
      setInstitutions(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleStatusChange = async (id: string, action: "activate" | "suspend") => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/institutions/${id}/${action}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to ${action} institution.`);
      fetchInstitutions();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-5xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Platform Super Admin Console</h1>
              <p className="text-xs text-text-muted mt-0.5">Global SaaS tenant onboarding, activation, and compliance tracking.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/institutions/create" className="px-4 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider">
              Onboard Institution
            </Link>
            <Link href="/login" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
              Log Out
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>System Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Connecting to global SaaS ledger...
          </div>
        ) : institutions.length === 0 ? (
          <div className="bg-card-bg p-12 rounded-2xl border border-border-color text-center flex flex-col items-center gap-4">
            <span className="text-5xl opacity-40">🏢</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">No tenants onboarded</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              There are no institutions registered on this platform installation yet. Add one to start conducting secure examinations.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Active SaaS Tenants ({institutions.length})</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {institutions.map((inst) => (
                <div key={inst.id} className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-border-color/80 transition shadow-lg">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-base tracking-wide">{inst.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        inst.status === "ACTIVE" 
                          ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" 
                          : "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                      }`}>
                        {inst.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-1 text-[11px] text-text-muted font-mono">
                      <div><span className="text-text-muted">Slug:</span> <span className="text-white">{inst.tenant_slug}</span></div>
                      <div><span className="text-text-muted">Type:</span> <span className="text-white">{inst.institution_type}</span></div>
                      <div><span className="text-text-muted">Region:</span> <span className="text-white">{inst.data_region}</span></div>
                      <div><span className="text-text-muted">Mode:</span> <span className="text-white">{inst.deployment_mode}</span></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/institutions/${inst.id}`} className="px-3.5 py-2 bg-background border border-border-color text-white rounded text-xs hover:bg-card-bg transition font-semibold">
                      Manage Context
                    </Link>
                    {inst.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleStatusChange(inst.id, "suspend")}
                        className="px-3.5 py-2 bg-accent-red/10 border border-accent-red/20 hover:bg-accent-red/20 text-accent-red rounded text-xs transition font-semibold cursor-pointer"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(inst.id, "activate")}
                        className="px-3.5 py-2 bg-accent-emerald/10 border border-accent-emerald/20 hover:bg-accent-emerald/20 text-accent-emerald rounded text-xs transition font-semibold cursor-pointer"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
