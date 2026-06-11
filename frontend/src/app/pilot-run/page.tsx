"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Terminal, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  CheckCircle,
  Database,
  Cpu,
  Fingerprint,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";

interface StageEvent {
  id: string;
  pilot_stage_id: string;
  event_name: string;
  status: string;
  actor: string;
  action: string;
  proof_hash: string | null;
  signature: string | null;
  risk_effect: string | null;
  created_at: string;
}

interface PilotStage {
  id: string;
  pilot_run_id: string;
  stage_name: string;
  status: string; // PENDING, IN_PROGRESS, COMPLETED, FAILED
  sequence: number;
  started_at: string;
  completed_at: string | null;
  events: StageEvent[];
}

interface PilotRun {
  id: string;
  institution_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  readiness_score: number | null;
  stages: PilotStage[];
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  INSTITUTION_SETUP: "Initialize multi-tenant keyspace, configure certificate signing keys, and setup audit namespace boundaries.",
  EXAM_CREATION: "Configure exam templates, set safety policies, lock exam blueprints, and seed mock MCQ bank questions.",
  PAPER_GENERATION: "Compile and encrypt secure question papers, generating sha256 hashes of paper configurations.",
  PACKAGE_SEALING: "Compute and lock center-bound paper packages, sealing paper package digests in the ledger.",
  CENTER_RELEASE: "Conduct dual-custody package release to generate and release decryption keys to center servers.",
  CANDIDATE_VERIFICATION: "Verify candidate identity cards via biometric mock matching, binding candidate records to seat layouts.",
  EXAM_SUBMISSION: "Attempt exam and log candidate MCQ answer submissions with cryptographically sealed session receipts.",
  OMR_PROCESSING: "Scan OMR sheets, parse response bubble grids, and verify ambiguous coordinate scanning flags.",
  WRITTEN_EVALUATION: "Anonymize descriptive copy pages and distribute to grading queue for double rubric marking.",
  CONFLICT_RESOLUTION: "Identify evaluator marking score differences, and execute senior controller conflict override review.",
  RESULT_GATE: "Audit release check gates: evaluate trust score thresholds, key validity, and unresolved incidents.",
  RESULT_PUBLICATION: "Transition exam state to published, sealing certified candidate transcripts and certificates.",
  DISPUTE_HANDLING: "File recheck claims, trigger OMR sheet check, and commit revised score revisions in the ledger.",
  AUDIT_REPORT: "Execute complete ledger validation checks: recalculate chained hashes block by block to prove zero backdoor tampering.",
  COMPLIANCE_REPORT: "Calculate overall security hardening compliance rate and sign final ECDSA compliance report."
};

const ACTORS: Record<string, string> = {
  INSTITUTION_SETUP: "System Root Admin",
  EXAM_CREATION: "Exam Controller",
  PAPER_GENERATION: "Exam Controller",
  PACKAGE_SEALING: "Security Module (HSM)",
  CENTER_RELEASE: "Exam Controller & Key Custodian",
  CANDIDATE_VERIFICATION: "Center Officer",
  EXAM_SUBMISSION: "Exam Invigilator",
  OMR_PROCESSING: "OMR Scanning Operator",
  WRITTEN_EVALUATION: "Anonymizer & Evaluator Team",
  CONFLICT_RESOLUTION: "Exam Controller",
  RESULT_GATE: "Trust Policy Engine",
  RESULT_PUBLICATION: "Exam Controller",
  DISPUTE_HANDLING: "Dispute Officer",
  AUDIT_REPORT: "Independent System Auditor",
  COMPLIANCE_REPORT: "Independent System Auditor"
};

