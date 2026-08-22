"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { ForgeBadge, BadgeStatus } from "@/components/forge/ForgeBadge";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { cn } from "@/lib/cn";
import {
  Building2,
  Key,
  CheckCircle2,
  Copy,
  ExternalLink,
  Laptop,
  Fingerprint,
  UserCheck,
  Users
} from "lucide-react";

interface Centre {
  id: string;
  name: string;
  location: string;
  halls: number;
  capacity: number;
  status: BadgeStatus;
}

const SAMPLE_CENTRES: Centre[] = [
  { id: "CTR-METRO-01", name: "National Metro Exam Centre", location: "Sector 4, North Wing", halls: 4, capacity: 120, status: "VERIFIED" },
  { id: "CTR-WEST-02", name: "Western Regional Hub", location: "Tech Park, Building B", halls: 2, capacity: 80, status: "PENDING" },
];

interface Hall {
  id: string;
  name: string;
  seatCount: number;
}

const SAMPLE_HALLS: Hall[] = [
  { id: "HALL-A", name: "Science Wing Hall A", seatCount: 40 },
  { id: "HALL-B", name: "Science Wing Hall B", seatCount: 30 },
];

interface SeatRecord {
  seatId: string;
  candidateId: string;
  candidateName: string;
  regNo: string;
  terminalIp: string;
  status: BadgeStatus;
  biometricScore: number;
}

const SAMPLE_SEATS: SeatRecord[] = [
  { seatId: "B-101", candidateId: "CAND-101", candidateName: "Alex Vance", regNo: "EF-2026-9842", terminalIp: "192.168.10.14", status: "VERIFIED", biometricScore: 98.4 },
  { seatId: "B-102", candidateId: "CAND-102", candidateName: "Devon Chen", regNo: "EF-2026-9843", terminalIp: "192.168.10.15", status: "PENDING", biometricScore: 0 },
  { seatId: "B-103", candidateId: "CAND-103", candidateName: "Elena Rostova", regNo: "EF-2026-9844", terminalIp: "192.168.10.16", status: "WARNING", biometricScore: 99.1 },
  { seatId: "B-104", candidateId: "CAND-104", candidateName: "Jordan Smith", regNo: "EF-2026-9845", terminalIp: "192.168.10.17", status: "PENDING", biometricScore: 0 },
  { seatId: "B-105", candidateId: "CAND-105", candidateName: "Priya Sharma", regNo: "EF-2026-9846", terminalIp: "192.168.10.18", status: "VERIFIED", biometricScore: 97.8 }
];

