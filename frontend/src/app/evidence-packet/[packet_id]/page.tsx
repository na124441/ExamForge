"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function EvidencePacketView() {
  const { packet_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [packet, setPacket] = useState<any>(null);
  const [redactionLevel, setRedactionLevel] = useState("CANDIDATE_SAFE");
  const [error, setError] = useState("");
  
  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const fetchPacket = async (level: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/evidence/${packet_id}?redaction_level=${level}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Could not fetch evidence packet details. You may need to login.");
      }
      const data = await res.json();
      setPacket(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (packet_id) {
      fetchPacket(redactionLevel);
    }
  }, [packet_id, redactionLevel]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/evidence/${packet_id}/verify`);
      if (!res.ok) throw new Error("Verification failed.");
      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setError(err.message || "Integrity verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleExport = () => {
    if (!packet) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(packet, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `evidence_packet_${packet_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper component to render nested JSON trees visually
  const JsonTree = ({ data, level = 0 }: { data: any; level?: number }) => {
    if (typeof data !== "object" || data === null) {
      if (typeof data === "string" && data.startsWith("[REDACTED")) {
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-amber/10 border border-accent-amber/30 text-accent-amber inline-flex items-center gap-1 font-mono">
            🔒 {data}
          </span>
        );
      }
      return <span className="text-white font-mono">{JSON.stringify(data)}</span>;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-text-muted">[]</span>;
      return (
        <div className="pl-4 border-l border-border-color flex flex-col gap-2 mt-1">
          {data.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-text-muted text-[10px] font-mono">[{idx}]</span>
              <div className="flex-1 bg-background/30 p-2 rounded border border-border-color/40">
                <JsonTree data={item} level={level + 1} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="pl-4 border-l border-border-color flex flex-col gap-2 mt-1">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex flex-col md:flex-row md:items-start gap-1">
            <span className="text-accent-emerald font-bold font-mono text-[11px] min-w-[150px]">{key}:</span>
            <div className="flex-1">
              <JsonTree data={val} level={level + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-color pb-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗃️</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Secure Evidence Packet</h1>
              <p className="text-xs text-text-muted mt-0.5 font-mono">ID: {packet_id}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={!packet}
              className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold disabled:opacity-50 cursor-pointer"
            >
              📥 Export JSON
            </button>
            <Link href="/disputes" className="px-4 py-2 bg-background border border-border-color text-text-muted rounded text-xs hover:text-white transition font-semibold flex items-center">
              ← Return
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Access Error:</strong> {error}
          </div>
        )}

        {/* Configuration Bar */}
        <div className="bg-card-bg p-4 rounded-xl border border-border-color flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-text-muted font-semibold">Redaction Level:</span>
            <select
              value={redactionLevel}
              onChange={(e) => setRedactionLevel(e.target.value)}
              className="p-2 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white font-mono"
            >
              <option value="CANDIDATE_SAFE">CANDIDATE_SAFE (Redacts Evaluators)</option>
              <option value="PUBLIC_SAFE">PUBLIC_SAFE (Redacts Sections)</option>
              <option value="FULL_INTERNAL">FULL_INTERNAL (Unredacted)</option>
            </select>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 bg-accent-emerald text-background font-extrabold rounded hover:bg-accent-emerald/90 transition uppercase tracking-wider text-[10px] cursor-pointer"
          >
            {verifying ? "Computing Hash Verification..." : "🛡️ Verify Packet Integrity"}
          </button>
        </div>

        {/* Verification Result Dialog */}
        {verifyResult && (
          <div className={`p-5 rounded-xl border flex flex-col gap-3 text-xs animate-in fade-in duration-300 ${
            verifyResult.hash_valid
              ? "bg-accent-emerald/5 border-accent-emerald/20 text-foreground"
              : "bg-accent-red/5 border-accent-red/20 text-foreground"
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{verifyResult.hash_valid ? "✅" : "❌"}</span>
              <h3 className={`font-bold text-sm uppercase tracking-wider ${verifyResult.hash_valid ? "text-accent-emerald" : "text-accent-red"}`}>
                {verifyResult.hash_valid ? "Cryptographic Verification Succeeded" : "Hash Integrity Verification Failed"}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-background/50 p-4 rounded border border-border-color font-mono text-[10px]">
              <div>
                <span className="text-text-muted block">Stored Hash:</span>
                <span className="text-white break-all">{verifyResult.stored_hash}</span>
              </div>
              <div>
                <span className="text-text-muted block">Recalculated Hash:</span>
                <span className="text-white break-all">{verifyResult.recalculated_hash}</span>
              </div>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              {verifyResult.hash_valid 
                ? "The evidence packet's integrity is mathematically confirmed. The contents match the signed audit log entries recorded at the time of compilation."
                : "Warning: The evidence packet contents do not match the stored hash signature. One or more records may have been tampered with or modified."}
            </p>
          </div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Retrieving signed evidence layers from decentralized ledger...
          </div>
        ) : packet ? (
          <div className="flex flex-col gap-6">
            {/* Packet Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card-bg p-6 rounded-xl border border-border-color text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-text-muted uppercase font-bold text-[9px] tracking-widest">Packet Hash</span>
                <span className="text-white font-mono break-all">{packet.packet_hash}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-text-muted uppercase font-bold text-[9px] tracking-widest">Authority Signature</span>
                <span className="text-white font-mono break-all">{packet.signature}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-text-muted uppercase font-bold text-[9px] tracking-widest">Generated At</span>
                <span className="text-white font-mono">{packet.generated_at ? new Date(packet.generated_at).toLocaleString() : "N/A"}</span>
              </div>
            </div>

            {/* Sections Display */}
            <div className="flex flex-col gap-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Evidence Sections</h2>

              {Object.keys(packet.sections || {}).length === 0 ? (
                <div className="bg-card-bg p-8 rounded-xl border border-border-color text-center text-xs text-text-muted">
                  No sections content returned under current redaction level (PUBLIC_SAFE). Only metadata hash is public.
                </div>
              ) : (
                Object.entries(packet.sections).map(([secName, secVal]: any) => (
                  <div key={secName} className="bg-card-bg rounded-xl border border-border-color overflow-hidden shadow-lg">
                    <div className="bg-background/80 border-b border-border-color px-4 py-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">{secName.replace(/_/g, " ")}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald">SECURED</span>
                    </div>
                    <div className="p-5 text-xs">
                      <JsonTree data={secVal} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
