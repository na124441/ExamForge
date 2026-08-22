"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BookOpen,
  ClipboardCheck,
  Shield,
  History,
  Settings,
  LogOut,
  ChevronDown,
  Radio,
  Lock,
  Flame,
  Camera,
  Layers,
  Scale,
  Search,
  Key,
  Award,
  Sparkles
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
  divider?: boolean;
}

const ROLES = [
  { value: "CONTROLLER", label: "Exam Controller (Admin)" },
  { value: "OFFICER", label: "Centre Superintendent" },
  { value: "INVIGILATOR", label: "Invigilator / Proctor" },
  { value: "EVALUATOR", label: "Subject Evaluator" },
  { value: "AUDITOR", label: "Independent Auditor" },
  { value: "CANDIDATE", label: "Candidate / Student" },
];

function getRoleNavigation(role: string): NavSection[] {
  if (role === "CANDIDATE") {
    return [
      {
        title: "Candidate Portal",
        items: [
          { label: "Verifiable Results", path: "/result-portal", icon: Search },
          { label: "Digital Receipt Check", path: "/receipt-verify", icon: Key },
          { label: "Launch CBT Exam", path: "/student-exam", icon: FileText, badge: "Live" },
        ],
      },
    ];
  }

  if (role === "EVALUATOR") {
    return [
      {
        title: "Grading Operations",
        items: [
          { label: "Evaluation Queue", path: "/evaluator", icon: ClipboardCheck },
          { label: "Grading Rubrics", path: "/rubrics", icon: BookOpen },
          { label: "Conflict Arbitration", path: "/evaluation-conflicts", icon: Scale, badge: "Delta > 2.0" },
          { label: "OMR Bubble Review", path: "/omr-review", icon: Camera },
          { label: "Evaluator Analytics", path: "/evaluator-analytics", icon: Layers },
        ],
      },
    ];
  }

  if (role === "OFFICER" || role === "INVIGILATOR") {
    return [
      {
        title: "Centre Operations",
        items: [
          { label: "Centre Desk & Links", path: "/center-onboarding", icon: Building2 },
          { label: "Biometric Check-In", path: "/candidate-verification", icon: Users },
          { label: "Hall Seat Mapping", path: "/seat-map", icon: Layers },
          { label: "Live War Room", path: "/war-room", icon: Radio, badge: "Active" },
          { label: "OMR Scanner Pipeline", path: "/omr-scanner", icon: Camera },
        ],
      },
    ];
  }

  if (role === "AUDITOR") {
    return [
      {
        title: "Forensics & Governance",
        items: [
          { label: "Merkle Audit Ledger", path: "/audit-timeline", icon: History },
          { label: "Security Posture", path: "/security", icon: Shield },
          { label: "Key Ceremony & KMS", path: "/keyspace", icon: Key },
          { label: "Publication Gate", path: "/publication-gate", icon: Lock },
          { label: "Pen-Test Mock Attacks", path: "/security-pentest", icon: Flame },
        ],
      },
    ];
  }

  // CONTROLLER / SUPER ADMIN
  return [
    {
      title: "Mission Control",
      items: [
        { label: "Operations Overview", path: "/authority", icon: LayoutDashboard },
        { label: "Exam War Room", path: "/war-room", icon: Radio, badge: "Live" },
        { label: "Ollama Question Bank", path: "/question-bank", icon: Sparkles, badge: "AI" },
        { label: "Exam Blueprints", path: "/create-exam", icon: FileText },
        { label: "Question Authoring", path: "/controller", icon: BookOpen },
      ],
      divider: true,
    },
    {
      title: "Centres & Delivery",
      items: [
        { label: "Centres & Exam Links", path: "/center-onboarding", icon: Building2 },
        { label: "Biometric Check-In", path: "/candidate-verification", icon: Users },
        { label: "Anti-Collusion Seating", path: "/seat-map", icon: Layers },
        { label: "CBT Window Preview", path: "/student-exam", icon: Sparkles },
      ],
      divider: true,
    },
    {
      title: "Grading & Integrity",
      items: [
        { label: "OMR Scanner Pipeline", path: "/omr-scanner", icon: Camera },
        { label: "Evaluation Operations", path: "/evaluation-ops", icon: ClipboardCheck },
        { label: "Conflict Arbitration", path: "/evaluation-conflicts", icon: Scale },
        { label: "Publication Gate", path: "/publication-gate", icon: Lock },
      ],
      divider: true,
    },
    {
      title: "Security & Auditing",
      items: [
        { label: "Security Command", path: "/security/command", icon: Shield },
        { label: "Pen-Test Simulation", path: "/security-pentest", icon: Flame },
        { label: "Forensic Audit Ledger", path: "/audit-timeline", icon: History },
      ],
      divider: true,
    },
    {
      items: [
        { label: "System Settings", path: "/institution-settings", icon: Settings },
      ],
    },
  ];
}

