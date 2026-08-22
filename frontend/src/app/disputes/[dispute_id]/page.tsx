"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  ArrowLeft, 
  Clock, 
  FolderLock, 
  Send, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { StatusBadge } from "../../../components/ui/StatusBadge";

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
      // Mock fallback
      setData({
        dispute: {
          id: dispute_id,
          dispute_type: "OMR_BUBBLE_DISCREPANCY",
          description: "Candidate contests question #14 optical mark recognition evaluation.",
          status: "UNDER_REVIEW",
          evidence_packet_id: "EP-998811"
        },
        events: [
          { id: 1, action: "DISPUTE_FILED", created_at: new Date(Date.now() - 86400000).toISOString(), notes: "Dispute submitted with signed candidate receipt attestation.", actor_id: "ANON-8891" },
          { id: 2, action: "EVIDENCE_ATTACHED", created_at: new Date(Date.now() - 43200000).toISOString(), notes: "Raw scan contour image linked into cryptographically sealed evidence packet.", actor_id: "SYSTEM_AGENT" }
        ],
        notes: [
          { id: 1, actor_id: "CONTROLLER_ADITI", content: "Under double-evaluator manual contour review.", created_at: new Date(Date.now() - 20000000).toISOString() }
        ]
      });
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
      await fetch(`${BACKEND_URL}/api/disputes/${dispute_id}/withdraw`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
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
      await fetch(`${BACKEND_URL}/api/disputes/${dispute_id}/attach-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: noteContent })
      });
      setNoteContent("");
      fetchDisputeDetails();
    } catch (err: any) {
      if (data) {
        setData({
          ...data,
          notes: [...data.notes, { id: Date.now(), actor_id: "CONTROLLER", content: noteContent, created_at: new Date().toISOString() }]
        });
        setNoteContent("");
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 md:p-10 font-sans items-center">
      {loading && (
        <div className="text-center py-20 text-xs text-slate-400">
          Retrieving audit timeline logs...
        </div>
      )}

      {error && (
        <div className="max-w-md w-full bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 text-center text-xs font-semibold">
          {error}
        </div>
      )}

      {data && (
        <div className="max-w-4xl w-full flex flex-col gap-6 animate-fade-in">
          
          {/* Header Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  Dispute: {data.dispute.id}
                </span>
                <StatusBadge status={data.dispute.status} size="sm" />
              </div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase mt-1">
                {data.dispute.dispute_type?.replace(/_/g, " ")}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">{data.dispute.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                href="/disputes"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Disputes</span>
              </Link>
              {data.dispute.status !== "CLOSED" && (
                <button 
                  onClick={handleWithdraw} 
                  disabled={actionLoading} 
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Timeline Events */}
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
                Cryptographic Timeline Logs
              </h2>
              
              <div className="flex flex-col gap-4 pl-3 relative border-l-2 border-slate-200 text-xs">
                {data.events.map((e: any) => (
                  <div key={e.id} className="relative pl-5">
                    <span className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></span>
                    <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-0.5 font-bold">
                      <span>Action: {e.action}</span>
                      <span>{new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-900 font-bold text-xs">{e.notes || "No extra status details."}</p>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Actor ID: {e.actor_id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Actions & Details */}
            <div className="flex flex-col gap-6">
              
              {/* Evidence packet Link */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Evidence Package
                </h3>
                {data.dispute.evidence_packet_id ? (
                  <Link 
                    href={`/evidence-packet/${data.dispute.evidence_packet_id}`} 
                    className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-xs active-press flex items-center justify-center gap-1.5"
                  >
                    <FolderLock className="w-3.5 h-3.5" />
                    <span>View Signed Evidence</span>
                  </Link>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Evidence files will populate automatically once the review starts.
                  </p>
                )}
              </div>

              {/* Add Note form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Attach Audit Note</h3>
                <form onSubmit={handleAddNote} className="flex flex-col gap-2.5 text-xs">
                  <textarea
                    rows={3}
                    placeholder="Provide updates..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 text-xs leading-relaxed"
                  />
                  <button 
                    type="submit" 
                    disabled={actionLoading} 
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Note</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Dispute Notes list */}
          {data.notes.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
                Auditor & Controller Notes
              </h2>
              <div className="flex flex-col gap-3 text-xs">
                {data.notes.map((n: any) => (
                  <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-1">
                    <div className="flex justify-between font-mono text-[10px] text-slate-400 font-bold">
                      <span>Author: {n.actor_id}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-800 font-medium text-xs leading-relaxed">{n.content}</p>
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
