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
  HelpCircle,
  Check,
  Download,
  Copy,
  Layers,
  ArrowRight,
  FileCheck,
  Lock,
  Sparkles
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ProofDrawer, ProofData } from "../../components/ui/ProofDrawer";

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
  status: string;
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
  AUDIT_REPORT: "Execute complete ledger validation checks: recalculate chained hashes block by block to prove zero tampering.",
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
  const [selectedProof, setSelectedProof] = useState<ProofData | null>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveRun();
  }, []);

  const fetchActiveRun = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const runs = await res.json();
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
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs/${runId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRun(data);
        if (data.status === "COMPLETED") {
          setSuccess("Guided Walkthrough completed! Cryptographic evidence binder is ready to compile.");
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
    setTerminalLogs(["[INIT] Spawning new 15-stage walkthrough sequence..."]);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
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
      `[EXECUTE] Processing cryptographic checks & ECDSA signing...`,
    ]);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs/${activeRun.id}/stages/${stage.id}/advance`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Stage execution failed.");

      await new Promise((resolve) => setTimeout(resolve, 200));
      
      const lastEvent = data.events?.[data.events.length - 1];

      setTerminalLogs((prev) => [
        ...prev,
        `[SUCCESS] Stage ${stage.sequence} completed. Status: SEALED.`,
        `[VERDICT] Risk Effect: ${lastEvent?.risk_effect || "POSTURE_OK"}`,
        `[CANONICAL HASH] ${lastEvent?.proof_hash || "SHA256:Sealed"}`,
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
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
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
    if (!confirm("Reset database? All active states, candidate submissions, and logs will be reset.")) return;
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

      setSuccess(data.message || "Reset complete.");
      setTerminalLogs(["[RESET] Database cleaned and seeded with fresh pilot variables."]);
      fetchActiveRun();
    } catch (err: any) {
      setError(err.message || "Failed to reset database.");
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 text-xs gap-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="font-semibold">Synchronizing 15-Stage Examination Pipeline...</span>
      </div>
    );
  }

  const currentStage = activeRun?.stages.find(
    (s) => s.status === "IN_PROGRESS" || s.status === "FAILED"
  ) || activeRun?.stages.find((s) => s.status === "PENDING");

  const currentOwner = currentStage
    ? ACTORS[currentStage.stage_name] ?? "Exam Controller"
    : "Exam Controller";

  const lastCompletedStage = activeRun?.stages
    .filter(s => s.status === "COMPLETED")
    .sort((a, b) => b.sequence - a.sequence)[0];

  const completedCount = activeRun?.stages.filter(s => s.status === "COMPLETED").length || 0;
  const progressPercent = Math.round((completedCount / 15) * 100);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Proof Drawer Modal */}
      <ProofDrawer 
        isOpen={isProofOpen} 
        onClose={() => setIsProofOpen(false)} 
        proof={selectedProof} 
      />

      {/* Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Guided 15-Stage Examination Walkthrough
            </h1>
            <span className="text-xs px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-bold">
              Interactive Simulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate every cryptographic stage of the examination lifecycle and inspect SHA-256 evidence in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold shadow-2xs active-press"
          >
            Authority Console
          </button>
          <button
            onClick={handleResetDatabase}
            className="text-xs px-3.5 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition font-bold cursor-pointer shadow-2xs active-press"
          >
            Reset Database
          </button>
        </div>
      </div>

      {/* Progress Metric Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-900">
                Pipeline Progress: {completedCount} / 15 Stages Verified
              </span>
              <span className="font-mono font-bold text-indigo-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500 shadow-xs" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {activeRun && (
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400">RUN:</span>
            <span className="font-bold text-slate-800">{activeRun.id.slice(0, 12)}...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Stage Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Stage Sequence Map
              </h3>
              <span className="text-[10px] font-bold text-slate-400">15 STEPS</span>
            </div>
            
            <div className="relative pl-6 pr-1 py-1 space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-thin">
              <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-slate-200" />
              
              {activeRun ? (
                activeRun.stages.map((stage) => {
                  const isActive = currentStage?.id === stage.id;
                  const isCompleted = stage.status === "COMPLETED";
                  const isFailed = stage.status === "FAILED";
                  
                  return (
                    <div
                      key={stage.id}
                      className="relative flex items-center"
                    >
                      <div className="absolute -left-[24.5px] z-10 flex items-center justify-center">
                        <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-200 border ${
                          isCompleted 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs" 
                            : isFailed 
                            ? "bg-red-600 border-red-600 text-white" 
                            : isActive 
                            ? "bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 shadow-2xs" 
                            : "bg-white border-slate-300 text-slate-500"
                        }`}>
                          {stage.sequence}
                        </span>
                      </div>

                      <div className={`w-full p-2.5 pl-3.5 rounded-xl border text-xs flex justify-between items-center transition-all duration-150 ${
                        isActive
                          ? "bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs"
                          : isCompleted
                          ? "bg-slate-50 border-slate-200/80 text-slate-700"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}>
                        <span className="truncate pr-2">
                          {stage.stage_name.replace(/_/g, " ")}
                        </span>
                        <StatusBadge status={stage.status} size="sm" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 italic py-16 text-center">
                  No active run initialized. Click below to begin.
                </div>
              )}
            </div>
          </div>

          {!activeRun && (
            <button
              onClick={handleStartRun}
              disabled={actioning}
              className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-xs active-press flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Initialize 15-Stage Lifecycle</span>
            </button>
          )}
        </div>

        {/* Right: Active Stage Desk & Real-Time Proofs (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Active Control Block */}
          {activeRun && currentStage && (
            <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl flex flex-col justify-between gap-6 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    Stage {currentStage.sequence} of 15 • In Flight
                  </span>
                </div>
                
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2.5">
                  {currentStage.stage_name.replace(/_/g, " ")}
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mt-4 py-3.5 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Designated Actor</span>
                    <span className="text-slate-900 font-bold mt-0.5 block">{currentOwner}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Action Protocol</span>
                    <span className="text-slate-900 font-bold mt-0.5 block">Cryptographic Hash & Seal</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
                  {STAGE_DESCRIPTIONS[currentStage.stage_name] || "Operational security stage checklist."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAdvanceStage(currentStage)}
                  disabled={actioning}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-2 shadow-xs cursor-pointer active-press hover:shadow-md"
                >
                  {actioning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Computing SHA-256 Digest...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Execute Stage {currentStage.sequence} Validation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Evidence Binder Compiling */}
          {activeRun && activeRun.status === "COMPLETED" && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-6 md:p-8 rounded-3xl flex flex-col gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-emerald-950">
                    Complete Walkthrough Validated
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Generate the signed **Evidence Binder** containing cryptographic certificates for all 15 stages.
                  </p>
                </div>
              </div>

              {!binder ? (
                <button
                  onClick={handleGenerateBinder}
                  disabled={actioning}
                  className="w-max px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-xs active-press"
                >
                  {actioning ? "Compiling..." : "Generate Signed Evidence Binder"}
                </button>
              ) : (
                <div className="text-xs border border-emerald-200 bg-white p-5 rounded-2xl flex flex-col gap-3 shadow-2xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Binder Document ID:</span>
                    <span className="text-slate-900 font-bold font-mono">{binder.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">SHA-256 Master Checksum:</span>
                    <span className="text-slate-900 font-mono font-bold truncate max-w-[280px]" title={binder.binder_hash}>{binder.binder_hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1.5 font-medium">ECDSA P-256 Signature:</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 break-all select-all font-mono">
                      {binder.signature}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Inspector */}
          {activeRun && lastCompletedStage && lastCompletedStage.events.length > 0 && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl text-xs space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-indigo-600" />
                  <span>Latest Cryptographic Proof (Stage {lastCompletedStage.sequence})</span>
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              
              {lastCompletedStage.events.map((event) => (
                <div key={event.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="text-sm">{event.event_name}</span>
                    <span className="text-emerald-700 uppercase font-bold text-[11px]">{event.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-500">
                    <span>Actor: <strong className="text-slate-800">{event.actor}</strong></span>
                    <span>Action: <strong className="text-slate-800">{event.action}</strong></span>
                  </div>
                  
                  {event.proof_hash && (
                    <div className="pt-2 border-t border-slate-200 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Digest Hash (SHA-256)</span>
                        <button
                          onClick={() => copyText(event.proof_hash!, event.id)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
                        >
                          {copiedHash === event.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHash === event.id ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <span className="text-slate-900 font-mono break-all text-xs font-semibold bg-white p-2 rounded-lg border border-slate-200">
                        {event.proof_hash}
                      </span>
                    </div>
                  )}

                  {event.signature && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">ECDSA Signature Hex</span>
                      <span className="text-slate-700 font-mono break-all text-[11px] bg-white p-2 rounded-lg border border-slate-200 leading-tight">
                        {event.signature}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cyber Terminal Execution Logs */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 flex flex-col h-[220px] overflow-hidden shadow-md">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Execution Terminal Stream</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 beacon-emerald" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">READY</span>
              </div>
            </div>
            
            <div className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto space-y-1.5 select-text scrollbar-thin">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-500 italic flex items-center justify-center h-full">
                  Terminal ready. Execute a stage above to view telemetry.
                </div>
              ) : (
                terminalLogs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap leading-relaxed">
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
