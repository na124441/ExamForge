"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  Building2, 
  Plus, 
  Cpu, 
  ShieldCheck, 
  Radio, 
  Search, 
  X, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  RefreshCw, 
  Sparkles,
  MapPin,
  Maximize2
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { cn } from "@/lib/cn";

export interface Room {
  id: string;
  name: string;
  rows: number;
  cols: number;
  capacity: number;
}

export interface CenterNode {
  center_id: string;
  name: string;
  location: string;
  invigilator: string;
  status: "VERIFIED" | "PENDING" | "ACTIVE";
  package_status: "RELEASED" | "LOCKED";
  rooms: Room[];
}

export interface StudentSeat {
  seatId: string;
  deskNumber: number;
  centerId: string;
  centerName: string;
  roomId: string;
  roomName: string;
  candidateId: string;
  candidateName: string;
  registrationNumber: string;
  paperSet: "Set A" | "Set B" | "Set C";
  biometricStatus: "VERIFIED" | "IN_PROGRESS" | "ANOMALY" | "VACANT";
  antiCollusionScore: number;
}

const INITIAL_CENTERS: CenterNode[] = [
  {
    center_id: "CTR-DEL-01",
    name: "Delhi Central Tech Institute",
    location: "Delhi (NCR)",
    invigilator: "Dr. R. K. Sharma",
    status: "VERIFIED",
    package_status: "RELEASED",
    rooms: [
      { id: "HALL-A", name: "Main Hall A (North Wing)", rows: 5, cols: 8, capacity: 40 },
      { id: "HALL-B", name: "Hall B (South Wing)", rows: 5, cols: 8, capacity: 40 },
      { id: "ROOM-101", name: "Room 101 (Lab 1)", rows: 5, cols: 8, capacity: 40 }
    ]
  },
  {
    center_id: "CTR-BOM-02",
    name: "Mumbai National Academy",
    location: "Mumbai (West)",
    invigilator: "Prof. S. Kulkarni",
    status: "VERIFIED",
    package_status: "RELEASED",
    rooms: [
      { id: "HALL-1", name: "Grand Auditorium", rows: 6, cols: 8, capacity: 48 },
      { id: "ROOM-204", name: "Room 204 (CS Dept)", rows: 5, cols: 8, capacity: 40 }
    ]
  },
  {
    center_id: "CTR-BLR-03",
    name: "Bangalore Science Center",
    location: "Bangalore (South)",
    invigilator: "Dr. Ananya Rao",
    status: "VERIFIED",
    package_status: "RELEASED",
    rooms: [
      { id: "AUD-1", name: "CV Raman Auditorium", rows: 6, cols: 8, capacity: 48 },
      { id: "ROOM-302", name: "Room 302 (Seminar Hall)", rows: 4, cols: 8, capacity: 32 }
    ]
  },
  {
    center_id: "CTR-MAA-04",
    name: "Chennai Testing Hub",
    location: "Chennai (South)",
    invigilator: "V. Swaminathan",
    status: "PENDING",
    package_status: "LOCKED",
    rooms: [
      { id: "HALL-X", name: "Hall X (Ground Floor)", rows: 5, cols: 8, capacity: 40 },
      { id: "HALL-Y", name: "Hall Y (First Floor)", rows: 5, cols: 8, capacity: 40 }
    ]
  }
];

const MOCK_CANDIDATE_NAMES = [
  "Alexander Vance", "Sophia Martinez", "Liam Chen", "Elena Rostova", "David Kalu",
  "Aarav Patel", "Ananya Iyer", "Benjamin Wright", "Chloe Zhao", "Daniel Kim",
  "Emma Watson", "Farhan Akhtar", "Grace Taylor", "Hannah Abbott", "Ibrahim Ali",
  "Jasmine Kaur", "Karan Malhotra", "Leo Fernandez", "Mia Thorne", "Noah Sterling",
  "Olivia Brooks", "Parth Sharma", "Quinn Fabray", "Rohan Mehta", "Sara Abdullah",
  "Tariq Mansoor", "Umair Siddiqui", "Victoria Pendelton", "William Das", "Xavier Woods",
  "Yash Vardhan", "Zara Khan", "Ayaan Sen", "Bhavna Reddy", "Chirag Gupta",
  "Divya Nair", "Esha Bose", "Faizan Qureshi", "Gautam Gambhir", "Heena Kousar"
];

