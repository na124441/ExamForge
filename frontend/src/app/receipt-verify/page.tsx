"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function ReceiptVerifyPage() {
  const router = useRouter();
  const [anonId, setAnonId] = useState("");
  const [examId, setExamId] = useState("EXM-001");
  const [timestamp, setTimestamp] = useState("");
  const [rootHash, setRootHash] = useState("");
  const [signature, setSignature] = useState("");
  
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonId || !timestamp || !rootHash || !signature) {
      setError("Please fill in all receipt validation fields.");
      return;
    }

    setVerifying(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/receipts/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: anonId.trim(),
          exam_id: examId.trim(),
          timestamp: timestamp.trim(),
          root_hash: rootHash.trim(),
          signature: signature.trim()
        })
      });

      if (!res.ok) throw new Error("Verification API error");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to establish connection with verification servers.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* Small Header */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <h1 className="text-sm font-bold text-white tracking-wide uppercase">
            ExamForge Result & Receipt Audit Gate
          </h1>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer"
        >
          Portal Home
        </button>
      </header>

      {/* Main verification form */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col md:flex-row gap-8 items-start justify-center mt-6">
        
        {/* Left Side: Receipt Paste Form */}
        <form
          onSubmit={handleVerify}
          className="w-full md:max-w-md bg-card-bg p-6 rounded-2xl border border-border-color shadow-xl flex flex-col gap-4"
        >
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Verifiable candidate receipt</h2>
            <p className="text-xs text-text-muted mt-1">Paste the cryptographic booklet cover stamp details to verify ledger recording.</p>
          </div>

          <div>
            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Anonymous candidate ID</label>
            <input
              type="text"
              value={anonId}
              onChange={(e) => setAnonId(e.target.value)}
              placeholder="e.g. ANON-DB233633"
              className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
            />
          </div>

          <div>
            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Exam ID</label>
            <input
              type="text"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
            />
          </div>

          <div>
            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Unix timestamp</label>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="e.g. 1780852594"
              className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
            />
          </div>

          <div>
            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Chained answer root hash</label>
            <input
              type="text"
              value={rootHash}
              onChange={(e) => setRootHash(e.target.value)}
              placeholder="SHA-256 Digest"
              className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
            />
          </div>

          <div>
            <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Server ECDSA signature hex</label>
            <textarea
              rows={3}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="ECDSA Hex string signature"
              className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono break-all leading-normal resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-xs"
          >
            {verifying ? "Verifying signature..." : "Verify Submission Receipt"}
          </button>
        </form>

        {/* Right Side: Verification Certificate display */}
        <div className="flex-1 w-full max-w-md">
          {result ? (
            <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-xl flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {result.is_valid ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald text-3xl mb-4 animate-bounce">
                    ✓
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Receipt verified</h3>
                  <div className="inline-block px-3 py-0.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald text-[9px] font-mono rounded mt-2 uppercase font-extrabold">
                    Signature Certified
                  </div>
                  <p className="text-xs text-text-muted mt-3 max-w-xs leading-relaxed">
                    The exam submission receipt is cryptographically valid. This session hash matches the root ledger state.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red text-3xl mb-4 animate-ping">
                    ❌
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Verification failed</h3>
                  <div className="inline-block px-3 py-0.5 bg-accent-red/10 border border-accent-red/30 text-accent-red text-[9px] font-mono rounded mt-2 uppercase font-extrabold">
                    Invalid Signature
                  </div>
                  <p className="text-xs text-text-muted mt-3 max-w-xs leading-relaxed">
                    The ECDSA signature is invalid. The parameters may have been modified or this receipt is forged.
                  </p>
                </>
              )}

              {/* Decrypted Payload details */}
              <div className="w-full mt-6 bg-background/50 rounded-xl p-4 border border-border-color/30 text-left flex flex-col gap-2.5 text-xs font-mono">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Payload manifestation</span>
                <div>
                  <span className="text-text-muted text-[10px]">Candidate Anonymous ID:</span>
                  <div className="text-white">{result.payload.anonymous_id}</div>
                </div>
                <div>
                  <span className="text-text-muted text-[10px]">Exam Session ID:</span>
                  <div className="text-white">{result.payload.exam_id}</div>
                </div>
                <div>
                  <span className="text-text-muted text-[10px]">Logged Unix Epoch:</span>
                  <div className="text-white">{result.payload.timestamp}</div>
                </div>
                <div>
                  <span className="text-text-muted text-[10px]">Root Chain Digest:</span>
                  <div className="text-white text-[10px] break-all leading-normal">{result.payload.root_hash}</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-card-bg/50 p-12 rounded-2xl border border-dashed border-border-color flex flex-col items-center justify-center text-center text-text-muted">
              <span className="text-4xl mb-3">🔬</span>
              <span className="text-xs font-mono">WAITING FOR RECEIPT INPUTS</span>
              <p className="text-[10px] text-text-muted/65 mt-2 max-w-xs leading-relaxed">
                Receipts can be generated on the student submission page or obtained from the Controller dashboard.
              </p>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
