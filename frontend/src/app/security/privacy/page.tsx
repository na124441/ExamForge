"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface AccessLog {
  id: string;
  actor_id: string;
  resource_type: string;
  resource_id: string;
  accessed_fields: string;
  accessed_at: string;
}

export default function PrivacyGuardPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Export validation form states
  const [mode, setMode] = useState("CANDIDATE_SAFE");
  const [rawJson, setRawJson] = useState(
    JSON.stringify(
      {
        resource_type: "Candidate",
        resource_id: "CAND-001",
        candidate_name: "John Doe",
        registration_number: "REG-1234-5678",
        evaluator_id: "EV-999"
      },
      null,
      2
    )
  );

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/privacy/pii-access-log`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load PII logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setValidating(true);

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(rawJson);
      } catch {
        throw new Error("Invalid JSON structure in payload editor.");
      }

      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/privacy/validate-export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          payload: parsedPayload,
          mode: mode
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Export blocked by Privacy Guard policies.");
      }

      setSuccess("✓ SUCCESS: " + data.message);
      fetchLogs(); // refresh log since it might have written access logging
    } catch (err: any) {
      setError(err.message || "Export validation failed.");
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2">⚙️</span>
        DECRYPTING PII AUDIT TRAILS...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* PII Access Audit Logs Column (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">PII Access Audit Ledger</h2>
          <p className="text-xs text-text-muted mt-1">Review all instances of personal identifiable data reads mapped by Controller and Eval actions.</p>
        </div>

        <div className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-sm max-h-[500px] overflow-y-auto">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Logs Feed</div>
          
          <div className="flex flex-col gap-3 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-center text-text-muted py-6">No PII access log entries registered.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-background/50 border border-border-color rounded-xl flex flex-col gap-1.5 leading-relaxed">
                  <div className="flex justify-between items-center text-[10px] text-text-muted">
                    <span>Actor: <span className="text-white font-bold">{log.actor_id}</span></span>
                    <span>{new Date(log.accessed_at).toLocaleString()}</span>
                  </div>
                  <div>
                    Accessed <span className="text-accent-emerald font-bold">{log.accessed_fields}</span> on resource <span className="text-white font-bold">{log.resource_type} ({log.resource_id})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Export Leakage Validation Tool */}
      <div className="flex flex-col gap-6">
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Leakage Validation Guard
          </h3>
          <p className="text-[11px] text-text-muted mb-4">Validate JSON payload structures against PII compliance rules before releasing data exports.</p>

          <form onSubmit={handleValidateExport} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Target Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none"
              >
                <option value="CANDIDATE_SAFE">CANDIDATE_SAFE (Hide Evaluators)</option>
                <option value="EVALUATOR_SAFE">EVALUATOR_SAFE (Hide Candidates)</option>
                <option value="PUBLIC_SAFE">PUBLIC_SAFE (Redact All)</option>
                <option value="LEGAL_EXPORT">LEGAL_EXPORT (Chains Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Payload JSON Editor</label>
              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={8}
                className="w-full p-3 bg-background border border-border-color rounded text-xs text-white font-mono focus:outline-none focus:border-accent-emerald leading-relaxed"
              />
            </div>

            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-[11px] leading-normal font-mono break-all">
                ⚠️ BLOCKED: {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-[11px] leading-normal">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={validating}
              className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase mt-2 font-mono"
            >
              {validating ? "Validating Payloads..." : "Run Export Guard check"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
