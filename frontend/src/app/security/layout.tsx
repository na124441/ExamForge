"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  Layers,
  EyeOff,
  UserCheck,
  CheckCircle2,
  Key,
  ClipboardList,
  Archive,
  Flame,
  FileText,
  Zap,
  Building2,
  LogOut,
  Shield,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ExamForgeLogo } from "@/components/brand/ExamForgeLogo";

interface NavItem {
  path: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { path: "/security", name: "Overview", icon: ShieldCheck },
  { path: "/security/threat-model", name: "Threat Model", icon: AlertOctagon },
  { path: "/security/assets", name: "Asset Classification", icon: Layers },
  { path: "/security/privacy", name: "PII & Privacy", icon: EyeOff },
  { path: "/security/approvals", name: "Dual Approvals", icon: UserCheck },
  { path: "/security/hardening", name: "OWASP Hardening", icon: CheckCircle2 },
  { path: "/security/keys", name: "Key Lifecycle", icon: Key },
  { path: "/security/access-review", name: "Access Review", icon: ClipboardList },
  { path: "/security/retention", name: "Data Retention", icon: Archive },
  { path: "/security/incidents", name: "Incident Ledger", icon: Flame },
  { path: "/security/compliance-report", name: "Compliance Report", icon: FileText },
  { path: "/security/pentest", name: "Pentest Simulation", icon: Zap },
];

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      data-workspace="auditor"
      className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] flex flex-col font-sans"
    >
      {/* Top Banner */}
      <header className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex justify-between items-center z-10 sticky top-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ExamForgeLogo variant="mark" size={32} />
          <div>
            <h1 className="text-sm font-bold text-[var(--color-ink)] tracking-tight flex items-center gap-2">
              <span>Security &amp; Compliance Hub</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] rounded-full font-bold uppercase">
                Zero-Trust Shield
              </span>
            </h1>
            <p className="text-[11px] text-[var(--color-ink-muted)]">
              Cryptographic Key Orchestration, Threat Mitigation &amp; Immutable Audit Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/exam-ops"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)] transition shadow-2xs"
          >
            <Building2 size={13} className="text-[var(--color-ink-muted)]" />
            <span>Operations Console</span>
          </Link>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 text-[var(--color-ink-muted)] hover:text-red-600 hover:bg-red-50/50 rounded-lg transition cursor-pointer"
          >
            <LogOut size={13} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-[var(--color-surface-raised)] border-r border-[var(--color-border)] flex flex-col justify-between overflow-y-auto p-3 shrink-0 hidden md:flex">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider px-3 py-1.5">
              Security Subsystems
            </div>
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 font-medium group",
                    active
                      ? "bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-bold shadow-2xs"
                      : "border border-transparent text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "shrink-0 transition-colors",
                      active
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl">
            <div className="text-[9px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
              Enforcement Protocol
            </div>
            <div className="text-[11px] font-mono font-bold text-[var(--color-accent)] mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SECURE_AUDIT_V2.0
            </div>
            <p className="text-[10px] text-[var(--color-ink-muted)] mt-1 leading-tight">
              Hardware-anchored ECDSA-P256 with Merkle root verification.
            </p>
          </div>
        </aside>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-[var(--color-surface)] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
