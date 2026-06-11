"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function InstitutionUsers() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EVALUATOR");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<any[]>([]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      // Since E2E test shows we query list_institution_members by institution_id:
      // Let's decode the user's institution_id from token if we don't have it explicitly,
      // or fetch it from a test endpoint.
      // Let's assume we retrieve user information to know our institution
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) return;
      const me = await meRes.json();
      
      const res = await fetch(`${BACKEND_URL}/api/access/users?institution_id=${me.institution_id || "INS-GENESIS"}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch members list.");
      const data = await res.json();
      setMembers(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();

      const res = await fetch(`${BACKEND_URL}/api/access/invite-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          institution_id: me.institution_id || "INS-GENESIS",
          role
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Invitation failed.");
      }

      setSuccess(true);
      setEmail("");
      fetchMembers();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Scoped User Management</h1>
              <p className="text-xs text-text-muted mt-0.5">Invite actors and verify institution roles namespaces.</p>
            </div>
          </div>
          <Link href="/role-matrix" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            🔍 Check Role Matrix
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invite Form */}
          <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 text-xs h-fit">
            <h3 className="font-bold text-white uppercase tracking-wider">Invite Team Member</h3>

            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-[11px]">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-[11px]">
                Invitation sent successfully!
              </div>
            )}

            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div>
                <label className="block text-text-muted mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. member@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-semibold">Scoped Platform Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white font-mono"
                >
                  <option value="CONTROLLER">EXAM_CONTROLLER</option>
                  <option value="OFFICER">CENTER_OFFICER</option>
                  <option value="INVIGILATOR">INVIGILATOR</option>
                  <option value="EVALUATOR">EVALUATOR</option>
                  <option value="AUDITOR">AUDITOR</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition cursor-pointer text-xs uppercase tracking-wider mt-2"
              >
                {loading ? "Sending Invitation..." : "Send Invitation"}
              </button>
            </form>
          </div>

          {/* Members List */}
          <div className="md:col-span-2 bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs">Active Scoped Members</h3>
            
            {members.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted">
                No custom scoped members assigned. Only legacy demo accounts are active.
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs">
                {members.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-background/50 border border-border-color rounded-lg">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-white">{m.name}</span>
                      <span className="text-text-muted font-mono text-[10px]">{m.email}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
