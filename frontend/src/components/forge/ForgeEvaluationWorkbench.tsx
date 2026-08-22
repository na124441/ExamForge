"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Shuffle, 
  ShieldCheck, 
  Lock, 
  Scale, 
  Sliders, 
  AlertTriangle, 
  Check, 
  RefreshCw, 
  Search, 
  UserX,
  FileText,
  ChevronDown,
  Layers,
  ArrowDown
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "./ForgeCard";
import { ForgeButton } from "./ForgeButton";
import { ForgeStatusPill } from "./ForgeStatusPill";
import { ForgeFormattedText } from "../forge-exam/ForgeFormattedText";

export interface PoolAnswerItem {
  id: string;
  questionNumber: number;
  questionTitle: string;
  subject: string;
  questionText: string;
  maxMarks: number;
  anonymousToken: string;
  ecdsaHash: string;
  candidateAnswerText: string;
  modelAnswerKey: string;
  rubricCriteria: { id: string; text: string; marks: number; checked?: boolean }[];
  aiSuggestedScore?: number;
  aiConfidence?: number;
  aiReasoning?: string;
  status: "PENDING" | "EVALUATED" | "FLAGGED";
  assignedMarks?: number;
  evaluatorNotes?: string;
}

const INITIAL_ANSWER_POOL: PoolAnswerItem[] = [
  {
    id: "ANS-8921",
    questionNumber: 5,
    questionTitle: "Gaussian Wave Integral Derivation",
    subject: "Quantum Mechanics & Calculus",
    questionText: "Evaluate the Gaussian definite integral $$\\int_{-\\infty}^{\\infty} e^{-\\alpha x^2} dx$$ where \\(\\alpha > 0\\) represents the wave packet confinement parameter.",
    maxMarks: 10,
    anonymousToken: "ANON-0x892F-9821",
    ecdsaHash: "7b4c8d9e2a10b4f8e3f4a5b6c7d8e9f0a1b2c3d4",
    candidateAnswerText: "To solve $$\\int_{-\\infty}^{\\infty} e^{-\\alpha x^2} dx$$, we square the integral and convert to polar coordinates:\n$$I^2 = \\int_{-\\infty}^{\\infty} \\int_{-\\infty}^{\\infty} e^{-\\alpha (x^2 + y^2)} dx dy$$\nConverting to polar coordinates \\(x^2 + y^2 = r^2\\) and \\(dx dy = r dr d\\theta\\):\n$$I^2 = \\int_{0}^{2\\pi} d\\theta \\int_{0}^{\\infty} r e^{-\\alpha r^2} dr = 2\\pi \\left[ -\\frac{1}{2\\alpha} e^{-\\alpha r^2} \\right]_{0}^{\\infty} = \\frac{\\pi}{\\alpha}$$\nTaking the square root gives $$I = \\sqrt{\\frac{\\pi}{\\alpha}}$$",
    modelAnswerKey: "1. Square the integral and rewrite as double integral over R^2.\n2. Apply Cartesian to polar coordinate transformation (r, theta).\n3. Integrate over theta (2*pi) and r (1 / (2*alpha)).\n4. Take square root to obtain final result sqrt(pi / alpha).",
    rubricCriteria: [
      { id: "c1", text: "Correct polar coordinate conversion (r dr dtheta)", marks: 3.0, checked: true },
      { id: "c2", text: "Accurate limits of integration (theta 0..2pi, r 0..infinity)", marks: 3.0, checked: true },
      { id: "c3", text: "Correct substitution & integration step", marks: 2.0, checked: true },
      { id: "c4", text: "Final algebraic result sqrt(pi / alpha)", marks: 2.0, checked: true }
    ],
    aiSuggestedScore: 10.0,
    aiConfidence: 98,
    aiReasoning: "Candidate answer contains flawless polar coordinate substitution, step-by-step limits integration, and accurate final expression.",
    status: "PENDING"
  },
  {
    id: "ANS-4102",
    questionNumber: 6,
    questionTitle: "Cache Coherence & MESI Protocol Analysis",
    subject: "Computer Architecture",
    questionText: "Explain how the MESI protocol handles write-invalidate broadcast traffic on split-transaction system buses during concurrent L1 cache writes.",
    maxMarks: 10,
    anonymousToken: "ANON-0x4102-7712",
    ecdsaHash: "3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
    candidateAnswerText: "The MESI protocol manages 4 states: Modified, Exclusive, Shared, and Invalid. When a core issues a write to a Shared block, it broadcasts an Invalidating Signal on the bus. Other caches listening (snooping) transition their copy to Invalid. In split-transaction buses, bus arbitration separates request and response phases, reducing latency.",
    modelAnswerKey: "1. Define 4 MESI states clearly.\n2. Detail Write-Invalidate broadcast mechanism.\n3. Explain bus snooping logic during shared state transition.\n4. Analyze split-transaction bus arbitration decoupling.",
    rubricCriteria: [
      { id: "c1", text: "Definition of 4 MESI states", marks: 2.5, checked: true },
      { id: "c2", text: "Write-invalidate broadcast explanation", marks: 2.5, checked: true },
      { id: "c3", text: "Bus snooping logic analysis", marks: 2.5, checked: true },
      { id: "c4", text: "Split-transaction bus arbitration phase decoupling", marks: 2.5, checked: false }
    ],
    aiSuggestedScore: 7.5,
    aiConfidence: 92,
    aiReasoning: "Accurate explanation of MESI states and write-invalidation. Minor omission on split-transaction bus arbitration phase details.",
    status: "PENDING"
  },
  {
    id: "ANS-1193",
    questionNumber: 3,
    questionTitle: "Zero-Knowledge Cryptographic Audit Proofs",
    subject: "Cryptography & Security",
    questionText: "Derive the zero-knowledge verification proof equation for ExamForge ECDSA answer logs. Explain how Merkle tree chaining guarantees zero-tampering auditability.",
    maxMarks: 10,
    anonymousToken: "ANON-0x1193-4409",
    ecdsaHash: "9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
    candidateAnswerText: "ExamForge uses Merkle trees where each leaf node is $H_i = \\text{SHA-256}(\\text{Candidate\\_Answer}_i \\parallel \\text{Timestamp})$. Parent nodes are $H_{ij} = \\text{SHA-256}(H_i \\parallel H_j)$. Modifying any single student response alters the root hash $R$, instantly failing signature verification against the ECDSA public key.",
    modelAnswerKey: "1. Merkle leaf hash formation SHA-256(Answer || Timestamp).\n2. Binary parent hash concatenation formula.\n3. Immutable root hash signature validation against ECDSA public key.\n4. Zero-knowledge privacy protection rationale.",
    rubricCriteria: [
      { id: "c1", text: "Leaf node cryptographic hash formula", marks: 2.5, checked: true },
      { id: "c2", text: "Parent node concatenation logic", marks: 2.5, checked: true },
      { id: "c3", text: "Root hash validation & tamper detection", marks: 2.5, checked: true },
      { id: "c4", text: "Zero-knowledge privacy preservation explanation", marks: 2.5, checked: true }
    ],
    aiSuggestedScore: 10.0,
    aiConfidence: 96,
    aiReasoning: "Full derivation of Merkle leaf/parent hashes and tamper verification chain.",
    status: "PENDING"
  }
];

