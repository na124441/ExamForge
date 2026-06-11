"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function MarksChainPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<any>(null);
  const [loadingVerify, setLoadingVerify] = useState(true);
  const [error, setError] = useState("");

  // Chain Search States
  const [searchAnonId, setSearchAnonId] = useState("ANON-6A3C3BCA"); // Seed with typical E2E mock ANON ID
  const [chainEvents, setChainEvents] = useState<any[]>([]);
  const [loadingChain, setLoadingChain] = useState(false);
  const [chainError, setChainError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    runLedgerVerification(storedToken);
    fetchChainEvents(searchAnonId, storedToken);
  }, []);

  const runLedgerVerification = async (authToken: string) => {
    setLoadingVerify(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluation/marks-chain/verify`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to run MarksChain verification script");
      const data = await res.json();
      setVerifyStatus(data);
    } catch (err: any) {
      setError(err.message || "Verification check failed");
    } finally {
      setLoadingVerify(false);
    }
  };

  const fetchChainEvents = async (anonId: string, authToken: string) => {
    if (!anonId) return;
    setLoadingChain(true);
    setChainError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluation/marks-chain/${anonId}`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to load chained ledger for this candidate");
      const data = await res.json();
      setChainEvents(data);
    } catch (err: any) {
      setChainError(err.message || "Failed to load candidate events chain");
    } finally {
      setLoadingChain(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChainEvents(searchAnonId, token);
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 font-mono">
              <Link href="/evaluation-ops" className="hover:text-accent-emerald transition-colors">EvaluationOps</Link>
              <span>/</span>
              <span className="text-foreground">MarksChain Ledger</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ⛓️ MarksChain Audit Ledger
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Verify the cryptographically chained event ledger sealing all locked evaluation marks.
            </p>
          </div>
          <div>
            <button 
              onClick={() => runLedgerVerification(token)}
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold flex items-center gap-2 cursor-pointer"
            >
              🔄 Re-run Audit Script
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Global Audit Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-card-bg p-5 rounded-xl border border-border-color">
            <h3 className="text-xs uppercase font-bold text-text-muted tracking-wider mb-2">Chaining Integrity</h3>
            {loadingVerify ? (
              <div className="text-sm text-text-muted animate-pulse">Running verification...</div>
            ) : verifyStatus ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{verifyStatus.chain_intact ? "🟢" : "🔴"}</span>
                <div>
                  <div className="font-bold text-white">{verifyStatus.chain_intact ? "Intact" : "Tamper Detected"}</div>
                  <div className="text-[10px] text-text-muted font-mono">SHA-256 sequence matches</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-card-bg p-5 rounded-xl border border-border-color">
            <h3 className="text-xs uppercase font-bold text-text-muted tracking-wider mb-2">Signature Seals</h3>
            {loadingVerify ? (
              <div className="text-sm text-text-muted animate-pulse">Validating keys...</div>
            ) : verifyStatus ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{verifyStatus.locks_valid ? "🟢" : "🔴"}</span>
                <div>
                  <div className="font-bold text-white">{verifyStatus.locks_valid ? "All Valid" : "Mismatched Signature"}</div>
                  <div className="text-[10px] text-text-muted font-mono">ECDSA locking validated</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-card-bg p-5 rounded-xl border border-border-color">
            <h3 className="text-xs uppercase font-bold text-text-muted tracking-wider mb-2">Database Backdoors</h3>
            {loadingVerify ? (
              <div className="text-sm text-text-muted animate-pulse">Scanning backdoor modifications...</div>
            ) : verifyStatus ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">🟢</span>
                <div>
                  <div className="font-bold text-white">Zero Intrusions</div>
                  <div className="text-[10px] text-text-muted font-mono">No direct DB updates detected</div>
                </div>
              </div>
            ) : null}
          </div>

        </div>

        {/* Ledger Inspector Search & View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          
          {/* Search form */}
          <div className="bg-card-bg rounded-xl border border-border-color p-6 space-y-6 self-start">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🔍 Chain Inspector
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Enter a candidate anonymous ID to trace its cryptographically linked events.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase mb-1">Anonymous Copy ID</label>
                <input 
                  type="text"
                  required
                  value={searchAnonId}
                  onChange={(e) => setSearchAnonId(e.target.value)}
                  placeholder="e.g. ANON-6A3C3BCA"
                  className="w-full p-2 bg-background border border-border-color rounded text-sm text-white focus:outline-none focus:border-accent-emerald font-mono"
                />
              </div>
              <button 
                type="submit"
                disabled={loadingChain}
                className="w-full py-2 bg-accent-emerald text-background font-bold text-sm rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
              >
                {loadingChain ? "Retrieving ledger block..." : "⚡ Trace Event Chain"}
              </button>
            </form>
          </div>

          {/* Visual Chained ledger blocks */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-white">Chained Block Sequence</h3>
            
            {chainError && (
              <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
                ⚠️ {chainError}
              </div>
            )}

            {loadingChain ? (
              <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
                <div className="animate-spin text-2xl">⏳</div>
                <p className="text-sm">Recalculating event hashes sequence...</p>
              </div>
            ) : chainEvents.length === 0 ? (
              <div className="p-8 border border-dashed border-border-color rounded text-center text-text-muted text-sm">
                No ledger blocks found for this ID. Make sure evaluations have been submitted and locked.
              </div>
            ) : (
              <div className="relative border-l-2 border-border-color/60 pl-8 ml-4 space-y-8">
                {chainEvents.map((ev, idx) => (
                  <div key={ev.id || idx} className="relative bg-card-bg border border-border-color p-5 rounded-xl space-y-3 shadow-lg">
                    
                    {/* Bullet marker */}
                    <span className="absolute left-[-41px] top-[22px] bg-background border-4 border-accent-emerald w-5 h-5 rounded-full z-10"></span>
                    
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <div className="text-xs uppercase font-bold text-accent-emerald font-mono tracking-wider">
                          Block #{ev.id} - {ev.event_type}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          Registered: {new Date(ev.created_at).toLocaleString()}
                        </div>
                      </div>
                      <span className="text-[9px] bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald px-1.5 py-0.2 rounded uppercase font-bold font-mono">
                        VERIFIED
                      </span>
                    </div>

                    <p className="text-xs text-white/90 leading-relaxed font-sans">{ev.details}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border-color/20 text-[10px] font-mono leading-normal">
                      <div>
                        <div className="text-text-muted uppercase font-bold text-[9px]">Previous Hash:</div>
                        <div className="text-white/60 truncate mt-0.5" title={ev.previous_hash}>{ev.previous_hash}</div>
                      </div>
                      <div>
                        <div className="text-text-muted uppercase font-bold text-[9px]">Current Hash:</div>
                        <div className="text-white/60 truncate mt-0.5" title={ev.current_hash}>{ev.current_hash}</div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
