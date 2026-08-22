"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Radio, 
  Clock, 
  ShieldAlert, 
  PauseCircle, 
  PlayCircle, 
  Send, 
  Camera, 
  Eye, 
  X, 
  CheckCircle2, 
  BellRing,
  Server
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { cn } from "@/lib/cn";

export interface CenterStreamNode {
  centerId: string;
  centerName: string;
  location: string;
  connectedStudents: number;
  totalSeats: number;
  networkLatency: number; // ms
  cctvStreamStatus: "LIVE_1080P" | "BUFFERING" | "OFFLINE";
  proctorStatus: "ACTIVE" | "WARNING" | "OFFLINE";
  activeIncidents: number;
}

export interface ProctoringAlert {
  id: string;
  timestamp: string;
  candidateId: string;
  candidateName: string;
  registrationNumber: string;
  centerId: string;
  centerName: string;
  deskId: string;
  alertType: "MULTIPLE_FACES" | "GAZE_DEVIATION" | "BLUETOOTH_SIGNAL" | "TAB_SWITCH" | "IMPERSONATION_RISK";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "OPEN" | "WARNED" | "TERMINATED" | "RESOLVED";
}

const INITIAL_CENTER_STREAMS: CenterStreamNode[] = [
  {
    centerId: "CTR-DEL-01",
    centerName: "Delhi Central Tech Institute",
    location: "Delhi (NCR)",
    connectedStudents: 118,
    totalSeats: 120,
    networkLatency: 12,
    cctvStreamStatus: "LIVE_1080P",
    proctorStatus: "ACTIVE",
    activeIncidents: 1
  },
  {
    centerId: "CTR-BOM-02",
    centerName: "Mumbai National Academy",
    location: "Mumbai (West)",
    connectedStudents: 86,
    totalSeats: 88,
    networkLatency: 18,
    cctvStreamStatus: "LIVE_1080P",
    proctorStatus: "ACTIVE",
    activeIncidents: 0
  },
  {
    centerId: "CTR-BLR-03",
    centerName: "Bangalore Science Center",
    location: "Bangalore (South)",
    connectedStudents: 79,
    totalSeats: 80,
    networkLatency: 15,
    cctvStreamStatus: "LIVE_1080P",
    proctorStatus: "ACTIVE",
    activeIncidents: 0
  },
  {
    centerId: "CTR-MAA-04",
    centerName: "Chennai Testing Hub",
    location: "Chennai (South)",
    connectedStudents: 74,
    totalSeats: 75,
    networkLatency: 42,
    cctvStreamStatus: "BUFFERING",
    proctorStatus: "WARNING",
    activeIncidents: 2
  }
];

const INITIAL_PROCTORING_ALERTS: ProctoringAlert[] = [
  {
    id: "ALT-901",
    timestamp: "14:22:04",
    candidateId: "CAND-6014",
    candidateName: "Alexander Vance",
    registrationNumber: "REG-6014",
    centerId: "CTR-DEL-01",
    centerName: "Delhi Central Tech",
    deskId: "Desk #14",
    alertType: "MULTIPLE_FACES",
    severity: "CRITICAL",
    status: "OPEN"
  },
  {
    id: "ALT-902",
    timestamp: "14:20:18",
    candidateId: "CAND-6045",
    candidateName: "Elena Rostova",
    registrationNumber: "REG-6045",
    centerId: "CTR-MAA-04",
    centerName: "Chennai Testing Hub",
    deskId: "Desk #08",
    alertType: "GAZE_DEVIATION",
    severity: "HIGH",
    status: "OPEN"
  },
  {
    id: "ALT-903",
    timestamp: "14:18:50",
    candidateId: "CAND-6088",
    candidateName: "Liam Chen",
    registrationNumber: "REG-6088",
    centerId: "CTR-MAA-04",
    centerName: "Chennai Testing Hub",
    deskId: "Desk #22",
    alertType: "BLUETOOTH_SIGNAL",
    severity: "CRITICAL",
    status: "OPEN"
  }
];

