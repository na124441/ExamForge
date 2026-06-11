"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function DisputeOfficerWorkspace() {
  const { dispute_id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Decision Form State
  const [decision, setDecision] = useState("RESOLVED_CONFIRMED");
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState("");

  // Versioning state (if updated)
  const [newMarks, setNewMarks] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [versionSig, setVersionSig] = useState("");
  const [versionSuccess, setVersionSuccess] = useState("");

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/disputes/${dispute_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch dispute details.");
      const json = await res.json();
      setData(json);
      setNotes(json.dispute.description);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dispute_id) fetchDetails();
  }, [dispute_id]);

  const handleAction = async (actionPath: string, actionName: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/dispute-ops/${dispute_id}/${actionPath}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`${actionName} action failed.`);
      alert(`${actionName} triggered successfully.`);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      alert("Please provide your ECDSA signature to lock the decision.");
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/dispute-ops/${dispute_id}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ decision, notes, signature })
      });
      if (!res.ok) throw new Error("Could not record decision.");
      alert("Decision recorded and signature locked in ledger.");
      fetchDetails();
    } catch (err: any) {
      alert(err.message || "Error recording decision.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDispute = async () => {
    if (!confirm("Are you sure you want to close this dispute?")) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/dispute-ops/${dispute_id}/close`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not close dispute.");
      alert("Dispute closed successfully.");
      router.push("/dispute-ops");
    } catch (err: any) {
      alert(err.message || "Error closing dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarks || !changeReason || !versionSig) {
      alert("Please fill in all fields to create a new version.");
      return;
    }
    setActionLoading(true);
    setVersionSuccess("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/results/${data.dispute.result_id}/create-version`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          new_marks: parseFloat(newMarks),
          change_reason: changeReason,
          linked_dispute_id: dispute_id,
          signature: versionSig
        })
      });
      if (!res.ok) throw new Error("Could not create result version.");
      setVersionSuccess("Version 2 successfully created, older certificates superseded!");
      setNewMarks("");
      setChangeReason("");
      setVersionSig("");
      fetchDetails();
    } catch (err: any) {
      alert(err.message || "Error creating version.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      {loading && (
        <div className="text-center py-12 text-xs text-text-muted animate-pulse">
          Opening dispute workspace...
        </div>
      )}

      {error && (
        <div className="max-w-md w-full bg-card-bg p-6 rounded-xl border border-accent-red/20 text-accent-red text-center">
          {error}
        </div>
      )}

      {data && (
        <div className="max-w-5xl w-full flex flex-col gap-6 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] text-text-muted">Workspace | Dispute Reference: {data.dispute.id}</span>
              <h1 className="text-lg font-bold text-white uppercase">{data.dispute.dispute_type.replace(/_/g, " ")}</h1>
              <p className="text-xs text-text-primary mt-1">{data.dispute.description}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-accent-amber/10 border border-accent-amber/20 text-accent-amber uppercase tracking-wider">
                {data.dispute.status}
              </span>
              <Link href="/dispute-ops" className="text-[10px] text-text-muted hover:text-white uppercase font-bold tracking-wider mt-1">
                ← Back to Queue
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Action panel & decision */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              {/* Trigger Rechecks */}
              <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color pb-2">Trigger Operations Checks</h2>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => handleAction("assign-recheck", "Assign Recheck")} disabled={actionLoading} className="py-2.5 bg-background border border-border-color hover:border-accent-amber text-white text-xs font-semibold rounded transition">
                    🔄 Assign Rechecker
                  </button>
                  <button onClick={() => handleAction("trigger-omr-review", "OMR Review")} disabled={actionLoading} className="py-2.5 bg-background border border-border-color hover:border-accent-amber text-white text-xs font-semibold rounded transition">
                    🔴 Re-evaluate OMR Bubbles
                  </button>
                  <button onClick={() => handleAction("trigger-written-recheck", "Written Recheck")} disabled={actionLoading} className="py-2.5 bg-background border border-border-color hover:border-accent-amber text-white text-xs font-semibold rounded transition">
                    📝 Re-evaluate Written Pages
                  </button>
                </div>
              </div>

              {/* Record Decision */}
              <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color pb-2">Record Decision & Signature Lock</h2>
                <form onSubmit={handleRecordDecision} className="flex flex-col gap-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-muted mb-1 font-semibold">Verdict Decision</label>
                      <select
                        value={decision}
                        onChange={(e) => setDecision(e.target.value)}
                        className="w-full p-2.5 bg-background border border-border-color rounded focus:outline-none focus:border-accent-emerald text-white cursor-pointer"
                      >
                        <option value="RESOLVED_CONFIRMED">Resolved - Confirmed (No change)</option>
                        <option value="RESOLVED_UPDATED">Resolved - Updated (Marks Revision)</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1 font-semibold">Officer Cryptographic Signature</label>
                      <input
                        type="text"
                        placeholder="ECDSA Key Session Lock hex"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        className="w-full p-2.5 bg-background border border-border-color rounded focus:outline-none focus:border-accent-emerald text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-muted mb-1 font-semibold">Resolution Notes</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 bg-background border border-border-color rounded focus:outline-none focus:border-accent-emerald text-white resize-none"
                    />
                  </div>

                  <button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition text-xs uppercase tracking-wider">
                    Sign & Commit Decision
                  </button>
                </form>
              </div>

              {/* Version revision (if updated) */}
              {data.dispute.status === "RESOLVED_UPDATED" && (
                <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color pb-2">Version Revision Console</h2>
                  <form onSubmit={handleCreateVersion} className="flex flex-col gap-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-text-muted mb-1 font-semibold">New Corrected Marks</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 12.0"
                          value={newMarks}
                          onChange={(e) => setNewMarks(e.target.value)}
                          className="w-full p-2.5 bg-background border border-border-color rounded focus:outline-none focus:border-accent-emerald text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-text-muted mb-1 font-semibold">Revision Authority Signature</label>
                        <input
                          type="text"
                          placeholder="ECDSA Key Session Lock hex"
                          value={versionSig}
                          onChange={(e) => setVersionSig(e.target.value)}
                          className="w-full p-2.5 bg-background border border-border-color rounded focus:outline-none focus:border-accent-emerald text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-text-muted mb-1 font-semibold">Correction Reason</label>
                      <input
                        type="text"
                        placeholder="e.g. OMR manual scan bubble error corrected."
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        className="w-full p-2.5 bg-background border border-border-color rounded focus:outline-none focus:border-accent-emerald text-white"
                      />
                    </div>

                    {versionSuccess && (
                      <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded">
                        {versionSuccess}
                      </div>
                    )}

                    <button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs uppercase tracking-wider">
                      Execute Version Update
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar actions & evidence */}
            <div className="flex flex-col gap-6">
              
              {/* Evidence packet trigger */}
              <div className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Evidence Folder</h3>
                {data.dispute.evidence_packet_id ? (
                  <div className="flex flex-col gap-2">
                    <Link href={`/evidence-packet/${data.dispute.evidence_packet_id}`} className="w-full text-center py-2.5 bg-accent-emerald text-background font-bold rounded text-xs hover:bg-accent-emerald/90 transition">
                      📂 View Signed Evidence
                    </Link>
                  </div>
                ) : (
                  <button onClick={() => handleAction("generate", "Generate Evidence")} disabled={actionLoading} className="w-full py-2.5 bg-accent-emerald text-background font-bold rounded text-xs hover:bg-accent-emerald/90 transition">
                    📂 Generate Evidence Packet
                  </button>
                )}
              </div>

              {/* Close Dispute */}
              <div className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Finalize Review</h3>
                <button onClick={handleCloseDispute} disabled={actionLoading} className="w-full py-2.5 bg-accent-red/10 border border-accent-red/20 text-accent-red hover:bg-accent-red/20 font-bold rounded text-xs transition uppercase tracking-wider">
                  🔒 Close Dispute File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
