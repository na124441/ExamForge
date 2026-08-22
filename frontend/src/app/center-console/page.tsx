"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { RefreshCw, Lock, Unlock, ShieldAlert, Key, Building2, UserCheck, AlertTriangle } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

function CenterConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centerId = searchParams.get("center") || "CTR-22";

  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [packages, setPackages] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [seatMap, setSeatMap] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [officerSignature, setOfficerSignature] = useState("ECDSA_SIG_CTR_OFFICER_8820");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    if (!storedToken || (storedRole !== "OFFICER" && storedRole !== "INVIGILATOR" && storedRole !== "CONTROLLER")) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole);
    fetchCenterDetails();
    const interval = setInterval(fetchCenterDetails, 4000);
    return () => clearInterval(interval);
  }, [centerId]);

  const fetchCenterDetails = async () => {
    try {
      const resPkg = await fetch(`${BACKEND_URL}/api/packages/${centerId}`);
      if (resPkg.ok) {
        const pkgData = await resPkg.json();
        setPackages(pkgData || []);
      }

      const resCands = await fetch(`${BACKEND_URL}/api/candidates`);
      if (resCands.ok) {
        const candsData = await resCands.json();
        setCandidates(candsData || []);
      }

      const resSeats = await fetch(`${BACKEND_URL}/api/center/seats/map/${centerId}`);
      if (resSeats.ok) {
        const seatsData = await resSeats.json();
        setSeatMap(seatsData || []);
      }

      const resInc = await fetch(`${BACKEND_URL}/api/incidents`);
      if (resInc.ok) {
        const incData = await resInc.json();
        setIncidents((incData || []).filter((r: any) => r.center_id === centerId));
      }
      
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load center details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPackage = async (packageId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/packages/${packageId}/verify`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      alert(`Package Verification Result:\nHash Valid: ${data.hash_valid ? "YES" : "NO"}\nLedger Valid: ${data.audit_chain_valid ? "YES" : "NO"}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleReleasePackage = async (packageId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/packages/${packageId}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          center_id: centerId,
          signature: officerSignature
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Release conditions failed.");
      }

      alert("Envelope package decrypted! Exam papers released and transition logged.");
      fetchCenterDetails();
    } catch (err: any) {
      alert(`Access Blocked: ${err.message}`);
    }
  };

  const handleLockSeatLayout = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/center/seats/lock?center_id=${centerId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to lock seat mapping layout");
      alert("Seat layout locked! Any subsequent seat reassignments will trigger warnings.");
      fetchCenterDetails();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && packages.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-600 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-3" />
        <div className="text-xs font-medium">Synchronizing Exam Center Channels...</div>
      </div>
    );
  }

  const lockedSeatCount = seatMap.filter(s => s.locked).length;
  const isSeatMapLocked = seatMap.length > 0 && lockedSeatCount === seatMap.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 px-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Center Console: <span className="text-indigo-600 font-mono">{centerId}</span>
            </h1>
            <p className="text-xs text-slate-500">Center Officer and Invigilator Management Dashboard</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/safebatch/handoff/HO-2026-0822-0034"
            className="text-xs px-3.5 py-1.5 bg-[#8AD8B8] text-[#132D28] font-bold rounded-md hover:bg-[#a0e8cb] transition cursor-pointer shadow-xs flex items-center gap-1.5 no-underline"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>🔔 SafeBatch Handoff (34)</span>
          </Link>
          {role === "CONTROLLER" && (
            <button onClick={() => router.push("/exam-ops")} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition cursor-pointer font-semibold shadow-xs">
              Ops Room
            </button>
          )}
          <button onClick={() => router.push(`/candidate-verification?center=${centerId}`)} className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition cursor-pointer font-semibold shadow-xs">
            Verify Entry
          </button>
          <button onClick={() => router.push(`/seat-map?center=${centerId}`)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition cursor-pointer font-semibold shadow-xs">
            Seat Planner
          </button>
          <button onClick={() => router.push(`/incidents?center=${centerId}`)} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition cursor-pointer font-semibold shadow-xs">
            Log Incident
          </button>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Operational Handoff Notification Card */}
          <div className="p-4 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.3)] shadow-lg flex items-center justify-between gap-4 text-[#FFF4E2]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                HO
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FFF4E2]">Operational Handoff Assigned: HO-2026-0822-0034</h4>
                <p className="text-[11px] text-[#8AD8B8]/80">Vendor Controller assigned 34 unresolved candidate allocations for superintendent review.</p>
              </div>
            </div>
            <Link
              href="/safebatch/handoff/HO-2026-0822-0034"
              className="px-3 py-1.5 rounded-xl bg-[#8AD8B8] text-[#132D28] font-bold text-xs shadow-sm hover:bg-[#a0e8cb] transition-all no-underline shrink-0"
            >
              Claim & Resolve &rarr;
            </Link>
          </div>
          
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Package control board */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              Center-Bound Sealed Key Packages
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Decryption requests require Center Officer authorization, valid scheduled window times, and zero active security blocks.
            </p>

            <div className="flex flex-col gap-4">
              {packages.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-lg">
                  No encrypted exam packages sealed for this center.
                </div>
              ) : (
                packages.map(pkg => (
                  <div key={pkg.package_id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="text-xs">
                        <div className="text-slate-900 font-bold font-mono">Package ID: {pkg.package_id.slice(0, 14)}...</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Exam: {pkg.exam_id} • Paper: <span className="font-mono">{pkg.paper_id.slice(0, 8)}...</span></div>
                      </div>
                      <StatusBadge status={pkg.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-white p-3 rounded border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Release Window Starts:</span>
                        <div className="text-slate-900 font-medium">{new Date(pkg.valid_from).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Release Window Ends:</span>
                        <div className="text-slate-900 font-medium">{new Date(pkg.valid_until).toLocaleTimeString()}</div>
                      </div>
                    </div>

                    {pkg.status === "SEALED" && (
                      <div className="flex flex-col gap-2 pt-1">
                        <label className="block text-[11px] text-slate-600 font-semibold">Officer Digital Signature</label>
                        <input
                          type="text"
                          value={officerSignature}
                          onChange={(e) => setOfficerSignature(e.target.value)}
                          className="p-2 bg-white border border-slate-200 rounded text-xs text-slate-900 font-mono shadow-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyPackage(pkg.package_id)}
                            className="flex-1 text-xs py-2 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition cursor-pointer font-semibold shadow-xs"
                          >
                            Verify Envelope
                          </button>
                          <button
                            onClick={() => handleReleasePackage(pkg.package_id)}
                            className="flex-1 text-xs py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition cursor-pointer shadow-xs active-press"
                          >
                            Decrypt & Release
                          </button>
                        </div>
                      </div>
                    )}

                    {pkg.status === "RELEASED" && (
                      <div className="text-xs bg-emerald-50 border border-emerald-200 p-3 rounded-md flex flex-col gap-1 text-emerald-950">
                        <div className="text-emerald-800 font-bold uppercase text-[10px]">Decryption Credentials Released</div>
                        <div>Released By: <span className="font-mono font-medium">{pkg.released_by.slice(0, 10)}...</span></div>
                        <div className="break-all font-mono text-[11px] text-slate-600">Signature: {pkg.release_signature}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Seat planner status card */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-900">Seat Map Configuration</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isSeatMapLocked ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>{isSeatMapLocked ? "Locked" : "Unlocked"}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              All candidate desk seat allocations must be locked before package release. Modifying seat lists post-lock triggers audit warning logs.
            </p>
            <div className="flex justify-between items-center text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 font-medium">
              <span>Desks Assigned: {seatMap.length}</span>
              <span>Checked In: {seatMap.filter(s => s.status === "VERIFIED").length}</span>
            </div>
            {!isSeatMapLocked && seatMap.length > 0 && (
              <button
                onClick={handleLockSeatLayout}
                className="w-full py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition cursor-pointer text-xs shadow-xs"
              >
                Lock Seat Map Grid
              </button>
            )}
          </section>

        </div>

        {/* Right Column (1 col) */}
        <div className="flex flex-col gap-6">
          
          {/* Candidate check-in roster */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col max-h-[350px]">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Candidate Check-in Roster</h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 text-xs scrollbar-thin">
              {candidates.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">No candidates registered.</div>
              ) : (
                candidates.map(c => (
                  <div key={c.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-900 font-semibold">{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.anonymous_id}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Local Incidents list */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-h-[300px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Center Incidents Log</span>
            </h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 text-xs leading-relaxed scrollbar-thin">
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">✓ No active incidents reported at this center.</div>
              ) : (
                incidents.map(inc => (
                  <div key={inc.incident_id} className={`p-2.5 rounded-lg border ${
                    inc.status === "RESOLVED" ? "border-slate-200 bg-slate-50 text-slate-500" :
                    inc.severity === "P0_CRITICAL" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}>
                    <div className="font-semibold">{inc.incident_type} ({inc.severity})</div>
                    <p className="mt-1 text-slate-800">{inc.description}</p>
                    <div className="text-[10px] mt-1 text-slate-500">Status: {inc.status}</div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </main>
    </div>
  );
}

export default function CenterConsolePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-600 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-3" />
        <div className="text-xs font-medium">Synchronizing Exam Center Channels...</div>
      </div>
    }>
      <CenterConsoleContent />
    </Suspense>
  );
}
