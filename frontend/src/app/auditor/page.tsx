"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");

    if (!storedToken || role !== "AUDITOR") {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setUserName(name || "Auditor");
    refreshLedgerData();
  }, []);

  const refreshLedgerData = async () => {
    try {
      // 1. Fetch Audit Logs
      const logsRes = await fetch(`${BACKEND_URL}/api/audit/logs`);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
        if (data.length > 0 && !targetId) {
          // Prefill target ID with latest log for ease of audit tampering demo
          setTargetId(data[data.length - 1].id.toString());
        }
      }

      // 2. Fetch Chain Verification status
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

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ExamForge <span className="text-accent-red text-sm px-2 py-0.5 bg-accent-red/10 border border-accent-red/20 rounded">Auditor</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted">Active: <span className="text-white">{userName}</span></span>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-border-color/80 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        
        {/* Left Column: Log timeline list */}
        <div className="lg:col-span-2 bg-card-bg p-6 rounded-xl border border-border-color shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-border-color/30 flex justify-between items-center">
            <span>📜 Cryptographic Audit Ledger Trail</span>
            <button
              onClick={refreshLedgerData}
              className="text-[10px] px-2.5 py-1 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer"
            >
              Sync Ledger
            </button>
          </h2>

          {/* Timeline container */}
          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 flex flex-col gap-4 mt-2">
            {logs.length === 0 ? (
              <div className="text-center text-xs text-text-muted py-8">
                Ledger is currently empty. Seed some database actions first.
              </div>
            ) : (
              logs.map((log, idx) => {
                const isFailing = !chainIntact && idx >= failingIndex;
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border text-xs flex flex-col gap-2 transition duration-300 ${
                      isFailing
                        ? "border-accent-red/40 bg-accent-red/5 text-accent-red shadow-lg shadow-accent-red/5"
                        : "border-border-color bg-background/50 hover:border-border-color/80 text-foreground"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white uppercase tracking-wide px-2 py-0.5 bg-white/5 rounded">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Index: <span className="font-mono text-white/70">{log.id}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted font-mono mt-1">
                      <div>Resource: <span className="text-white/80">{log.resource_type} ({log.resource_id.slice(0, 8)}...)</span></div>
                      <div>Actor: <span className="text-white/80">{log.actor_id.slice(0, 8)}...</span></div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border-color/20 font-mono text-[9px] flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Prev Event Hash:</span>
                        <span className="text-white/60 truncate max-w-[200px] md:max-w-xs">{log.previous_hash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Payload SHA-256:</span>
                        <span className="text-white/60 truncate max-w-[200px] md:max-w-xs">{log.payload_hash}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-text-muted">Chained Hash:</span>
                        <span className={isFailing ? "text-accent-red" : "text-accent-emerald"}>{log.current_hash}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Status & Backdoor control panel */}
        <div className="flex flex-col gap-6">
          
          {/* Cryptographic Health Status */}
          <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
            <h3 className="text-xs text-text-muted uppercase font-bold tracking-wider mb-3">Verification Health</h3>
            
            <div className={`p-4 rounded-lg border text-center flex flex-col gap-2 ${
              chainIntact
                ? "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald"
                : "bg-accent-red/10 border-accent-red/20 text-accent-red animate-pulse"
            }`}>
              <div className="text-2xl">{chainIntact ? "🛡️" : "🚨"}</div>
              <div className="text-xs font-extrabold uppercase tracking-widest">
                {chainIntact ? "Ledger Verified" : "Chain Integrity Void"}
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed font-mono mt-2 break-words text-left">
                {chainMessage || "Pending synchronization."}
              </p>
            </div>
          </section>

          {/* Tamper Simulation Backdoor panel */}
          <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
            <h3 className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2">Tamper Simulator</h3>
            <p className="text-[11px] text-text-muted mb-4 leading-normal">
              Direct SQL Backdoor helper to manipulate SQLite records. Select a target object below to break the hash links.
            </p>

            <form onSubmit={handleSimulateTamper} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-text-muted mb-1 font-semibold">SQL Targets Model</label>
                <select
                  value={tamperMode}
                  onChange={(e) => setTamperMode(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded focus:outline-none focus:border-accent-red"
                >
                  <option value="EVALUATION_MARKS">descriptive marks (evaluations)</option>
                  <option value="ANSWER_EVENT">candidate MCQ answers (answer_events)</option>
                  <option value="AUDIT_LOG">append-only ledger timeline logs (audit_logs)</option>
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-semibold">Target Record UUID / ID</label>
                <input
                  type="text"
                  placeholder="Enter target primary key ID"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded font-mono focus:border-accent-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-semibold">Malicious Value Injection</label>
                <input
                  type="text"
                  placeholder="e.g. 10.0, 'A', or 'USER_LOGIN'"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded focus:border-accent-red focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-accent-red text-white font-bold rounded hover:bg-accent-red/90 transition cursor-pointer text-xs"
              >
                Inject Malicious Edit
              </button>
            </form>

            {tamperResult && (
              <div className="mt-4 p-3 bg-accent-red/5 border border-accent-red/15 text-accent-red rounded text-[11px] font-mono leading-relaxed break-all">
                ⚠️ Modified in Database: {tamperResult}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
