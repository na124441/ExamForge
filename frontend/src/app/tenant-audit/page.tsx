"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function TenantAuditNamespace() {
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<any>(null);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<any[]>([]);

  const fetchNamespaceData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();
      const instId = me.institution_id || "INS-GENESIS";

      const res = await fetch(`${BACKEND_URL}/api/audit-namespaces/${instId}/verify`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not verify audit namespace.");
      const data = await res.json();
      setVerification(data);

      const evsRes = await fetch(`${BACKEND_URL}/api/audit-namespaces/${instId}/events`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (evsRes.ok) {
        const evsData = await evsRes.json();
        setEvents(evsData);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNamespaceData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⛓️</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Tenant Audit Namespace</h1>
              <p className="text-xs text-text-muted mt-0.5">Verify cryptographic backlink integrity logs for this institution.</p>
            </div>
          </div>
          <Link href="/platform-admin" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            Dashboard
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Verifying scoped log namespaces...
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Verification Banner */}
            {verification && (
              <div className={`p-6 rounded-xl border flex items-center gap-4 ${
                verification.is_valid
                  ? "bg-accent-emerald/5 border-accent-emerald/20 text-white"
                  : "bg-accent-red/5 border-accent-red/20 text-white"
              }`}>
                <span className="text-4xl">{verification.is_valid ? "🛡️" : "⚠️"}</span>
                <div>
                  <h4 className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Audit Chain Status</h4>
                  <p className={`text-base font-extrabold ${verification.is_valid ? "text-accent-emerald" : "text-accent-red"}`}>
                    {verification.is_valid ? "LEDGER CHAIN INTACT" : "COMPROMISED SEGMENT DETECTED"}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    {verification.is_valid
                      ? "All scoped chronological logs verify against institution ECDSA keys. Zero isolation violations."
                      : "Cross-tenant intrusion attempt or log tampering signature discovered."}
                  </p>
                </div>
              </div>
            )}

            {/* Events Timeline */}
            <div className="flex flex-col gap-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Audit Namespace Logs ({events.length})</h2>
              
              {events.length === 0 ? (
                <div className="bg-card-bg p-8 rounded-xl border border-border-color text-center text-xs text-text-muted">
                  No log entries recorded in this namespace namespace yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3 font-mono text-xs">
                  {events.map((e, idx) => (
                    <div key={idx} className="bg-card-bg p-4 rounded-xl border border-border-color hover:border-border-color/80 transition flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-start text-[10px] text-text-muted">
                        <span>Seq ID: #{e.id}</span>
                        <span>{e.created_at ? new Date(e.created_at).toLocaleString() : ""}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-white font-bold">{e.action.replace(/_/g, " ")}</span>
                        <span className="px-2 py-0.5 rounded-[3px] bg-background border border-border-color text-text-muted text-[9px]">{e.resource_type}</span>
                      </div>

                      <div className="pt-2 border-t border-border-color/60 text-[10px] text-text-muted break-all">
                        Log Hash: <span className="text-white font-mono">{e.log_hash}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
