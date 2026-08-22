"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
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
  ChevronRight,
  ChevronLeft,
  Radio,
  Lock,
  Flame,
  Camera,
  Layers,
  Scale,
  Search,
  Key,
  Sparkles,
  UserCircle,
  Plus
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
          { label: "Registration", path: "/candidate", icon: Users, badge: "New" },
          { label: "CBT Exam", path: "/student-exam", icon: FileText, badge: "Live" },
          { label: "Verifiable Results", path: "/result-portal", icon: Search },
          { label: "Digital Receipts", path: "/receipt-verify", icon: Key },
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
        { label: "SafeBatch", path: "/safebatch", icon: Sparkles, badge: "KILLER" },
        { label: "Vendor EaaS", path: "/vendor", icon: Building2, badge: "EaaS" },
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
        { label: "Students", path: "/candidate", icon: Users },
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

export function ForgeNavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("CONTROLLER");
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedRole = localStorage.getItem("user_role");
    if (savedRole) {
      setRole(savedRole);
    }
    const savedExpanded = localStorage.getItem("forge-nav-expanded") === "true";
    setIsExpanded(savedExpanded);
  }, []);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("forge-nav-expanded", String(newState));
  };

  const handleRoleChange = (newRole: string) => {
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

  const currentRole = mounted ? role : "CONTROLLER";
  const sections = getRoleNavigation(currentRole);

  return (
    <Tooltip.Provider delayDuration={200}>
      <aside
        className={cn(
          "h-full shrink-0 flex flex-col select-none transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-20",
          "bg-[var(--color-surface-raised)] border-r border-[var(--color-border)]",
          isExpanded ? "w-[256px]" : "w-[76px]"
        )}
      >
        {/* Top: Header / Logo & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between shrink-0 px-3.5 border-b border-[var(--color-border)]">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 overflow-hidden rounded-xl p-1 transition-colors hover:bg-[var(--color-surface-sunken)]",
              !isExpanded && "justify-center w-full"
            )}
          >
            <img
              src="/logo-icon.png"
              alt="ExamForge Logo"
              className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0 border border-[var(--color-border)]"
            />
            {isExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-[var(--color-ink)] truncate">
                  ExamForge
                </span>
                <span className="text-[10px] font-mono text-[var(--color-ink-secondary)] -mt-0.5">
                  M3 OS v2.0
                </span>
              </div>
            )}
          </Link>

          {isExpanded && (
            <button
              onClick={toggleExpanded}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer"
              title="Collapse Navigation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Action / Floating Action Button */}
        <div className="p-3 shrink-0 flex justify-center">
          {isExpanded ? (
            <button
              onClick={() => router.push("/create-exam")}
              className="w-full h-12 rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-accent)] shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Create Exam</span>
            </button>
          ) : (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={() => router.push("/create-exam")}
                  className="w-12 h-12 rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-accent)] shadow-sm hover:shadow-md flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={12}
                  className="z-[200] px-3 py-1.5 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-xs font-medium rounded-lg shadow-md"
                >
                  Create Exam
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
        </div>

        {/* Middle: Navigation Destinations */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {isExpanded && section.title && (
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)]">
                  {section.title}
                </div>
              )}
              {!isExpanded && section.title && (
                <div className="w-8 h-px bg-[var(--color-border)] mx-auto my-2" />
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.path ||
                    (item.path !== "/" && pathname.startsWith(item.path + "/"));

                  if (isExpanded) {
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                          "flex items-center gap-3.5 px-4 py-2.5 rounded-lg transition-all text-sm font-medium",
                          isActive
                            ? "bg-[var(--color-accent-surface)] text-[var(--color-accent)] font-semibold shadow-xs"
                            : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                        )}
                      >
                        <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[var(--color-accent)]" : "")} />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-accent)] text-[var(--color-ink-inverse)] shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  // Collapsed Rail Item (Active Pill + Label Underneath)
                  return (
                    <Tooltip.Root key={item.path}>
                      <Tooltip.Trigger asChild>
                        <Link
                          href={item.path}
                          className="flex flex-col items-center justify-center py-1.5 group cursor-pointer"
                        >
                          <div
                            className={cn(
                              "w-14 h-8 rounded-full flex items-center justify-center transition-all relative",
                              isActive
                                ? "bg-[var(--color-accent-surface)] text-[var(--color-accent)] shadow-xs"
                                : "text-[var(--color-ink-secondary)] group-hover:bg-[var(--color-surface-sunken)] group-hover:text-[var(--color-ink)]"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            {item.badge && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--color-accent)] ring-2 ring-[var(--color-surface-raised)]" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-medium mt-1 truncate max-w-[64px] text-center leading-tight transition-colors",
                              isActive
                                ? "text-[var(--color-ink)] font-semibold"
                                : "text-[var(--color-ink-secondary)] group-hover:text-[var(--color-ink)]"
                            )}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="right"
                          sideOffset={12}
                          className="z-[200] px-3 py-1.5 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-xs font-medium rounded-lg shadow-md flex items-center gap-2"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[var(--color-accent)] text-[var(--color-ink-inverse)] font-bold">
                              {item.badge}
                            </span>
                          )}
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: Settings, Persona Switcher & Expand */}
        <div className="shrink-0 border-t border-[var(--color-border)] p-2.5 flex flex-col items-center gap-1.5 bg-[var(--color-surface-sunken)]">
          {/* Persona Switcher Popover */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className={cn(
                  "flex items-center rounded-xl transition-all text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] cursor-pointer",
                  isExpanded ? "w-full p-2.5 gap-3 justify-start" : "w-12 h-12 justify-center"
                )}
                title="Switch Operational Persona"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent)] flex items-center justify-center font-bold text-xs shrink-0">
                  {role.slice(0, 2)}
                </div>
                {isExpanded && (
                  <div className="flex flex-col items-start min-w-0 overflow-hidden flex-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-ink-secondary)] tracking-wider">
                      Role Active
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-ink)] truncate w-full text-left">
                      {role}
                    </span>
                  </div>
                )}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                side="right"
                align="end"
                sideOffset={14}
                className="z-[200] w-64 p-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl shadow-lg"
              >
                <div className="px-3 py-2 text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider">
                  Switch Operational Role
                </div>
                <div className="space-y-1">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRoleChange(r.value)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                        role === r.value
                          ? "bg-[var(--color-accent-surface)] text-[var(--color-accent)] font-semibold"
                          : "text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Action Row */}
          <div className="w-full flex items-center justify-center gap-1">
            <Link
              href="/institution-settings"
              className={cn(
                "flex items-center justify-center rounded-lg transition-colors text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]",
                isExpanded ? "flex-1 py-2 gap-2 text-xs font-medium" : "w-10 h-10"
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              {isExpanded && <span>Settings</span>}
            </Link>

            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center justify-center rounded-lg transition-colors text-[var(--color-ink-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] cursor-pointer",
                isExpanded ? "flex-1 py-2 gap-2 text-xs font-medium" : "w-10 h-10"
              )}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              {isExpanded && <span>Logout</span>}
            </button>
          </div>

          {!isExpanded && (
            <button
              onClick={toggleExpanded}
              className="w-full h-8 flex items-center justify-center text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] rounded-lg transition-colors cursor-pointer mt-1"
              title="Expand Navigation Rail"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
