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
        "h-16 shrink-0 flex items-center justify-between px-6 border-b border-[var(--md-sys-color-outline-variant)]",
        "bg-[var(--md-sys-color-surface-container-low)] sticky top-0 z-20 select-none font-sans"
      )}
    >
      {/* Left side: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 -ml-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium">ExamForge</span>
          <span className="text-[var(--md-sys-color-outline)] font-bold">/</span>
          <span className="text-[var(--md-sys-color-on-surface)] font-bold m3-title-sm text-sm">
            {sectionLabel}
          </span>
        </div>
      </div>

      {/* Right side: M3 Search Bar, Status & Profile */}
      <div className="flex items-center gap-3">
        {/* M3 Search Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            "flex items-center gap-2.5 px-4 py-2",
            "bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]",
            "rounded-full text-[var(--md-sys-color-on-surface-variant)] text-xs font-medium",
            "hover:text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-highest)]",
            "transition-all duration-[var(--duration-fast)] cursor-pointer shadow-xs"
          )}
          title="Search Command Palette (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <span className="hidden sm:inline text-xs">Search actions, routes, exams...</span>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-lowest)] rounded-md border border-[var(--md-sys-color-outline-variant)] shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <div className="w-px h-5 bg-[var(--md-sys-color-outline-variant)] hidden sm:block" />

        {/* M3 Live Status Chip */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-success)] animate-pulse" />
          <span className="hidden xl:inline">Live Engine</span>
        </div>

        {/* User / Brand Logo Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden border border-[rgba(138,216,184,0.3)] shadow-xs select-none bg-[rgba(19,45,40,0.85)] flex items-center justify-center p-1">
          <img src="/logo-icon.png" alt="EF" className="w-full h-full object-contain mix-blend-screen" />
        </div>
      </div>
    </header>
  );
}
