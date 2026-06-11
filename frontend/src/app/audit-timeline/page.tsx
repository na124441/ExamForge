"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";
const EXAM_ID = "EXM-001";

interface TimelineBlock {
  index: number;
  action: string;
  actor_id: string;
  actor_name: string;
  resource_type: string;
  resource_id: string;
  payload_hash: string;
  previous_hash: string;
  current_hash: string;
  signature_status: string;
  timestamp: string;
  explanation: string;
}

export default function AuditTimelinePage() {
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [chainValid, setChainValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchTimeline = async () => {
    try {
      const resTime = await fetch(`${BACKEND_URL}/api/audit/timeline-explain/${EXAM_ID}`);
      if (!resTime.ok) throw new Error("Failed to load explainable timeline");
      const timeData = await resTime.json();
      setTimeline(timeData.timeline || []);

      const resVerify = await fetch(`${BACKEND_URL}/api/audit/verify-chain`);
      if (resVerify.ok) {
        const verifyData = await resVerify.json();
        setChainValid(verifyData.intact);
      }
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load audit trails.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && timeline.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">RECONSTRUCTING LEDGER HASH TIMELINE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              ExamForge <span className="text-indigo-400 text-xs px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded font-mono">Explainable Audit Timeline</span>
            </h1>
            <p className="text-xs text-text-muted">Cryptographic chain-of-custody verifier and timeline examiner</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const role = localStorage.getItem("user_role");
              if (role === "CONTROLLER") router.push("/exam-ops");
              else if (role === "OFFICER" || role === "INVIGILATOR") router.push("/center-console");
              else router.push("/");
            }}
            className="text-xs px-3 py-1.5 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer font-bold"
          >
            ⬅️ Return
          </button>
        </div>
      </header>

      {/* Cockpit container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-xs font-mono">
            {error}
          </div>
        )}

        {/* Chain verification summary */}
        <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Audit ledger verification</h2>
            <p className="text-xs text-text-muted mt-1 leading-normal">
              Every operation links back deterministically to the preceding block. Chain integrity ensures no database backdoors can silently change scores.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-background/50 border border-border-color p-4 rounded-xl font-mono text-xs w-full md:w-auto">
            <div>
              <span className="text-[10px] text-text-muted uppercase">Chain status:</span>
              <div className={chainValid ? "text-accent-emerald font-bold uppercase mt-0.5" : "text-accent-red font-bold uppercase mt-0.5 animate-pulse"}>
                {chainValid ? "✓ LINKED & INTACT" : "🚨 HASH DISCREPANCY!"}
              </div>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full ${chainValid ? "bg-accent-emerald animate-pulse" : "bg-accent-red animate-ping"}`}></div>
          </div>
        </section>

        {/* Explainable Timeline List */}
        <section className="flex flex-col gap-6 relative pl-6 border-l border-border-color/85">
          {timeline.map((block) => (
            <div
              key={block.index}
              className={`bg-card-bg p-5 rounded-2xl border flex flex-col gap-4 relative animate-in slide-in-from-left-3 duration-250 ${
                block.signature_status === "TAMPERED" ? "border-accent-red/80 shadow-md shadow-accent-red/5 bg-accent-red/5" : "border-border-color hover:border-white/5"
              }`}
            >
              {/* Dot marker */}
              <span className={`absolute left-[-31px] top-[26px] w-4 h-4 rounded-full border-4 border-background flex items-center justify-center ${
                block.signature_status === "TAMPERED" ? "bg-accent-red animate-ping" : "bg-indigo-400"
              }`}></span>

              {/* Block header */}
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold uppercase text-[10px] px-2 py-0.5 bg-border-color rounded">Block #{block.index}</span>
                    <span className="text-white font-bold">{block.action}</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-1">
                    Actor: <span className="text-white font-semibold">{block.actor_name}</span> | Type: {block.resource_type} | ID: {block.resource_id.slice(0, 12)}...
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-text-muted">{new Date(block.timestamp).toLocaleTimeString()}</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${
                    block.signature_status === "TAMPERED" ? "bg-accent-red text-background" : "bg-accent-emerald/10 text-accent-emerald"
                  }`}>{block.signature_status}</span>
                </div>
              </div>

              {/* Explanation section */}
              <div className="text-xs leading-relaxed text-text-primary bg-background/40 p-3.5 border border-border-color/30 rounded-xl leading-normal">
                <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider font-mono mb-1">Why this matters</div>
                {block.explanation}
              </div>

              {/* Cryptographic hashes details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[9px] text-text-muted bg-background/60 p-3 rounded-lg border border-border-color/20 break-all leading-normal">
                <div>
                  <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider block">Payload Hash SHA-256</span>
                  <span className="text-white/80">{block.payload_hash}</span>
                </div>
                <div>
                  <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider block">Previous Block Hash</span>
                  <span className="text-white/80">{block.previous_hash}</span>
                </div>
                <div>
                  <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider block">Current Block Hash</span>
                  <span className="text-white/80">{block.current_hash}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