export function ForgeEvaluationWorkbench() {
  const [viewMode, setViewMode] = useState<"RANDOM_POOL" | "AUTO_OBJECTIVE" | "AI_ASSISTED">("RANDOM_POOL");
  const [answerPool, setAnswerPool] = useState<PoolAnswerItem[]>(INITIAL_ANSWER_POOL);
  const [scores, setScores] = useState<{ [ansId: string]: number }>({});
  const [notes, setNotes] = useState<{ [ansId: string]: string }>({});

  // Auto-Objective Evaluation Stats
  const [autoGradingProgress, setAutoGradingProgress] = useState(100);

  const handleScoreChange = (ansId: string, val: number) => {
    setScores(prev => ({ ...prev, [ansId]: val }));
  };

  const handleConfirmGrade = (ansId: string) => {
    setAnswerPool(prev => prev.map(item => {
      if (item.id === ansId) {
        return {
          ...item,
          status: "EVALUATED",
          assignedMarks: scores[ansId] ?? item.aiSuggestedScore ?? item.maxMarks
        };
      }
      return item;
    }));
  };

  const handleFlagConflict = (ansId: string) => {
    setAnswerPool(prev => prev.map(item => {
      if (item.id === ansId) {
        return { ...item, status: "FLAGGED" };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6 font-sans text-[#FFF4E2]">
      
      {/* Top Header & Checking Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[rgba(19,45,40,0.8)] p-6 rounded-3xl border border-[rgba(138,216,184,0.25)] shadow-2xl backdrop-blur-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#FFF4E2] tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#8AD8B8]" />
              Double-Blind Anonymized Evaluation Workbench
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] border border-[rgba(138,216,184,0.25)]">
              Zero-Bias Pool
            </span>
          </div>
          <p className="text-xs text-[#8AD8B8]/80 font-medium mt-1">
            Randomized Question Pool • Cryptographic ECDSA Student Anonymization • Infinite Scrolling Review
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center bg-[rgba(8,19,16,0.85)] p-1 rounded-full border border-[rgba(138,216,184,0.2)]">
          <button
            onClick={() => setViewMode("RANDOM_POOL")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5",
              viewMode === "RANDOM_POOL"
                ? "bg-[#408576] text-[#FFF4E2] font-bold shadow-sm"
                : "text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
            )}
          >
            <Shuffle className="w-3.5 h-3.5 text-[#8AD8B8]" /> Random Pool Feed
          </button>
          <button
            onClick={() => setViewMode("AUTO_OBJECTIVE")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5",
              viewMode === "AUTO_OBJECTIVE"
                ? "bg-[#408576] text-[#FFF4E2] font-bold shadow-sm"
                : "text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#8AD8B8]" /> Auto-Objective
          </button>
          <button
            onClick={() => setViewMode("AI_ASSISTED")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5",
              viewMode === "AI_ASSISTED"
                ? "bg-[#408576] text-[#FFF4E2] font-bold shadow-sm"
                : "text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8AD8B8]" /> AI Rubric Copilot
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[rgba(19,45,40,0.7)] border border-[rgba(138,216,184,0.2)] shadow-xl backdrop-blur-xl">
          <span className="text-[10px] font-bold text-[#8AD8B8]/80 uppercase tracking-wider font-mono">Total Responses in Pool</span>
          <span className="text-2xl font-bold font-mono text-[#FFF4E2] mt-0.5">155,760</span>
        </div>
        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[rgba(19,45,40,0.7)] border border-[rgba(138,216,184,0.2)] shadow-xl backdrop-blur-xl">
          <span className="text-[10px] font-bold text-[#8AD8B8]/80 uppercase tracking-wider font-mono">Evaluated & Verified</span>
          <span className="text-2xl font-bold font-mono text-[#8AD8B8] mt-0.5">124,608 (80%)</span>
        </div>
        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[rgba(19,45,40,0.7)] border border-[rgba(138,216,184,0.2)] shadow-xl backdrop-blur-xl">
          <span className="text-[10px] font-bold text-[#8AD8B8]/80 uppercase tracking-wider font-mono">Pending Pool Queue</span>
          <span className="text-2xl font-bold font-mono text-[#FFF4E2] mt-0.5">31,152</span>
        </div>
        <div className="flex flex-col gap-1 p-5 rounded-3xl bg-[rgba(19,45,40,0.7)] border border-[rgba(138,216,184,0.2)] shadow-xl backdrop-blur-xl">
          <span className="text-[10px] font-bold text-[#8AD8B8]/80 uppercase tracking-wider font-mono">Evaluator Pace Velocity</span>
          <span className="text-2xl font-bold font-mono text-[#8AD8B8] mt-0.5">42 Answers / Hr</span>
        </div>
      </div>

      {/* MODE 1: INFINITE SCROLLING RANDOM-POOL EVALUATION WORKBENCH */}
      {viewMode === "RANDOM_POOL" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8AD8B8] uppercase tracking-wider font-mono">
              <ArrowDown className="w-4 h-4 text-[#8AD8B8] animate-bounce" />
              Continuous Anonymized Response Feed (Random Candidate & Question Stream)
            </div>
            <span className="text-xs text-[#8AD8B8]/70 font-mono">
              Showing {answerPool.length} Active Items in Queue
            </span>
          </div>

          {/* Scrolling Feed Cards */}
          <div className="space-y-6">
            {answerPool.map((item) => {
              const currentScore = scores[item.id] ?? item.assignedMarks ?? item.aiSuggestedScore ?? item.maxMarks;
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "bg-[rgba(19,45,40,0.8)] border rounded-3xl p-6 lg:p-8 shadow-2xl transition-all space-y-6 relative overflow-hidden backdrop-blur-2xl",
                    item.status === "EVALUATED" ? "border-[#8AD8B8]/60 bg-[rgba(19,45,40,0.9)]" :
                    item.status === "FLAGGED" ? "border-amber-400/40 bg-[rgba(19,45,40,0.85)]" : "border-[rgba(138,216,184,0.25)]"
                  )}
                >
                  {/* Top Bar: Anonymized Hash & Question Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(138,216,184,0.15)] gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-2xl bg-[rgba(8,19,16,0.9)] text-[#8AD8B8] border border-[rgba(138,216,184,0.25)] font-mono font-bold text-xs flex items-center justify-center shadow-md">
                        Q{item.questionNumber}
                      </span>
                      <div>
                        <div className="text-base font-bold text-[#FFF4E2]">{item.questionTitle}</div>
                        <div className="text-xs text-[#8AD8B8]/70 font-mono">{item.subject} • Max Marks: {item.maxMarks}</div>
                      </div>
                    </div>

                    {/* Double-Blind Anonymized Cryptographic Identity Tag */}
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(8,19,16,0.85)] border border-[rgba(138,216,184,0.2)] text-xs font-mono text-[#8AD8B8]">
                      <UserX className="w-3.5 h-3.5 text-[#8AD8B8]" />
                      <span className="font-bold text-[#FFF4E2]">{item.anonymousToken}</span>
                      <span className="text-[#8AD8B8]/40">|</span>
                      <span className="text-[10px] text-[#8AD8B8]/70 truncate max-w-[120px]" title={item.ecdsaHash}>
                        {item.ecdsaHash.slice(0, 10)}...
                      </span>
                    </div>
                  </div>

                  {/* Question & Submitted Answer Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Question Prompt & Candidate's Response */}
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.2)] space-y-2">
                        <div className="text-xs font-bold text-[#8AD8B8]/80 font-mono uppercase tracking-wider">
                          Question Prompt:
                        </div>
                        <ForgeFormattedText content={item.questionText} className="text-sm font-medium text-[#FFF4E2]" />
                      </div>

                      <div className="p-5 rounded-2xl bg-[rgba(13,32,28,0.85)] border border-[rgba(138,216,184,0.25)] shadow-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#8AD8B8] font-mono uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#8AD8B8]" /> Candidate Submitted Response:
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#8AD8B8] bg-[rgba(64,133,118,0.25)] px-2.5 py-0.5 rounded-full border border-[rgba(138,216,184,0.3)]">
                            Verified Signed Payload
                          </span>
                        </div>
                        <div className="pt-2 text-[#FFF4E2]">
                          <ForgeFormattedText content={item.candidateAnswerText} className="text-sm text-[#FFF4E2] font-sans leading-relaxed" />
                        </div>
                      </div>
                    </div>

                    {/* Right: Model Answer Key, Rubric & Scoring Control */}
                    <div className="space-y-4">
                      {/* Model Answer Key */}
                      <div className="p-5 rounded-2xl bg-[rgba(16,40,35,0.7)] border border-[rgba(138,216,184,0.2)] space-y-2">
                        <div className="text-xs font-bold text-[#8AD8B8] font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#8AD8B8]" /> Model Answer Key & Solution Scheme:
                        </div>
                        <div className="text-xs text-[#FFF4E2]/90 font-sans leading-relaxed whitespace-pre-line">
                          {item.modelAnswerKey}
                        </div>
                      </div>

                      {/* Rubric Criteria Checklist */}
                      <div className="p-5 rounded-2xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.2)] space-y-2">
                        <div className="text-xs font-bold text-[#8AD8B8]/80 font-mono uppercase tracking-wider">
                          Evaluation Rubric Breakdown:
                        </div>
                        <div className="space-y-2 pt-1">
                          {item.rubricCriteria.map(c => (
                            <div key={c.id} className="flex items-start justify-between text-xs p-2.5 rounded-xl bg-[rgba(19,45,40,0.8)] border border-[rgba(138,216,184,0.2)]">
                              <div className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-[#8AD8B8] shrink-0" />
                                <span className="text-[#FFF4E2] font-medium">{c.text}</span>
                              </div>
                              <span className="font-mono font-bold text-[#8AD8B8] shrink-0">+{c.marks}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Copilot Suggestion Box */}
                      {item.aiSuggestedScore !== undefined && (
                        <div className="p-4 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <div className="font-bold text-[#FFF4E2] flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#8AD8B8]" /> AI Rubric Score Suggestion:
                            </div>
                            <div className="text-[#8AD8B8]/80 text-[11px] font-sans">
                              {item.aiReasoning}
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            <div className="text-base font-bold font-mono text-[#8AD8B8]">{item.aiSuggestedScore} / {item.maxMarks}</div>
                            <div className="text-[10px] text-[#8AD8B8]/80 font-mono font-semibold">{item.aiConfidence}% Conf</div>
                          </div>
                        </div>
                      )}

                      {/* Evaluation Marks Entry Bar */}
                      <div className="p-5 rounded-2xl bg-[rgba(8,19,16,0.9)] border border-[rgba(138,216,184,0.25)] text-[#FFF4E2] space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#8AD8B8]">
                            Assign Marks ({currentScore} / {item.maxMarks}):
                          </span>
                          {item.status === "EVALUATED" && (
                            <ForgeStatusPill status="verified" />
                          )}
                        </div>

                        {/* Quick Score Preset Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {[0, 2.5, 5.0, 7.5, 10.0].map(val => (
                            <button
                              key={val}
                              onClick={() => handleScoreChange(item.id, val)}
                              className={cn(
                                "px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer border",
                                currentScore === val
                                  ? "bg-[#408576] text-[#FFF4E2] border-[#8AD8B8] shadow-sm"
                                  : "bg-[rgba(19,45,40,0.8)] text-[#8AD8B8] border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8]"
                              )}
                            >
                              {val}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[rgba(138,216,184,0.15)] gap-3">
                          <button
                            onClick={() => handleFlagConflict(item.id)}
                            className="px-4 py-2 rounded-2xl text-xs font-semibold bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] border border-[rgba(138,216,184,0.2)] text-[#8AD8B8] hover:text-[#FFF4E2] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Flag Arbitration
                          </button>

                          <button
                            onClick={() => handleConfirmGrade(item.id)}
                            className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] border border-[#8AD8B8]/30 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#8AD8B8]" /> Confirm Score & Next
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: AUTOMATED OBJECTIVE CHECKING */}
      {viewMode === "AUTO_OBJECTIVE" && (
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2 text-[#FFF4E2]">
              <CheckCircle2 className="w-5 h-5 text-[#8AD8B8]" />
              Automated Objective Auto-Grader Engine
            </ForgeCardTitle>
          </ForgeCardHeader>
          <ForgeCardContent className="space-y-6">
            <div className="p-5 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#8AD8B8] font-mono">
                <span>Objective Evaluation Pipeline: 100% Complete</span>
                <span>38,940 / 38,940 Answer Sheets</span>
              </div>
              <div className="w-full h-3 bg-[rgba(8,19,16,0.8)] rounded-full overflow-hidden border border-[rgba(138,216,184,0.2)]">
                <div className="h-full bg-[#408576] rounded-full w-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.2)] text-center">
                <div className="text-xs text-[#8AD8B8]/80 font-mono uppercase font-bold">MCQ Single Choice Evaluated</div>
                <div className="text-2xl font-bold font-mono text-[#FFF4E2] mt-1">116,820</div>
              </div>
              <div className="p-5 rounded-2xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.2)] text-center">
                <div className="text-xs text-[#8AD8B8]/80 font-mono uppercase font-bold">MSQ Multi-Select Evaluated</div>
                <div className="text-2xl font-bold font-mono text-[#8AD8B8] mt-1">38,940</div>
              </div>
              <div className="p-5 rounded-2xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.2)] text-center">
                <div className="text-xs text-[#8AD8B8]/80 font-mono uppercase font-bold">Numerical Inputs Checked</div>
                <div className="text-2xl font-bold font-mono text-[#8AD8B8] mt-1">38,940</div>
              </div>
            </div>
          </ForgeCardContent>
        </ForgeCard>
      )}

      {/* MODE 3: AI RUBRIC COPILOT */}
      {viewMode === "AI_ASSISTED" && (
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2 text-[#FFF4E2]">
              <Sparkles className="w-5 h-5 text-[#8AD8B8]" />
              AI Subjective Rubric Evaluation Copilot
            </ForgeCardTitle>
          </ForgeCardHeader>
          <ForgeCardContent className="space-y-4">
            <p className="text-xs text-[#8AD8B8]/80 leading-relaxed font-medium">
              The AI Rubric Copilot scans descriptive student answers, matches key phrases against marking scheme rubrics, and generates instant score suggestions with confidence intervals.
            </p>
            <div className="p-5 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] text-xs font-mono text-[#8AD8B8] space-y-1">
              <div className="font-bold text-[#FFF4E2]">Active AI Model: DeepSeek-R1 / Ollama Llama3 70B Proctored Evaluator</div>
              <div>Processing Velocity: 120 Essay Booklets / Minute</div>
              <div>Score Discrepancy Filter Threshold: Delta &gt; 5% triggers senior human controller review.</div>
            </div>
          </ForgeCardContent>
        </ForgeCard>
      )}

    </div>
  );
}
