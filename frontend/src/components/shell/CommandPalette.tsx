"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Compass,
  Terminal,
  FilePlus,
  Radio,
  History,
  Layers,
  Scale,
  Lock,
  Shield,
  Users,
  Key,
  Cpu,
  X,
  ArrowRight,
  Sparkles,
  Command,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Navigation" | "Personas" | "Quick Actions";
  icon: React.ComponentType<any>;
  path?: string;
  action?: () => void;
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSwitchRole = useCallback((role: string, label: string, targetPath: string) => {
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_name", label);
    router.push(targetPath);
    onClose();
    setTimeout(() => window.location.reload(), 100);
  }, [router, onClose]);

  const commands: CommandItem[] = useMemo(() => [
    // Core Navigation
    {
      id: "nav-authority",
      title: "Executive Oversight Dashboard",
      subtitle: "Institutional integrity metrics & policy status",
      category: "Navigation",
      icon: Compass,
      path: "/authority",
      keywords: ["executive", "authority", "dashboard", "overview", "metrics", "trust"]
    },
    {
      id: "nav-pilot",
      title: "Guided 15-Stage Lifecycle Walkthrough",
      subtitle: "Interactive step-by-step examination pipeline simulator",
      category: "Navigation",
      icon: Terminal,
      path: "/pilot-run",
      keywords: ["pilot", "walkthrough", "stages", "pipeline", "simulation", "guided"]
    },
    {
      id: "nav-war-room",
      title: "Operations War Room",
      subtitle: "Live telemetry, node mesh & tamper attack simulator",
      category: "Navigation",
      icon: Command,
      path: "/war-room",
      keywords: ["war room", "operations", "telemetry", "attacks", "nodes", "live"]
    },
    {
      id: "nav-create-exam",
      title: "Create Examination",
      subtitle: "Configure blueprint, parameters & security policy",
      category: "Navigation",
      icon: FilePlus,
      path: "/create-exam",
      keywords: ["create", "exam", "blueprint", "setup", "new"]
    },
    {
      id: "nav-control-room",
      title: "Exam Control Room",
      subtitle: "Active session monitoring & dual-custody package keys",
      category: "Navigation",
      icon: Radio,
      path: "/exams/EXM-001/control-room",
      keywords: ["control", "room", "package", "custody", "keys", "live"]
    },
    {
      id: "nav-omr",
      title: "OMR Correction & Bubble Review",
      subtitle: "Review ambiguous scans and density anomalies",
      category: "Navigation",
      icon: Layers,
      path: "/omr-review",
      keywords: ["omr", "scans", "bubbles", "correction", "review", "density"]
    },
    {
      id: "nav-eval-ops",
      title: "Evaluation Operations & Double Grading",
      subtitle: "Anonymized booklet queues & rubric distribution",
      category: "Navigation",
      icon: Scale,
      path: "/evaluation-ops",
      keywords: ["evaluation", "grading", "rubrics", "evaluators", "marking"]
    },
    {
      id: "nav-gate",
      title: "Result Publication Safety Gate",
      subtitle: "Pre-flight safety audit & cryptographic release gate",
      category: "Navigation",
      icon: Lock,
      path: "/publication-gate",
      keywords: ["publication", "gate", "release", "safety", "publish"]
    },
    {
      id: "nav-verify",
      title: "Public Result & Receipt Verifier",
      subtitle: "Verify cryptographic receipt stamp and SHA-256 seal",
      category: "Navigation",
      icon: Key,
      path: "/receipt-verify",
      keywords: ["receipt", "verify", "attestation", "hash", "public", "seal"]
    },
    {
      id: "nav-audit",
      title: "Immutable Audit Timeline",
      subtitle: "Cryptographic block-by-block ledger verification",
      category: "Navigation",
      icon: History,
      path: "/audit-timeline",
      keywords: ["audit", "timeline", "ledger", "hashes", "blocks", "history"]
    },
    {
      id: "nav-risk",
      title: "Risk & Collusion Analytics",
      subtitle: "Statistical seat-distance anomaly detection",
      category: "Navigation",
      icon: Cpu,
      path: "/risk-dashboard",
      keywords: ["risk", "collusion", "seating", "cheat", "analytics"]
    },

    // Persona Switchers
    {
      id: "role-controller",
      title: "Switch Persona: Exam Controller",
      subtitle: "Full operational and publishing authority",
      category: "Personas",
      icon: Shield,
      action: () => handleSwitchRole("CONTROLLER", "Exam Controller", "/authority"),
      keywords: ["role", "persona", "controller", "switch", "admin"]
    },
    {
      id: "role-officer",
      title: "Switch Persona: Center Officer",
      subtitle: "Physical exam center & candidate check-in operations",
      category: "Personas",
      icon: Users,
      action: () => handleSwitchRole("OFFICER", "Center Officer", "/center-console"),
      keywords: ["role", "persona", "officer", "center", "switch"]
    },
    {
      id: "role-evaluator",
      title: "Switch Persona: Evaluator",
      subtitle: "Double-blind descriptive grading queue",
      category: "Personas",
      icon: Scale,
      action: () => handleSwitchRole("EVALUATOR", "Evaluator", "/evaluator"),
      keywords: ["role", "persona", "evaluator", "grading", "switch"]
    },
    {
      id: "role-auditor",
      title: "Switch Persona: System Auditor",
      subtitle: "Zero-trust verification & compliance attestations",
      category: "Personas",
      icon: History,
      action: () => handleSwitchRole("AUDITOR", "System Auditor", "/audit-timeline"),
      keywords: ["role", "persona", "auditor", "compliance", "switch"]
    },
    {
      id: "role-candidate",
      title: "Switch Persona: Candidate Portal",
      subtitle: "Candidate verifiable transcript and certificate viewer",
      category: "Personas",
      icon: Key,
      action: () => handleSwitchRole("CANDIDATE", "Candidate", "/result-portal"),
      keywords: ["role", "persona", "candidate", "student", "results", "switch"]
    }
  ], [handleSwitchRole]);

  // Filtering
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter((cmd) =>
      cmd.title.toLowerCase().includes(lower) ||
      cmd.subtitle.toLowerCase().includes(lower) ||
      cmd.keywords.some((k) => k.includes(lower))
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          if (selected.action) {
            selected.action();
          } else if (selected.path) {
            router.push(selected.path);
            onClose();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[var(--surface-overlay)] backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* M3 Modal Container */}
      <div className="relative w-full max-w-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-[28px] shadow-[var(--md-sys-elevation-3)] overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-highest)]">
          <Search className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, or switch personas..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center px-2 py-0.5 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-lowest)] rounded-md border border-[var(--md-sys-color-outline-variant)]">
            ESC
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[var(--md-sys-color-outline-variant)]">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
              No matching commands or pages found for "{query}".
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.path) {
                      router.push(item.path);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-[var(--duration-fast)]",
                    isSelected
                      ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shadow-xs"
                      : "hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs"
                          : "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate text-[var(--md-sys-color-on-surface)]">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            item.category === "Personas"
                              ? "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]"
                              : "bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface-variant)]"
                          )}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {isSelected && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-primary)]">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-5 py-3 bg-[var(--md-sys-color-surface-container-lowest)] border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-md font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-md font-mono text-[10px]">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-md font-mono text-[10px]">↵</kbd>
              <span>jump</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--md-sys-color-primary)] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>M3 Command Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
