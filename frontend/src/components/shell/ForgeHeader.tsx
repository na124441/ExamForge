"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { Search, Clock } from "lucide-react";

interface ForgeHeaderProps {
  onOpenCommandPalette?: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  "/authority": "Overview",
  "/create-exam": "Examinations",
  "/candidate-verification": "Candidates",
  "/center-onboarding": "Centres",
  "/controller": "Question Bank",
  "/evaluation-ops": "Evaluation",
  "/security": "Security",
  "/audit-timeline": "Audit Log",
  "/institution-settings": "Settings",
  "/war-room": "War Room",
  "/pilot-run": "Pilot Run",
  "/publication-gate": "Publication Gate",
  "/risk-dashboard": "Risk Dashboard",
  "/security-pentest": "Security Testing",
  "/omr-scanner": "OMR Scanner",
  "/omr-review": "OMR Review",
  "/evaluator": "Evaluator",
  "/rubrics": "Rubrics",
  "/seat-map": "Seat Map",
  "/exams": "Exam Control",
  "/exam-ops": "Exam Operations",
  "/dispute-ops": "Disputes",
  "/incidents": "Incidents",
  "/keyspace": "Key Management",
  "/policies": "Policies",
  "/role-matrix": "Role Matrix",
  "/platform-admin": "Platform Admin",
  "/ops": "Operations",
  "/centers": "Centres",
};

function getSectionLabel(pathname: string): string {
  // Exact match first
  if (SECTION_LABELS[pathname]) return SECTION_LABELS[pathname];
  // Prefix match
  for (const [prefix, label] of Object.entries(SECTION_LABELS)) {
    if (pathname.startsWith(prefix + "/")) return label;
  }
  return "ExamForge";
}

export function ForgeHeader({ onOpenCommandPalette }: ForgeHeaderProps) {
  const pathname = usePathname();
  const [role, setRole] = React.useState("CONTROLLER");
  const [clockTime, setClockTime] = React.useState("");
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("user_role") || "CONTROLLER");
    }

    const updateClock = () => {
      setClockTime(
        new Date().toLocaleTimeString("en-US", { hour12: false })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const sectionLabel = getSectionLabel(pathname);

  return (
    <header
      className={cn(
        "h-[44px] shrink-0 flex items-center justify-between px-5",
        "bg-[var(--surface-panel)] border-b border-[var(--border-subtle)]",
        "text-xs select-none"
      )}
      style={{ zIndex: "var(--z-header)" }}
    >
      {/* Left: Section name */}
      <span className="text-sm font-semibold text-[var(--text-primary)]">
        {sectionLabel}
      </span>

      {/* Right: Search, Role, Clock, Status */}
      <div className="flex items-center gap-3">
        {/* Command palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1",
            "bg-[var(--surface-elevated)] border border-[var(--border-default)]",
            "rounded-[var(--radius-2)] text-[var(--text-muted)]",
            "hover:text-[var(--text-secondary)] hover:border-[var(--border-strong)]",
            "transition-colors cursor-pointer"
          )}
          title="Quick Jump (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <kbd className="font-mono text-[10px] text-[var(--text-muted)]">
            Ctrl+K
          </kbd>
        </button>

        <div className="w-px h-4 bg-[var(--border-subtle)]" />

        {/* Role badge */}
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {role}
        </span>

        <div className="w-px h-4 bg-[var(--border-subtle)]" />

        {/* Clock */}
        <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
          <Clock className="w-3 h-3 inline mr-1 opacity-50" />
          {clockTime || "00:00:00"}
        </span>

        {/* System status dot */}
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isOnline
              ? "bg-[var(--status-operational)]"
              : "bg-[var(--status-danger)] animate-pulse-dot"
          )}
          title={isOnline ? "Online" : "Offline"}
        />
      </div>
    </header>
  );
}