function generateSeatAllocations(
  centers: CenterNode[], 
  algorithm: "INTERLEAVED_SPIRAL" | "SNAKE_EVEN_ODD" | "PSEUDO_RANDOM"
): StudentSeat[] {
  const seats: StudentSeat[] = [];
  let candidateIndex = 0;
  const paperSets: ("Set A" | "Set B" | "Set C")[] = ["Set A", "Set B", "Set C"];

  centers.forEach((center) => {
    center.rooms.forEach((room) => {
      const totalDesks = room.rows * room.cols;
      for (let d = 1; d <= totalDesks; d++) {
        const name = MOCK_CANDIDATE_NAMES[candidateIndex % MOCK_CANDIDATE_NAMES.length];
        const regNo = `REG-${6000 + candidateIndex + 1}`;
        const candId = `CAND-${6000 + candidateIndex + 1}`;

        // Anti-collusion paper set interleaving
        let paperIndex = 0;
        if (algorithm === "INTERLEAVED_SPIRAL") {
          paperIndex = (d + Math.floor(d / room.cols)) % 3;
        } else if (algorithm === "SNAKE_EVEN_ODD") {
          paperIndex = (d + Math.floor(d / 2)) % 3;
        } else {
          paperIndex = (candidateIndex * 7) % 3;
        }

        const paperSet = paperSets[paperIndex];

        // Biometric status distribution
        let bioStatus: "VERIFIED" | "IN_PROGRESS" | "ANOMALY" | "VACANT" = "VERIFIED";
        const rollCheck = (candidateIndex * 13 + d) % 100;
        if (rollCheck < 5) bioStatus = "ANOMALY";
        else if (rollCheck < 15) bioStatus = "IN_PROGRESS";
        else if (rollCheck < 20) bioStatus = "VACANT";

        seats.push({
          seatId: `${center.center_id}/${room.id}/Desk-${String(d).padStart(3, "0")}`,
          deskNumber: d,
          centerId: center.center_id,
          centerName: center.name,
          roomId: room.id,
          roomName: room.name,
          candidateId: candId,
          candidateName: name,
          registrationNumber: regNo,
          paperSet,
          biometricStatus: bioStatus,
          antiCollusionScore: bioStatus === "ANOMALY" ? 82.4 : 99.8
        });

        candidateIndex++;
      }
    });
  });

  return seats;
}

