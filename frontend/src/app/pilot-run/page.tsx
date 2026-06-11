"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  INSTITUTION_SETUP: "Initialize the multi-tenant keyspace, configuring ECDSA certificate signing keys, and audit namespace isolation boundaries.",
  EXAM_CREATION: "Configure exam policy templates, lock the exam blueprints config, and seed 20 MCQ questions.",
  PAPER_GENERATION: "Generate secure question set papers and seal paper content hashes in the database.",
  PACKAGE_SEALING: "Encrypt examination booklet packages for each center, computing the SHA-256 seal integrity hash.",
  CENTER_RELEASE: "Perform dual-custody package release to send decryption keys to the exam centers.",
  CANDIDATE_VERIFICATION: "Admit and verify candidate attendance utilizing biometric verification checks.",
  EXAM_SUBMISSION: "Record timing-locked MCQ answer submissions, generating cryptographically locked session receipts.",
  OMR_PROCESSING: "Process bubble sheet answer coordinates and resolve any ambiguous coordinate reviews.",
  WRITTEN_EVALUATION: "Upload descriptive booklets and score them anonymously, logging double evaluation marks.",
  CONFLICT_RESOLUTION: "Identify evaluation mismatches and apply senior controller resolution overrides.",
  RESULT_GATE: "Assemble and verify all publishing gate rules (trust engine scores, key states, and unresolved incidents).",
  RESULT_PUBLICATION: "Transition exam state to published, generating candidate-verifiable result certificates.",
  DISPUTE_HANDLING: "File disputes, record dispute reviews, and append revised result versions to the hash chain.",
  AUDIT_REPORT: "Execute a full hash chain validation across the audit log block entries.",
  COMPLIANCE_REPORT: "Calculate final compliance readiness metrics and compile an ECDSA signed compliance report."
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
        throw new Error("Authentication failed. Please log in as a Controller.");
      }

      if (res.ok) {
        const runs = await res.json();
        // Look for in-progress run
        const active = runs.find((r: any) => r.status === "IN_PROGRESS") || runs[0];
        if (active) {
          fetchRunDetails(active.id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load runs.");
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
        // If the run is completed, fetch evidence binder if it exists
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
      `[STAGE] Launching: ${stage.stage_name}`,
      `[EXECUTE] Processing backend zero-trust logic...`,
    ]);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/pilot/runs/${activeRun.id}/stages/${stage.id}/advance`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Stage execution failed.");

      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const lastEvent = data.events[data.events.length - 1];

      setTerminalLogs((prev) => [
        ...prev,
        `[SUCCESS] Stage ${stage.sequence} completed.`,
        `[VERDICT] Effect: ${lastEvent?.risk_effect || "POSTURE_OK"}`,
        `[PROOF HASH] ${lastEvent?.proof_hash || "None"}`,
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
    if (!confirm("Are you sure you want to clean and rebuild the database? All active states will be reset.")) return;
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text-muted font-mono text-xs">
        <span className="animate-spin text-xl mb-3">⚙️</span>
        DECRYPTING GUIDED PILOT WORKFLOW...
      </div>
    );
  }

  const currentStage = activeRun?.stages.find(
    (s) => s.status === "IN_PROGRESS" || s.status === "FAILED"
  ) || activeRun?.stages.find((s) => s.status === "PENDING");

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-card-bg/50 p-5 rounded-2xl border border-border-color shadow-sm backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              🚀 ExamForge <span className="text-accent-emerald text-xs px-2.5 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded font-mono uppercase">Guided Pilot Run</span>
            </h1>
            <p className="text-xs text-text-muted mt-1 leading-normal">
              Step-by-step interactive workflow engine testing the zero-trust audit trail.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/authority")}
              className="text-xs px-3 py-2 bg-border-color hover:bg-white/5 border border-border-color text-white rounded-xl transition cursor-pointer"
            >
              🏢 Authority Dashboard
            </button>
            <button
              onClick={handleResetDatabase}
              className="text-xs px-3 py-2 bg-accent-red/10 border border-accent-red/25 text-accent-red rounded-xl hover:bg-accent-red/20 transition cursor-pointer"
            >
              🚨 Clean Reset DB
            </button>
          </div>
        </header>

        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-xl text-xs leading-normal font-mono">
            ⚠️ ERROR: {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded-xl text-xs leading-normal font-mono">
            ✓ SUCCESS: {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Stepper (4 cols) */}
          <div className="lg:col-span-4 bg-card-bg p-5 rounded-2xl border border-border-color flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Workflow Stepper
            </h3>
            
            <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 flex flex-col gap-2">
              {activeRun ? (
                activeRun.stages.map((stage) => {
                  const isActive = currentStage?.id === stage.id;
                  const isCompleted = stage.status === "COMPLETED";
                  const isFailed = stage.status === "FAILED";
                  return (
                    <div
                      key={stage.id}
                      className={`p-2.5 rounded-xl border text-xs flex justify-between items-center ${
                        isActive
                          ? "bg-accent-emerald/5 border-accent-emerald/40 text-white"
                          : isCompleted
                          ? "bg-background/20 border-border-color/30 text-text-muted/70"
                          : "bg-background/40 border-border-color text-text-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                          isCompleted ? "bg-accent-emerald text-background" : isFailed ? "bg-accent-red text-white" : "bg-border-color text-white"
                        }`}>
                          {stage.sequence}
                        </span>
                        <span className="font-bold tracking-wide truncate max-w-[150px]">
                          {stage.stage_name.replace("_", " ")}
                        </span>
                      </div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                        isCompleted ? "bg-accent-emerald/10 text-accent-emerald" : isFailed ? "bg-accent-red/10 text-accent-red" : "bg-border-color/20 text-text-muted"
                      }`}>
                        {stage.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] text-text-muted italic py-8 text-center">
                  No active run initialized.
                </div>
              )}
            </div>

            {!activeRun && (
              <button
                onClick={handleStartRun}
                disabled={actioning}
                className="w-full py-2.5 bg-accent-emerald text-background font-black rounded-xl hover:bg-accent-emerald/90 transition text-xs uppercase cursor-pointer"
              >
                Start Pilot Run
              </button>
            )}
          </div>

          {/* Active Control Panel & Terminal (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Active Control Block */}
            {activeRun && currentStage && (
              <div className="bg-card-bg p-6 rounded-2xl border border-border-color flex flex-col gap-4 shadow-md">
                <div>
                  <div className="text-[9px] font-bold text-accent-emerald uppercase tracking-widest font-mono">
                    STAGE {currentStage.sequence} IN-PROGRESS
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight mt-1 uppercase">
                    {currentStage.stage_name.replace("_", " ")}
                  </h2>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed font-sans">
                    {STAGE_DESCRIPTIONS[currentStage.stage_name] || "Verify zero-trust integrity checklists."}
                  </p>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleAdvanceStage(currentStage)}
                    disabled={actioning}
                    className="px-5 py-2.5 bg-accent-emerald text-background font-bold rounded-xl hover:bg-accent-emerald/90 transition text-xs uppercase cursor-pointer tracking-wider"
                  >
                    {actioning ? "Executing..." : `Execute ${currentStage.stage_name.replace("_", " ")}`}
                  </button>
                </div>
              </div>
            )}

            {/* Run completed - generate Evidence Binder */}
            {activeRun && activeRun.status === "COMPLETED" && (
              <div className="bg-card-bg p-6 rounded-2xl border border-accent-emerald/30 flex flex-col gap-4 shadow-lg animate-in fade-in zoom-in duration-300">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    ✓ Pilot Sequence Concluded
                  </h2>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Generate the final institutional-level **Evidence Binder** containing cryptographically signed proofs of all 15 stages.
                  </p>
                </div>

                {!binder ? (
                  <button
                    onClick={handleGenerateBinder}
                    disabled={actioning}
                    className="px-5 py-2.5 bg-accent-emerald text-background font-black rounded-xl hover:bg-accent-emerald/90 transition text-xs uppercase cursor-pointer tracking-wider shrink-0 w-max"
                  >
                    {actioning ? "Compiling..." : "Generate Signed Evidence Binder"}
                  </button>
                ) : (
                  <div className="font-mono text-xs border border-accent-emerald/20 bg-background/50 p-4 rounded-xl flex flex-col gap-2.5">
                    <div className="flex justify-between border-b border-border-color/30 pb-2">
                      <span className="text-text-muted">Binder UUID</span>
                      <span className="text-white font-bold">{binder.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-color/30 pb-2">
                      <span className="text-text-muted">Checksum SHA-256</span>
                      <span className="text-white font-bold truncate max-w-[200px]" title={binder.binder_hash}>{binder.binder_hash}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block mb-1">ECDSA Signature (Base64)</span>
                      <div className="p-2.5 bg-[#050c18] border border-border-color rounded text-[9px] text-[#00ff66]/85 break-all leading-normal select-all">
                        {binder.signature}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Terminal */}
            <div className="bg-[#050c18] rounded-2xl border border-border-color shadow-xl overflow-hidden flex flex-col h-[280px]">
              <div className="bg-[#0b1524] px-4 py-2 border-b border-border-color/60 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-red"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-amber"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald"></span>
                </div>
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
                  Pilot Execution logs
                </span>
              </div>
              
              <div className="flex-1 p-4 font-mono text-[10px] text-[#00ff66]/90 overflow-y-auto space-y-1.5 select-text leading-normal">
                {terminalLogs.length === 0 ? (
                  <div className="text-text-muted text-[10px] italic flex items-center justify-center h-full">
                    No logs logged. Initialize run or advance stage to trace operations.
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
    </div>
  );
}
