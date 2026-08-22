"use client";

import React, { useState, useMemo } from "react";
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileCheck, 
  Eye, 
  RefreshCw, 
  Lock, 
  Users, 
  Zap, 
  X, 
  Check, 
  BookOpen, 
  Award,
  Sparkles,
  Layers,
  ChevronRight
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { cn } from "@/lib/cn";

export interface EvaluationConflict {
  id: string;
  bookletId: string;
  anonymousToken: string;
  evaluatorAScore: number;
  evaluatorBScore: number;
  scoreDelta: number;
  conflictType: "SCORE_MISMATCH" | "OMR_DOUBLE_BUBBLE" | "RUBRIC_DIVERGENCE";
  status: "OPEN" | "RESOLVED" | "LOCKED";
  finalScore?: number;
}

export interface EvaluatorNode {
  evaluatorId: string;
  evaluatorName: string;
  copiesGraded: number;
  averageSpeedMin: number;
  agreementRatePercent: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
}

const INITIAL_CONFLICTS: EvaluationConflict[] = [
  {
    id: "CNF-101",
    bookletId: "BKL-8891",
    anonymousToken: "ANON-7712-X",
    evaluatorAScore: 74,
    evaluatorBScore: 88,
    scoreDelta: 14,
    conflictType: "SCORE_MISMATCH",
    status: "OPEN"
  },
  {
    id: "CNF-102",
    bookletId: "BKL-4412",
    anonymousToken: "ANON-3391-Y",
    evaluatorAScore: 62,
    evaluatorBScore: 65,
    scoreDelta: 3,
    conflictType: "OMR_DOUBLE_BUBBLE",
    status: "OPEN"
  },
  {
    id: "CNF-103",
    bookletId: "BKL-9021",
    anonymousToken: "ANON-1102-Z",
    evaluatorAScore: 91,
    evaluatorBScore: 78,
    scoreDelta: 13,
    conflictType: "RUBRIC_DIVERGENCE",
    status: "OPEN"
  }
];

const INITIAL_EVALUATORS: EvaluatorNode[] = [
  { evaluatorId: "EV-01", evaluatorName: "Panel A — Prof. V. K. Nambiar", copiesGraded: 420, averageSpeedMin: 4.2, agreementRatePercent: 98.4, status: "ACTIVE" },
  { evaluatorId: "EV-02", evaluatorName: "Panel B — Dr. Meera Deshmukh", copiesGraded: 395, averageSpeedMin: 4.5, agreementRatePercent: 97.9, status: "ACTIVE" },
  { evaluatorId: "EV-03", evaluatorName: "Panel C — Dr. Rajesh Sengupta", copiesGraded: 410, averageSpeedMin: 4.1, agreementRatePercent: 99.1, status: "ACTIVE" },
  { evaluatorId: "EV-04", evaluatorName: "Panel D — Prof. Aris Thorne", copiesGraded: 380, averageSpeedMin: 4.8, agreementRatePercent: 96.5, status: "ACTIVE" }
];

