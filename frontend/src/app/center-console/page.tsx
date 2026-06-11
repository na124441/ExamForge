"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
      // 1. Fetch package status
      const resPkg = await fetch(`${BACKEND_URL}/api/packages/${centerId}`);
      if (resPkg.ok) {
        const pkgData = await resPkg.json();
        setPackages(pkgData || []);
      }

      // 2. Fetch candidates
      const resCands = await fetch(`${BACKEND_URL}/api/candidates`);
      if (resCands.ok) {
        const candsData = await resCands.json();
        // Filter mock candidates enrolled
        setCandidates(candsData || []);
      }

      // 3. Fetch seat assignments
      const resSeats = await fetch(`${BACKEND_URL}/api/center/seats/map/${centerId}`);
      if (resSeats.ok) {
        const seatsData = await resSeats.json();
        setSeatMap(seatsData || []);
      }

      // 4. Fetch center incident logs
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
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">SYNCHRONIZING EXAM CENTER CHANNELS...</div>
      </div>
    );
  }

  const lockedSeatCount = seatMap.filter(s => s.locked).length;
  const isSeatMapLocked = seatMap.length > 0 && lockedSeatCount === seatMap.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-card-bg border-b border-border-color p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏢</span>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Center console: <span className="text-accent-amber font-mono">{centerId}</span>
            </h1>
            <p className="text-xs text-text-muted">Center Officer and Invigilator dashboard room</p>
          </div>
        </div>

        <div className="flex gap-2">
          {role === "CONTROLLER" && (
            <button onClick={() => router.push("/exam-ops")} className="text-xs px-3 py-1.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald rounded hover:bg-accent-emerald/20 transition cursor-pointer font-bold">
              🛰️ Ops room
            </button>
          )}
          <button onClick={() => router.push(`/candidate-verification?center=${centerId}`)} className="text-xs px-3 py-1.5 bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 rounded hover:bg-accent-emerald/30 transition cursor-pointer font-bold">
            👤 Verify entry
          </button>
          <button onClick={() => router.push(`/seat-map?center=${centerId}`)} className="text-xs px-3 py-1.5 bg-accent-amber/15 text-accent-amber border border-accent-amber/30 rounded hover:bg-accent-amber/30 transition cursor-pointer font-bold">
            🪑 Seat planner
          </button>
          <button onClick={() => router.push(`/incidents?center=${centerId}`)} className="text-xs px-3 py-1.5 bg-accent-red/15 text-accent-red border border-accent-red/30 rounded hover:bg-accent-red/30 transition cursor-pointer font-bold">
            ⚠️ Log incident
          </button>
          <button onClick={() => { localStorage.clear(); router.push("/"); }} className="text-xs px-3 py-1.5 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer font-bold">
            Logout
          </button>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Package release and center overview (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {error && (
            <div className="p-4 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          {/* Time lock & Package control board */}
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-amber animate-pulse"></span> Center-Bound Sealed Packages
            </h2>
            <p className="text-xs text-text-muted mb-6">
              Release decryption requests require a Center Officer role, valid scheduled window times, and zero active system anomalies.
            </p>

            <div className="flex flex-col gap-4">
              {packages.length === 0 ? (
                <div className="text-center py-10 text-text-muted text-xs font-mono">
                  No encrypted exam packages sealed for this center. Set up papers in Controller Dashboard.
                </div>
              ) : (
                packages.map(pkg => (
                  <div key={pkg.package_id} className="p-4 bg-background/30 rounded-xl border border-border-color/80 flex flex-col gap-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="font-mono text-xs">
                        <div className="text-white font-bold">Package ID: {pkg.package_id.slice(0, 12)}...</div>
                        <div className="text-[10px] text-text-muted mt-0.5">Exam: {pkg.exam_id} | Paper: {pkg.paper_id.slice(0, 8)}...</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        pkg.status === "RELEASED" ? "bg-accent-emerald text-background" :
                        pkg.status === "REVOKED" ? "bg-accent-red text-background" :
                        "bg-accent-amber text-background"
                      }`}>{pkg.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono leading-normal bg-background/50 p-3 rounded border border-border-color/30">
                      <div>
                        <span className="text-[10px] text-text-muted uppercase">Release starts:</span>
                        <div className="text-white text-[11px]">{new Date(pkg.valid_from).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted uppercase">Release ends:</span>
                        <div className="text-white text-[11px]">{new Date(pkg.valid_until).toLocaleTimeString()}</div>
                      </div>
                    </div>

                    {pkg.status === "SEALED" && (
                      <div className="flex flex-col gap-2">
                        <label className="block text-[10px] text-text-muted uppercase font-mono">Officer digital authorization signature</label>
                        <input
                          type="text"
                          value={officerSignature}
                          onChange={(e) => setOfficerSignature(e.target.value)}
                          className="p-2 bg-background border border-border-color rounded text-xs text-white font-mono"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyPackage(pkg.package_id)}
                            className="flex-1 text-xs py-2 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer font-bold"
                          >
                            Verify envelope
                          </button>
                          <button
                            onClick={() => handleReleasePackage(pkg.package_id)}
                            className="flex-1 text-xs py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer"
                          >
                            Decrypt & Release
                          </button>
                        </div>
                      </div>
                    )}

                    {pkg.status === "RELEASED" && (
                      <div className="text-xs bg-accent-emerald/5 border border-accent-emerald/20 p-3 rounded-lg flex flex-col gap-1 font-mono">
                        <div className="text-accent-emerald font-bold uppercase text-[10px]">Decryption credentials released</div>
                        <div>Released By: <span className="text-white">{pkg.released_by.slice(0, 8)}...</span></div>
                        <div className="break-all">Signature: <span className="text-white/80">{pkg.release_signature}</span></div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Seat planner status card */}
          <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Seat map configuration</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isSeatMapLocked ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20" : "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
              }`}>{isSeatMapLocked ? "LOCKED" : "UNLOCKED"}</span>
            </div>
            <p className="text-xs text-text-muted mb-4">
              All candidate desk seat allocations must be locked before the package key releases. Modifying seat lists post-lock triggers ledger risk alerts.
            </p>
            <div className="flex justify-between items-center font-mono text-xs text-white bg-background/50 p-3 rounded border border-border-color/30 mb-4">
              <span>Desks assigned: {seatMap.length}</span>
              <span>Checked in: {seatMap.filter(s => s.status === "VERIFIED").length}</span>
            </div>
            {!isSeatMapLocked && seatMap.length > 0 && (
              <button
                onClick={handleLockSeatLayout}
                className="w-full py-2 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition cursor-pointer text-xs"
              >
                Lock Seat map Grid
              </button>
            )}
          </section>

        </div>

        {/* Right Column: Local center stats & Incidents (1 col) */}
        <div className="flex flex-col gap-6">
          
          {/* Candidate quick search roster */}
          <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-md flex-1 flex flex-col max-h-[350px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Local Candidate checkin roster</h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 font-mono text-xs">
              {candidates.length === 0 ? (
                <div className="text-center py-10 text-text-muted">No candidates seeded.</div>
              ) : (
                candidates.map(c => (
                  <div key={c.id} className="p-2.5 bg-background/30 rounded border border-border-color/65 flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold">{c.name}</div>
                      <div className="text-[10px] text-text-muted">{c.anonymous_id}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      c.status === "VERIFIED" ? "bg-accent-emerald/10 text-accent-emerald" :
                      c.status === "COMPLETED" ? "bg-indigo-400/10 text-indigo-400" :
                      "bg-accent-red/10 text-accent-red"
                    }`}>{c.status}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Local Incidents list */}
          <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-md max-h-[300px] flex flex-col">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 text-accent-red">Center Incidents log</h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 font-mono text-[11px] leading-relaxed">
              {incidents.length === 0 ? (
                <div className="text-center py-10 text-text-muted">🟢 No incidents reported at this center.</div>
              ) : (
                incidents.map(inc => (
                  <div key={inc.incident_id} className={`p-2.5 rounded border ${
                    inc.status === "RESOLVED" ? "border-border-color bg-background/10 text-text-muted" :
                    inc.severity === "P0_CRITICAL" ? "border-accent-red/50 bg-accent-red/5 text-accent-red" : "border-accent-amber/50 bg-accent-amber/5 text-accent-amber"
                  }`}>
                    <div className="font-bold">{inc.incident_type} ({inc.severity})</div>
                    <p className="mt-1 text-white">{inc.description}</p>
                    <div className="text-[9px] mt-1 opacity-70">Status: {inc.status}</div>
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
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">SYNCHRONIZING EXAM CENTER CHANNELS...</div>
      </div>
    }>
      <CenterConsoleContent />
    </Suspense>
  );
}