export default function PilotRunPage() {
  const router = useRouter();
  const [activeRun, setActiveRun] = useState<PilotRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [binder, setBinder] = useState<any>(null);

  useEffect(() => {
    fetchActiveRun();
  }, []);

  const fetchActiveRun = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error("Session expired or unauthorized role. Log in as a Controller.");
      }

      if (res.ok) {
        const runs = await res.json();
        // Look for in-progress run or fall back to first run
        const active = runs.find((r: any) => r.status === "IN_PROGRESS") || runs[0];
        if (active) {
          fetchRunDetails(active.id);
        }
      }
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to sync pilot state.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs/${runId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRun(data);
        if (data.status === "COMPLETED") {
          setSuccess("Pilot Run completed! Cryptographic evidence binder is ready to compile.");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRun = async () => {
    setActioning(true);
    setError("");
    setSuccess("");
    setBinder(null);
    setTerminalLogs(["[INIT] Spawning new Zero-Trust Pilot Run sequence..."]);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create run.");

      setActiveRun(data);
      setTerminalLogs((prev) => [...prev, `[SUCCESS] Run ${data.id} instantiated. Stage 1 initialized.`]);
    } catch (err: any) {
      setError(err.message || "Failed to start run.");
    } finally {
      setActioning(false);
    }
  };

  const handleAdvanceStage = async (stage: PilotStage) => {
    if (!activeRun) return;
    setActioning(true);
    setError("");
    setSuccess("");

    setTerminalLogs((prev) => [
      ...prev,
      `[STAGE] Launching Stage ${stage.sequence}: ${stage.stage_name}`,
      `[EXECUTE] Processing zero-trust security checks...`,
    ]);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs/${activeRun.id}/stages/${stage.id}/advance`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Stage execution failed.");

      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const lastEvent = data.events[data.events.length - 1];

      setTerminalLogs((prev) => [
        ...prev,
        `[SUCCESS] Stage ${stage.sequence} completed.`,
        `[VERDICT] Posture Effect: ${lastEvent?.risk_effect || "POSTURE_OK"}`,
        `[CANONICAL HASH] ${lastEvent?.proof_hash || "None"}`,
      ]);

      fetchRunDetails(activeRun.id);
    } catch (err: any) {
      setError(err.message || "Stage execution failed.");
      setTerminalLogs((prev) => [...prev, `[FAILED] ${err.message}`]);
    } finally {
      setActioning(false);
    }
  };

  const handleGenerateBinder = async () => {
    if (!activeRun) return;
    setActioning(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/pilot/evidence-binder/generate?pilot_run_id=${activeRun.id}`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Binder generation failed.");

      setBinder(data);
      setSuccess("✓ Cryptographic Evidence Binder compiled and signed successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to generate binder.");
    } finally {
      setActioning(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm("Reset database? All active states, candidate submissions, and logs will be deleted.")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    setBinder(null);
    setActiveRun(null);
    setTerminalLogs([]);

    try {
      const res = await fetch(`${BACKEND_URL}/api/pilot/reset-and-seed`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Database reset failed.");

      setSuccess(data.message);
      setTerminalLogs(["[RESET] Database cleaned and seeded with pilot variables successfully."]);
      fetchActiveRun();
    } catch (err: any) {
      setError(err.message || "Failed to reset database.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚙️</span>
        <span>DECRYPTING INTERACTIVE WORKFLOW SEQUENCE...</span>
      </div>
    );
  }

  const currentStage = activeRun?.stages.find(
    (s) => s.status === "IN_PROGRESS" || s.status === "FAILED"
  ) || activeRun?.stages.find((s) => s.status === "PENDING");

  const lastCompletedStage = activeRun?.stages
    .filter(s => s.status === "COMPLETED")
    .sort((a, b) => b.sequence - a.sequence)[0];

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Pilot Simulator Flow</span>
            <span className="text-[9px] px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded uppercase font-mono font-bold tracking-widest animate-pulse">
              Interactive Deck
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Advance step-by-step to simulate a full examination lifecycle and verify ledger entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-lg transition"
          >
            🏢 Authority Console
          </button>
          <button
            onClick={handleResetDatabase}
            className="text-xs px-3 py-2 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 rounded-lg transition font-mono"
          >
            🚨 Clean Reset DB
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/10 border border-red-900/20 text-red-400 rounded-xl text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 text-emerald-400 rounded-xl text-xs font-mono">
          ✓ {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Workflow Stepper (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between min-h-[480px]">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">
              Workflow timeline
            </h3>
            
            <div className="overflow-y-auto max-h-[380px] pr-1 space-y-2">
              {activeRun ? (
                activeRun.stages.map((stage) => {
                  const isActive = currentStage?.id === stage.id;
                  const isCompleted = stage.status === "COMPLETED";
                  const isFailed = stage.status === "FAILED";
                  
                  return (
                    <div
                      key={stage.id}
                      className={`p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600/10 border-blue-500/30 text-white"
                          : isCompleted
                          ? "bg-slate-950/20 border-slate-850 text-slate-400/80"
                          : "bg-slate-950/40 border-slate-900 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 ${
                          isCompleted ? "bg-emerald-500 text-slate-950" : isFailed ? "bg-red-500 text-white" : isActive ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                        }`}>
                          {stage.sequence}
                        </span>
                        <span className="font-bold tracking-wide truncate">
                          {stage.stage_name.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                        isCompleted ? "bg-emerald-500/10 text-emerald-400" : isFailed ? "bg-red-500/10 text-red-400" : isActive ? "bg-blue-500/10 text-blue-400" : "bg-slate-850 text-slate-500"
                      }`}>
                        {stage.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-slate-500 italic py-12 text-center font-mono">
                  No active run initialized.
                </div>
              )}
            </div>
          </div>

          {!activeRun && (
            <button
              onClick={handleStartRun}
              disabled={actioning}
              className="w-full py-2.5 mt-4 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-500 transition text-xs uppercase cursor-pointer tracking-wider"
            >
              Start Pilot Run
            </button>
          )}
        </div>

        {/* Right: Active Stage Desk & Logs (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Active control block */}
          {activeRun && currentStage && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850 flex flex-col justify-between gap-5 shadow-lg">
              <div>
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest font-mono">
                  Stage {currentStage.sequence} / 15 • Active Operations
                </span>
                <h2 className="text-base font-black text-white tracking-tight mt-1 uppercase font-mono">
                  {currentStage.stage_name.replace(/_/g, " ")}
                </h2>
                <div className="grid grid-cols-2 gap-4 mt-3 py-3 border-y border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Acting Authority</span>
                    <span className="text-slate-300 font-semibold">{ACTORS[currentStage.stage_name] || "Security Module"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Action Details</span>
                    <span className="text-slate-300 font-semibold">Verify and seal secure ledger entries</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {STAGE_DESCRIPTIONS[currentStage.stage_name] || "Secure operational checklist."}
                </p>
              </div>

              <button
                onClick={() => handleAdvanceStage(currentStage)}
                disabled={actioning}
                className="w-max px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-600/10 cursor-pointer"
              >
                {actioning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing checks...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Stage {currentStage.sequence} Logic</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Evidence Binder Compiling */}
          {activeRun && activeRun.status === "COMPLETED" && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/25 flex flex-col gap-5 shadow-lg animate-in fade-in zoom-in-95 duration-250">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2 tracking-tight">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Interactive Run Completed</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Generate the independent system **Evidence Binder** containing cryptographically signed proofs of all 15 stages.
                </p>
              </div>

              {!binder ? (
                <button
                  onClick={handleGenerateBinder}
                  disabled={actioning}
                  className="w-max px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  {actioning ? "Compiling..." : "Generate Signed Evidence Binder"}
                </button>
              ) : (
                <div className="font-mono text-xs border border-emerald-500/20 bg-slate-950 p-4 rounded-xl flex flex-col gap-2.5">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">Binder ID</span>
                    <span className="text-white font-bold">{binder.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">SHA-256 Checksum</span>
                    <span className="text-emerald-400 font-bold truncate max-w-[200px]" title={binder.binder_hash}>{binder.binder_hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">ECDSA Signature (Base64)</span>
                    <div className="p-2.5 bg-slate-950 border border-slate-850 rounded text-[9px] text-emerald-400 break-all select-all leading-normal">
                      {binder.signature}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Inspector (Shows last event details) */}
          {activeRun && lastCompletedStage && lastCompletedStage.events.length > 0 && (
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 font-mono text-xs space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                <span>Last Cryptographic Proof Details</span>
              </h4>
              
              {lastCompletedStage.events.map((event) => (
                <div key={event.id} className="p-3 bg-slate-950 rounded-xl space-y-2 text-[11px]">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{event.event_name}</span>
                    <span className="text-emerald-400 uppercase font-semibold text-[9px]">{event.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                    <span>Actor: <span className="text-slate-300">{event.actor}</span></span>
                    <span>Action: <span className="text-slate-300">{event.action}</span></span>
                  </div>
                  {event.proof_hash && (
                    <div className="pt-2 border-t border-slate-900/60">
                      <span className="text-[9px] text-slate-500 uppercase block">Digest SHA-256</span>
                      <span className="text-cyan-400 break-all text-[10px] font-bold">{event.proof_hash}</span>
                    </div>
                  )}
                  {event.signature && (
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">ECDSA Signature</span>
                      <span className="text-slate-400 break-all text-[9px] leading-tight block">{event.signature}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Live Terminal logs */}
          <div className="bg-slate-950 rounded-2xl border border-slate-900 flex flex-col h-[220px] overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-900 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span>Pilot Execution Telemetry Console</span>
              </span>
            </div>
            
            <div className="flex-1 p-4 font-mono text-[10px] text-[#00ff66]/85 overflow-y-auto space-y-1 select-text leading-normal">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-600 italic flex items-center justify-center h-full">
                  No active telemetry logs. Run a stage to print ledger entries.
                </div>
              ) : (
                terminalLogs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
