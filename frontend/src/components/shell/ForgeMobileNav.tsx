"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
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
  Sparkles,
  X
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
          { label: "Digital Receipts", path: "/receipt-verify", icon: Key },
          { label: "CBT Exam", path: "/student-exam", icon: FileText, badge: "Live" },
        ],
      },
    ];
  }

  if (role === "EVALUATOR") {
    return [
      {
        title: "Grading Operations",
        items: [
          { label: "Grading Queue", path: "/evaluator", icon: ClipboardCheck },
          { label: "Rubrics", path: "/rubrics", icon: BookOpen },
          { label: "Arbitration", path: "/evaluation-conflicts", icon: Scale, badge: "Delta > 2.0" },
          { label: "OMR Review", path: "/omr-review", icon: Camera },
          { label: "Analytics", path: "/evaluator-analytics", icon: Layers },
        ],
      },
    ];
  }

  if (role === "OFFICER" || role === "INVIGILATOR") {
    return [
      {
        title: "Centre Operations",
        items: [
          { label: "Centre Desk", path: "/center-onboarding", icon: Building2 },
          { label: "Biometrics", path: "/candidate-verification", icon: Users },
          { label: "Seat Mapping", path: "/seat-map", icon: Layers },
          { label: "War Room", path: "/war-room", icon: Radio, badge: "Active" },
          { label: "OMR Scanner", path: "/omr-scanner", icon: Camera },
        ],
      },
    ];
  }

  if (role === "AUDITOR") {
    return [
      {
        title: "Forensics & Governance",
        items: [
          { label: "Audit Ledger", path: "/audit-timeline", icon: History },
          { label: "Security", path: "/security", icon: Shield },
          { label: "Key Ceremony", path: "/keyspace", icon: Key },
          { label: "Publication Gate", path: "/publication-gate", icon: Lock },
          { label: "Pen-Test Mock", path: "/security-pentest", icon: Flame },
        ],
      },
    ];
  }

  return [
    {
      title: "Mission Control",
      items: [
        { label: "Overview", path: "/authority", icon: LayoutDashboard },
        { label: "War Room", path: "/war-room", icon: Radio, badge: "Live" },
        { label: "Question Bank", path: "/question-bank", icon: Sparkles, badge: "AI" },
        { label: "Blueprints", path: "/create-exam", icon: FileText },
        { label: "Authoring", path: "/controller", icon: BookOpen },
      ],
      divider: true,
    },
    {
      title: "Centres & Delivery",
      items: [
        { label: "Centres", path: "/center-onboarding", icon: Building2 },
        { label: "Biometrics", path: "/candidate-verification", icon: Users },
        { label: "Anti-Collusion", path: "/seat-map", icon: Layers },
        { label: "CBT Preview", path: "/student-exam", icon: Sparkles },
      ],
      divider: true,
    },
    {
      title: "Grading & Integrity",
      items: [
        { label: "OMR Scanner", path: "/omr-scanner", icon: Camera },
        { label: "Evaluation", path: "/evaluation-ops", icon: ClipboardCheck },
        { label: "Arbitration", path: "/evaluation-conflicts", icon: Scale },
        { label: "Publication Gate", path: "/publication-gate", icon: Lock },
      ],
      divider: true,
    },
    {
      title: "Security & Auditing",
      items: [
        { label: "Command", path: "/security/command", icon: Shield },
        { label: "Pen-Test", path: "/security-pentest", icon: Flame },
        { label: "Merkle Ledger", path: "/audit-timeline", icon: History },
      ],
      divider: true,
    },
  ];
}

interface ForgeMobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgeMobileNav({ open, onOpenChange }: ForgeMobileNavProps) {
  const pathname = usePathname();
  const [role, setRole] = useState("CONTROLLER");

  useEffect(() => {
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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[var(--surface-overlay)] backdrop-blur-xs z-[100] transition-opacity" />
        <Dialog.Content 
          className={cn(
            "fixed inset-y-0 left-0 z-[101] w-[280px]",
            "bg-[var(--md-sys-color-surface-container-low)] rounded-r-[28px] shadow-[var(--md-sys-elevation-4)] border-r border-[var(--md-sys-color-outline-variant)]",
            "flex flex-col overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]">
            <Link href="/" className="flex items-center gap-3" onClick={() => onOpenChange(false)}>
              <img
                src="/logo-icon.png"
                alt="ExamForge Logo"
                className="w-9 h-9 rounded-2xl object-cover shadow-xs border border-[var(--md-sys-color-outline-variant)]"
              />
              <span className="text-base font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                ExamForge
              </span>
            </Link>
            <Dialog.Close asChild>
              <button className="p-2 -mr-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Nav Destinations */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-3 font-sans">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {section.title && (
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    {section.title}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.path ||
                      (item.path !== "/" && pathname.startsWith(item.path + "/"));

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-[var(--duration-fast)]",
                          isActive
                            ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-xs"
                            : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[var(--md-sys-color-on-secondary-container)]" : "")} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
                {section.divider && (
                  <div className="pt-2 pb-1">
                    <div className="h-px bg-[var(--md-sys-color-outline-variant)]" />
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer Persona Selector */}
          <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] space-y-3">
            <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Active Persona
            </div>
            <div className="relative">
              <select
                value={role}
                onChange={handleRoleChange}
                className={cn(
                  "w-full appearance-none px-3.5 py-2 pr-8",
                  "bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]",
                  "rounded-xl text-sm font-medium",
                  "text-[var(--md-sys-color-on-surface)] cursor-pointer truncate",
                  "focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                )}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