export function ForgeEvaluationControlStudio() {
  const [conflicts, setConflicts] = useState<EvaluationConflict[]>(INITIAL_CONFLICTS);
  const [evaluators, setEvaluators] = useState<EvaluatorNode[]>(INITIAL_EVALUATORS);
  const [selectedConflict, setSelectedConflict] = useState<EvaluationConflict | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"CONFLICTS" | "EVALUATORS" | "OMR_REVIEW">("CONFLICTS");

  const totalCopies = 38940;
  const completedCopies = 31152;
  const completionPercentage = Math.round((completedCopies / totalCopies) * 100);

  const handleRunSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 700);
  };

  const handleResolveConflict = (conflictId: string, resolvedScore: number) => {
    setConflicts(prev => prev.map(c => {
      if (c.id === conflictId) {
        return {
          ...c,
          status: "RESOLVED",
          finalScore: resolvedScore
        };
      }
      return c;
    }));
    setSelectedConflict(null);
  };

  const conflictColumns: ForgeTableColumn<EvaluationConflict>[] = [
    {
      key: "id",
      header: "Conflict Ref",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.id}</ForgeMonoText>
    },
    {
      key: "bookletId",
      header: "Booklet & Token",
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.bookletId}</div>
          <div className="text-xs font-mono text-[var(--text-muted)]">{row.anonymousToken}</div>
        </div>
      )
    },
    {
      key: "scores",
      header: "Evaluator A vs Evaluator B",
      render: (row) => (
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded bg-[var(--surface-interactive)] border border-[var(--border-subtle)] font-bold text-[var(--text-primary)]">
            A: {row.evaluatorAScore} M
          </span>
          <span className="text-[var(--text-muted)]">vs</span>
          <span className="px-2 py-0.5 rounded bg-[var(--surface-interactive)] border border-[var(--border-subtle)] font-bold text-[var(--text-primary)]">
            B: {row.evaluatorBScore} M
          </span>
          <span className="text-xs font-bold text-[var(--accent-primary)] font-sans">
            (Δ = {row.scoreDelta} M)
          </span>
        </div>
      )
    },
    {
      key: "conflictType",
      header: "Discrepancy Category",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-[var(--accent-primary-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary-border)]">
          {row.conflictType.replace("_", " ")}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <ForgeStatusPill status={row.status === "RESOLVED" ? "verified" : "scheduled"} />
      )
    },
    {
      key: "action",
      header: "Senior Override",
      render: (row) => (
        <ForgeButton 
          size="compact" 
          variant={row.status === "RESOLVED" ? "secondary" : "primary"}
          onClick={() => {
            setSelectedConflict(row);
            setOverrideScore(Math.round((row.evaluatorAScore + row.evaluatorBScore) / 2));
          }}
        >
          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect & Certify
        </ForgeButton>
      )
    }
  ];

  const evaluatorColumns: ForgeTableColumn<EvaluatorNode>[] = [
    {
      key: "evaluatorId",
      header: "Panel ID",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.evaluatorId}</ForgeMonoText>
    },
    {
      key: "evaluatorName",
      header: "Evaluator Panel Lead",
      render: (row) => <span className="font-semibold text-[var(--text-primary)]">{row.evaluatorName}</span>
    },
    {
      key: "copiesGraded",
      header: "Booklets Graded",
      render: (row) => <span className="font-mono text-xs font-bold">{row.copiesGraded} Copies</span>
    },
    {
      key: "averageSpeedMin",
      header: "Avg Speed",
      render: (row) => <span className="font-mono text-xs text-[var(--text-secondary)]">{row.averageSpeedMin} mins / copy</span>
    },
    {
      key: "agreementRatePercent",
      header: "Agreement Rate",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
          {row.agreementRatePercent}% Match
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ForgeStatusPill status="verified" />
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Studio Header & Completion Bar */}
      <ForgeCard>
        <ForgeCardHeader className="flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <ForgeCardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--accent-primary)]" />
              Double-Blind Evaluation & Grading Control Studio
            </ForgeCardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Double evaluation rubrics sync, OMR bubble scan verification, and senior controller conflict resolution
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ForgeButton 
              variant="secondary" 
              size="compact" 
              onClick={handleRunSync}
              disabled={syncing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-1.5", syncing && "animate-spin text-[var(--accent-primary)]")} />
              {syncing ? "Syncing Score Matrices..." : "Run AI Evaluator Sync"}
            </ForgeButton>

            <ForgeButton variant="primary" size="compact">
              <Lock className="w-4 h-4 mr-1.5" />
              Seal Certified Grade Ledger
            </ForgeButton>
          </div>
        </ForgeCardHeader>

        <ForgeCardContent className="border-t border-[var(--border-subtle)] pt-4 space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-[var(--text-primary)]">Double-Evaluation Completion Progress</span>
              <span className="font-mono font-bold text-[var(--accent-primary)]">
                {completedCopies.toLocaleString()} / {totalCopies.toLocaleString()} ({completionPercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-[var(--surface-interactive)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div 
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Tab Switcher & Stats */}
          <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
            <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 text-[var(--accent-primary)] font-bold">
                <CheckCircle2 className="w-4 h-4" /> 45 Evaluators Online
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span>Open Conflicts: <strong className="text-[var(--text-primary)]">{conflicts.filter(c => c.status === "OPEN").length} Cases</strong></span>
              <span className="text-[var(--text-muted)]">•</span>
              <span>OMR Accuracy: <strong className="text-[var(--accent-primary)]">99.4% Auto-Verified</strong></span>
            </div>

            <div className="flex items-center bg-[var(--surface-interactive)] p-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
              <button
                onClick={() => setActiveTab("CONFLICTS")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer flex items-center gap-1.5",
                  activeTab === "CONFLICTS" ? "bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-xs" : "text-[var(--text-muted)]"
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Score Conflicts ({conflicts.filter(c => c.status === "OPEN").length})
              </button>
              <button
                onClick={() => setActiveTab("EVALUATORS")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer flex items-center gap-1.5",
                  activeTab === "EVALUATORS" ? "bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-xs" : "text-[var(--text-muted)]"
                )}
              >
                <Users className="w-3.5 h-3.5" /> Evaluator Panels (45)
              </button>
            </div>
          </div>
        </ForgeCardContent>
      </ForgeCard>

      {/* TAB 1: EVALUATION CONFLICTS TABLE */}
      {activeTab === "CONFLICTS" && (
        <ForgeCard>
          <ForgeCardHeader className="flex justify-between items-center">
            <div>
              <ForgeCardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--accent-primary)]" />
                Score Discrepancy & Conflict Resolution Queue
              </ForgeCardTitle>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Booklets where Evaluator A and Evaluator B scores differ by Δ &gt; 5% or OMR double-marks occurred
              </p>
            </div>
            <ForgeBadge variant="info" label={`${conflicts.filter(c => c.status === "OPEN").length} Pending Resolution`} />
          </ForgeCardHeader>

          <ForgeCardContent className="p-0">
            <ForgeTable columns={conflictColumns} data={conflicts} keyField="id" />
          </ForgeCardContent>
        </ForgeCard>
      )}

      {/* TAB 2: EVALUATOR PANELS PERFORMANCE */}
      {activeTab === "EVALUATORS" && (
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-primary)]" />
              Active Double-Blind Evaluator Panels
            </ForgeCardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Live grading speed, booklet throughput, and inter-evaluator agreement rates
            </p>
          </ForgeCardHeader>

          <ForgeCardContent className="p-0">
            <ForgeTable columns={evaluatorColumns} data={evaluators} keyField="evaluatorId" />
          </ForgeCardContent>
        </ForgeCard>
      )}

      {/* INSPECT BOOKLET & SENIOR OVERRIDE MODAL */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-panel)] shadow-xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Senior Controller Score Certification</h3>
              </div>
              <button 
                onClick={() => setSelectedConflict(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Booklet Banner */}
              <div className="p-4 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-[var(--text-primary)]">Booklet {selectedConflict.bookletId}</div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">{selectedConflict.anonymousToken}</div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-bold font-mono bg-[var(--accent-primary-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary-border)]">
                  {selectedConflict.conflictType.replace("_", " ")}
                </span>
              </div>

              {/* Side by side score breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--surface-panel)] rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Evaluator A Score</span>
                  <span className="font-bold text-lg font-mono text-[var(--text-primary)] block mt-1">
                    {selectedConflict.evaluatorAScore} M
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">Panel A — Dr. Nambiar</span>
                </div>

                <div className="p-3 bg-[var(--surface-panel)] rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Evaluator B Score</span>
                  <span className="font-bold text-lg font-mono text-[var(--text-primary)] block mt-1">
                    {selectedConflict.evaluatorBScore} M
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold">Panel B — Dr. Deshmukh</span>
                </div>
              </div>

              {/* Senior Override Input */}
              <div className="p-4 bg-[var(--surface-interactive)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] space-y-3">
                <label className="text-xs font-bold text-[var(--text-primary)] block">
                  Certify Final Score (Senior Override):
                </label>
                <div className="flex items-center gap-3">
                  <ForgeInput
                    type="number"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(Number(e.target.value))}
                    className="w-32 font-mono font-bold text-sm"
                  />
                  <span className="text-xs text-[var(--text-muted)] font-mono">Out of 100 Marks</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex justify-between gap-2">
                <ForgeButton 
                  variant="secondary" 
                  size="compact" 
                  onClick={() => handleResolveConflict(selectedConflict.id, selectedConflict.evaluatorAScore)}
                >
                  Accept A ({selectedConflict.evaluatorAScore} M)
                </ForgeButton>

                <ForgeButton 
                  variant="secondary" 
                  size="compact" 
                  onClick={() => handleResolveConflict(selectedConflict.id, selectedConflict.evaluatorBScore)}
                >
                  Accept B ({selectedConflict.evaluatorBScore} M)
                </ForgeButton>

                <ForgeButton 
                  variant="primary" 
                  size="compact" 
                  onClick={() => handleResolveConflict(selectedConflict.id, overrideScore)}
                >
                  Certify Senior Score ({overrideScore} M)
                </ForgeButton>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
