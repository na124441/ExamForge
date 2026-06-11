"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function RateLimitsDashboard() {
  const [rateLimits, setRateLimits] = useState<any[]>([]);
  const [abuseEvents, setAbuseEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSecurityEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { "Authorization": `Bearer ${token}` };

      // Fetch rate limits
      const rRes = await fetch(`${BACKEND_URL}/api/ops/rate-limits`, { headers });
      if (rRes.ok) {
        setRateLimits(await rRes.json());
      }

      // Fetch abuse alerts
      const aRes = await fetch(`${BACKEND_URL}/api/ops/abuse-alerts`, { headers });
      if (aRes.ok) {
        setAbuseEvents(await aRes.json());
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Rate limits & Abuse logs</h1>
          <p className="text-xs text-text-muted mt-0.5">Audit throttled requests and blacklisted IPs attempting brute force or site scraping.</p>
        </div>
        <button
          onClick={fetchSecurityEvents}
          className="px-3 py-1.5 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold"
        >
          🔄 Refresh Log
        </button>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Security Telemetry Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-text-muted animate-pulse">
          Opening security logs ledger...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Rate Limits Table */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Throttled Rate-Limit Events ({rateLimits.length})</h2>
            
            {rateLimits.length === 0 ? (
              <p className="text-xs text-text-muted">No rate limits breached recently.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {rateLimits.map((evt) => (
                  <div key={evt.id} className="bg-background/55 p-3.5 rounded border border-border-color/60 text-[11px] font-mono text-text-muted flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <strong className="text-accent-red text-xs">{evt.action}</strong>
                      <span className="text-[9px] text-white">IP: {evt.ip_address}</span>
                    </div>
                    <div>Fingerprint: <span className="text-white">{evt.fingerprint || "None"}</span></div>
                    <div>Actor ID: <span className="text-white">{evt.actor_id || "GUEST"}</span></div>
                    <div>Blocked Until: <span className="text-accent-red font-bold">{new Date(evt.blocked_until).toLocaleTimeString()}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Abuse Events Table */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Abuse & Intrusion Alerts ({abuseEvents.length})</h2>
            
            {abuseEvents.length === 0 ? (
              <p className="text-xs text-text-muted">No public abuse patterns logged.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {abuseEvents.map((evt) => (
                  <div key={evt.id} className="bg-background/55 p-3.5 rounded border border-border-color/60 text-[11px] font-mono text-text-muted flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <strong className="text-accent-red text-xs uppercase">{evt.abuse_type}</strong>
                      <span className="text-[9px] text-white">IP: {evt.ip_address}</span>
                    </div>
                    <p className="text-text-muted mt-1 leading-normal font-sans">{evt.description}</p>
                    <div className="text-[9px] text-text-muted border-t border-border-color/40 pt-1.5 mt-1">
                      Logged: {new Date(evt.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
