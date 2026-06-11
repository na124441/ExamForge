"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

function CandidateVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centerId = searchParams.get("center") || "CTR-22";

  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandId, setSelectedCandId] = useState("");
  const [admitCard, setAdmitCard] = useState<any>(null);
  const [seatId, setSeatId] = useState("");
  
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    fetchData();
  }, [centerId]);

  const fetchData = async () => {
    try {
      const resCands = await fetch(`${BACKEND_URL}/api/candidates`);
      if (resCands.ok) {
        const candsData = await resCands.json();
        setCandidates(candsData || []);
      }
      
      const resLogs = await fetch(`${BACKEND_URL}/api/audit/logs`);
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        // Filter verification logs
        setVerificationLogs((logsData || []).filter((l: any) => l.action === "CANDIDATE_VERIFIED"));
      }
      
      setError("");
    } catch (err: any) {
      setError("Failed to synchronize check-in database.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = async (candidateId: string) => {
    setSelectedCandId(candidateId);
    setAdmitCard(null);
    setVerificationResult(null);
    
    if (!candidateId) return;

    try {
      // 1. Generate Admit Card (ECDSA Signed admit card)
      const res = await fetch(`${BACKEND_URL}/api/candidates/generate-admit-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          center_id: centerId
        })
      });
      if (!res.ok) throw new Error("Could not construct admit card.");
      const card = await res.json();
      setAdmitCard(card);
      
      // Auto-assign mock seat if none
      setSeatId(`Seat-${card.registration_number.slice(-4)}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedCandId || !admitCard || !seatId) {
      alert("Please map a seat and scan admit card first.");
      return;
    }

    try {
      // First ensure seat is assigned
      const resSeat = await fetch(`${BACKEND_URL}/api/center/seats/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          candidate_id: selectedCandId,
          center_id: centerId,
          seat_id: seatId
        })
      });
      if (!resSeat.ok) {
        const err = await resSeat.json();
        throw new Error(err.detail || "Seat assignment failed.");
      }

      // Check in
      const resVerify = await fetch(`${BACKEND_URL}/api/center/verify-candidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          candidate_id: selectedCandId,
          center_id: centerId,
          seat_id: seatId,
          admit_card_signature: admitCard.admit_card_signature
        })
      });

      if (!resVerify.ok) {
        const err = await resVerify.json();
        throw new Error(err.detail || "Verification failed");
      }

      const data = await resVerify.json();
      setVerificationResult(data);
      alert("Candidate successfully verified and checked in!");
      fetchData();
    } catch (err: any) {
      alert(`Check-in Blocked: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            Candidate verification: <span className="text-accent-amber font-mono">{centerId}</span>
          </h1>
        </div>
        <button
          onClick={() => router.push(`/center-console?center=${centerId}`)}
          className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer"
        >
          ⬅️ Center console
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Verify Form (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Check in candidate</h2>
              <p className="text-xs text-text-muted mt-1">Select candidate, scan admit card QR signature, map government photo ID, and verify desk seat.</p>
            </div>

            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs font-mono">
                {error}
              </div>
            )}

            <div>
              <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Select Candidate Roster</label>
              <select
                value={selectedCandId}
                onChange={(e) => handleSelectCandidate(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.registration_number}) - Status: {c.status}</option>
                ))}
              </select>
            </div>

            {admitCard && (
              <div className="p-4 bg-background/50 rounded-xl border border-border-color flex flex-col gap-3 font-mono text-xs animate-in fade-in duration-200">
                <div className="text-[10px] text-accent-emerald font-bold uppercase tracking-wider">Admit card QR scan metadata</div>
                <div>Anonymous ID: <span className="text-white">{admitCard.anonymous_id}</span></div>
                <div>Reg number: <span className="text-white">{admitCard.registration_number}</span></div>
                <div>Center ID: <span className="text-white">{admitCard.center_id}</span></div>
                <div>
                  <label className="block text-[10px] text-text-muted uppercase mb-1">Assigned seat desk</label>
                  <input
                    type="text"
                    value={seatId}
                    onChange={(e) => setSeatId(e.target.value)}
                    className="p-1 bg-background border border-border-color rounded text-xs text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase">ECDSA Signature:</span>
                  <div className="text-[10px] text-white/75 break-all mt-0.5 leading-normal">{admitCard.admit_card_signature}</div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="govId" defaultChecked className="cursor-pointer" />
                  <label htmlFor="govId" className="cursor-pointer text-[11px] text-text-muted">Government ID & biometric reference verified</label>
                </div>

                <button
                  onClick={handleCheckIn}
                  className="w-full mt-2 py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer"
                >
                  Verify & Check in Candidate
                </button>
              </div>
            )}

            {verificationResult && (
              <div className="p-4 bg-accent-emerald/5 border border-accent-emerald/30 rounded-xl text-xs font-mono leading-relaxed text-accent-emerald animate-in fade-in duration-200">
                <div className="font-bold text-white uppercase text-[10px] mb-1">Check-in Verification Success</div>
                <div>Verification ID: {verificationResult.verification_id}</div>
                <div className="break-all">Verification Hash: {verificationResult.verification_hash}</div>
              </div>
            )}
          </section>

        </div>

        {/* Right Side: Verification Logs Feed (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Verification ledger logs</h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 font-mono text-[11px] leading-relaxed">
              {verificationLogs.length === 0 ? (
                <div className="text-center py-20 text-text-muted">No check-ins logged yet for this exam day.</div>
              ) : (
                verificationLogs.map((log, idx) => {
                  try {
                    const data = JSON.parse(log.payload_hash); // Mock parsing or text
                    return (
                      <div key={idx} className="p-3 bg-background/50 border border-border-color/60 rounded-xl">
                        <div className="text-accent-emerald font-bold">CANDIDATE_VERIFIED</div>
                        <div className="text-white mt-1">Resource ID: {log.resource_id.slice(0, 12)}...</div>
                        <div className="text-[10px] text-text-muted break-all mt-1">Log Hash: {log.current_hash.slice(0, 16)}...</div>
                      </div>
                    );
                  } catch {
                    return (
                      <div key={idx} className="p-3 bg-background/50 border border-border-color/60 rounded-xl">
                        <div className="text-accent-emerald font-bold">CANDIDATE_VERIFIED</div>
                        <div className="text-white mt-1">Resource ID: {log.resource_id.slice(0, 12)}...</div>
                        <div className="text-[10px] text-text-muted break-all mt-1">Log Hash: {log.current_hash.slice(0, 16)}...</div>
                      </div>
                    );
                  }
                })
              )}
            </div>
          </section>

        </div>

      </main>
    </div>
  );
}

export default function CandidateVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">SYNCHRONIZING EXAM CENTER CHANNELS...</div>
      </div>
    }>
      <CandidateVerificationContent />
    </Suspense>
  );
}
