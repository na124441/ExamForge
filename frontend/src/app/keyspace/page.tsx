"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

interface InstitutionKey {
  id: string;
  institution_id: string;
  key_type: string;
  algorithm: string;
  public_key: string;
  status: string;
  created_at: string;
}

export default function KeyspaceDashboard() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<InstitutionKey[]>([]);
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newKeyType, setNewKeyType] = useState("CERTIFICATE_SIGNING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const meData = await meRes.json();
      setMe(meData);

      const instId = meData.institution_id || "INS-GENESIS";
      const res = await fetch(`${BACKEND_URL}/api/keyspace/institution/${instId}/keys`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch keyspace registry.");
      const data = await res.json();
      setKeys(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleInitialize = async () => {
    if (!me) return;
    setError("");
    setSuccess("");
    const instId = me.institution_id || "INS-GENESIS";
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/keyspace/institution/${instId}/initialize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key_type: newKeyType })
      });
      if (!res.ok) throw new Error("Failed to initialize key.");
      setSuccess(`Successfully initialized key of type ${newKeyType}.`);
      fetchKeys();
    } catch (err: any) {
      setError(err.message || "Initialization failed.");
    }
  };

  const handleRotate = async (keyId: string) => {
    setError("");
    setSuccess("");
    setActionLoading(keyId);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/keyspace/keys/${keyId}/rotate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to rotate key.");
      setSuccess("Key successfully rotated. A new active key has been generated.");
      fetchKeys();
    } catch (err: any) {
      setError(err.message || "Rotation failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this key? This operation is irreversible and will penalize the Trust Score if active assets were signed by it.")) {
      return;
    }
    setError("");
    setSuccess("");
    setActionLoading(keyId);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/keyspace/keys/${keyId}/revoke`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to revoke key.");
      setSuccess("Key successfully revoked.");
      fetchKeys();
    } catch (err: any) {
      setError(err.message || "Revocation failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Public key copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-5xl w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔑</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Keyspace Cryptographic Console</h1>
              <p className="text-xs text-text-muted mt-0.5">Manage per-institution cryptographic keyrings, ECDSA rotators, and revocation chains.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/platform-admin" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Tenant Banner */}
        {me && (
          <div className="bg-card-bg/50 px-4 py-3 rounded-lg border border-border-color/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-text-muted">Bound Institution: </span>
              <strong className="text-accent-emerald uppercase tracking-wider">{me.institution_id || "INS-GENESIS"}</strong>
            </div>
            <div>
              <span className="text-text-muted">Security Role: </span>
              <strong className="text-white font-mono">{me.role}</strong>
            </div>
          </div>
        )}

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Cryptographic Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs leading-normal">
            <strong>Action Confirmed:</strong> {success}
          </div>
        )}

        {/* Console layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Initialize Card */}
            <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Initialize Key Type</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Generate a new cryptographic keyring. If an active key of the chosen type already exists, initialization will return the existing active key.
              </p>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Key Purpose</label>
                <select
                  value={newKeyType}
                  onChange={(e) => setNewKeyType(e.target.value)}
                  className="bg-background border border-border-color rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-emerald"
                >
                  <option value="CERTIFICATE_SIGNING">CERTIFICATE_SIGNING (Result Certs)</option>
                  <option value="RECEIPT_SIGNING">RECEIPT_SIGNING (Exam Day Receipts)</option>
                  <option value="AUDIT_SIGNING">AUDIT_SIGNING (Chain Log Seals)</option>
                  <option value="PACKAGE_SIGNING">PACKAGE_SIGNING (Encrypted Papers)</option>
                </select>
              </div>

              <button
                onClick={handleInitialize}
                className="w-full mt-2 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider cursor-pointer"
              >
                🔐 Generate Keyring
              </button>
            </div>

            {/* Educational Info Card */}
            <div className="bg-card-bg/40 p-6 rounded-xl border border-border-color/60 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rotation Guidelines</h3>
              <ul className="text-[11px] text-text-muted list-disc pl-4 space-y-2 leading-relaxed">
                <li>Key rotations automatically create a new <code className="text-white">ACTIVE</code> key and demote the current key to <code className="text-white">ROTATED</code>.</li>
                <li>Verify that all current audit events are compiled before revoking obsolete keys.</li>
                <li>Revoking keys causes an immediate penalty to trust score metrics if older signed certs are inspected.</li>
              </ul>
            </div>

          </div>

          {/* Keys Registry Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider px-1">Keyspace Registry</h2>

            {loading ? (
              <div className="text-center py-20 text-xs text-text-muted animate-pulse">
                Fetching active cryptographic keychains...
              </div>
            ) : keys.length === 0 ? (
              <div className="bg-card-bg p-12 rounded-xl border border-border-color text-center flex flex-col items-center gap-4">
                <span className="text-4xl opacity-40">🗝️</span>
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Empty Keyspace</h3>
                <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                  This institution has not initialized any cryptographic keyspace yet. Generate a Certificate or Receipt signing key to begin.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-emerald/30 transition flex flex-col gap-3 shadow-md"
                  >
                    {/* Key Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-text-muted">{k.id}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-white tracking-wide">{k.key_type}</span>
                          <span className="text-[9px] bg-background border border-border-color px-2 py-0.5 rounded text-text-muted font-mono">{k.algorithm}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
                        k.status === "ACTIVE"
                          ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                          : k.status === "ROTATED"
                          ? "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
                          : "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                      }`}>
                        {k.status}
                      </span>
                    </div>

                    {/* Public Key Display */}
                    <div className="bg-background/80 p-3 rounded border border-border-color font-mono text-[10px] text-text-muted flex flex-col gap-2 relative">
                      <div className="flex justify-between items-center text-[9px] border-b border-border-color/40 pb-1.5 mb-1 text-white">
                        <span>Public Component</span>
                        <button
                          onClick={() => copyToClipboard(k.public_key)}
                          className="px-2 py-0.5 bg-card-bg hover:bg-border-color rounded transition border border-border-color/60 text-[9px]"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all leading-normal text-white/80">{k.public_key}</pre>
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex justify-between items-center border-t border-border-color/60 pt-3 mt-1">
                      <span className="text-[10px] text-text-muted">
                        Created: {new Date(k.created_at).toLocaleString()}
                      </span>

                      <div className="flex gap-2">
                        {k.status !== "REVOKED" && (
                          <>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleRotate(k.id)}
                              className="px-2.5 py-1 bg-accent-amber hover:bg-accent-amber/90 text-background font-extrabold rounded text-[9px] uppercase tracking-wider disabled:opacity-50 transition cursor-pointer"
                            >
                              Rotate
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleRevoke(k.id)}
                              className="px-2.5 py-1 bg-accent-red/20 border border-accent-red/35 hover:bg-accent-red/30 text-accent-red font-bold rounded text-[9px] uppercase tracking-wider disabled:opacity-50 transition cursor-pointer"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
