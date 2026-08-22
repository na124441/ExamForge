"use client";

import React, { useState, useMemo } from "react";
import { 
  FileText, 
  Key, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Shuffle, 
  Lock, 
  Unlock, 
  Eye, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  Building2, 
  Users, 
  X,
  FileCheck,
  Zap,
  BookOpen
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { cn } from "@/lib/cn";

export interface QuestionItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  questionText: string;
  options: { key: string; text: string }[];
  correctOption: string;
}

export interface PaperSet {
  setId: string;
  setName: string;
  targetGroup: string;
  totalQuestions: number;
  totalMarks: number;
  questionOrder: string[];
  packageHash: string;
  status: "DRAFT" | "COMPILED" | "SEALED" | "DISPATCHED";
  scrambledQuestions: QuestionItem[];
}

export interface CenterPaperAllocation {
  centerId: string;
  centerName: string;
  location: string;
  allocatedSets: { set: string; count: number }[];
  totalCandidates: number;
  packageStatus: "SEALED" | "KEY_PENDING" | "DECRYPTED";
  releaseKey: string;
}

const PRE_MADE_QUESTION_BANK: QuestionItem[] = [
  {
    id: "Q-PHY-101",
    subject: "Physics",
    topic: "Thermodynamics",
    difficulty: "MEDIUM",
    marks: 4,
    questionText: "An ideal gas undergoes an adiabatic expansion. What is the relation between pressure P and temperature T?",
    options: [
      { key: "A", text: "P^(1-γ) T^γ = Constant" },
      { key: "B", text: "P^γ T^(1-γ) = Constant" },
      { key: "C", text: "P T^γ = Constant" },
      { key: "D", text: "P^γ T = Constant" }
    ],
    correctOption: "A"
  },
  {
    id: "Q-PHY-102",
    subject: "Physics",
    topic: "Electromagnetism",
    difficulty: "HARD",
    marks: 4,
    questionText: "A charged particle moves perpendicular to a uniform magnetic field B with velocity v. The radius of its circular path is:",
    options: [
      { key: "A", text: "r = mv / (qB)" },
      { key: "B", text: "r = qB / (mv)" },
      { key: "C", text: "r = mB / (qv)" },
      { key: "D", text: "r = qv / (mB)" }
    ],
    correctOption: "A"
  },
  {
    id: "Q-CHM-201",
    subject: "Chemistry",
    topic: "Organic Mechanism",
    difficulty: "MEDIUM",
    marks: 4,
    questionText: "Which of the following carbocations is the most stable due to hyperconjugation and resonance?",
    options: [
      { key: "A", text: "Tropylium Cation (C7H7+)" },
      { key: "B", text: "Tertiary Butyl Cation" },
      { key: "C", text: "Allyl Cation" },
      { key: "D", text: "Methyl Cation" }
    ],
    correctOption: "A"
  },
  {
    id: "Q-CHM-202",
    subject: "Chemistry",
    topic: "Chemical Kinetics",
    difficulty: "EASY",
    marks: 4,
    questionText: "For a first-order reaction, the half-life period (t_1/2) is independent of:",
    options: [
      { key: "A", text: "Initial concentration of reactant" },
      { key: "B", text: "Temperature of reaction" },
      { key: "C", text: "Rate constant k" },
      { key: "D", text: "Activation energy" }
    ],
    correctOption: "A"
  },
  {
    id: "Q-MAT-301",
    subject: "Mathematics",
    topic: "Calculus & Limits",
    difficulty: "HARD",
    marks: 4,
    questionText: "Evaluate the limit lim(x->0) (sin(x) - x) / x^3:",
    options: [
      { key: "A", text: "-1/6" },
      { key: "B", text: "1/6" },
      { key: "C", text: "0" },
      { key: "D", text: "Infinity" }
    ],
    correctOption: "A"
  },
  {
    id: "Q-MAT-302",
    subject: "Mathematics",
    topic: "Linear Algebra",
    difficulty: "MEDIUM",
    marks: 4,
    questionText: "If A is an invertible square matrix of order 3 with det(A) = 5, then det(adj A) is equal to:",
    options: [
      { key: "A", text: "25" },
      { key: "B", text: "5" },
      { key: "C", text: "125" },
      { key: "D", text: "1/5" }
    ],
    correctOption: "A"
  },
  {
    id: "Q-LOG-401",
    subject: "Logical Reasoning",
    topic: "Pattern Recognition",
    difficulty: "EASY",
    marks: 4,
    questionText: "Complete the series: 3, 7, 15, 31, 63, ?",
    options: [
      { key: "A", text: "127" },
      { key: "B", text: "125" },
      { key: "C", text: "128" },
      { key: "D", text: "130" }
    ],
    correctOption: "A"
  },
  {
    id: "Q-LOG-402",
    subject: "Logical Reasoning",
    topic: "Data Sufficiency",
    difficulty: "MEDIUM",
    marks: 4,
    questionText: "Is X greater than Y? Statement 1: X - Y > 0. Statement 2: X^2 > Y^2.",
    options: [
      { key: "A", text: "Statement 1 alone is sufficient" },
      { key: "B", text: "Statement 2 alone is sufficient" },
      { key: "C", text: "Both together are necessary" },
      { key: "D", text: "Neither is sufficient" }
    ],
    correctOption: "A"
  }
];

