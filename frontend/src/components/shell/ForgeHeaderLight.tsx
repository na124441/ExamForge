"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { Search, Menu, ShieldCheck } from "lucide-react";

interface ForgeHeaderLightProps {
  onOpenCommandPalette?: () => void;
  onToggleMobileNav?: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  "/authority": "Executive Operations",
  "/examinations": "Examinations",
  "/create-exam": "Create Exam Blueprint",
  "/candidate-verification": "Biometric Verification",
  "/center-onboarding": "Centres & Infrastructure",
  "/controller": "Question Bank Authoring",
  "/evaluation-ops": "Evaluation Operations",
  "/security": "Security Posture",
  "/audit-timeline": "Merkle Forensic Ledger",
  "/institution-settings": "Settings",
  "/war-room": "Live War Room",
  "/pilot-run": "Pilot Run",
  "/publication-gate": "Publication Gate",
  "/risk-dashboard": "Risk Dashboard",
  "/security-pentest": "Security Testing",
  "/omr-scanner": "OMR Scanner Pipeline",
  "/omr-review": "OMR Bubble Review",
  "/evaluator": "Subject Evaluator",
  "/rubrics": "Grading Rubrics",
  "/seat-map": "Anti-Collusion Seat Map",
  "/exams": "Control Room",
  "/exam-ops": "Exam Operations",
  "/dispute-ops": "Disputes",
  "/incidents": "Incidents",
  "/keyspace": "Key Management & KMS",
  "/policies": "Policy Engine",
  "/role-matrix": "Role Matrix",
  "/platform-admin": "Platform Admin",
  "/ops": "Infrastructure Ops",
  "/centers": "Centres",
};

function getSectionLabel(pathname: string): string {
  if (SECTION_LABELS[pathname]) return SECTION_LABELS[pathname];
  for (const [prefix, label] of Object.entries(SECTION_LABELS)) {
    if (pathname.startsWith(prefix + "/")) return label;
  }
  return "Workspace";
}

export function ForgeHeaderLight({ onOpenCommandPalette, onToggleMobileNav }: ForgeHeaderLightProps) {
  const pathname = usePathname();
  const sectionLabel = getSectionLabel(pathname);

  return (
    <header
      className={cn(
        "h-16 shrink-0 flex items-center justify-between px-6 border-b border-[var(--color-border)]",
        "bg-[var(--color-surface-raised)] sticky top-0 z-20 select-none font-sans"
      )}
    >
      {/* Left side: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 -ml-2 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] rounded-full transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-[var(--color-ink-secondary)] font-medium">ExamForge</span>
          <span className="text-[var(--color-ink-muted)] font-bold">/</span>
          <span className="text-[var(--color-ink)] font-bold text-sm">
            {sectionLabel}
          </span>
        </div>
      </div>

      {/* Right side: Search Bar, Status & Profile */}
      <div className="flex items-center gap-3">
        {/* Search Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            "flex items-center gap-2.5 px-4 py-2",
            "bg-[var(--color-surface-sunken)] border border-[var(--color-border)]",
            "rounded-full text-[var(--color-ink-secondary)] text-xs font-medium",
            "hover:text-[var(--color-ink)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-inset)]",
            "transition-all cursor-pointer shadow-xs"
          )}
          title="Search Command Palette (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-[var(--color-ink-secondary)]" />
          <span className="hidden sm:inline text-xs">Search actions, routes, exams...</span>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-ink-secondary)] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <div className="w-px h-5 bg-[var(--color-border)] hidden sm:block" />

        {/* Live Status Chip */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-success-surface)] text-[var(--color-success-text)] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
          <span className="hidden xl:inline">Live Engine</span>
        </div>

        {/* User / Brand Logo Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden border border-[var(--color-border)] shadow-xs select-none bg-[var(--color-surface-sunken)] flex items-center justify-center p-1">
          <img src="/logo-icon.png" alt="EF" className="w-full h-full object-contain" />
        </div>
      </div>
    </header>
  );
}
