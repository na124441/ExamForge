"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { ForgeBadge, BadgeStatus } from "@/components/forge/ForgeBadge";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeStepIndicator, Step } from "@/components/forge/ForgeStepIndicator";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database
} from "lucide-react";

interface OMRRow {
  questionNo: number;
  densities: { [opt: string]: number }; // e.g. {A: 92, B: 4, C: 6, D: 2}
  detectedChoice: string;
  confidence: number;
  isAmbiguous: boolean;
  status: BadgeStatus;
}

const INITIAL_OMR_DATA: OMRRow[] = [
  { questionNo: 1, densities: { A: 94.2, B: 2.1, C: 1.8, D: 3.5 }, detectedChoice: "A", confidence: 0.98, isAmbiguous: false, status: "VERIFIED" },
  { questionNo: 2, densities: { A: 4.1, B: 91.5, C: 3.2, D: 1.1 }, detectedChoice: "B", confidence: 0.96, isAmbiguous: false, status: "VERIFIED" },
  { questionNo: 3, densities: { A: 42.0, B: 3.1, C: 88.4, D: 4.0 }, detectedChoice: "C", confidence: 0.58, isAmbiguous: true, status: "WARNING" }, // Ambiguous secondary mark!
  { questionNo: 4, densities: { A: 2.5, B: 1.9, C: 2.1, D: 95.0 }, detectedChoice: "D", confidence: 0.99, isAmbiguous: false, status: "VERIFIED" },
  { questionNo: 5, densities: { A: 12.0, B: 9.5, C: 14.0, D: 8.0 }, detectedChoice: "SKIPPED", confidence: 0.95, isAmbiguous: false, status: "VERIFIED" },
  { questionNo: 6, densities: { A: 89.1, B: 4.5, C: 2.0, D: 1.0 }, detectedChoice: "A", confidence: 0.94, isAmbiguous: false, status: "VERIFIED" },
  { questionNo: 7, densities: { A: 3.0, B: 93.4, C: 2.1, D: 1.5 }, detectedChoice: "B", confidence: 0.97, isAmbiguous: false, status: "VERIFIED" },
  { questionNo: 8, densities: { A: 2.0, B: 1.5, C: 96.2, D: 2.0 }, detectedChoice: "C", confidence: 0.99, isAmbiguous: false, status: "VERIFIED" },
  { questionNo: 9, densities: { A: 48.5, B: 52.0, C: 3.0, D: 1.0 }, detectedChoice: "AMBIGUOUS", confidence: 0.45, isAmbiguous: true, status: "WARNING" }, // Double marked!
  { questionNo: 10, densities: { A: 1.5, B: 2.0, C: 3.1, D: 92.8 }, detectedChoice: "D", confidence: 0.96, isAmbiguous: false, status: "VERIFIED" }
];