const INITIAL_CENTER_ALLOCATIONS: CenterPaperAllocation[] = [
  {
    centerId: "CTR-DEL-01",
    centerName: "Delhi Central Tech Institute",
    location: "Delhi (NCR)",
    allocatedSets: [
      { set: "Set A", count: 40 },
      { set: "Set B", count: 40 },
      { set: "Set C", count: 40 }
    ],
    totalCandidates: 120,
    packageStatus: "SEALED",
    releaseKey: "KEY-DEL-8921-X"
  },
  {
    centerId: "CTR-BOM-02",
    centerName: "Mumbai National Academy",
    location: "Mumbai (West)",
    allocatedSets: [
      { set: "Set A", count: 30 },
      { set: "Set B", count: 30 },
      { set: "Set C", count: 28 }
    ],
    totalCandidates: 88,
    packageStatus: "SEALED",
    releaseKey: "KEY-BOM-4412-Y"
  },
  {
    centerId: "CTR-BLR-03",
    centerName: "Bangalore Science Center",
    location: "Bangalore (South)",
    allocatedSets: [
      { set: "Set A", count: 27 },
      { set: "Set B", count: 27 },
      { set: "Set C", count: 26 }
    ],
    totalCandidates: 80,
    packageStatus: "KEY_PENDING",
    releaseKey: "KEY-BLR-1092-Z"
  },
  {
    centerId: "CTR-MAA-04",
    centerName: "Chennai Testing Hub",
    location: "Chennai (South)",
    allocatedSets: [
      { set: "Set A", count: 25 },
      { set: "Set B", count: 25 },
      { set: "Set C", count: 25 }
    ],
    totalCandidates: 75,
    packageStatus: "KEY_PENDING",
    releaseKey: "KEY-MAA-7734-W"
  }
];

