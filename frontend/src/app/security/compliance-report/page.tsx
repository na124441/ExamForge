"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface ComplianceReport {
  id: string;
  readiness_score: number;
  verdict: string;
  hash_signature: string;
  created_by: string;
  created_at: string;
}

export default function ComplianceReportPage() {
  const [scoreData, setScoreData] = useState<{ readiness_score: number; status: string } | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // verification state
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/compliance/readiness-score`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setScoreData(data);
      }
    } catch (err) {
      console.error("Failed to load compliance score", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/compliance/report/generate`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate compliance report.");
      }

      setReport(data);
      setVerifyId(data.id);
      setSuccess("Compliance report generated and cryptographically signed successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifySignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyResult(null);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/compliance/report/${verifyId}/verify`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Report verification endpoint error.");
      }

      setVerifyResult(data);
    } catch (err: any) {
      setError(err.message || "Signature verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2">⚙️</span>
        DECRYPTING COMPLIANCE POSTURE TELEMETRY...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Score and Generation (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Compliance Reports & Audit Portal</h2>
          <p className="text-xs text-text-muted mt-1">Export cryptographically signed compliance reports signed with keyspace keys.</p>
        </div>

        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal font-mono">
            ⚠️ ERROR: {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs leading-normal">
            {success}
          </div>
        )}

        {/* Readiness overview */}
        {scoreData && (
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Audit Readiness Score</div>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">{scoreData.readiness_score}/100</div>
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                Aggregated posture assessment based on open incident count, threat mitigations, and hardening checklists status.
              </p>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-4 py-2 bg-accent-emerald text-background text-xs font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer uppercase shrink-0"
            >
              {generating ? "Signing report..." : "Generate Signed Audit Report"}
            </button>
          </div>
        )}

        {/* Generated Report output */}
        {report && (
          <section className="bg-card-bg p-6 rounded-2xl border border-accent-emerald/25 shadow-md font-mono text-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-accent-emerald uppercase tracking-wider font-sans">
              Cryptographically Signed Report
            </h3>
            
            <div className="grid grid-cols-2 gap-4 border-b border-border-color/30 pb-3">
              <div>
                <div className="text-[10px] text-text-muted">Report ID</div>
                <div className="text-white font-bold">{report.id}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-muted">Verdict</div>
                <div className="text-white font-bold">{report.verdict}</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-text-muted mb-1">ECDSA SHA-256 Digital Signature (Base64)</div>
              <div className="p-3 bg-background border border-border-color rounded text-[9px] text-text-muted break-all select-all leading-normal">
                {report.hash_signature}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Verification Tool Side Panel */}
      <div className="flex flex-col gap-6">
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Verify Report Authenticity
          </h3>
          <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
            Verify signature checksums against active or historical keyspace keys.
          </p>

          <form onSubmit={handleVerifySignature} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Report ID</label>
              <input
                type="text"
                required
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                placeholder="Enter report UUID"
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || !verifyId}
              className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase font-mono mt-2"
            >
              {verifying ? "Verifying..." : "Verify Audit Checksum"}
            </button>
          </form>

          {/* Verification result */}
          {verifyResult && (
            <div className={`mt-4 p-4 rounded-xl border font-mono text-[11px] leading-relaxed ${
              verifyResult.is_valid
                ? "border-accent-emerald/20 bg-accent-emerald/5 text-accent-emerald"
                : "border-accent-red/25 bg-accent-red/5 text-accent-red"
            }`}>
              <div className="font-bold text-xs uppercase tracking-wider mb-1">
                {verifyResult.is_valid ? "✓ SIGNATURE VALID" : "❌ SIGNATURE INVALID"}
              </div>
              <div className="text-white/80 mt-2">
                Report ID: {verifyResult.report_id}<br />
                Readiness: {verifyResult.readiness_score}%<br />
                Verdict: {verifyResult.verdict}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
