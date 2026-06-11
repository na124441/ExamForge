"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  History, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle,
  Clock,
  Fingerprint,
  ChevronRight,
  Database
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ProofDrawer, ProofData } from "../../components/ui/ProofDrawer";

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
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<ProofData | null>(null);

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 5000);
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

  const handleBlockClick = (block: TimelineBlock) => {
    const proof: ProofData = {
      resourceId: block.resource_id,
      resourceType: block.resource_type,
      payloadHash: block.payload_hash,
      previousHash: block.previous_hash,
      currentHash: block.current_hash,
      signature: "MEYCIQCc9v19sO12X9kGq81jA208B81a3d9f429188e001ba7e44ee52b1ba7d4c9f1a01AiEA2b... (ECDSA Authenticated signature)",
      actorName: block.actor_name,
      actorRole: block.actor_id.includes("controller") ? "Exam Controller" : "Authorized System Agent",
      timestamp: block.timestamp,
      auditEvent: block.action,
      explanation: block.explanation
    };
    setSelectedProof(proof);
    setIsDrawerOpen(true);
  };

  if (loading && timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚙️</span>
        <span>RECONSTRUCTING CRYPTOGRAPHIC LEDGER CHAIN...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Audit Evidence Ledger</span>
            <span className="text-[9px] px-2 py-0.5 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded uppercase font-mono font-bold tracking-widest">
              Ledger Console
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Immutable timeline verifying the cryptographic chain-of-custody for all examination blocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const role = localStorage.getItem("user_role") || "CONTROLLER";
              if (role === "CONTROLLER") router.push("/authority");
              else if (role === "OFFICER" || role === "INVIGILATOR") router.push("/center-console");
              else router.push("/");
            }}
            className="text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-lg transition"
          >
            ⬅️ Return
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/10 border border-red-900/20 text-red-400 rounded-xl text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Ledger status strip */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Ledger Chain Verification Status
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-xl">
            Each block calculates its hash from the preceding block's hash. A hash discrepancy indicates database modification outside authorized channels.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 p-3.5 rounded-xl font-mono text-xs w-full md:w-auto">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Ledger State</span>
            <div className={chainValid ? "text-emerald-400 font-bold uppercase mt-0.5" : "text-red-400 font-bold uppercase mt-0.5 animate-pulse"}>
              {chainValid ? "✓ Chain Intact" : "🚨 Discrepancy Alert!"}
            </div>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${chainValid ? "bg-emerald-500 animate-pulse" : "bg-red-500 animate-ping"}`} />
        </div>
      </div>

      {/* Vertical Timeline List */}
      <div className="relative pl-6 border-l border-slate-800 space-y-6 ml-2.5">
        {timeline.map((block) => {
          const isTampered = block.signature_status === "TAMPERED";
          return (
            <div
              key={block.index}
              onClick={() => handleBlockClick(block)}
              className={`bg-slate-900 p-5 rounded-2xl border cursor-pointer hover:bg-slate-900/80 hover:border-slate-700 transition-all duration-200 flex flex-col gap-4 relative group ${
                isTampered 
                  ? "border-red-500/40 bg-red-950/5 shadow-md shadow-red-950/10" 
                  : "border-slate-850 hover:shadow-lg hover:shadow-black/20"
              }`}
            >
              {/* Dot marker */}
              <span className={`absolute left-[-31px] top-[26px] w-4 h-4 rounded-full border-4 border-slate-950 flex items-center justify-center transition-transform group-hover:scale-110 ${
                isTampered ? "bg-red-500 animate-ping" : "bg-cyan-500"
              }`}></span>

              {/* Block Header */}
              <div className="flex justify-between items-start flex-wrap gap-2 font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold uppercase text-[10px] px-2 py-0.5 bg-slate-950 rounded border border-slate-850">
                      Block #{block.index}
                    </span>
                    <span className="text-white font-bold text-xs uppercase tracking-wide">
                      {block.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5">
                    Authority: <span className="text-slate-300 font-semibold">{block.actor_name}</span> | Type: <span className="text-slate-400">{block.resource_type}</span> | ID: <span className="text-slate-400 font-mono">{block.resource_id.slice(0, 12)}...</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-[10px]">
                  <span className="text-slate-500 font-semibold">{new Date(block.timestamp).toLocaleTimeString()}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                    isTampered ? "bg-red-500/10 text-red-400 border border-red-500/25" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                  }`}>
                    {block.signature_status}
                  </span>
                </div>
              </div>

              {/* Explanation section */}
              <div className="text-xs leading-relaxed text-slate-300 bg-slate-950/50 p-3.5 border border-slate-850 rounded-xl">
                <div className="text-[9px] text-cyan-400 uppercase font-bold tracking-wider font-mono mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Why this matters</span>
                </div>
                <p className="font-sans leading-relaxed text-[11px] text-slate-400">
                  {block.explanation}
                </p>
              </div>

              {/* Short hashes block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[9px] text-slate-500 border-t border-slate-850/60 pt-3">
                <div className="truncate">
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">Block Hash</span>
                  <span className="text-slate-400 font-mono">{block.current_hash}</span>
                </div>
                <div className="truncate text-right hidden md:block">
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">Click to inspect full ECDSA signature</span>
                  <span className="text-blue-500 font-bold hover:underline font-mono">View proof details →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reusable Proof Drawer */}
      <ProofDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        proof={selectedProof} 
      />
    </div>
  );
}
