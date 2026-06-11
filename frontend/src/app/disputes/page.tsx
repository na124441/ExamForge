"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function DisputesDashboard() {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${BACKEND_URL}/api/disputes/my`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Could not fetch filed disputes.");
        const data = await res.json();
        setDisputes(data);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">⚠️</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Disputes & Rechecks Portal</h1>
              <p className="text-xs text-text-muted mt-0.5">Track, update, and manage result verification complaints.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/disputes/file" className="px-4 py-2 bg-accent-amber text-background font-extrabold rounded text-xs hover:bg-accent-amber/90 transition uppercase tracking-wider">
              File New Dispute
            </Link>
            <Link href="/result-portal" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
              Return to Portal
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-xs text-text-muted animate-pulse">
            Connecting to verification authorities...
          </div>
        )}

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
            {error}
          </div>
        )}

        {!loading && disputes.length === 0 && (
          <div className="bg-card-bg p-12 rounded-2xl border border-border-color text-center flex flex-col items-center gap-4 shadow-lg">
            <span className="text-5xl opacity-40">📭</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">No disputes filed</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              You haven&apos;t filed any recheck disputes yet. If you believe there is an error in your published scores, you can file one.
            </p>
          </div>
        )}

        {disputes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disputes.map((d: any) => (
              <div key={d.id} className="bg-card-bg p-6 rounded-xl border border-border-color hover:border-accent-amber/40 transition flex flex-col gap-4 shadow-md justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-text-muted">{d.id}</span>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                      d.status === "CLOSED" ? "bg-background border border-border-color text-text-muted" :
                      d.status.startsWith("RESOLVED") ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" :
                      "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-sm tracking-wide mt-1">{d.dispute_type.replace(/_/g, " ")}</h3>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{d.description}</p>
                </div>

                <div className="flex justify-between items-center border-t border-border-color/60 pt-3 mt-2 text-[10px]">
                  <span className="text-text-muted">Exam: {d.exam_id}</span>
                  <Link href={`/disputes/${d.id}`} className="text-accent-amber hover:underline font-bold uppercase tracking-wider">
                    View Timeline →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
