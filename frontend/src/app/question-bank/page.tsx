"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Database,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Cpu,
  Layers,
  FileCheck,
  Flame,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeSelect } from "@/components/forge/ForgeSelect";
import { cn } from "@/lib/cn";

interface QuestionItem {
  id: string;
  text: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  content_hash: string;
  status: string;
  subject?: string;
  topic?: string;
}

export default function QuestionBankPage() {
  const [subject, setSubject] = useState("Computer Science");
  const [topic, setTopic] = useState("Distributed Consensus & Raft Protocol");
  const [difficulty, setDifficulty] = useState("HARD");
  const [count, setCount] = useState(3);
  const [selectedModel, setSelectedModel] = useState("phi:latest");
  const [customPrompt, setCustomPrompt] = useState("");
  const [autoSave, setAutoSave] = useState(true);

  const [availableModels, setAvailableModels] = useState<string[]>([
    "phi:latest",
    "kimi-k2.6:cloud",
    "gemma4:e4b",
    "qwen3:4b",
    "deepseek-v3.1:671b-cloud"
  ]);
  const [ollamaHost, setOllamaHost] = useState("http://localhost:11434");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: "QST-AI-9F82A1B0",
      subject: "Computer Science",
      topic: "Distributed Consensus & Raft Protocol",
      text: "In the Raft consensus algorithm, how does a candidate node handle receiving an AppendEntries RPC from a leader with a term number lower than its own current term?",
      options: {
        "A": "It rejects the RPC and returns its own higher term number.",
        "B": "It immediately steps down to follower state and updates its term.",
        "C": "It forwards the RPC to all other followers in the cluster.",
        "D": "It increments its term number and casts a vote for the leader."
      },
      answer: "A",
      explanation: "Raft invariant requires rejecting any RPC containing an outdated term (term < currentTerm) to prevent stale split-brain leadership.",
      difficulty: "HARD",
      marks: 4,
      content_hash: "9f82a1b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
      status: "SAVED_TO_BANK"
    },
    {
      id: "QST-AI-4C7E819D",
      subject: "Computer Science",
      topic: "Distributed Consensus & Raft Protocol",
      text: "Which quorum condition must be satisfied in Paxos before a Proposer can safely commit a value during Phase 2b?",
      options: {
        "A": "A majority of Acceptors (N/2 + 1) must reply with Accepted(n, v).",
        "B": "All Acceptors in the cluster must reach unanimous consensus.",
        "C": "At least one Learner must replicate the value to local non-volatile disk.",
        "D": "The Distinguished Proposer must increment the monotonically increasing proposal number by 2."
      },
      answer: "A",
      explanation: "Paxos requires a strict majority quorum in Phase 2b to guarantee non-empty intersection between any two successive proposal quorums.",
      difficulty: "HARD",
      marks: 4,
      content_hash: "4c7e819d2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
      status: "SAVED_TO_BANK"
    }
  ]);

  useEffect(() => {
    // Fetch available Ollama models on mount
    fetch("/api/questions/ai-models")
      .then((res) => res.json())
      .then((data) => {
        if (data.models && data.models.length > 0) {
          const names = data.models.map((m: any) => m.name);
          setAvailableModels(names);
          if (names.length > 0) setSelectedModel(names[0]);
        }
        if (data.ollama_host) {
          setOllamaHost(data.ollama_host);
        }
      })
      .catch(() => {
        // Fallback to default catalog
      });
  }, []);

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        subject,
        topic,
        difficulty,
        count: Number(count),
        model: selectedModel,
        question_type: "MCQ_SINGLE",
        custom_instructions: customPrompt || undefined,
        auto_save_to_bank: autoSave
      };

      const res = await fetch("/api/questions/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          const newItems = data.questions.map((q: any) => ({
            ...q,
            subject,
            topic
          }));
          setQuestions((prev) => [...newItems, ...prev]);
        }
      }
    } catch (e) {
      console.error("AI Generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.subject && q.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === "ALL") return matchesSearch;
    return matchesSearch && q.difficulty === activeFilter;
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto min-h-screen text-[var(--text-primary)]">
      {/* ═══════════════════════════════════════════════════════════
          HEADER BAR & OLLAMA STATUS
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[var(--radius-2)] bg-[var(--accent-primary-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary-border)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="forge-page-title text-xl font-bold">
                Ollama AI Question Bank Generator
              </h1>
              <p className="forge-page-description text-xs text-[var(--text-muted)]">
                Author, encrypt, and seal examination questions dynamically using Ollama Python Cloud models.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-2)] bg-[var(--surface-panel)] border border-[var(--border-subtle)] font-mono text-xs">
            <Cpu className="w-4 h-4 text-[var(--forge-cyan)]" />
            <span className="text-[var(--text-muted)]">Host:</span>
            <span className="text-[var(--text-primary)]">{ollamaHost}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-operational)] animate-pulse" />
          </div>
          <div className="px-3 py-1.5 rounded-[var(--radius-2)] bg-[var(--status-operational-surface)] border border-[var(--status-operational-border)] text-[var(--status-operational-text)] font-mono text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>AES-256 SEALED</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN 2-COLUMN LAYOUT: GENERATOR CONTROLS + QUESTION BANK
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EXAMINER GENERATION DESK (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="forge-panel p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Examiner AI Blueprint
                </span>
              </div>
              <ForgeBadge variant="info" size="sm">
                {selectedModel}
              </ForgeBadge>
            </div>

            {/* Subject */}
            <div>
              <label className="forge-label">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics & Calculus</option>
                <option value="Physics">Physics & Electromagnetism</option>
                <option value="Chemistry">Chemistry & Thermodynamics</option>
                <option value="Cyber Security">Cyber Security & Cryptography</option>
                <option value="Data Structures">Data Structures & Algorithms</option>
                <option value="Systems Engineering">Systems & Operating Systems</option>
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="forge-label">Specific Topic / Concept</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Distributed Consensus, Merkle Trees, Carnot Cycle"
                className="input-field"
              />
            </div>

            {/* Difficulty & Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="forge-label">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="input-field"
                >
                  <option value="EASY">Easy (1 Mark)</option>
                  <option value="MEDIUM">Medium (2 Marks)</option>
                  <option value="HARD">Hard (4 Marks)</option>
                </select>
              </div>

              <div>
                <label className="forge-label">Question Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>

            {/* Model Selector */}
            <div>
              <label className="forge-label">Ollama Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="input-field font-mono text-xs"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Prompt Guidelines */}
            <div>
              <label className="forge-label">Additional Examiner Guidelines (Optional)</label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Include numerical calculation step, edge cases in distributed failures..."
                className="input-field py-2 resize-none h-16 text-xs"
              />
            </div>

            {/* Auto-Save Toggle */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-2)] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-xs">
              <span className="text-[var(--text-secondary)]">Encrypt & Auto-Save to Bank</span>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating || !topic.trim()}
              className="btn-primary w-full py-2.5 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating via Ollama...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Questions with Ollama</span>
                </>
              )}
            </button>
          </div>

          {/* Cryptographic Protection Notice */}
          <div className="p-4 rounded-[var(--radius-3)] bg-[var(--surface-panel)] border border-[var(--border-subtle)] space-y-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Hardware-Enforced Encryption</span>
            </div>
            <p className="leading-relaxed">
              Every question generated is encrypted using AES-GCM-256 storage keys and tagged with a deterministic SHA-256 content proof hash to ensure question bank integrity before exam assembly.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION BANK REPOSITORY (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="forge-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search question text, topic, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 bg-[var(--surface-elevated)] p-1 rounded-[var(--radius-2)] border border-[var(--border-subtle)] text-xs font-mono">
                {["ALL", "EASY", "MEDIUM", "HARD"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setActiveFilter(lvl)}
                    className={cn(
                      "px-2.5 py-1 rounded-[var(--radius-1)] cursor-pointer transition-colors text-[11px]",
                      activeFilter === lvl
                        ? "bg-[var(--accent-primary)] text-white font-bold"
                        : "text-[var(--text-secondary)] hover:text-white"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <span className="text-xs font-mono text-[var(--text-muted)]">
                {filteredQuestions.length} Questions
              </span>
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="forge-panel p-12 text-center space-y-3">
                <Database className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  No Questions Found
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  Adjust your search filters or generate new questions using the Ollama AI Blueprint panel on the left.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="forge-panel p-5 space-y-4 hover:border-[var(--border-strong)] transition-all"
                >
                  {/* Top Bar of Question Card */}
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-[var(--text-primary)]">{q.id}</span>
                      <span className="text-[var(--border-strong)]">|</span>
                      <span className="text-[var(--text-muted)]">{q.subject} &rarr; {q.topic}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ForgeBadge
                        variant={
                          q.difficulty === "HARD"
                            ? "danger"
                            : q.difficulty === "MEDIUM"
                            ? "warning"
                            : "success"
                        }
                        size="sm"
                      >
                        {q.difficulty} ({q.marks} Marks)
                      </ForgeBadge>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--status-operational-surface)] text-[var(--status-operational-text)] border border-[var(--status-operational-border)]">
                        {q.status}
                      </span>
                    </div>
                  </div>

                  {/* Question Body */}
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                    {q.text}
                  </p>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(q.options || {}).map(([key, val]) => {
                      const isCorrect = key === q.answer;
                      return (
                        <div
                          key={key}
                          className={cn(
                            "p-2.5 rounded-[var(--radius-2)] border text-xs flex items-start gap-2.5 transition-colors",
                            isCorrect
                              ? "bg-[var(--status-operational-surface)] border-[var(--status-operational-border)] text-[var(--text-primary)] font-medium"
                              : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                          )}
                        >
                          <span
                            className={cn(
                              "w-5 h-5 rounded flex items-center justify-center font-mono font-bold shrink-0 text-[11px]",
                              isCorrect
                                ? "bg-[var(--status-operational)] text-white"
                                : "bg-[var(--surface-panel)] border border-[var(--border-default)] text-[var(--text-muted)]"
                            )}
                          >
                            {key}
                          </span>
                          <span className="pt-0.5">{val}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Scientific Explanation & Cryptographic Hash Footer */}
                  {q.explanation && (
                    <div className="p-3 rounded-[var(--radius-2)] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-xs space-y-1">
                      <span className="font-semibold text-[var(--accent-primary)] block">
                        Correct Answer: Option {q.answer} &mdash; Scientific Rationale:
                      </span>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>SHA-256:</span>
                      <ForgeMonoText text={q.content_hash} className="text-xs text-[var(--text-secondary)] truncate max-w-xs" />
                    </div>
                    <span>AES-GCM-256 Storage Lock Active</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
