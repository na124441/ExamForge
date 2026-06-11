"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface ApprovalReq {
  id: string;
  requested_by: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  reason: string;
  required_approvals: number;
  status: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approvingId, setApprovingId] = useState("");

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/approvals/pending`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Failed to load approvals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setError("");
    setSuccess("");
    setApprovingId(id);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to execute ${action}.`);
      }

      setSuccess(`Action ${action} executed successfully! Status: ${data.status}`);
      fetchPendingRequests();
    } catch (err: any) {
      setError(err.message || "Approval execution error.");
    } finally {
      setApprovingId("");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2">⚙️</span>
        DECRYPTING PENDING DUAL-CONTROL WORKFLOWS...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Privileged Action Approvals</h2>
        <p className="text-xs text-text-muted mt-1">Actions flagged as high-risk (e.g. key rotations, backup purges) require dual-officer signoffs.</p>
      </div>

      {error && (
        <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal font-mono">
          ⚠️ ERROR: {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs leading-normal">
          {success}
        </div>
      )}

      {/* Grid of Pending approvals */}
      <div className="grid grid-cols-1 gap-4">
        {requests.length === 0 ? (
          <div className="p-10 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs leading-normal">
            ⚙️ Zero pending dual-control approval requests active.<br />
            System is fully synced and compliant.
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="p-5 rounded-2xl border border-border-color bg-card-bg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold bg-accent-amber/10 border border-accent-amber/25 text-accent-amber px-2 py-0.5 rounded uppercase">
                    {req.action_type}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">Resource: {req.resource_type} ({req.resource_id})</span>
                </div>
                <p className="text-xs text-white font-medium mt-2">Reason: {req.reason}</p>
                <div className="text-[10px] text-text-muted mt-1 font-mono">
                  Requested by: <span className="text-white">{req.requested_by}</span> | Required Approvals: <span className="text-white">{req.required_approvals}</span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  disabled={approvingId === req.id}
                  onClick={() => handleAction(req.id, "approve")}
                  className="px-3 py-1.5 bg-accent-emerald text-background text-xs font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer"
                >
                  {approvingId === req.id ? "Processing..." : "Approve"}
                </button>
                <button
                  disabled={approvingId === req.id}
                  onClick={() => handleAction(req.id, "reject")}
                  className="px-3 py-1.5 bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-bold rounded hover:bg-accent-red/20 transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
