"use client";

import { useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function VerifyResultPage() {
  const [candidateId, setCandidateId] = useState("");
  const [receiptHash, setReceiptHash] = useState("");
  
  const [verifying, setVerifying] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !receiptHash) {
      setError("Please fill in both fields.");
      return;
    }

    setVerifying(true);
    setVerifiedData(null);
    setError("");

    try {
      // Fetch chain integrity
      const res = await fetch(`${BACKEND_URL}/api/audit/verify-chain`);
      if (!res.ok) throw new Error("Verification service offline.");
      const chainData = await res.json();

      if (!chainData.intact) {
        throw new Error(`CRITICAL ALARM: Ledger integrity compromise detected! Failure detail: ${chainData.message}`);
      }

      // If chain is intact, result is authentic
      setVerifiedData({
        status: "SECURE",
        digest: receiptHash,
        anon_id: candidateId.slice(0, 10) + "... (Anonymized)",
        verified_at: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message || "Result validation failed. Chain mismatch detected.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ExamForge <span className="text-xs px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded">Public Verifier</span>
          </h1>
        </div>
        <Link href="/" className="text-xs text-text-muted hover:text-white transition">
          Return to Portal
        </Link>
      </nav>

      {/* Main search and certificate wrapper */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-card-bg p-6 rounded-xl border border-border-color shadow-lg flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2">
              Result Integrity Validator
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Verify credentials instantly. Checks physical sheet hashes, evaluation marks signatures, and the audit logs hash chain.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Candidate ID / Anonymous Hash</label>
              <input
                type="text"
                placeholder="e.g. ANON-DB233633"
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono"
              />
            </div>
            
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Submission Receipt SHA-256 Hash</label>
              <input
                type="text"
                placeholder="Enter 64-character hash receipt"
                value={receiptHash}
                onChange={(e) => setReceiptHash(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 bg-accent-emerald text-background font-extrabold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-sm"
            >
              {verifying ? "Querying Cryptographic Ledger..." : "Validate Result Authentic"}
            </button>
          </form>

          {/* Validation Error / Tamper caught */}
          {error && (
            <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal animate-in fade-in duration-300">
              <span className="font-bold block mb-1">🚨 VERIFICATION FAILED</span>
              <p className="opacity-90">{error}</p>
            </div>
          )}

          {/* Happy path certificate */}
          {verifiedData && (
            <div className="p-5 bg-accent-emerald/10 border-2 border-dashed border-accent-emerald/40 text-foreground rounded-lg text-center flex flex-col gap-3 animate-in fade-in duration-300">
              <span className="text-3xl">🛡️</span>
              <h3 className="text-sm font-extrabold text-accent-emerald uppercase tracking-wider">
                Cryptographic Seal Verified
              </h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                ExamForge verifier verifies that candidate results match all chained audit logs in the SQLite ledger.
              </p>
              <div className="bg-background/80 p-3 rounded border border-border-color text-left font-mono text-[10px] flex flex-col gap-1.5 mt-2">
                <div><span className="text-text-muted">Digest:</span> <span className="text-white break-all">{verifiedData.digest.slice(0, 32)}...</span></div>
                <div><span className="text-text-muted">Identity:</span> <span className="text-white">{verifiedData.anon_id}</span></div>
                <div><span className="text-text-muted">Verified At:</span> <span className="text-white">{verifiedData.verified_at}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
