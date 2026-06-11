"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

interface PageProps {
  params: Promise<{ job_id: string }>;
}

export default function JobDetailsPage({ params }: PageProps) {
  const { job_id } = use(params);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/jobs/${job_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not load job details.");
      const data = await res.json();
      setJob(data.job);
      setEvents(data.events);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [job_id]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Job execution log</h1>
          <p className="text-xs text-text-muted mt-0.5">Chronological milestones and failure diagnosis details for task {job_id}.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDetails}
            className="px-3 py-1.5 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold"
          >
            🔄 Refresh Log
          </button>
          <Link href="/ops/jobs" className="px-3 py-1.5 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            Back to Queue
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Log Fetch Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-text-muted animate-pulse">
          Opening asynchronous journal records...
        </div>
      ) : !job ? (
        <div className="bg-card-bg p-8 rounded-xl border border-border-color text-center text-xs text-text-muted">
          Job record not found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Metadata Card */}
          <div className="lg:col-span-1 bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 h-fit">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Task Parameters</h2>
            
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between border-b border-border-color/40 pb-2">
                <span className="text-text-muted">Status</span>
                <span className={`font-bold uppercase ${
                  job.status === "COMPLETED" ? "text-accent-emerald" : job.status === "FAILED" ? "text-accent-red" : "text-accent-amber"
                }`}>{job.status}</span>
              </div>
              <div className="flex justify-between border-b border-border-color/40 pb-2">
                <span className="text-text-muted">Type</span>
                <span className="text-white font-mono">{job.job_type}</span>
              </div>
              <div className="flex justify-between border-b border-border-color/40 pb-2">
                <span className="text-text-muted">Progress</span>
                <span className="text-white font-mono">{job.progress}%</span>
              </div>
              <div className="flex justify-between border-b border-border-color/40 pb-2">
                <span className="text-text-muted">Tenant ID</span>
                <span className="text-white font-mono">{job.institution_id || "None"}</span>
              </div>
              <div className="flex justify-between border-b border-border-color/40 pb-2">
                <span className="text-text-muted">Requestor</span>
                <span className="text-white font-mono">{job.created_by || "SYSTEM"}</span>
              </div>
              <div className="flex justify-between border-b border-border-color/40 pb-2">
                <span className="text-text-muted">Created</span>
                <span className="text-white">{new Date(job.created_at).toLocaleString()}</span>
              </div>
              {job.completed_at && (
                <div className="flex justify-between border-b border-border-color/40 pb-2">
                  <span className="text-text-muted">Completed</span>
                  <span className="text-white">{new Date(job.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Error diagnosis */}
            {job.status === "FAILED" && (
              <div className="mt-2 p-3 bg-accent-red/10 border border-accent-red/25 rounded flex flex-col gap-2">
                <span className="text-[10px] font-bold text-accent-red uppercase tracking-wider">Failure diagnosis</span>
                <pre className="text-[10px] text-accent-red font-mono whitespace-pre-wrap leading-normal break-all">{job.error_reason}</pre>
              </div>
            )}
          </div>

          {/* Timeline Events */}
          <div className="lg:col-span-2 bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Milestone timeline</h2>
            
            {events.length === 0 ? (
              <p className="text-xs text-text-muted">No execution events recorded for this task cycle.</p>
            ) : (
              <div className="flex flex-col gap-4 relative pl-4 border-l border-border-color/60">
                {events.map((evt, idx) => (
                  <div key={idx} className="relative flex flex-col gap-1">
                    {/* Event Dot */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent-emerald border-2 border-card-bg" />
                    
                    <div className="flex justify-between items-center">
                      <strong className="text-xs text-white uppercase tracking-wide">{evt.event_type}</strong>
                      <span className="text-[9px] font-mono text-text-muted">{new Date(evt.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">{evt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