export function ForgeSidebar() {
  const pathname = usePathname();
  const [role, setRole] = React.useState("CONTROLLER");
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("user_role") || "CONTROLLER");
    }
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    const roleLabel = ROLES.find((r) => r.value === newRole)?.label || newRole;
    localStorage.setItem("user_role", newRole);
    localStorage.setItem("user_name", roleLabel);
    setRole(newRole);

    // Navigate to role-appropriate landing
    const routes: Record<string, string> = {
      CONTROLLER: "/authority",
      OFFICER: "/center-onboarding",
      INVIGILATOR: "/candidate-verification",
      EVALUATOR: "/evaluator",
      AUDITOR: "/audit-timeline",
      CANDIDATE: "/result-portal",
    };
    window.location.href = routes[newRole] || "/authority";
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const sections = getRoleNavigation(role);

  return (
    <aside
      className={cn(
        "w-60 shrink-0 flex flex-col h-full select-none",
        "bg-[var(--surface-panel)] border-r border-[var(--border-subtle)]"
      )}
    >
      {/* Wordmark */}
      <div className="px-4 h-[44px] flex items-center justify-between border-b border-[var(--border-subtle)]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-lg bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.3)] flex items-center justify-center p-0.5 overflow-hidden group-hover:scale-105 transition-transform">
            <img src="/logo-icon.png" alt="EF" className="w-full h-full object-contain mix-blend-screen" />
          </div>
          <span className="text-xs font-bold tracking-tight text-[#FFF4E2]">
            EXAM<span className="text-[#8AD8B8]">FORGE</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--status-operational-text)] bg-[var(--status-operational-surface)] px-2 py-0.5 rounded-[var(--radius-1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-operational)]" />
          <span>ONLINE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-3">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.path ||
                  (item.path !== "/" && pathname.startsWith(item.path + "/"));

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-2)] text-xs font-medium transition-colors",
                      "duration-[var(--duration-fast)]",
                      isActive
                        ? "bg-[var(--surface-interactive)] text-[var(--text-primary)] border-l-2 border-[var(--accent-primary)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isActive
                            ? "text-[var(--accent-primary)]"
                            : "text-[var(--text-muted)]"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0",
                          item.badge === "Live" || item.badge === "Active"
                            ? "bg-[var(--status-operational-surface)] text-[var(--status-operational-text)] border-[var(--status-operational)]"
                            : "bg-[var(--status-warning-surface)] text-[var(--status-warning-text)] border-[var(--status-warning)]"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            {section.divider && (
              <div className="pt-2 border-t border-[var(--border-subtle)]" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer: Persona Switcher + Logout */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--surface-app)] space-y-2">
        <div className="text-[10px] uppercase font-mono font-medium text-[var(--text-muted)] px-1 flex items-center justify-between">
          <span>Active Persona</span>
          <span className="text-[9px] text-[var(--accent-primary)] font-semibold">SWITCH</span>
        </div>
        <div className="relative">
          <select
            value={role}
            onChange={handleRoleChange}
            className={cn(
              "w-full appearance-none px-2.5 py-1.5 pr-7",
              "bg-[var(--surface-panel)] border border-[var(--border-default)]",
              "rounded-[var(--radius-2)] text-xs font-medium",
              "text-[var(--text-primary)] cursor-pointer truncate",
              "focus:outline-none focus:border-[var(--accent-primary)]"
            )}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-1",
            "text-[11px] font-medium text-[var(--text-muted)]",
            "hover:text-[var(--status-danger-text)] transition-colors",
            "rounded-[var(--radius-2)] hover:bg-[var(--status-danger-surface)]",
            "cursor-pointer"
          )}
        >
          <LogOut className="w-3 h-3" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