export function ForgeSeatingEngine() {
  const [centers, setCenters] = useState<CenterNode[]>(INITIAL_CENTERS);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("CTR-DEL-01");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("HALL-A");
  const [algorithm, setAlgorithm] = useState<"INTERLEAVED_SPIRAL" | "SNAKE_EVEN_ODD" | "PSEUDO_RANDOM">("INTERLEAVED_SPIRAL");
  const [allocating, setAllocating] = useState(false);
  const [searchRoster, setSearchRoster] = useState("");
  const [activeView, setActiveView] = useState<"GRID" | "ROSTER">("GRID");

  // Modals state
  const [isAddCenterOpen, setIsAddCenterOpen] = useState(false);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState<StudentSeat | null>(null);

  // New center form state
  const [newCenterId, setNewCenterId] = useState("");
  const [newCenterName, setNewCenterName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newInvigilator, setNewInvigilator] = useState("");
  const [newRoomCount, setNewRoomCount] = useState(2);

  // Seating assignments
  const allSeatAllocations = useMemo(() => {
    return generateSeatAllocations(centers, algorithm);
  }, [centers, algorithm]);

  const currentCenter = useMemo(() => {
    return centers.find(c => c.center_id === selectedCenterId) || centers[0];
  }, [centers, selectedCenterId]);

  const currentRoom = useMemo(() => {
    return currentCenter?.rooms.find(r => r.id === selectedRoomId) || currentCenter?.rooms[0];
  }, [currentCenter, selectedRoomId]);

  const roomSeats = useMemo(() => {
    return allSeatAllocations.filter(
      s => s.centerId === selectedCenterId && s.roomId === (currentRoom?.id || selectedRoomId)
    );
  }, [allSeatAllocations, selectedCenterId, currentRoom, selectedRoomId]);

  const filteredRoster = useMemo(() => {
    if (!searchRoster.trim()) return allSeatAllocations;
    const query = searchRoster.toLowerCase();
    return allSeatAllocations.filter(s => 
      s.candidateName.toLowerCase().includes(query) ||
      s.registrationNumber.toLowerCase().includes(query) ||
      s.centerName.toLowerCase().includes(query) ||
      s.seatId.toLowerCase().includes(query)
    );
  }, [allSeatAllocations, searchRoster]);

  const handleAddCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterId || !newCenterName) return;

    const generatedRooms: Room[] = Array.from({ length: Number(newRoomCount) }).map((_, idx) => ({
      id: `ROOM-${idx + 101}`,
      name: `Hall ${String.fromCharCode(65 + idx)} (${newLocation || "Center"})`,
      rows: 5,
      cols: 8,
      capacity: 40
    }));

    const newCenter: CenterNode = {
      center_id: newCenterId.toUpperCase(),
      name: newCenterName,
      location: newLocation || "Primary Hub",
      invigilator: newInvigilator || "Unassigned",
      status: "VERIFIED",
      package_status: "RELEASED",
      rooms: generatedRooms
    };

    setCenters(prev => [...prev, newCenter]);
    setSelectedCenterId(newCenter.center_id);
    setSelectedRoomId(generatedRooms[0].id);

    // Reset form
    setNewCenterId("");
    setNewCenterName("");
    setNewLocation("");
    setNewInvigilator("");
    setIsAddCenterOpen(false);
  };

  const handleRunAlgorithm = () => {
    setAllocating(true);
    setTimeout(() => {
      setAllocating(false);
    }, 800);
  };

  const centerColumns: ForgeTableColumn<CenterNode>[] = [
    {
      key: "center_id",
      header: "Center Code",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.center_id}</ForgeMonoText>
    },
    {
      key: "name",
      header: "Center Name",
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.name}</div>
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {row.location}
          </div>
        </div>
      )
    },
    {
      key: "rooms",
      header: "Rooms / Capacity",
      render: (row) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {row.rooms.length} Halls ({row.rooms.reduce((acc, r) => acc + r.capacity, 0)} Seats)
        </span>
      )
    },
    {
      key: "invigilator",
      header: "Invigilator",
      render: (row) => <span className="text-xs font-medium text-[var(--text-secondary)]">{row.invigilator}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ForgeStatusPill status={row.status === "VERIFIED" ? "verified" : "scheduled"} />
    }
  ];

  const rosterColumns: ForgeTableColumn<StudentSeat>[] = [
    {
      key: "candidateName",
      header: "Student Name",
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.candidateName}</div>
          <div className="text-xs text-[var(--text-muted)] font-mono">{row.registrationNumber}</div>
        </div>
      )
    },
    {
      key: "centerName",
      header: "Assigned Center",
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{row.centerName}</div>
          <div className="text-xs font-mono text-[var(--text-muted)]">{row.centerId}</div>
        </div>
      )
    },
    {
      key: "roomName",
      header: "Room / Hall",
      render: (row) => <span className="text-xs text-[var(--text-secondary)]">{row.roomName}</span>
    },
    {
      key: "seatId",
      header: "Desk Seat ID",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--accent-primary)]">{row.seatId.split("/").pop()}</ForgeMonoText>
    },
    {
      key: "paperSet",
      header: "Paper Set",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-[var(--surface-interactive)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
          {row.paperSet}
        </span>
      )
    },
    {
      key: "biometricStatus",
      header: "Status",
      render: (row) => (
        <ForgeStatusPill status={
          row.biometricStatus === "VERIFIED" ? "verified" :
          row.biometricStatus === "IN_PROGRESS" ? "processing" :
          row.biometricStatus === "ANOMALY" ? "failed" : "draft"
        } />
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Action & Algorithm Control Bar */}
      <ForgeCard>
        <ForgeCardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <ForgeCardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--accent-primary)]" />
              Anti-Collusion Seating Allocation Engine
            </ForgeCardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Multi-center spatial interleaving algorithm with anti-proximity paper variant distribution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ForgeButton 
              variant="secondary" 
              size="compact" 
              onClick={() => setIsAddCenterOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add New Center
            </ForgeButton>

            <ForgeButton 
              variant="primary" 
              size="compact" 
              onClick={handleRunAlgorithm}
              disabled={allocating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-1.5", allocating && "animate-spin")} />
              {allocating ? "Computing Spatial Matrix..." : "Run Seating Allocation"}
            </ForgeButton>
          </div>
        </ForgeCardHeader>

        <ForgeCardContent className="border-t border-[var(--border-subtle)] pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Algorithm:</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as any)}
              className="px-3 py-1.5 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="INTERLEAVED_SPIRAL">Spiral Anti-Proximity Interleaving (Recommended)</option>
              <option value="SNAKE_EVEN_ODD">Snake-Order Roll Interleaving</option>
              <option value="PSEUDO_RANDOM">Cryptographic Pseudo-Random Spatial Scatter</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 text-[var(--status-operational-text)]">
              <ShieldCheck className="w-4 h-4" /> 100% Anti-Collusion Pass
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span>Total Centers: <strong className="text-[var(--text-primary)]">{centers.length}</strong></span>
            <span className="text-[var(--text-muted)]">•</span>
            <span>Allocated Seats: <strong className="text-[var(--text-primary)]">{allSeatAllocations.length}</strong></span>
          </div>
        </ForgeCardContent>
      </ForgeCard>

      {/* Main View Switcher & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Center & Room Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCenterId}
            onChange={(e) => {
              setSelectedCenterId(e.target.value);
              const c = centers.find(center => center.center_id === e.target.value);
              if (c && c.rooms.length > 0) setSelectedRoomId(c.rooms[0].id);
            }}
            className="px-3 py-2 bg-[var(--surface-panel)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs font-semibold text-[var(--text-primary)] shadow-xs"
          >
            {centers.map(c => (
              <option key={c.center_id} value={c.center_id}>
                {c.center_id} — {c.name} ({c.location})
              </option>
            ))}
          </select>

          {currentCenter && (
            <div className="flex items-center gap-1 bg-[var(--surface-interactive)] p-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
              {currentCenter.rooms.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoomId(r.id)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer",
                    (currentRoom?.id === r.id) 
                      ? "bg-[var(--surface-panel)] text-[var(--accent-primary)] shadow-xs" 
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {r.name.split(" ")[0]} ({r.capacity} Seats)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid vs Roster View Switcher */}
        <div className="flex items-center bg-[var(--surface-interactive)] p-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] shrink-0">
          <button
            onClick={() => setActiveView("GRID")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer flex items-center gap-1.5",
              activeView === "GRID" ? "bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-xs" : "text-[var(--text-muted)]"
            )}
          >
            <Radio className="w-3.5 h-3.5" /> Room Desk Grid
          </button>
          <button
            onClick={() => setActiveView("ROSTER")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer flex items-center gap-1.5",
              activeView === "ROSTER" ? "bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-xs" : "text-[var(--text-muted)]"
            )}
          >
            <Users className="w-3.5 h-3.5" /> All Students Roster
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE DESK GRID */}
      {activeView === "GRID" && currentRoom && (
        <ForgeCard>
          <ForgeCardHeader className="flex justify-between items-center">
            <div>
              <ForgeCardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--accent-primary)]" />
                {currentCenter.name} — {currentRoom.name}
              </ForgeCardTitle>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Click any desk to inspect candidate seat ticket, biometric status, and anti-cheating paper assignment.
              </p>
            </div>
            <ForgeBadge variant="info" label={`${roomSeats.length} / ${currentRoom.capacity} Occupied`} />
          </ForgeCardHeader>

          <ForgeCardContent className="space-y-6">
            {/* Visual Desk Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 bg-[var(--surface-interactive)] p-5 border border-[var(--border-subtle)] rounded-[var(--radius-card)]">
              {roomSeats.map((seat) => {
                let statusBg = "bg-[var(--surface-panel)] border-[var(--border-default)] text-[var(--text-primary)]";
                if (seat.biometricStatus === "VERIFIED") {
                  statusBg = "bg-[var(--accent-primary-surface)] border-[var(--accent-primary-border)] text-[var(--accent-primary)] font-semibold";
                } else if (seat.biometricStatus === "IN_PROGRESS") {
                  statusBg = "bg-[var(--surface-interactive)] border-[var(--border-default)] text-[var(--text-primary)]";
                } else if (seat.biometricStatus === "ANOMALY") {
                  statusBg = "bg-[var(--surface-interactive)] border-slate-300 text-[var(--text-primary)] font-bold";
                }

                return (
                  <div
                    key={seat.seatId}
                    onClick={() => setSelectedSeatDetails(seat)}
                    className={cn(
                      "group p-2.5 rounded-[var(--radius-control)] border flex flex-col justify-between transition-all cursor-pointer hover:scale-105 hover:shadow-md",
                      statusBg
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold">Desk #{seat.deskNumber}</span>
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[var(--surface-panel)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                        {seat.paperSet}
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="text-xs font-bold truncate group-hover:text-[var(--accent-primary)]">
                        {seat.candidateName.split(" ")[0]}
                      </div>
                      <div className="text-[10px] font-mono opacity-70 truncate">{seat.registrationNumber}</div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-semibold">
                      <span className="capitalize">{seat.biometricStatus.toLowerCase()}</span>
                      <Maximize2 className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="p-3 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-control)] text-xs flex flex-wrap justify-between items-center gap-3">
              <span className="text-[var(--text-muted)] font-medium">Grid Legend:</span>
              <div className="flex items-center gap-4 font-medium text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" /> Verified Biometric</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--surface-panel)] border border-[var(--border-default)]" /> In-Progress</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--text-disabled)]" /> Vacant Desk</span>
              </div>
            </div>
          </ForgeCardContent>
        </ForgeCard>
      )}

      {/* VIEW 2: ALL STUDENTS SEAT ROSTER TABLE */}
      {activeView === "ROSTER" && (
        <ForgeCard>
          <ForgeCardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <ForgeCardTitle>Master Candidate Seat Allocation Roster</ForgeCardTitle>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Complete student index with assigned center, hall, desk seat number, and paper set.
              </p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, reg no, or seat..."
                value={searchRoster}
                onChange={(e) => setSearchRoster(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </ForgeCardHeader>

          <ForgeCardContent className="p-0">
            <ForgeTable columns={rosterColumns} data={filteredRoster} keyField="seatId" />
          </ForgeCardContent>
        </ForgeCard>
      )}

      {/* MODAL 1: ADD NEW CENTER DIALOG */}
      {isAddCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-panel)] shadow-xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--accent-primary)]" />
                Register New Examination Center
              </h3>
              <button 
                onClick={() => setIsAddCenterOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCenter} className="space-y-4 text-xs">
              <ForgeInput
                label="Center Code (e.g. CTR-KOL-05)"
                placeholder="CTR-KOL-05"
                value={newCenterId}
                onChange={(e) => setNewCenterId(e.target.value)}
                required
              />

              <ForgeInput
                label="Center Institution Name"
                placeholder="Kolkata Regional Engineering College"
                value={newCenterName}
                onChange={(e) => setNewCenterName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <ForgeInput
                  label="Location / City"
                  placeholder="Kolkata (East)"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
                <ForgeInput
                  label="Invigilator Name"
                  placeholder="Dr. S. Bannerjee"
                  value={newInvigilator}
                  onChange={(e) => setNewInvigilator(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Number of Examination Halls/Rooms</label>
                <select
                  value={newRoomCount}
                  onChange={(e) => setNewRoomCount(Number(e.target.value))}
                  className="w-full p-2 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] font-medium"
                >
                  <option value={2}>2 Halls (80 Seats)</option>
                  <option value={3}>3 Halls (120 Seats)</option>
                  <option value={4}>4 Halls (160 Seats)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
                <ForgeButton 
                  type="button" 
                  variant="secondary" 
                  size="compact" 
                  onClick={() => setIsAddCenterOpen(false)}
                >
                  Cancel
                </ForgeButton>
                <ForgeButton type="submit" variant="primary" size="compact">
                  Create & Allocation Map
                </ForgeButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CANDIDATE SEAT INSPECTION TICKET */}
      {selectedSeatDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-panel)] shadow-xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Candidate Desk Seat Pass</h3>
              </div>
              <button 
                onClick={() => setSelectedSeatDetails(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-[var(--text-primary)]">{selectedSeatDetails.candidateName}</div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">{selectedSeatDetails.registrationNumber}</div>
                </div>
                <ForgeStatusPill status={
                  selectedSeatDetails.biometricStatus === "VERIFIED" ? "verified" :
                  selectedSeatDetails.biometricStatus === "IN_PROGRESS" ? "processing" : "failed"
                } />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[var(--surface-panel)] p-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Assigned Center</span>
                  <span className="font-semibold text-[var(--text-primary)] block mt-0.5">{selectedSeatDetails.centerName}</span>
                  <ForgeMonoText className="text-[10px]">{selectedSeatDetails.centerId}</ForgeMonoText>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Hall & Desk</span>
                  <span className="font-semibold text-[var(--accent-primary)] block mt-0.5">{selectedSeatDetails.roomName}</span>
                  <ForgeMonoText className="text-[10px]">Desk #{selectedSeatDetails.deskNumber}</ForgeMonoText>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--surface-interactive)] rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Anti-Cheating Paper Set</span>
                  <span className="font-bold text-sm font-mono text-[var(--text-primary)] block mt-0.5">
                    {selectedSeatDetails.paperSet}
                  </span>
                </div>
                <div className="p-3 bg-[var(--surface-interactive)] rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Proximity Integrity</span>
                  <span className="font-bold text-sm font-mono text-[var(--status-operational-text)] block mt-0.5">
                    {selectedSeatDetails.antiCollusionScore}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block mb-1">Cryptographic Seat Checksum</span>
                <div className="p-2.5 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-control)] text-[10px] font-mono text-[var(--text-secondary)] break-all">
                  {selectedSeatDetails.seatId}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <ForgeButton 
                variant="primary" 
                size="compact" 
                onClick={() => setSelectedSeatDetails(null)}
              >
                Close Pass
              </ForgeButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
