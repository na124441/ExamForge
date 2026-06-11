"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function DisputeTimelinePage() {
  const { dispute_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [noteContent, setNoteContent] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDisputeDetails = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/disputes/${dispute_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch dispute timeline details.");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dispute_id) fetchDisputeDetails();
  }, [dispute_id]);

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw this dispute?")) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/disputes/${dispute_id}/withdraw`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Withdrawal failed.");
      fetchDisputeDetails();
    } catch (err: any) {
      alert(err.message || "Error withdrawing dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/disputes/${dispute_id}/attach-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: noteContent })
      });
      if (!res.ok) throw new Error("Could not post note.");
      setNoteContent("");
      fetchDisputeDetails();
    } catch (err: any) {
      alert(err.message || "Error adding note.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      {loading && (
        <div className="text-center py-12 text-xs text-text-muted animate-pulse">
          Retrieving audit timeline logs...
        </div>
      )}

      {error && (
        <div className="max-w-md w-full bg-card-bg p-6 rounded-xl border border-accent-red/20 text-accent-red text-center">
          {error}
        </div>
      )}

      {data && (
        <div className="max-w-3xl w-full flex flex-col gap-6 animate-in fade-in duration-300">
          
          {/* Header Card */}
          <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] text-text-muted">Dispute ID: {data.dispute.id}</span>
              <h1 className="text-lg font-bold text-white uppercase">{data.dispute.dispute_type.replace(/_/g, " ")}</h1>
              <p className="text-xs text-text-primary mt-1">{data.dispute.description}</p>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                data.dispute.status === "CLOSED" ? "bg-background border border-border-color text-text-muted" :
                data.dispute.status.startsWith("RESOLVED") ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" :
                "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
              }`}>
                {data.dispute.status}
              </span>
              
              {data.dispute.status !== "CLOSED" && (
                <button onClick={handleWithdraw} disabled={actionLoading} className="text-[10px] text-accent-red hover:underline uppercase font-bold tracking-wider">
                  Withdraw dispute
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Timeline Events */}
            <div className="md:col-span-2 bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color pb-2">Status Timeline</h2>
              
              <div className="flex flex-col gap-4 pl-3 relative border-l border-border-color/60 text-xs">
                {data.events.map((e: any, idx: number) => (
                  <div key={e.id} className="relative pl-4">
                    <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-accent-amber border-2 border-card-bg"></span>
                    <div className="flex justify-between font-mono text-[9px] text-text-muted mb-0.5">
                      <span>Action: {e.action}</span>
                      <span>{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-white font-semibold">{e.notes || "No extra status details."}</p>
                    <span className="text-[9px] text-text-muted">Actor: {e.actor_id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Actions & Details */}
            <div className="flex flex-col gap-6">
              
              {/* Evidence packet Link */}
              <div className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Evidence Folder</h3>
                {data.dispute.evidence_packet_id ? (
                  <Link href={`/evidence-packet/${data.dispute.evidence_packet_id}`} className="w-full text-center py-2.5 bg-accent-emerald text-background font-bold rounded text-xs hover:bg-accent-emerald/90 transition">
                    📂 View Signed Evidence
                  </Link>
                ) : (
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Evidence files will populate automatically once the review starts.
                  </p>
                )}
              </div>

              {/* Add Note form */}
              <div className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-lg flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Attach Note</h3>
                <form onSubmit={handleAddNote} className="flex flex-col gap-2 text-xs">
                  <textarea
                    rows={3}
                    placeholder="Provide updates..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-2 bg-background border border-border-color rounded focus:outline-none focus:border-accent-amber text-white text-[11px]"
                  />
                  <button type="submit" disabled={actionLoading} className="w-full py-2 bg-card-bg border border-border-color text-white hover:border-accent-amber rounded font-semibold text-xs transition">
                    Post Note
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Dispute Notes list */}
          {data.notes.length > 0 && (
            <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color pb-2">Dispute Notes</h2>
              <div className="flex flex-col gap-3 text-xs">
                {data.notes.map((n: any) => (
                  <div key={n.id} className="p-3 bg-background/30 rounded border border-border-color/60 flex flex-col gap-1.5">
                    <div className="flex justify-between font-mono text-[9px] text-text-muted">
                      <span>Author: {n.actor_id}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-text-primary leading-normal">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
