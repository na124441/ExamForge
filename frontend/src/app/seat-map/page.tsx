"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ForgeMetric } from "@/components/forge/ForgeMetric";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeSelect } from "@/components/forge/ForgeSelect";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { Users, Shield, Laptop, AlertTriangle, RefreshCw, Lock, Server, Cpu, ArrowRightLeft } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

const ROWS = 5;
const COLS = 6;
const SETS = ["A", "B", "C", "D"];

function generateGrid() {
  const grid = [];
  const rows = ["A", "B", "C", "D", "E"];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid.push({
        id: `${rows[r]}-${c + 1}`,
        r,
        c,
        paperSet: SETS[(r + c) % 4]
      });
    }
  }
  return grid;
}

function getFakeIp(r: number, c: number) {
  return `192.168.10.${100 + r * 10 + c}`;
}

function getFakeHash(r: number, c: number) {
  return `0x${(r * 31 + c * 17 + 8912).toString(16)}...${(r + c + 12).toString(16)}`;
}

function SeatMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centerId = searchParams.get("center") || "CTR-22";

  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [seatMap, setSeatMap] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const [gridSeats, setGridSeats] = useState(generateGrid());

  // Selection
  const [selectedSeat, setSelectedSeat] = useState<any | null>(null);
  const [selectedCandId, setSelectedCandId] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("VERIFIED");

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
          seat_id: selectedSeat.id
        })
      });
      if (!res.ok) throw new Error("Seat assignment failed.");
      setSelectedSeat(null);
      setSelectedCandId("");
      fetchData();
    } catch (err: any) {
      console.error(err);
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
      setSelectedSeat(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLockLayout = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/center/seats/lock?center_id=${centerId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to lock layout");
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const reshuffleMatrix = () => {
    const newGrid = [...gridSeats];
    const offsets = [0, 1, 2, 3];
    const offset = offsets[Math.floor(Math.random() * offsets.length)];
    for (let i = 0; i < newGrid.length; i++) {
      newGrid[i].paperSet = SETS[(newGrid[i].r + newGrid[i].c + offset) % 4];
    }
    setGridSeats(newGrid);
  };

  if (loading && seatMap.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex flex-col justify-center items-center font-mono">
        <div className="animate-spin text-4xl mb-4 text-[var(--accent-primary)]">🌀</div>
        <div className="text-sm text-[var(--text-secondary)]">LOADING SEAT LAYOUT...</div>
      </div>
    );
  }

  // Calculate mock metrics based on 30 terminals
  const totalTerminals = ROWS * COLS;
  // Let's assume some seats are occupied based on seatMap, if empty use a mock value 28
  const occupiedSeats = seatMap.length > 0 ? seatMap.length : 28;
  const spareSeats = totalTerminals - occupiedSeats;

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] flex flex-col font-sans">
      <header className="bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--surface-raised)] rounded-md border border-[var(--border-default)]">
            <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Anti-Collusion Seat Map
            </h1>
            <div className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
              Hall B <span className="text-[var(--text-tertiary)]">•</span> Center: <ForgeMonoText text={centerId} />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <ForgeButton
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={reshuffleMatrix}
          >
            Re-shuffle Anti-Collusion Matrix
          </ForgeButton>
          {!isLocked ? (
            <ForgeButton
              variant="primary"
              icon={<Lock className="w-4 h-4" />}
              onClick={handleLockLayout}
            >
              Lock Seating Manifest (Cryptographic Seal)
            </ForgeButton>
          ) : (
            <ForgeBadge variant="success" icon={<Lock className="w-3 h-3" />}>
              Manifest Sealed
            </ForgeBadge>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ForgeMetric 
            label="Total Terminals" 
            value={totalTerminals.toString()} 
            icon={<Laptop className="w-4 h-4" />} 
          />
          <ForgeMetric 
            label="Occupied Seats" 
            value={occupiedSeats.toString()} 
            icon={<Users className="w-4 h-4" />} 
          />
          <ForgeMetric 
            label="Contingency Spares" 
            value={spareSeats.toString()} 
            icon={<Server className="w-4 h-4" />} 
            trend="neutral"
          />
          <ForgeMetric 
            label="Collusion Risk Score" 
            value="0.0%" 
            icon={<AlertTriangle className="w-4 h-4" />} 
            trend="down"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Hall Grid */}
          <div className="lg:col-span-2 bg-[var(--surface-elevated)] p-6 rounded-[var(--radius-3)] border border-[var(--border-default)] flex flex-col gap-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Interactive Hall Grid</h2>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--status-success)]"></span> Verified</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--status-neutral)]"></span> Empty Spare</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--status-warning)]"></span> Offline</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 flex-1 place-content-center">
              {gridSeats.map((seat) => {
                const assign = seatMap.find(item => item.seat_id === seat.id);
                
                // Determine status for visualization
                let statusColor = "bg-[var(--surface-raised)] border-[var(--border-subtle)]";
                let statusIndicator = "bg-[var(--status-neutral)]"; // Empty Spare
                
                if (assign) {
                  if (assign.status === "VERIFIED") {
                    statusColor = "bg-[var(--surface-raised)] border-[var(--status-success)]";
                    statusIndicator = "bg-[var(--status-success)]"; // Verified
                  } else if (assign.status === "ABSENT") {
                    statusColor = "bg-[var(--surface-raised)] border-[var(--status-error)]";
                    statusIndicator = "bg-[var(--status-error)]"; // Absent
                  } else if (assign.status === "FLAGGED") {
                    statusColor = "bg-[var(--status-error)]/10 border-[var(--status-error)]";
                    statusIndicator = "bg-[var(--status-error)] animate-pulse"; // Flagged
                  } else {
                    statusColor = "bg-[var(--surface-raised)] border-[var(--status-warning)]";
                    statusIndicator = "bg-[var(--status-warning)]"; // Assigned / Active
                  }
                }
                
                const isSelected = selectedSeat?.id === seat.id;
                if (isSelected) {
                  statusColor = "bg-[var(--surface-raised)] border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20";
                }

                return (
                  <div
                    key={seat.id}
                    onClick={() => setSelectedSeat(seat)}
                    className={`relative p-3 rounded-[var(--radius-2)] border ${statusColor} cursor-pointer hover:border-[var(--border-strong)] transition-all flex flex-col items-center justify-between min-h-[90px]`}
                  >
                    <div className="w-full flex justify-between items-start">
                      <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">{seat.id}</span>
                      <div className={`w-2 h-2 rounded-full ${statusIndicator}`} />
                    </div>
                    
                    <div className="mt-2 text-center w-full">
                      {assign ? (
                        <div className="text-[10px] font-mono text-[var(--text-primary)] truncate">
                          {assign.candidate_anonymous_id}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[var(--text-tertiary)]">Spare</div>
                      )}
                    </div>
                    
                    <div className="mt-2 w-full flex justify-center">
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-1)]
                        ${seat.paperSet === 'A' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : ''}
                        ${seat.paperSet === 'B' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : ''}
                        ${seat.paperSet === 'C' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : ''}
                        ${seat.paperSet === 'D' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : ''}
                      `}>
                        Set {seat.paperSet}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspector Drawer */}
          <div className="bg-[var(--surface-elevated)] p-5 rounded-[var(--radius-3)] border border-[var(--border-default)] flex flex-col gap-5 shadow-sm">
            <h2 className="text-sm font-medium text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-4">
              Inspector Drawer
            </h2>
            
            {selectedSeat ? (
              <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Selected Terminal</span>
                  <ForgeMonoText text={selectedSeat.id} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Question Paper</span>
                  <ForgeBadge variant="neutral">Set {selectedSeat.paperSet}</ForgeBadge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">IP Address</span>
                  <ForgeMonoText text={getFakeIp(selectedSeat.r, selectedSeat.c)} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Device Hash</span>
                  <ForgeMonoText text={getFakeHash(selectedSeat.r, selectedSeat.c)} />
                </div>
                
                <div className="border-t border-[var(--border-subtle)] pt-4 mt-2">
                  {(() => {
                    const assign = seatMap.find(item => item.seat_id === selectedSeat.id);
                    if (assign) {
                      return (
                        <div className="flex flex-col gap-4">
                          <div>
                            <span className="text-xs text-[var(--text-secondary)] block mb-1">Candidate ID</span>
                            <ForgeMonoText text={assign.candidate_anonymous_id} />
                          </div>
                          
                          <div>
                            <span className="text-xs text-[var(--text-secondary)] block mb-1">Attendance Status</span>
                            <ForgeSelect
                              options={[
                                { label: "Verified Present", value: "VERIFIED" },
                                { label: "Absent", value: "ABSENT" },
                                { label: "Flagged Suspicious", value: "FLAGGED" }
                              ]}
                              value={attendanceStatus}
                              onChange={setAttendanceStatus}
                            />
                          </div>
                          
                          <ForgeButton
                            variant="primary"
                            onClick={() => handleMarkAttendance(assign.candidate_id, selectedSeat.id)}
                            fullWidth
                          >
                            Update Attendance
                          </ForgeButton>

                          <ForgeButton
                            variant="outline"
                            icon={<ArrowRightLeft className="w-4 h-4" />}
                            fullWidth
                            className="mt-2"
                          >
                            Hot-Swap to Contingency Spare
                          </ForgeButton>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="p-3 bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-[var(--radius-2)] text-xs text-[var(--text-secondary)] text-center">
                            Terminal is empty. Assign candidate from roster or designate as active contingency.
                          </div>
                          
                          {!isLocked ? (
                            <>
                              <div>
                                <span className="text-xs text-[var(--text-secondary)] block mb-1">Assign Candidate</span>
                                <ForgeSelect
                                  options={[
                                    { label: "-- Choose Candidate --", value: "" },
                                    ...candidates.filter(c => !seatMap.some(s => s.candidate_id === c.id)).map(c => ({
                                      label: `${c.name} (${c.anonymous_id})`,
                                      value: c.id
                                    }))
                                  ]}
                                  value={selectedCandId}
                                  onChange={setSelectedCandId}
                                />
                              </div>
                              <ForgeButton
                                variant="primary"
                                onClick={handleAssignSeat}
                                fullWidth
                                disabled={!selectedCandId}
                              >
                                Assign Candidate
                              </ForgeButton>
                            </>
                          ) : (
                            <ForgeBadge variant="error" className="w-full justify-center">
                              Seating Manifest is Locked
                            </ForgeBadge>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10 opacity-60">
                <Cpu className="w-8 h-8 text-[var(--text-tertiary)]" />
                <p className="text-xs text-[var(--text-secondary)] max-w-[200px]">
                  Select a terminal from the hall grid to view inspection details and device telemetry.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default function SeatMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--surface-base)] flex flex-col justify-center items-center font-mono">
        <div className="animate-spin text-4xl mb-4 text-[var(--accent-primary)]">🌀</div>
        <div className="text-sm text-[var(--text-secondary)]">LOADING SEAT MAP...</div>
      </div>
    }>
      <SeatMapContent />
    </Suspense>
  );
}
