"use client";

import React, { useState, useMemo } from "react";
import { 
  Fingerprint, 
  Camera, 
  FileSignature, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  RefreshCw, 
  Lock, 
  ShieldCheck, 
  Upload, 
  Save, 
  X, 
  Search, 
  UserCheck, 
  UserX,
  Scan,
  Sparkles,
  Sliders,
  Check
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { cn } from "@/lib/cn";

export interface CandidateBiometricRecord {
  id: string;
  registrationNumber: string;
  candidateName: string;
  governmentId: string;
  centerId: string;
  centerName: string;
  deskId: string;
  faceMatchPercent: number;
  thumbprintMatchPercent: number;
  signatureMatchPercent: number;
  status: "VERIFIED" | "ANOMALY_FLAGGED" | "PENDING_RECAPTURE";
  photoUrl: string;
  thumbprintUrl: string;
  signatureUrl: string;
  lastAnalyzedTimestamp: string;
}

const INITIAL_BIOMETRIC_RECORDS: CandidateBiometricRecord[] = [
  {
    id: "CAND-6014",
    registrationNumber: "REG-2026-6014",
    candidateName: "Alexander Vance",
    governmentId: "ID-9981-4412",
    centerId: "CTR-DEL-01",
    centerName: "Delhi Central Tech Institute",
    deskId: "Desk #14",
    faceMatchPercent: 98.6,
    thumbprintMatchPercent: 99.2,
    signatureMatchPercent: 97.4,
    status: "VERIFIED",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    thumbprintUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=150&auto=format&fit=crop&q=80",
    lastAnalyzedTimestamp: "2026-08-20 14:10:02"
  },
  {
    id: "CAND-6045",
    registrationNumber: "REG-2026-6045",
    candidateName: "Elena Rostova",
    governmentId: "ID-8812-7741",
    centerId: "CTR-BOM-02",
    centerName: "Mumbai National Academy",
    deskId: "Desk #08",
    faceMatchPercent: 64.2,
    thumbprintMatchPercent: 58.1,
    signatureMatchPercent: 88.0,
    status: "ANOMALY_FLAGGED",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    thumbprintUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=150&auto=format&fit=crop&q=80",
    lastAnalyzedTimestamp: "2026-08-20 14:15:30"
  },
  {
    id: "CAND-6088",
    registrationNumber: "REG-2026-6088",
    candidateName: "Liam Chen",
    governmentId: "ID-1102-9934",
    centerId: "CTR-BLR-03",
    centerName: "Bangalore Science Center",
    deskId: "Desk #22",
    faceMatchPercent: 99.1,
    thumbprintMatchPercent: 98.8,
    signatureMatchPercent: 99.4,
    status: "VERIFIED",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    thumbprintUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=150&auto=format&fit=crop&q=80",
    lastAnalyzedTimestamp: "2026-08-20 14:18:11"
  },
  {
    id: "CAND-6112",
    registrationNumber: "REG-2026-6112",
    candidateName: "Sophia Martinez",
    governmentId: "ID-3341-8890",
    centerId: "CTR-MAA-04",
    centerName: "Chennai Testing Hub",
    deskId: "Desk #30",
    faceMatchPercent: 82.0,
    thumbprintMatchPercent: 44.5,
    signatureMatchPercent: 91.2,
    status: "PENDING_RECAPTURE",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    thumbprintUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80",
    signatureUrl: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=150&auto=format&fit=crop&q=80",
    lastAnalyzedTimestamp: "2026-08-20 14:21:44"
  }
];

export function ForgeBiometricAnalysisStudio() {
  const [records, setRecords] = useState<CandidateBiometricRecord[]>(INITIAL_BIOMETRIC_RECORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [analyzingRecordId, setAnalyzingRecordId] = useState<string | null>(null);

  // Editor Modal Window state
  const [editingRecord, setEditingRecord] = useState<CandidateBiometricRecord | null>(null);
  const [formName, setFormName] = useState("");
  const [formGovId, setFormGovId] = useState("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formStatus, setFormStatus] = useState<"VERIFIED" | "ANOMALY_FLAGGED" | "PENDING_RECAPTURE">("VERIFIED");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const handleOpenEditor = (record: CandidateBiometricRecord) => {
    setEditingRecord(record);
    setFormName(record.candidateName);
    setFormGovId(record.governmentId);
    setFormPhotoUrl(record.photoUrl);
    setFormStatus(record.status);
    setSavedSuccess(false);
  };

  const handleReanalyzeAI = (id: string) => {
    setAnalyzingRecordId(id);
    setTimeout(() => {
      setRecords(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            faceMatchPercent: Number((95 + Math.random() * 4.5).toFixed(1)),
            thumbprintMatchPercent: Number((96 + Math.random() * 3.8).toFixed(1)),
            signatureMatchPercent: Number((94 + Math.random() * 5.2).toFixed(1)),
            status: "VERIFIED",
            lastAnalyzedTimestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
          };
        }
        return r;
      }));
      setAnalyzingRecordId(null);
    }, 800);
  };

  const handleSaveModifiedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setRecords(prev => prev.map(r => {
      if (r.id === editingRecord.id) {
        return {
          ...r,
          candidateName: formName,
          governmentId: formGovId,
          photoUrl: formPhotoUrl,
          status: formStatus,
          lastAnalyzedTimestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
        };
      }
      return r;
    }));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setEditingRecord(null);
    }, 1000);
  };

  const columns: ForgeTableColumn<CandidateBiometricRecord>[] = [
    {
      key: "registrationNumber",
      header: "Registration & Candidate ID",
      mono: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)] font-sans">{row.candidateName}</div>
          <div className="text-xs text-[var(--accent-primary)] font-mono font-bold">{row.registrationNumber}</div>
        </div>
      )
    },
    {
      key: "centerName",
      header: "Center & Desk",
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{row.centerName}</div>
          <div className="text-xs text-[var(--text-muted)] font-mono">{row.centerId} • {row.deskId}</div>
        </div>
      )
    },
    {
      key: "faceMatchPercent",
      header: "Photo Match",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Camera className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className={cn(
            "font-bold",
            row.faceMatchPercent >= 90 ? "text-[var(--accent-primary)]" : "text-amber-600"
          )}>
            {row.faceMatchPercent}%
          </span>
        </div>
      )
    },
    {
      key: "thumbprintMatchPercent",
      header: "Thumbprint Match",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Fingerprint className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className={cn(
            "font-bold",
            row.thumbprintMatchPercent >= 90 ? "text-[var(--accent-primary)]" : "text-amber-600"
          )}>
            {row.thumbprintMatchPercent}%
          </span>
        </div>
      )
    },
    {
      key: "signatureMatchPercent",
      header: "Digital Signature",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <FileSignature className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="font-bold text-[var(--text-primary)]">{row.signatureMatchPercent}%</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Verification",
      render: (row) => (
        <ForgeStatusPill status={
          row.status === "VERIFIED" ? "verified" :
          row.status === "ANOMALY_FLAGGED" ? "failed" : "processing"
        } />
      )
    },
    {
      key: "action",
      header: "Analyze & Modify",
      render: (row) => (
        <ForgeButton 
          size="compact" 
          variant="secondary" 
          onClick={() => handleOpenEditor(row)}
        >
          <Scan className="w-3.5 h-3.5 mr-1 text-[var(--accent-primary)]" /> Inspect Window
        </ForgeButton>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">Total Enrolled Candidates</span>
          <span className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">38,940</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">Biometric Verified Check-Ins</span>
          <span className="text-xl font-bold font-mono text-[var(--accent-primary)] mt-0.5">38,620 (99.2%)</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">Impersonation Alerts</span>
          <span className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">
            {records.filter(r => r.status === "ANOMALY_FLAGGED").length} Flagged
          </span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-wider">Minutiae Quality Index</span>
          <span className="text-xl font-bold font-mono text-[var(--accent-primary)] mt-0.5">98.4 / 100</span>
        </div>
      </div>

      {/* Main Candidate Registry Table & Search */}
      <ForgeCard>
        <ForgeCardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <ForgeCardTitle className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[var(--accent-primary)]" />
              Candidate Biometric Audit & Storage Roster
            </ForgeCardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select any candidate record to analyze photos, thumbprints, digital signatures, or modify identity metadata.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search Candidate, Roll No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-medium"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="ANOMALY_FLAGGED">Anomaly Flagged</option>
              <option value="PENDING_RECAPTURE">Pending Recapture</option>
            </select>
          </div>
        </ForgeCardHeader>

        <ForgeCardContent className="p-0">
          <ForgeTable columns={columns} data={filteredRecords} keyField="id" />
        </ForgeCardContent>
      </ForgeCard>

      {/* BEAUTIFUL WINDOW — BIOMETRIC ANALYSIS & DATA EDITOR MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-panel)] shadow-xl p-6 space-y-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--surface-elevated)] z-10">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Scan className="w-5 h-5 text-[var(--accent-primary)]" />
                  Biometric Analysis & Identity Management Window
                </h3>
                <ForgeMonoText className="text-xs text-[var(--text-muted)]">
                  Candidate ID: {editingRecord.id} • Ref: {editingRecord.registrationNumber}
                </ForgeMonoText>
              </div>
              <button 
                onClick={() => setEditingRecord(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Point Biometric Visual Inspection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Photo 1: Facial Recognition */}
              <div className="p-4 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[var(--accent-primary)]" /> Photo Match
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                      {editingRecord.faceMatchPercent}%
                    </span>
                  </div>
                  <div className="w-full aspect-square bg-[var(--surface-panel)] rounded-[var(--radius-control)] border border-[var(--border-default)] overflow-hidden relative flex items-center justify-center">
                    <img 
                      src={formPhotoUrl || editingRecord.photoUrl} 
                      alt="Candidate Face" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-xs rounded text-[9px] font-mono text-white flex justify-between">
                      <span>Landmarks: 68 Pts</span>
                      <span>Liveness: Pass</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Facial Recognition Vector Distance: <strong className="text-[var(--text-primary)] font-mono">0.042</strong>
                </div>
              </div>

              {/* Photo 2: Minutiae Thumbprint */}
              <div className="p-4 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4 text-[var(--accent-primary)]" /> AFIS Thumbprint
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                      {editingRecord.thumbprintMatchPercent}%
                    </span>
                  </div>
                  <div className="w-full aspect-square bg-[var(--surface-panel)] rounded-[var(--radius-control)] border border-[var(--border-default)] overflow-hidden relative flex items-center justify-center">
                    <img 
                      src={editingRecord.thumbprintUrl} 
                      alt="Candidate Thumbprint" 
                      className="w-full h-full object-cover opacity-90 contrast-125"
                    />
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-xs rounded text-[9px] font-mono text-white flex justify-between">
                      <span>Bifurcations: 34</span>
                      <span>Endings: 28</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  AFIS Minutiae Quality Index: <strong className="text-[var(--text-primary)] font-mono">98/100</strong>
                </div>
              </div>

              {/* Photo 3: Digital Signature */}
              <div className="p-4 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <FileSignature className="w-4 h-4 text-[var(--accent-primary)]" /> Digital Signature
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                      {editingRecord.signatureMatchPercent}%
                    </span>
                  </div>
                  <div className="w-full aspect-square bg-[var(--surface-panel)] rounded-[var(--radius-control)] border border-[var(--border-default)] overflow-hidden relative flex items-center justify-center p-2">
                    <img 
                      src={editingRecord.signatureUrl} 
                      alt="Candidate Signature" 
                      className="w-full h-full object-contain filter invert dark:invert-0"
                    />
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-xs rounded text-[9px] font-mono text-white flex justify-between">
                      <span>Stroke Speed: 1.2m/s</span>
                      <span>Pressure: Dynamic</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Signature Stroke Hash: <strong className="text-[var(--text-primary)] font-mono">0x44A1...</strong>
                </div>
              </div>

            </div>

            {/* Form Section: Modify Candidate Biometric & Identity Data */}
            <form onSubmit={handleSaveModifiedRecord} className="p-5 bg-[var(--surface-panel)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-4 text-xs">
              <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
                Modify Candidate Identity & Biometric Record
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Full Candidate Name</label>
                  <ForgeInput
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Government ID Number</label>
                  <ForgeInput
                    type="text"
                    value={formGovId}
                    onChange={(e) => setFormGovId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Photo URL Baseline</label>
                  <ForgeInput
                    type="text"
                    value={formPhotoUrl}
                    onChange={(e) => setFormPhotoUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Verification Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full p-2 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] font-medium"
                  >
                    <option value="VERIFIED">VERIFIED (Cleared)</option>
                    <option value="ANOMALY_FLAGGED">ANOMALY_FLAGGED (Flagged Impersonation)</option>
                    <option value="PENDING_RECAPTURE">PENDING_RECAPTURE (Require Recapture)</option>
                  </select>
                </div>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-[var(--accent-primary-surface)] border border-[var(--accent-primary-border)] text-[var(--accent-primary)] rounded-[var(--radius-control)] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Biometric Profile Saved & Chained to Ledger!
                </div>
              )}

              <div className="pt-3 flex justify-between items-center border-t border-[var(--border-subtle)]">
                <ForgeButton 
                  type="button" 
                  variant="secondary" 
                  size="compact" 
                  onClick={() => handleReanalyzeAI(editingRecord.id)}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[var(--accent-primary)]" /> Live AI Vector Re-Scan
                </ForgeButton>

                <div className="flex gap-2">
                  <ForgeButton 
                    type="button" 
                    variant="secondary" 
                    size="compact" 
                    onClick={() => setEditingRecord(null)}
                  >
                    Cancel
                  </ForgeButton>

                  <ForgeButton type="submit" variant="primary" size="compact">
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Save & Store Biometric Record
                  </ForgeButton>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
