"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

function SeatMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centerId = searchParams.get("center") || "CTR-22";

  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [seatMap, setSeatMap] = useState<any[]>([]);
  
  // Selection
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedCandId, setSelectedCandId] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("VERIFIED");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate 20 seats grid coordinates (Rows A-D, Columns 1-5)
  const rows = ["A", "B", "C", "D"];
  const cols = [1, 2, 3, 4, 5];
  const gridSeats: string[] = [];
  rows.forEach(r => cols.forEach(c => gridSeats.push(`${r}-${c}`)));

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [centerId]);

  const fetchData = async () => {
    try {
      const resCands = await fetch(`${BACKEND_URL}/api/candidates`);
      if (resCands.ok) {
        const candsData = await resCands.json();
        setCandidates(candsData || []);
      }
      
      const resSeats = await fetch(`${BACKEND_URL}/api/center/seats/map/${centerId}`);
      if (resSeats.ok) {
        const seatsData = await resSeats.json();
        setSeatMap(seatsData || []);
        
        const lockedCount = (seatsData || []).filter((s: any) => s.locked).length;
        setIsLocked((seatsData || []).length > 0 && lockedCount === (seatsData || []).length);
      }
    } catch (err) {
      console.error("Failed to load seat layout mapping", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSeat = async () => {
    if (!selectedSeat || !selectedCandId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/center/seats/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          candidate_id: selectedCandId,
          center_id: centerId,
          seat_id: selectedSeat
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Seat assignment failed.");
      }

      alert("Seat successfully assigned!");
      setSelectedSeat(null);
      setSelectedCandId("");
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleMarkAttendance = async (candidateId: string, seatId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/center/seats/mark-attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          seat_id: seatId,
          status: attendanceStatus
        })
      });

      if (!res.ok) throw new Error("Failed to update status");
      alert(`Seat ${seatId} attendance marked as ${attendanceStatus}`);
      setSelectedSeat(null);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleLockLayout = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/center/seats/lock?center_id=${centerId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to lock layout");
      alert("Seat map grid locked successfully!");
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && seatMap.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">LOADING SEAT LAYOUT...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪑</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            Center seat map: <span className="text-accent-amber font-mono">{centerId}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          {!isLocked && seatMap.length > 0 && (
            <button
              onClick={handleLockLayout}
              className="text-xs px-3 py-1 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition cursor-pointer"
            >
              Lock Seat Map
            </button>
          )}
          <button
            onClick={() => router.push(`/center-console?center=${centerId}`)}
            className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer"
          >
            ⬅️ Center console
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Grid: Seat Grid View (2 cols) */}
        <div className="lg:col-span-2 bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Center Room Layout Grid</h2>
              <p className="text-[11px] text-text-muted mt-1">Select a seat coordinate to assign a candidate or mark attendance.</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isLocked ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20" : "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
            }`}>{isLocked ? "LOCKED" : "UNLOCKED"}</span>
          </div>

          {/* Seat Grid Map */}
          <div className="grid grid-cols-5 gap-3 p-4 bg-background/40 rounded-xl border border-border-color/45">
            {gridSeats.map(sId => {
              const assign = seatMap.find(item => item.seat_id === sId);
              
              let seatColor = "border-border-color hover:border-white/20 hover:bg-white/2 text-text-muted";
              if (assign) {
                if (assign.status === "VERIFIED") {
                  seatColor = "border-accent-emerald/50 bg-accent-emerald/5 text-accent-emerald";
                } else if (assign.status === "ABSENT") {
                  seatColor = "border-accent-red/50 bg-accent-red/5 text-accent-red";
                } else if (assign.status === "FLAGGED") {
                  seatColor = "border-accent-red/70 bg-accent-red/10 text-accent-red animate-pulse";
                } else {
                  seatColor = "border-accent-amber/50 bg-accent-amber/5 text-accent-amber";
                }
              }
              if (selectedSeat === sId) {
                seatColor = "border-white bg-white/10 text-white ring-2 ring-white/30";
              }

              return (
                <div
                  key={sId}
                  onClick={() => setSelectedSeat(sId)}
                  className={`p-3 rounded-lg border text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[75px] ${seatColor}`}
                >
                  <span className="font-bold text-xs font-mono">{sId}</span>
                  {assign ? (
                    <span className="text-[9px] font-mono mt-1 text-white truncate max-w-[80px]">
                      {assign.candidate_anonymous_id}
                    </span>
                  ) : (
                    <span className="text-[9px] mt-1 opacity-50">Empty</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-[10px] font-mono font-bold text-text-muted flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-border-color"></span> Empty</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-accent-amber"></span> Assigned</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-accent-emerald"></span> Verified Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-accent-red"></span> Absent</span>
          </div>

        </div>

        {/* Right Side: Seat controls (1 col) */}
        <div className="flex flex-col gap-6">
          {selectedSeat ? (
            <section className="bg-card-bg p-5 rounded-2xl border border-border-color shadow-md flex flex-col gap-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Seat Control: <span className="text-accent-amber">{selectedSeat}</span>
              </h3>

              {/* Find if assigned */}
              {(() => {
                const assign = seatMap.find(item => item.seat_id === selectedSeat);
                if (assign) {
                  return (
                    <div className="flex flex-col gap-3 font-mono text-xs">
                      <div>Candidate Name: <span className="text-white font-bold">{assign.candidate_name}</span></div>
                      <div>Anonymous ID: <span className="text-white">{assign.candidate_anonymous_id}</span></div>
                      <div>Desk Status: <span className="text-white uppercase font-bold">{assign.status}</span></div>

                      <div className="border-t border-border-color/50 pt-3 flex flex-col gap-2">
                        <label className="block text-[10px] text-text-muted uppercase font-bold">Update attendance status</label>
                        <select
                          value={attendanceStatus}
                          onChange={(e) => setAttendanceStatus(e.target.value)}
                          className="w-full p-2 bg-background border border-border-color rounded text-xs text-white"
                        >
                          <option value="VERIFIED">Verified Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="FLAGGED">Flagged suspicious</option>
                        </select>
                        <button
                          onClick={() => handleMarkAttendance(assign.candidate_id, selectedSeat)}
                          className="w-full py-1.5 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-xs"
                        >
                          Update attendance
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex flex-col gap-3 font-mono text-xs">
                      <p className="text-text-muted leading-relaxed">Desk is empty. Assign candidate from enrollment roster:</p>
                      
                      {isLocked ? (
                        <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs text-center leading-normal">
                          ⚠️ Seat Map is LOCKED. Empty seats cannot be assigned now.
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedCandId}
                            onChange={(e) => setSelectedCandId(e.target.value)}
                            className="w-full p-2 bg-background border border-border-color rounded text-xs text-white"
                          >
                            <option value="">-- Choose Candidate --</option>
                            {candidates.filter(c => !seatMap.some(s => s.candidate_id === c.id)).map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.anonymous_id})</option>
                            ))}
                          </select>
                          <button
                            onClick={handleAssignSeat}
                            className="w-full py-1.5 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-xs"
                          >
                            Assign candidate to desk
                          </button>
                        </>
                      )}
                    </div>
                  );
                }
              })()}
            </section>
          ) : (
            <div className="bg-card-bg/50 p-10 rounded-2xl border border-dashed border-border-color flex flex-col items-center justify-center text-center text-text-muted font-mono text-xs">
              <span>🔬 SELECT DESK GRID FOR CONTROLS</span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default function SeatMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">LOADING SEAT LAYOUT...</div>
      </div>
    }>
      <SeatMapContent />
    </Suspense>
  );
}
