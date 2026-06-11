"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function BackupsDashboard() {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [dryRunDetails, setDryRunDetails] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/backup`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not retrieve backup logs.");
      const data = await res.json();
      setBackups(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setError("");
    setSuccess("");
    setDryRunDetails(null);
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/backup/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to compile system backup.");
      const data = await res.json();
      setSuccess(`Backup manifest ${data.id} generated successfully.`);
      fetchBackups();
    } catch (err: any) {
      setError(err.message || "Backup compilation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyBackup = async (backupId: string) => {
    setError("");
    setSuccess("");
    setDryRunDetails(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/backup/${backupId}/verify`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to verify backup manifest.");
      const data = await res.json();
      if (data.is_valid) {
        setSuccess(`Backup manifest ${backupId} signature verified intact! Checksums match.`);
      } else {
        setError(`Backup manifest checksum mismatch. Manifest is invalid!`);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    }
  };

  const handleDryRunRestore = async (backupId: string) => {
    setError("");
    setSuccess("");
    setDryRunDetails(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/restore/dry-run`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ backup_id: backupId })
      });
      if (!res.ok) throw new Error("Failed to initiate restore dry-run.");
      const data = await res.json();
      if (data.status === "PASSED") {
        setSuccess("Restore dry-run passed! Checksums and audit namespaces verified consistent.");
      } else {
        setError("Restore dry-run validation failed!");
      }
      setDryRunDetails(data.details);
    } catch (err: any) {
      setError(err.message || "Dry-run failed.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Backup & Restore registry</h1>
          <p className="text-xs text-text-muted mt-0.5">Generate immutable ledger snapshots and verify structural consistency via restore simulations.</p>
        </div>
        
        <button
          disabled={actionLoading}
          onClick={handleCreateBackup}
          className="px-4 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider disabled:opacity-50 cursor-pointer"
        >
          🔐 Create Backup
        </button>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Backup Alert:</strong> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs">
          <strong>Operational Verdict:</strong> {success}
        </div>
      )}
      {dryRunDetails && (
        <div className="p-4 bg-card-bg border border-border-color rounded text-xs font-mono text-white">
          <span className="text-[10px] text-text-muted font-sans font-bold uppercase tracking-wider block mb-1">Dry-Run Logs:</span>
          {dryRunDetails}
        </div>
      )}

      {/* Backups List */}
      {loading ? (
        <div className="text-center py-20 text-xs text-text-muted animate-pulse">
          Retrieving backup manifests catalogue...
        </div>
      ) : backups.length === 0 ? (
        <div className="bg-card-bg p-12 rounded-xl border border-border-color text-center flex flex-col items-center gap-4">
          <span className="text-4xl opacity-40">💾</span>
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">No manifests registered</h3>
          <p className="text-xs text-text-muted leading-relaxed max-w-sm">
            This institution has not registered any database or storage backups yet. Click "Create Backup" above to generate one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {backups.map((bk) => (
            <div
              key={bk.id}
              className="bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-emerald/30 transition flex flex-col gap-3 shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-text-muted">{bk.id}</span>
                  <strong className="text-xs text-white uppercase tracking-wider">{bk.backup_type} SNAPSHOT</strong>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
                  bk.status === "COMPLETED"
                    ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                    : "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                }`}>
                  {bk.status}
                </span>
              </div>

              {/* Hash metadata */}
              <div className="bg-background/80 p-3 rounded border border-border-color/60 text-[10px] font-mono text-text-muted flex flex-col gap-1.5">
                <div className="flex justify-between gap-4">
                  <span>DB Snapshot Hash:</span>
                  <span className="text-white break-all text-right">{bk.db_snapshot_hash}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Storage Manifest Hash:</span>
                  <span className="text-white break-all text-right">{bk.object_manifest_hash}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Audit Namespace Head:</span>
                  <span className="text-white break-all text-right">{bk.audit_head_hash}</span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex justify-between items-center border-t border-border-color/60 pt-3 mt-1 text-[10px]">
                <span className="text-text-muted">Generated: {new Date(bk.created_at).toLocaleString()}</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyBackup(bk.id)}
                    className="px-2.5 py-1 bg-background hover:bg-border-color rounded transition border border-border-color/60 font-semibold cursor-pointer"
                  >
                    Verify Checksums
                  </button>
                  <button
                    onClick={() => handleDryRunRestore(bk.id)}
                    className="px-2.5 py-1 bg-accent-amber/20 border border-accent-amber/35 hover:bg-accent-amber/30 text-accent-amber font-extrabold rounded transition uppercase tracking-wider cursor-pointer"
                  >
                    Dry-Run Restore
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
