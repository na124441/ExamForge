"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  History, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Lock
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

interface AuditEvent {
  id: number;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  payload_hash: string;
  previous_hash: string;
  current_hash: string;
  created_at: string;
}

export default function AuditorPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  
  // Ledger and verification state
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [chainIntact, setChainIntact] = useState(true);
  const [chainMessage, setChainMessage] = useState("");
  const [failingIndex, setFailingIndex] = useState(-1);

  // Tamper backdoor form
  const [tamperMode, setTamperMode] = useState("EVALUATION_MARKS");
  const [targetId, setTargetId] = useState("");
  const [newValue, setNewValue] = useState("");
  const [tamperResult, setTamperResult] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const name = localStorage.getItem("user_name");

    setToken(storedToken || "");
    setUserName(name || "System Auditor");
    refreshLedgerData();
  }, []);

  const refreshLedgerData = async () => {
    try {
      const logsRes = await fetch(`${BACKEND_URL}/api/audit/logs`);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data || []);
        if (data && data.length > 0 && !targetId) {
          setTargetId(data[data.length - 1].id.toString());
        }
      }

      const verifyRes = await fetch(`${BACKEND_URL}/api/audit/verify-chain`);
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        setChainIntact(data.intact);
        setChainMessage(data.message);
        setFailingIndex(data.failing_index);
      }
    } catch (err) {
      console.error("Failed to load audit trail", err);
    }
  };

  const handleSimulateTamper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !newValue) {
      alert("Please enter target ID and new tamper value.");
      return;
    }

    setTamperResult("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/EXM-001/simulate-tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: tamperMode,
          target_id: targetId,
          new_value: newValue
        })
      });

      if (!res.ok) throw new Error("Tamper backdoor execution failed");
      const data = await res.json();
      setTamperResult(data.modified_resource);
      alert("Backdoor database edit executed! Recalculating chain...");
      refreshLedgerData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 md:px-10 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>ExamForge Cryptographic Ledger Auditor</span>
              <span className="text-[10px] px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-bold">
                Zero-Trust
              </span>
            </h1>
            <span className="text-[11px] text-slate-500 block">
              Block-by-block Merkle integrity recalculation engine
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-semibold px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home Portal</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8">
        
        {/* Left Column: Log timeline */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Cryptographic Audit Ledger Trail
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Append-only SHA-256 hash-chained block records.
              </p>
            </div>
            <button
              onClick={refreshLedgerData}
              className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 active-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recalculate Ledger</span>
            </button>
          </div>

          {/* Timeline list */}
          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 flex flex-col gap-3.5 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-16">
                Ledger synchronized. Initializing blocks...
              </div>
            ) : (
              logs.map((log, idx) => {
                const isFailing = !chainIntact && idx >= failingIndex;
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border text-xs flex flex-col gap-2.5 transition duration-200 ${
                      isFailing
                        ? "border-red-300 bg-red-50 text-red-900 shadow-xs"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 uppercase tracking-wide px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                        {log.action}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-bold">
                        Block #{log.id}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                      <div>Resource: <strong className="text-slate-900">{log.resource_type} ({log.resource_id?.slice(0, 8)}...)</strong></div>
                      <div>Actor: <strong className="text-slate-900">{log.actor_id?.slice(0, 10)}...</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 font-mono text-[10px] flex flex-col gap-1 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Prev Hash:</span>
                        <span className="text-slate-700 truncate max-w-[200px]">{log.previous_hash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payload Hash:</span>
                        <span className="text-slate-700 truncate max-w-[200px]">{log.payload_hash}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1">
                        <span className="text-slate-500">Chained Hash:</span>
                        <span className={isFailing ? "text-red-700" : "text-emerald-700"}>{log.current_hash}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Status & Tamper Simulator */}
        <div className="flex flex-col gap-6">
          
          {/* Cryptographic Health Status */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3">
              Ledger Verification Verdict
            </h3>
            
            <div className={`p-5 rounded-2xl border text-center flex flex-col items-center gap-2.5 ${
              chainIntact
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <div className="p-3 bg-white rounded-2xl shadow-2xs">
                {chainIntact ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <ShieldAlert className="w-8 h-8 text-red-600" />}
              </div>
              <div className="text-xs font-extrabold uppercase tracking-wider">
                {chainIntact ? "Ledger Cryptographically Verified" : "Chain Integrity Tamper Detected"}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {chainMessage || "All SHA-256 hash chains validated against consensus root."}
              </p>
            </div>
          </section>

          {/* Tamper Simulator Panel */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-xs text-slate-900 uppercase font-extrabold tracking-wider">
                Tamper Attack Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Inject a malicious database edit to demonstrate automated instant cryptographic chain fracture detection.
            </p>

            <form onSubmit={handleSimulateTamper} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Target Model</label>
                <select
                  value={tamperMode}
                  onChange={(e) => setTamperMode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-red-500"
                >
                  <option value="EVALUATION_MARKS">Descriptive Marks (evaluations)</option>
                  <option value="ANSWER_EVENT">Candidate MCQ Answers (answer_events)</option>
                  <option value="AUDIT_LOG">Append-Only Timeline Logs (audit_logs)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Target Record ID</label>
                <input
                  type="text"
                  placeholder="Enter record ID (e.g. 1)"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Malicious Value</label>
                <input
                  type="text"
                  placeholder="e.g. 99.5 or 'USER_COMPROMISE'"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none font-mono text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition cursor-pointer text-xs shadow-xs active-press mt-1"
              >
                Inject Simulated Tamper Edit
              </button>
            </form>

            {tamperResult && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] font-mono leading-relaxed break-all">
                ⚠️ Modified in Database: {tamperResult}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
