"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function CentersDashboard() {
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchCenters = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();

      const res = await fetch(`${BACKEND_URL}/api/centers?institution_id=${me.institution_id || "INS-GENESIS"}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not retrieve centers registry.");
      const data = await res.json();
      setCenters(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const handleStatusChange = async (id: string, action: "approve" | "suspend") => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/centers/${id}/${action}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to change center status.`);
      fetchCenters();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📍</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Institution center registry</h1>
              <p className="text-xs text-text-muted mt-0.5">Manage persistent locations, capacities, and review risk metrics.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/centers/onboard" className="px-4 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider">
              Onboard Center
            </Link>
            <Link href="/platform-admin" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
              Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Center Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Connecting to centers registry...
          </div>
        ) : centers.length === 0 ? (
          <div className="bg-card-bg p-12 rounded-2xl border border-border-color text-center flex flex-col items-center gap-4">
            <span className="text-5xl opacity-40">📍</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">No centers onboarded</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              Your institution has not onboarded any exam centers yet. Add centers to start scheduling seating capacity assignments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centers.map((c) => (
              <div key={c.id} className="bg-card-bg p-6 rounded-xl border border-border-color hover:border-accent-emerald/40 transition flex flex-col gap-4 shadow-md justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-text-muted">{c.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === "APPROVED" 
                        ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" 
                        : "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-base tracking-wide mt-1">{c.name}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-[11px] text-text-muted font-mono bg-background/30 p-3 rounded border border-border-color/60">
                    <div>Capacity: <span className="text-white font-bold">{c.capacity} candidates</span></div>
                    <div>Rooms: <span className="text-white">{c.rooms}</span></div>
                    <div>Location: <span className="text-white">{c.city}, {c.state}</span></div>
                    <div>Security: <span className="text-white font-bold">{c.security_level}</span></div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border-color pt-3 mt-2 text-[10px]">
                  <Link href={`/centers/${c.id}`} className="text-accent-emerald hover:underline font-bold uppercase tracking-wider">
                    View Risk Profile →
                  </Link>
                  <div className="flex gap-2">
                    {c.status === "APPROVED" ? (
                      <button
                        onClick={() => handleStatusChange(c.id, "suspend")}
                        className="px-2.5 py-1 bg-accent-red/10 border border-accent-red/20 hover:bg-accent-red/20 text-accent-red rounded transition font-semibold cursor-pointer"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(c.id, "approve")}
                        className="px-2.5 py-1 bg-accent-emerald/10 border border-accent-emerald/20 hover:bg-accent-emerald/20 text-accent-emerald rounded transition font-semibold cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