export default function CenterOnboardingConsole() {
  const router = useRouter();
  
  const [selectedCentre, setSelectedCentre] = useState<Centre>(SAMPLE_CENTRES[0]);
  const [seats, setSeats] = useState<SeatRecord[]>(SAMPLE_SEATS);
  const [selectedSeat, setSelectedSeat] = useState<SeatRecord>(SAMPLE_SEATS[0]);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");

  const handleGenerateExamLink = () => {
    if (!selectedSeat) return;
    const randomToken = "EF_TOK_" + Math.random().toString(36).substring(2, 14).toUpperCase() + "_SEC";
    const link = `http://localhost:3000/student-exam?exam_id=EXM-PILOT-01&cand_id=${selectedSeat.candidateId}&token=${randomToken}`;
    setGeneratedLink(link);
    setNotification(`One-Time Exam Token Generated for ${selectedSeat.candidateName}`);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleBiometricCheckin = (seatId: string) => {
    setVerifying(true);
    setTimeout(() => {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatId === seatId
            ? { ...s, status: "VERIFIED", biometricScore: 98.6 }
            : s
        )
      );
      if (selectedSeat?.seatId === seatId) {
        setSelectedSeat((prev) => ({ ...prev, status: "VERIFIED", biometricScore: 98.6 }));
      }
      setVerifying(false);
      setNotification(`Biometric Identity Check-In Verified for Seat ${seatId}`);
    }, 600);
  };

  const centreColumns: ForgeTableColumn<Centre>[] = [
    { key: "id", header: "Centre ID", mono: true },
    { key: "name", header: "Name" },
    { key: "location", header: "Location" },
    { key: "halls", header: "Halls" },
    { key: "capacity", header: "Capacity" },
    { key: "status", header: "Status", render: (row) => <ForgeBadge status={row.status} /> },
    { key: "actions", header: "Actions", render: (row) => (
      <ForgeButton variant="ghost" size="sm" onClick={() => setSelectedCentre(row)}>
        Select
      </ForgeButton>
    )}
  ];

  const hallColumns: ForgeTableColumn<Hall>[] = [
    { key: "id", header: "Hall ID", mono: true },
    { key: "name", header: "Name" },
    { key: "seatCount", header: "Seat Count" }
  ];

  const seatColumns: ForgeTableColumn<SeatRecord>[] = [
    { key: "seatId", header: "Seat ID", mono: true },
    { key: "candidateName", header: "Candidate" },
    { key: "regNo", header: "Reg No", mono: true },
    { key: "terminalIp", header: "Terminal IP", mono: true },
    { key: "status", header: "Status", render: (row) => <ForgeBadge status={row.status} /> },
    { key: "actions", header: "Actions", render: (row) => (
      <ForgeButton variant={selectedSeat?.seatId === row.seatId ? "primary" : "ghost"} size="sm" onClick={() => setSelectedSeat(row)}>
        Manage
      </ForgeButton>
    )}
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] p-6 space-y-[var(--space-6)] font-sans">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--surface-panel)] border border-[var(--border-subtle)] p-6 rounded-[var(--radius-3)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--accent-primary-surface)] text-[var(--accent-primary)] rounded-[var(--radius-2)] flex items-center justify-center border border-[var(--accent-primary-border)]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Centre Management</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Select a centre and manage hall allocations and verify candidates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ForgeButton variant="primary" onClick={() => router.push("/student-exam")}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Launch Student Exam Window
          </ForgeButton>
          <ForgeButton variant="secondary" onClick={() => router.push("/")}>
            Exit to Home
          </ForgeButton>
        </div>
      </header>

      {notification && (
        <div className="bg-[var(--status-success-surface)] border border-[var(--status-success)] text-[var(--status-success-text)] px-4 py-3 rounded-[var(--radius-2)] text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {notification}
          </span>
          <button onClick={() => setNotification("")} className="hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      <div className="space-y-[var(--space-4)]">
        <h2 className="text-lg font-medium text-[var(--text-primary)]">Centres Directory</h2>
        <ForgeTable columns={centreColumns} data={SAMPLE_CENTRES} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-[var(--space-6)]">
          <div className="bg-[var(--surface-panel)] border border-[var(--border-subtle)] rounded-[var(--radius-3)] p-6 shadow-sm space-y-[var(--space-5)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm">
                <Laptop className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>HALL LIST & SEAT COUNTS</span>
              </div>
            </div>
            <ForgeTable columns={hallColumns} data={SAMPLE_HALLS} />
            
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 pt-4">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm">
                <Users className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>CANDIDATE ALLOCATION GRID</span>
              </div>
            </div>
            <ForgeTable columns={seatColumns} data={seats} />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-[var(--space-6)]">
          <div className="bg-[var(--surface-panel)] border border-[var(--border-subtle)] rounded-[var(--radius-3)] p-6 shadow-sm space-y-[var(--space-5)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm">
                <UserCheck className="w-4 h-4 text-[var(--status-success)]" />
                <span>INVIGILATOR VERIFICATION DESK</span>
              </div>
              <ForgeMonoText className="text-xs font-semibold">
                SEAT: {selectedSeat.seatId}
              </ForgeMonoText>
            </div>

            <div className="bg-[var(--surface-elevated)] p-4 rounded-[var(--radius-2)] border border-[var(--border-default)] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Candidate Name:</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedSeat.candidateName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Registration Number:</span>
                <ForgeMonoText className="font-semibold">{selectedSeat.regNo}</ForgeMonoText>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Assigned Terminal:</span>
                <ForgeMonoText>{selectedSeat.terminalIp}</ForgeMonoText>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Biometric Match:</span>
                <span className="text-[var(--accent-primary)] font-medium">
                  {selectedSeat.biometricScore > 0 ? `${selectedSeat.biometricScore}% Match Verified` : "Not Scanned"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Verification Status:</span>
                <ForgeBadge status={selectedSeat.status} />
              </div>
            </div>

            <div className="space-y-[var(--space-3)] pt-2">
              {selectedSeat.status !== "VERIFIED" && selectedSeat.status !== "WARNING" && (
                <ForgeButton
                  variant="primary"
                  className="w-full"
                  disabled={verifying}
                  onClick={() => handleBiometricCheckin(selectedSeat.seatId)}
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  {verifying ? "Verifying Biometrics..." : "Perform Biometric Check-In & Unlock"}
                </ForgeButton>
              )}

              <div className="bg-[var(--surface-elevated)] p-4 rounded-[var(--radius-2)] border border-[var(--border-default)] space-y-3">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2 border-b border-[var(--border-subtle)] pb-2">Generate Exam Link</h3>
                <ForgeInput
                  label="Candidate ID"
                  value={selectedSeat.candidateId}
                  disabled
                  mono
                />
                <ForgeButton
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={handleGenerateExamLink}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Generate Cryptographic Exam Access Link
                </ForgeButton>
              </div>
            </div>

            {generatedLink && (
              <div className="bg-[var(--surface-elevated)] p-4 rounded-[var(--radius-2)] border border-[var(--border-focus)] space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>One-Time Candidate Access Link:</span>
                  <span className="text-[var(--status-warning-text)]">Expires in 180 min</span>
                </div>
                <div className="bg-[var(--surface-panel)] p-2.5 rounded-[var(--radius-1)] border border-[var(--border-subtle)] text-[var(--accent-primary)] break-all select-all text-xs">
                  <ForgeMonoText>{generatedLink}</ForgeMonoText>
                </div>
                <div className="flex gap-2">
                  <ForgeButton
                    variant="secondary"
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? <CheckCircle2 className="w-4 h-4 mr-2 text-[var(--status-success)]" /> : <Copy className="w-4 h-4 mr-2" />}
                    {linkCopied ? "Link Copied!" : "Copy Link"}
                  </ForgeButton>
                  <ForgeButton
                    variant="primary"
                    className="flex-1"
                    onClick={() => router.push(generatedLink.replace("http://localhost:3000", ""))}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Exam Window
                  </ForgeButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