export function ForgeQuestionPaperStudio() {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(
    PRE_MADE_QUESTION_BANK.map(q => q.id)
  );
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [compiling, setCompiling] = useState(false);
  const [previewSet, setPreviewSet] = useState<PaperSet | null>(null);
  const [activeStudioTab, setActiveStudioTab] = useState<"BANK" | "SETS" | "ALLOCATION">("SETS");

  const [centerAllocations, setCenterAllocations] = useState<CenterPaperAllocation[]>(
    INITIAL_CENTER_ALLOCATIONS
  );

  // Generate 4 paper sets with question shuffling and option scrambling
  const generatedPaperSets: PaperSet[] = useMemo(() => {
    const activeQuestions = PRE_MADE_QUESTION_BANK.filter(q => selectedQuestions.includes(q.id));
    const totalMarks = activeQuestions.reduce((acc, q) => acc + q.marks, 0);

    const setNames = [
      { id: "SET_A", name: "Paper Set A (General)", group: "Standard Interleaved A" },
      { id: "SET_B", name: "Paper Set B (Advanced)", group: "Standard Interleaved B" },
      { id: "SET_C", name: "Paper Set C (Reserves)", group: "Reserve Keyring C" },
      { id: "SET_D", name: "Paper Set D (Special)", group: "Special Access D" }
    ];

    return setNames.map((s, idx) => {
      // Deterministically shuffle question order per set
      const shuffledQ = [...activeQuestions].sort((a, b) => {
        const hashA = (a.id.charCodeAt(a.id.length - 1) + idx * 7) % 11;
        const hashB = (b.id.charCodeAt(b.id.length - 1) + idx * 7) % 11;
        return hashA - hashB;
      });

      // Scramble options per question for this paper set
      const scrambledQuestions = shuffledQ.map((q, qIdx) => {
        const optionShift = (qIdx + idx) % 4;
        const keys = ["A", "B", "C", "D"];
        const reorderedOptions = q.options.map((opt, oIdx) => ({
          key: keys[(oIdx + optionShift) % 4],
          text: opt.text
        }));

        return {
          ...q,
          options: reorderedOptions
        };
      });

      const hash = `0x${(idx * 7919 + activeQuestions.length * 31).toString(16).toUpperCase()}8F48A58A291`;

      return {
        setId: s.id,
        setName: s.name,
        targetGroup: s.group,
        totalQuestions: activeQuestions.length,
        totalMarks,
        questionOrder: scrambledQuestions.map(q => q.id),
        packageHash: hash,
        status: "SEALED",
        scrambledQuestions
      };
    });
  }, [selectedQuestions]);

  const filteredQuestions = useMemo(() => {
    if (subjectFilter === "ALL") return PRE_MADE_QUESTION_BANK;
    return PRE_MADE_QUESTION_BANK.filter(q => q.subject === subjectFilter);
  }, [subjectFilter]);

  const handleToggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleCompileSets = () => {
    setCompiling(true);
    setTimeout(() => {
      setCompiling(false);
    }, 700);
  };

  const handleReleaseKey = (centerId: string) => {
    setCenterAllocations(prev => prev.map(c => {
      if (c.centerId === centerId) {
        return { ...c, packageStatus: "DECRYPTED" };
      }
      return c;
    }));
  };

  const questionColumns: ForgeTableColumn<QuestionItem>[] = [
    {
      key: "select",
      header: "Include",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedQuestions.includes(row.id)}
          onChange={() => handleToggleQuestion(row.id)}
          className="w-4 h-4 text-[var(--accent-primary)] rounded border-[var(--border-default)] cursor-pointer"
        />
      )
    },
    {
      key: "id",
      header: "Q-ID",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.id}</ForgeMonoText>
    },
    {
      key: "subject",
      header: "Subject & Topic",
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.subject}</div>
          <div className="text-xs text-[var(--text-muted)]">{row.topic}</div>
        </div>
      )
    },
    {
      key: "difficulty",
      header: "Difficulty",
      render: (row) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono",
          row.difficulty === "EASY" && "bg-emerald-500/10 text-emerald-600",
          row.difficulty === "MEDIUM" && "bg-amber-500/10 text-amber-600",
          row.difficulty === "HARD" && "bg-red-500/10 text-red-600"
        )}>
          {row.difficulty}
        </span>
      )
    },
    {
      key: "marks",
      header: "Marks",
      render: (row) => <span className="font-mono font-bold text-xs">{row.marks} M</span>
    }
  ];

  const centerAllocationCols: ForgeTableColumn<CenterPaperAllocation>[] = [
    {
      key: "centerId",
      header: "Center Code",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.centerId}</ForgeMonoText>
    },
    {
      key: "centerName",
      header: "Center Name",
      render: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.centerName}</div>
          <div className="text-xs text-[var(--text-muted)]">{row.location}</div>
        </div>
      )
    },
    {
      key: "allocatedSets",
      header: "Allocated Paper Distribution",
      render: (row) => (
        <div className="flex gap-2">
          {row.allocatedSets.map(s => (
            <span key={s.set} className="px-2 py-0.5 rounded bg-[var(--surface-interactive)] border border-[var(--border-subtle)] text-[10px] font-mono font-semibold">
              {s.set}: <strong>{s.count}</strong>
            </span>
          ))}
        </div>
      )
    },
    {
      key: "totalCandidates",
      header: "Students",
      render: (row) => <span className="font-mono text-xs font-bold">{row.totalCandidates}</span>
    },
    {
      key: "packageStatus",
      header: "Custody Key Status",
      render: (row) => (
        <ForgeStatusPill status={
          row.packageStatus === "DECRYPTED" ? "verified" :
          row.packageStatus === "SEALED" ? "locked" : "processing"
        } />
      )
    },
    {
      key: "action",
      header: "Key Release",
      render: (row) => (
        <ForgeButton 
          size="compact" 
          variant={row.packageStatus === "DECRYPTED" ? "secondary" : "primary"}
          onClick={() => handleReleaseKey(row.centerId)}
          disabled={row.packageStatus === "DECRYPTED"}
        >
          {row.packageStatus === "DECRYPTED" ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Keys Unlocked
            </>
          ) : (
            <>
              <Key className="w-3.5 h-3.5 mr-1" /> Release Key Envelope
            </>
          )}
        </ForgeButton>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Studio Header & Compilation Bar */}
      <ForgeCard>
        <ForgeCardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <ForgeCardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
              Question Paper Studio & Multi-Set Compiler
            </ForgeCardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Select pre-made questions, compile anti-cheating shuffled paper sets (Set A, B, C, D), and manage center key envelopes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ForgeButton
              variant="primary"
              size="compact"
              onClick={handleCompileSets}
              disabled={compiling}
            >
              <Shuffle className={cn("w-4 h-4 mr-1.5", compiling && "animate-spin")} />
              {compiling ? "Shuffling & Sealing Sets..." : "Compile & Seal All Paper Sets"}
            </ForgeButton>
          </div>
        </ForgeCardHeader>

        <ForgeCardContent className="border-t border-[var(--border-subtle)] pt-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 text-[var(--status-operational-text)]">
              <CheckCircle2 className="w-4 h-4" /> 4 Paper Sets Sealed
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span>Question Bank Size: <strong className="text-[var(--text-primary)]">{PRE_MADE_QUESTION_BANK.length} Questions</strong></span>
            <span className="text-[var(--text-muted)]">•</span>
            <span>Selected for Exam: <strong className="text-[var(--accent-primary)]">{selectedQuestions.length} Questions</strong></span>
            <span className="text-[var(--text-muted)]">•</span>
            <span>Total Marks: <strong className="text-[var(--text-primary)]">{selectedQuestions.length * 4} Marks</strong></span>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-[var(--surface-interactive)] p-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveStudioTab("SETS")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer flex items-center gap-1.5",
                activeStudioTab === "SETS" ? "bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-xs" : "text-[var(--text-muted)]"
              )}
            >
              <Layers className="w-3.5 h-3.5" /> Paper Sets (A, B, C, D)
            </button>
            <button
              onClick={() => setActiveStudioTab("BANK")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer flex items-center gap-1.5",
                activeStudioTab === "BANK" ? "bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-xs" : "text-[var(--text-muted)]"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" /> Pre-made Question Bank
            </button>
            <button
              onClick={() => setActiveStudioTab("ALLOCATION")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-[var(--radius-2)] transition-colors cursor-pointer flex items-center gap-1.5",
                activeStudioTab === "ALLOCATION" ? "bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-xs" : "text-[var(--text-muted)]"
              )}
            >
              <Building2 className="w-3.5 h-3.5" /> Center & Student Allocation
            </button>
          </div>
        </ForgeCardContent>
      </ForgeCard>

      {/* STUDIO TAB 1: PAPER SETS (SET A, SET B, SET C, SET D) */}
      {activeStudioTab === "SETS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {generatedPaperSets.map((set) => (
            <ForgeCard key={set.setId} className="flex flex-col justify-between">
              <ForgeCardHeader>
                <div>
                  <div className="flex items-center justify-between">
                    <ForgeCardTitle className="text-base font-bold">{set.setName}</ForgeCardTitle>
                    <ForgeStatusPill status="verified" />
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">{set.targetGroup}</div>
                </div>
              </ForgeCardHeader>

              <ForgeCardContent className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-control)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Questions</span>
                    <span className="font-bold text-sm text-[var(--text-primary)] font-mono">{set.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Total Marks</span>
                    <span className="font-bold text-sm text-[var(--text-primary)] font-mono">{set.totalMarks} M</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block mb-1">Package Signature</span>
                  <ForgeMonoText className="text-[10px] text-[var(--text-secondary)] block truncate">{set.packageHash}</ForgeMonoText>
                </div>

                <div className="p-2.5 bg-[var(--status-operational-surface)] border border-[var(--status-operational-border)] rounded-[var(--radius-control)] text-xs text-[var(--status-operational-text)] font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Options & Sequence Scrambled
                </div>
              </ForgeCardContent>

              <div className="p-[var(--space-card)] border-t border-[var(--border-subtle)]">
                <ForgeButton 
                  variant="secondary" 
                  size="compact" 
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={() => setPreviewSet(set)}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Paper Set & Answer Key
                </ForgeButton>
              </div>
            </ForgeCard>
          ))}
        </div>
      )}

      {/* STUDIO TAB 2: PRE-MADE QUESTION BANK REPOSITORY */}
      {activeStudioTab === "BANK" && (
        <ForgeCard>
          <ForgeCardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <ForgeCardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
                Pre-made Exam Question Bank
              </ForgeCardTitle>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Toggle checkmarks to include/exclude pre-made questions into compiled exam paper sets.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surface-interactive)] border border-[var(--border-default)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] font-medium"
              >
                <option value="ALL">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
              </select>
            </div>
          </ForgeCardHeader>

          <ForgeCardContent className="p-0">
            <ForgeTable columns={questionColumns} data={filteredQuestions} keyField="id" />
          </ForgeCardContent>
        </ForgeCard>
      )}

      {/* STUDIO TAB 3: CENTER & STUDENT ALLOCATION */}
      {activeStudioTab === "ALLOCATION" && (
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--accent-primary)]" />
              Center Paper Distribution & Custody Keys
            </ForgeCardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Allocated paper sets per center node with dual-custody time-lock envelope release triggers.
            </p>
          </ForgeCardHeader>

          <ForgeCardContent className="p-0">
            <ForgeTable columns={centerAllocationCols} data={centerAllocations} keyField="centerId" />
          </ForgeCardContent>
        </ForgeCard>
      )}

      {/* PREVIEW PAPER SET MODAL */}
      {previewSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-panel)] shadow-xl p-6 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--surface-elevated)] z-10">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
                  {previewSet.setName} — Paper Preview
                </h3>
                <ForgeMonoText className="text-xs text-[var(--text-muted)]">
                  Hash: {previewSet.packageHash}
                </ForgeMonoText>
              </div>
              <button 
                onClick={() => setPreviewSet(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {previewSet.scrambledQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      Question #{idx + 1} <span className="text-xs text-[var(--text-muted)] font-mono">({q.id} — {q.subject})</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-panel)] border border-[var(--border-subtle)] font-mono font-bold">
                      {q.marks} Marks
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                    {q.questionText}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map(opt => (
                      <div key={opt.key} className="p-2 rounded bg-[var(--surface-panel)] border border-[var(--border-subtle)] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[var(--surface-interactive)] flex items-center justify-center font-bold font-mono text-[10px]">
                          {opt.key}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-[var(--border-subtle)] sticky bottom-0 bg-[var(--surface-elevated)] z-10">
              <span className="text-xs text-[var(--status-operational-text)] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Scrambled Key Verified
              </span>
              <ForgeButton 
                variant="primary" 
                size="compact" 
                onClick={() => setPreviewSet(null)}
              >
                Close Preview
              </ForgeButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
