"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface HardeningCheck {
  id: string;
  check_type: string;
  status: string;
  details: string;
}

export default function SecurityHardeningPage() {
  const [checks, setChecks] = useState<HardeningCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchChecks();
  }, []);

  const fetchChecks = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/security/hardening/status`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setChecks(data);
      }
    } catch (err) {
      console.error("Failed to load hardening status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunChecks = async () => {
    setRunning(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/security/hardening/run-check`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setChecks(data);
      }
    } catch (err) {
      console.error("Failed to run checks", err);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2">⚙️</span>
        DECRYPTING OWASP COMPLIANCE METRICS...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hardening Checklist (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">OWASP API Hardening Controls</h2>
            <p className="text-xs text-text-muted mt-1">Review configurations of secure headers, upload validation layers, and SQL injection mitigations.</p>
          </div>
          
          <button
            onClick={handleRunChecks}
            disabled={running}
            className="px-3 py-2 bg-accent-emerald text-background text-xs font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer uppercase shrink-0"
          >
            {running ? "Running audit..." : "Trigger Hardening Sweep"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {checks.length === 0 ? (
            <div className="p-8 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs">
              No hardening check records found. Click "Trigger Hardening Sweep" to scan the environment.
            </div>
          ) : (
            checks.map((c) => {
              const isPassed = c.status === "PASSED";
              return (
                <div key={c.id} className={`p-4 rounded-xl border bg-card-bg flex gap-3.5 items-start justify-between ${
                  isPassed ? "border-accent-emerald/20" : "border-accent-red/25"
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isPassed ? "bg-accent-emerald" : "bg-accent-red"}`}></span>
                      <h4 className="text-xs font-bold text-white font-mono">{c.check_type}</h4>
                    </div>
                    <p className="text-xs text-text-muted mt-2 leading-relaxed">{c.details}</p>
                  </div>
                  
                  <span className={`text-xs font-bold font-mono ${isPassed ? "text-accent-emerald" : "text-accent-red"}`}>
                    {isPassed ? "✓ PASSED" : "❌ FAILED"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Static Info Cards */}
      <div className="flex flex-col gap-6">
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Enforced HTTP Headers
          </h3>
          <p className="text-[11px] text-text-muted mb-4 leading-normal">
            The platform injects secure headers to defend against clickjacking, CSS injection, content sniffing, and MIME exploits.
          </p>

          <div className="flex flex-col gap-2 font-mono text-[10px]">
            <div className="p-2 bg-background border border-border-color rounded">
              <div className="text-text-muted">Content-Security-Policy</div>
              <div className="text-white mt-0.5 break-all">default-src &apos;self&apos;; script-src &apos;self&apos;...</div>
            </div>
            <div className="p-2 bg-background border border-border-color rounded">
              <div className="text-text-muted">X-Frame-Options</div>
              <div className="text-white mt-0.5">DENY</div>
            </div>
            <div className="p-2 bg-background border border-border-color rounded">
              <div className="text-text-muted">X-Content-Type-Options</div>
              <div className="text-white mt-0.5">nosniff</div>
            </div>
            <div className="p-2 bg-background border border-border-color rounded">
              <div className="text-text-muted">Strict-Transport-Security</div>
              <div className="text-white mt-0.5">max-age=63072000; includeSubDomains</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
