"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface KeyDetail {
  id: string;
  institution_id: string;
  key_type: string;
  algorithm: string;
  public_key: string;
  status: string;
}

interface KeyLifecycleLog {
  id: string;
  key_id: string;
  event_type: string;
  old_state: string;
  new_state: string;
  actor_id: string;
  details: string;
  created_at: string;
}

export default function KeyLifecyclePage() {
  const [keys, setKeys] = useState<KeyDetail[]>([]);
  const [logs, setLogs] = useState<KeyLifecycleLog[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const userEmail = localStorage.getItem("user_email") || "controller@example.com";
      
      // Let's resolve the user's institution ID from /me or database
      const resMe = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!resMe.ok) return;
      const me = await resMe.json();
      const instId = me.institution_id || "INS-GENESIS";

      const resKeys = await fetch(`${BACKEND_URL}/api/keyspace/institution/${instId}/keys`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (resKeys.ok) {
        const data = await resKeys.json();
        setKeys(data);
        if (data.length > 0) {
          setSelectedKeyId(data[0].id);
          fetchKeyLogs(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load keyspace", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKeyLogs = async (keyId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/keys/${keyId}/lifecycle`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load key logs", err);
    }
  };

  const handleKeySelect = (keyId: string) => {
    setSelectedKeyId(keyId);
    fetchKeyLogs(keyId);
  };

  const handleRequestRotation = async () => {
    if (!selectedKeyId) return;
    setError("");
    setSuccess("");
    setActioning(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/keys/${selectedKeyId}/rotate/request`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Rotation request failed.");
      }

      setSuccess(`Rotation request successfully created! Approval ID: ${data.approval_request_id}`);
      fetchKeyLogs(selectedKeyId);
    } catch (err: any) {
      setError(err.message || "Key rotation error.");
    } finally {
      setActioning(false);
    }
  };

  const handleMarkCompromised = async () => {
    if (!selectedKeyId) return;
    if (!confirm("WARNING: Simulating a key compromise will report a P0 security incident and immediately lock result releases. Proceed?")) return;
    
    setError("");
    setSuccess("");
    setActioning(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/keys/${selectedKeyId}/mark-compromised`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Mark compromised failed.");
      }

      setSuccess(`CRITICAL ALERT: Key marked compromised. Incident Reported: ${data.incident_id}`);
      fetchKeys(); // refresh status
      fetchKeyLogs(selectedKeyId);
    } catch (err: any) {
      setError(err.message || "Failed to mark compromised.");
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2"></span>
        DECRYPTING KEYSPACE SNAPSHOTS...
      </div>
    );
  }

  const activeKey = keys.find((k) => k.id === selectedKeyId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Key List & Details (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Key Lifecycle Control</h2>
          <p className="text-xs text-text-muted mt-1">Review active, archived, and compromised cryptographic signing keys.</p>
        </div>

        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal font-mono">
             {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs leading-normal">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {keys.length === 0 ? (
            <div className="p-8 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs">
              No institution keys created yet.
            </div>
          ) : (
            keys.map((k) => {
              const isSelected = selectedKeyId === k.id;
              const isCompromised = k.status === "COMPROMISED";
              return (
                <div
                  key={k.id}
                  onClick={() => handleKeySelect(k.id)}
                  className={`p-5 rounded-2xl border bg-card-bg cursor-pointer shadow-sm transition ${
                    isSelected ? "border-accent-emerald/30 shadow-md" : "border-border-color hover:border-border-color/80"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isCompromised ? "bg-accent-red/10 text-accent-red border border-accent-red/25 animate-pulse" : k.status === "ACTIVE" ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/25" : "bg-text-muted/10 text-text-muted border border-border-color"
                        }`}>
                          {k.status}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{k.key_type}</span>
                      </div>
                      <h4 className="text-xs font-mono text-white mt-3 break-all">ID: {k.id}</h4>
                      <p className="text-[10px] text-text-muted mt-1 font-mono">Algorithm: {k.algorithm}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Key Logs */}
        {activeKey && (
          <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-mono">
              Key Lifecycle History Logs
            </h3>
            
            <div className="flex flex-col gap-3 font-mono text-[11px] max-h-[300px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center text-text-muted py-4">No lifecycle logs registered.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-background/50 border border-border-color rounded-xl flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[9px] text-text-muted">
                      <span>Event: <span className="text-white font-bold">{log.event_type}</span></span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      Transition: <span className="text-text-muted">{log.old_state}</span> → <span className="text-white font-bold">{log.new_state}</span>
                    </div>
                    {log.details && <div className="text-[10px] text-text-muted mt-1 bg-background/80 p-2 rounded border border-border-color/30 leading-normal">{log.details}</div>}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Lifecycle Actions */}
      <div className="flex flex-col gap-6">
        {activeKey && activeKey.status === "ACTIVE" && (
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald"></span> Key Actions
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Execute secure rotation requests or trigger simulated keyspace compromise mock events.
            </p>

            <button
              onClick={handleRequestRotation}
              disabled={actioning}
              className="w-full py-2.5 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase font-mono mt-2"
            >
              Request Key Rotation
            </button>

            <button
              onClick={handleMarkCompromised}
              disabled={actioning}
              className="w-full py-2.5 bg-accent-red/10 border border-accent-red/35 text-accent-red font-bold rounded hover:bg-accent-red/25 transition text-xs cursor-pointer uppercase font-mono"
            >
              Simulate Key Compromise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
