"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function JobsDashboard() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [triggerType, setTriggerType] = useState("GENERATE_AUDIT_REPORT");
  const [examId, setExamId] = useState("EXM-008");
  const [resultId, setResultId] = useState("RES-001");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/jobs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch background jobs.");
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleTriggerJob = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      let endpoint = `${BACKEND_URL}/api/jobs/reports/generate`;
      let body: any = { exam_id: examId };

      if (triggerType === "PROCESS_OMR_SCAN") {
        endpoint = `${BACKEND_URL}/api/jobs/omr/process-scan`;
        body = { exam_id: examId, bubble_data: { "Q1": "A", "Q2": "B" } };
      } else if (triggerType === "GENERATE_CERTIFICATE") {
        endpoint = `${BACKEND_URL}/api/jobs/certificates/generate`;
        body = { result_id: resultId };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to trigger background job.");
      const data = await res.json();
      setSuccess(`Job triggered successfully! Job ID: ${data.job_id}`);
      fetchJobs();
    } catch (err: any) {
      setError(err.message || "Could not trigger job.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/cancel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to cancel job.");
      setSuccess("Job successfully cancelled.");
      fetchJobs();
    } catch (err: any) {
      setError(err.message || "Cancel failed.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Background task Manager</h1>
          <p className="text-xs text-text-muted mt-0.5">Audit long-running asynchronous cycles such as certificate printing and OMR coordinates parsing.</p>
        </div>
        <button
          onClick={fetchJobs}
          className="px-3 py-1.5 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold"
        >
          🔄 Refresh list
        </button>
      </div>

      {/* Trigger Form */}
      <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Execute Manual Task</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted">Job Purpose</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="bg-background border border-border-color rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-emerald"
            >
              <option value="GENERATE_AUDIT_REPORT">GENERATE_AUDIT_REPORT (Audit Compilation)</option>
              <option value="PROCESS_OMR_SCAN">PROCESS_OMR_SCAN (OMR Scanner)</option>
              <option value="GENERATE_CERTIFICATE">GENERATE_CERTIFICATE (ECDSA Cert Sign)</option>
            </select>
          </div>

          {triggerType === "GENERATE_CERTIFICATE" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-text-muted">Result ID</label>
              <input
                type="text"
                value={resultId}
                onChange={(e) => setResultId(e.target.value)}
                className="bg-background border border-border-color rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-emerald"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-text-muted">Exam ID</label>
              <input
                type="text"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="bg-background border border-border-color rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-emerald"
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              disabled={actionLoading}
              onClick={handleTriggerJob}
              className="w-full py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider disabled:opacity-50"
            >
              🚀 Dispatch Task
            </button>
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
          <strong>Job Action Failure:</strong> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs">
          <strong>Queue Confirmed:</strong> {success}
        </div>
      )}

      {/* Jobs list */}
      {loading ? (
        <div className="text-center py-20 text-xs text-text-muted animate-pulse">
          Querying background queue loggers...
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-card-bg p-12 rounded-xl border border-border-color text-center flex flex-col items-center gap-4">
          <span className="text-4xl opacity-40">⚙️</span>
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">No background jobs found</h3>
          <p className="text-xs text-text-muted leading-relaxed max-w-sm">
            This institution has not dispatched any background tasks yet. Use the selector above to trigger a test task.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-emerald/30 transition flex flex-col gap-3 shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-text-muted">{job.id}</span>
                  <strong className="text-sm text-white tracking-wide">{job.job_type}</strong>
                </div>
                
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                  job.status === "COMPLETED"
                    ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald"
                    : job.status === "FAILED"
                    ? "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                    : job.status === "RUNNING"
                    ? "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber animate-pulse"
                    : "bg-background border border-border-color text-text-muted"
                }`}>
                  {job.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 bg-background h-2 rounded overflow-hidden border border-border-color/60">
                  <div
                    className="bg-accent-emerald h-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-white shrink-0">{job.progress}%</span>
              </div>

              <div className="flex justify-between items-center border-t border-border-color/60 pt-3 mt-1 text-[10px] text-text-muted">
                <span>Dispatched: {new Date(job.created_at).toLocaleString()}</span>
                
                <div className="flex gap-3">
                  <Link href={`/ops/jobs/${job.id}`} className="text-accent-emerald hover:underline font-bold uppercase tracking-wider">
                    View Details →
                  </Link>
                  {(job.status === "PENDING" || job.status === "RUNNING") && (
                    <button
                      onClick={() => handleCancelJob(job.id)}
                      className="text-accent-red hover:underline font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