export function ForgeExamConductWorkbench() {
  const [examStatus, setExamStatus] = useState<"LIVE" | "PAUSED" | "LOCKED">("LIVE");
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(6138); // 1h 42m 18s
  const [centerStreams, setCenterStreams] = useState<CenterStreamNode[]>(INITIAL_CENTER_STREAMS);
  const [alerts, setAlerts] = useState<ProctoringAlert[]>(INITIAL_PROCTORING_ALERTS);

  // Modals & Drawers state
  const [selectedCandidateAlert, setSelectedCandidateAlert] = useState<ProctoringAlert | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("ALL_CENTERS");
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Live countdown timer
  useEffect(() => {
    if (examStatus !== "LIVE") return;
    const interval = setInterval(() => {
      setTimeRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [examStatus]);

  // Format seconds to HH:MM:SS
  const formattedTimeRemaining = useMemo(() => {
    const hrs = Math.floor(timeRemainingSeconds / 3600);
    const mins = Math.floor((timeRemainingSeconds % 3600) / 60);
    const secs = timeRemainingSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [timeRemainingSeconds]);

  const totalConnected = useMemo(() => {
    return centerStreams.reduce((acc, c) => acc + c.connectedStudents, 0);
  }, [centerStreams]);

  const totalSeats = useMemo(() => {
    return centerStreams.reduce((acc, c) => acc + c.totalSeats, 0);
  }, [centerStreams]);

  const handlePauseExam = () => {
    setExamStatus(prev => (prev === "LIVE" ? "PAUSED" : "LIVE"));
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setIsBroadcastOpen(false);
      setBroadcastMessage("");
    }, 1200);
  };

  const handleIssueWarning = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "WARNED" } : a));
    setSelectedCandidateAlert(null);
  };

  const handleTerminateSession = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "TERMINATED" } : a));
    setSelectedCandidateAlert(null);
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "RESOLVED" } : a));
    setSelectedCandidateAlert(null);
  };

  const centerColumns: ForgeTableColumn<CenterStreamNode>[] = [
    {
      key: "centerId",
      header: "Center Code",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.centerId}</ForgeMonoText>
    },
    {
      key: "centerName",
      header: "Center Name & Location",
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.centerName}</div>
          <div className="text-xs text-[var(--text-muted)]">{row.location}</div>
        </div>
      )
    },
    {
      key: "connectedStudents",
      header: "Live Connections",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
          {row.connectedStudents} / {row.totalSeats}
        </span>
      )
    },
    {
      key: "cctvStreamStatus",
      header: "CCTV Video Feed",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{row.cctvStreamStatus}</span>
        </div>
      )
    },
    {
      key: "networkLatency",
      header: "Latency",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
          {row.networkLatency}ms
        </span>
      )
    },
    {
      key: "proctorStatus",
      header: "Proctor Sync",
      render: (row) => <ForgeStatusPill status={row.proctorStatus === "ACTIVE" ? "live" : "processing"} />
    }
  ];

  const alertColumns: ForgeTableColumn<ProctoringAlert>[] = [
    {
      key: "timestamp",
      header: "Time",
      mono: true,
      render: (row) => <ForgeMonoText className="text-xs">{row.timestamp}</ForgeMonoText>
    },
    {
      key: "candidateName",
      header: "Candidate & Reg No",
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.candidateName}</div>
          <div className="text-xs text-[var(--text-muted)] font-mono">{row.registrationNumber}</div>
        </div>
      )
    },
    {
      key: "centerName",
      header: "Center & Desk",
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{row.centerName}</div>
          <div className="text-xs text-[var(--accent-primary)] font-mono font-semibold">{row.deskId}</div>
        </div>
      )
    },
    {
      key: "alertType",
      header: "AI Flagged Intercept",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-[var(--accent-primary-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary-border)]">
          {row.alertType.replace("_", " ")}
        </span>
      )
    },
    {
      key: "status",
      header: "Action Status",
      render: (row) => (
        <ForgeStatusPill status={
          row.status === "OPEN" ? "scheduled" :
          row.status === "WARNED" ? "locked" :
          row.status === "TERMINATED" ? "failed" : "verified"
        } />
      )
    },
    {
      key: "action",
      header: "Inspect",
      render: (row) => (
        <ForgeButton 
          size="compact" 
          variant="secondary" 
          onClick={() => setSelectedCandidateAlert(row)}
        >
          <Eye className="w-3.5 h-3.5 mr-1 text-[var(--accent-primary)]" /> Inspect Session
        </ForgeButton>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Clean White & Blue Telemetry Header */}
      <ForgeCard>
        <ForgeCardHeader className="flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <ForgeCardTitle className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Radio className="w-5 h-5 text-[var(--accent-primary)]" />
                Live Exam Conduct & Proctored Operations
              </ForgeCardTitle>
              <ForgeStatusPill status={examStatus === "LIVE" ? "live" : "locked"} />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
              Exam Session ID: EXM-001-LIVE • 80 Nodes Synchronized • Real-Time AI Proctoring Interceptor Active
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Countdown Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-control)] bg-[var(--accent-primary-surface)] border border-[var(--accent-primary-border)] text-[var(--accent-primary)] font-medium">
              <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-xs font-semibold uppercase">Remaining:</span>
              <span className="text-base font-bold font-mono text-[var(--accent-primary)]">{formattedTimeRemaining}</span>
            </div>

            <ForgeButton 
              variant="secondary" 
              size="compact" 
              onClick={() => setIsBroadcastOpen(true)}
            >
              <BellRing className="w-4 h-4 mr-1.5 text-[var(--accent-primary)]" />
              Broadcast Alert
            </ForgeButton>

            <ForgeButton 
              variant={examStatus === "LIVE" ? "secondary" : "primary"} 
              size="compact" 
              onClick={handlePauseExam}
            >
              {examStatus === "LIVE" ? (
                <>
                  <PauseCircle className="w-4 h-4 mr-1.5 text-[var(--accent-primary)]" /> Pause Workstations
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-1.5" /> Resume Workstations
                </>
              )}
            </ForgeButton>
          </div>
        </ForgeCardHeader>

        <ForgeCardContent className="border-t border-[var(--border-subtle)] pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[var(--text-primary)]">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Live Connected Workstations</span>
            <span className="text-2xl font-bold font-mono text-[var(--accent-primary)] mt-0.5 block">{totalConnected.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-sans font-normal">/ {totalSeats.toLocaleString()}</span></span>
          </div>

          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Active Center Proctors</span>
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-0.5 block">80 / 80 Nodes</span>
          </div>

          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Average Cluster Latency</span>
            <span className="text-2xl font-bold font-mono text-[var(--accent-primary)] mt-0.5 block">14 ms</span>
          </div>

          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Flagged AI Intercepts</span>
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-0.5 block">
              {alerts.filter(a => a.status === "OPEN").length} Open Flags
            </span>
          </div>
        </ForgeCardContent>
      </ForgeCard>

      {/* Flagged AI Proctoring Intercepts */}
      <ForgeCard>
        <ForgeCardHeader className="flex justify-between items-center">
          <div>
            <ForgeCardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
              <ShieldAlert className="w-5 h-5 text-[var(--accent-primary)]" />
              Live AI Malpractice Interceptor Stream
            </ForgeCardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Real-time facial recognition, multi-face detection, and Bluetooth spatial anomaly alerts
            </p>
          </div>
          <ForgeBadge variant="info" label={`${alerts.filter(a => a.status === "OPEN").length} Open Intercepts`} />
        </ForgeCardHeader>

        <ForgeCardContent className="p-0">
          <ForgeTable columns={alertColumns} data={alerts} keyField="id" />
        </ForgeCardContent>
      </ForgeCard>

      {/* Live Center Video Stream Telemetry */}
      <ForgeCard>
        <ForgeCardHeader>
          <ForgeCardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[var(--accent-primary)]" />
            Live Examination Center Video & Proctor Telemetry
          </ForgeCardTitle>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Real-time 1080p CCTV feeds, network bandwidth, and proctor synchronization across all centers
          </p>
        </ForgeCardHeader>

        <ForgeCardContent className="p-0">
          <ForgeTable columns={centerColumns} data={centerStreams} keyField="centerId" />
        </ForgeCardContent>
      </ForgeCard>

      {/* MODAL 1: INSPECT CANDIDATE SESSION & MALPRACTICE DRAWER */}
      {selectedCandidateAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-panel)] shadow-xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">AI Proctoring Intercept Details</h3>
              </div>
              <button 
                onClick={() => setSelectedCandidateAlert(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Candidate Banner */}
              <div className="p-4 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-[var(--text-primary)]">{selectedCandidateAlert.candidateName}</div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">{selectedCandidateAlert.registrationNumber} • {selectedCandidateAlert.candidateId}</div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-bold font-mono bg-[var(--accent-primary-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary-border)]">
                  {selectedCandidateAlert.alertType.replace("_", " ")}
                </span>
              </div>

              {/* Location & Seat Details */}
              <div className="grid grid-cols-2 gap-3 bg-[var(--surface-panel)] p-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Test Center</span>
                  <span className="font-semibold text-[var(--text-primary)] block mt-0.5">{selectedCandidateAlert.centerName}</span>
                  <ForgeMonoText className="text-[10px]">{selectedCandidateAlert.centerId}</ForgeMonoText>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Desk & Time</span>
                  <span className="font-semibold text-[var(--accent-primary)] block mt-0.5">{selectedCandidateAlert.deskId}</span>
                  <ForgeMonoText className="text-[10px]">{selectedCandidateAlert.timestamp}</ForgeMonoText>
                </div>
              </div>

              {/* Intercept Proof Details */}
              <div className="p-3.5 bg-[var(--surface-interactive)] rounded-[var(--radius-control)] border border-[var(--border-subtle)] space-y-2">
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[var(--accent-primary)]" /> Malpractice Signature Analysis
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  OpenCV AI Proctoring detected secondary face contour at angle +34° relative to workstation webcam stream. High confidence anomaly score (94.2%).
                </p>
              </div>

              {/* Controller Action Buttons */}
              <div className="pt-2 grid grid-cols-3 gap-2">
                <ForgeButton 
                  variant="secondary" 
                  size="compact" 
                  onClick={() => handleDismissAlert(selectedCandidateAlert.id)}
                >
                  Dismiss Alert
                </ForgeButton>

                <ForgeButton 
                  variant="secondary" 
                  size="compact"
                  onClick={() => handleIssueWarning(selectedCandidateAlert.id)}
                >
                  Issue Warning
                </ForgeButton>

                <ForgeButton 
                  variant="primary" 
                  size="compact" 
                  onClick={() => handleTerminateSession(selectedCandidateAlert.id)}
                >
                  Terminate Exam
                </ForgeButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BROADCAST EMERGENCY ALERT TO ALL CENTERS */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-panel)] shadow-xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[var(--accent-primary)]" />
                Broadcast Controller Notice
              </h3>
              <button 
                onClick={() => setIsBroadcastOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Broadcast Target Scope</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full p-2 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] font-medium"
                >
                  <option value="ALL_CENTERS">All 80 Examination Centers & Proctors</option>
                  <option value="ALL_CANDIDATES">All 38,940 Student Workstations</option>
                  <option value="SUPERINTENDENTS">Center Superintendents Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Announcement Message</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Attention candidates: A 10-minute time extension has been granted due to regional network delays."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full p-3 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-sans"
                />
              </div>

              {broadcastSent && (
                <div className="p-3 bg-[var(--accent-primary-surface)] border border-[var(--accent-primary-border)] text-[var(--accent-primary)] rounded-[var(--radius-control)] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Message Broadcasted to {broadcastTarget.replace("_", " ")}!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
                <ForgeButton 
                  type="button" 
                  variant="secondary" 
                  size="compact" 
                  onClick={() => setIsBroadcastOpen(false)}
                >
                  Cancel
                </ForgeButton>
                <ForgeButton type="submit" variant="primary" size="compact">
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Transmit Announcement
                </ForgeButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