export default function OMRScannerConsole() {
  const router = useRouter();
  const [omrRows, setOmrRows] = useState<OMRRow[]>(INITIAL_OMR_DATA);
  const [candidateId, setCandidateId] = useState<string>("CAND-101 (Alex Vance)");
  const [examId, setExamId] = useState<string>("EXM-PILOT-01");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cvStep, setCvStep] = useState<number>(4);
  const [ingestionStatus, setIngestionStatus] = useState<string>("");

  const handleSimulateScan = () => {
    setIsScanning(true);
    setCvStep(1);
    setTimeout(() => setCvStep(2), 600);
    setTimeout(() => setCvStep(3), 1200);
    setTimeout(() => {
      setCvStep(4);
      setIsScanning(false);
      setIngestionStatus("OpenCV Extraction & Bubble Quantification Complete. 2 Ambiguities Detected.");
    }, 1800);
  };

  const handleResolveAmbiguity = (qNo: number, manualChoice: string) => {
    setOmrRows((prev) =>
      prev.map((r) =>
        r.questionNo === qNo
          ? { ...r, detectedChoice: manualChoice, isAmbiguous: false, confidence: 1.0, status: "VERIFIED" }
          : r
      )
    );
  };

  const ambiguousCount = omrRows.filter((r) => r.isAmbiguous).length;
  const confidentCount = omrRows.filter((r) => !r.isAmbiguous && r.detectedChoice !== "SKIPPED").length;

  const steps: Step[] = [
    { label: "Perspective Warp", status: cvStep > 1 ? "completed" : cvStep === 1 ? "current" : "pending" },
    { label: "Thresholding", status: cvStep > 2 ? "completed" : cvStep === 2 ? "current" : "pending" },
    { label: "Grid Extraction", status: cvStep > 3 ? "completed" : cvStep === 3 ? "current" : "pending" },
    { label: "Density Analysis", status: cvStep > 4 || (!isScanning && cvStep === 4) ? "completed" : cvStep === 4 ? "current" : "pending" },
  ];

  const omrColumns: ForgeTableColumn<OMRRow>[] = [
    { key: "questionNo", header: "Q #", mono: true },
    { key: "optA", header: "Option A %", mono: true, render: (row) => `${row.densities.A || 0}%` },
    { key: "optB", header: "Option B %", mono: true, render: (row) => `${row.densities.B || 0}%` },
    { key: "optC", header: "Option C %", mono: true, render: (row) => `${row.densities.C || 0}%` },
    { key: "optD", header: "Option D %", mono: true, render: (row) => `${row.densities.D || 0}%` },
    { key: "detectedChoice", header: "Detected", mono: true, render: (row) => <span className={row.isAmbiguous ? "text-[var(--status-warning-text)]" : "text-[var(--status-success-text)]"}>{row.detectedChoice}</span> },
    { key: "status", header: "Status", render: (row) => <ForgeBadge status={row.status} /> }
  ];

  const ambiguityColumns: ForgeTableColumn<OMRRow>[] = [
    { key: "questionNo", header: "Q #", mono: true },
    { key: "detectedChoice", header: "Issue", mono: true, render: (row) => "Ambiguous Mark" },
    { key: "actions", header: "Resolve", render: (row) => (
      <div className="flex gap-1">
        {["A", "B", "C", "D"].map((opt) => (
          <ForgeButton key={opt} variant="secondary" size="sm" onClick={() => handleResolveAmbiguity(row.questionNo, opt)}>
            {opt}
          </ForgeButton>
        ))}
      </div>
    )}
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] p-6 space-y-[var(--space-6)] font-sans">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--surface-panel)] border border-[var(--border-subtle)] p-6 rounded-[var(--radius-3)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--accent-primary-surface)] text-[var(--accent-primary)] rounded-[var(--radius-2)] flex items-center justify-center border border-[var(--accent-primary-border)]">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">OMR Pipeline</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Automated Computer Vision Extraction & Quantization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ForgeButton variant="primary" onClick={handleSimulateScan} disabled={isScanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Processing CV..." : "Scan & Quantify OMR Sheet"}
          </ForgeButton>
          <ForgeButton variant="secondary" onClick={() => router.push("/")}>
            Exit to Home
          </ForgeButton>
        </div>
      </header>

      {ingestionStatus && (
        <div className="bg-[var(--status-success-surface)] border border-[var(--status-success)] text-[var(--status-success-text)] px-4 py-3 rounded-[var(--radius-2)] text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {ingestionStatus}
          </span>
          <button onClick={() => setIngestionStatus("")} className="hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      <div className="bg-[var(--surface-panel)] border border-[var(--border-subtle)] rounded-[var(--radius-3)] p-6 shadow-sm flex flex-col gap-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">Pipeline Status</h3>
        <ForgeStepIndicator steps={steps} className="py-2" />
        
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Upload New OMR Sheet</label>
          <input type="file" className="block w-full max-w-sm text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-2)] file:border-0 file:text-sm file:font-semibold file:bg-[var(--surface-elevated)] file:text-[var(--text-primary)] hover:file:bg-[var(--surface-hover)] border border-[var(--border-default)] rounded-[var(--radius-2)] p-1 bg-[var(--surface-base)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-[var(--space-6)]">
          <div className="bg-[var(--surface-panel)] border border-[var(--border-subtle)] rounded-[var(--radius-3)] p-6 shadow-sm space-y-[var(--space-5)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm">
                <Database className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>BUBBLE DENSITY MATRIX</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[var(--status-success-text)] font-semibold">{confidentCount} Confident</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-[var(--status-warning-text)] font-semibold">{ambiguousCount} Ambiguous</span>
              </div>
            </div>

            <ForgeTable columns={omrColumns} data={omrRows} />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-[var(--space-6)]">
          <div className="bg-[var(--surface-panel)] border border-[var(--border-subtle)] rounded-[var(--radius-3)] p-6 shadow-sm space-y-[var(--space-5)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-sm font-medium text-[var(--text-primary)] uppercase tracking-wider">
                Sheet Metadata & Ambiguity Queue
              </h3>
              <ForgeMonoText className="text-[10px] font-semibold text-[var(--status-success-text)]">HASH VERIFIED</ForgeMonoText>
            </div>

            <div className="bg-[var(--surface-elevated)] p-4 rounded-[var(--radius-2)] border border-[var(--border-default)] space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Candidate:</span>
                <span className="text-[var(--text-primary)] font-semibold">{candidateId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Exam Code:</span>
                <ForgeMonoText className="text-[var(--accent-primary)]">{examId}</ForgeMonoText>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Image SHA-256:</span>
                <ForgeMonoText className="truncate max-w-[140px]">0x7fa2b89c3e...</ForgeMonoText>
              </div>
            </div>

            {ambiguousCount > 0 && (
              <div className="space-y-[var(--space-3)] pt-2">
                <div className="flex items-center gap-2 text-[var(--status-warning-text)] font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Resolution Queue</span>
                </div>
                <ForgeTable columns={ambiguityColumns} data={omrRows.filter(r => r.isAmbiguous)} />
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
              <ForgeButton
                variant="primary"
                className="w-full"
                onClick={() => alert("OMR sheet marks successfully calculated, signed, and ingested into Results Database!")}
              >
                <Database className="w-4 h-4 mr-2" />
                Commit & Sign Marks to Result Database
              </ForgeButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
