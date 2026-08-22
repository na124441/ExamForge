"use client";

import React from "react";
import Link from "next/link";
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  ScanEye, 
  Eye, 
  Radio, 
  Fingerprint, 
  GraduationCap, 
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/cn";

interface PortalOption {
  title: string;
  category: string;
  role: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge: string;
}

const PORTALS: PortalOption[] = [
  {
    title: "Candidate & Student Portal",
    category: "Assessments & Applications",
    role: "CANDIDATE",
    description: "Application submission, Aadhaar QR verification, dynamic UPI payment, admit cards, and verified scorecards.",
    href: "/candidate",
    icon: GraduationCap,
    badge: "Public & Candidates",
  },
  {
    title: "Statutory Examination Authority",
    category: "Multi-Tenant EaaS",
    role: "VENDOR",
    description: "National boards, testing agencies, and university assessment bodies onboarding & catalog configuration.",
    href: "/vendor",
    icon: Building2,
    badge: "Boards & Vendors",
  },
  {
    title: "Exam Controller Mission Control",
    category: "Executive Authority",
    role: "CONTROLLER",
    description: "Question blueprints, double-controller key ceremonies, sealed package distribution, and publication safety gate.",
    href: "/authority",
    icon: ShieldCheck,
    badge: "Authority Admin",
  },
  {
    title: "Live Operations War Room",
    category: "Network Telemetry",
    role: "CONTROLLER",
    description: "Real-time workstation heartbeat monitor, active anomaly alerts, live exam progress, and anti-tamper telemetry.",
    href: "/war-room",
    icon: Radio,
    badge: "Real-Time Telemetry",
  },
  {
    title: "Centre Superintendent Console",
    category: "On-Site Operations",
    role: "OFFICER",
    description: "Centre readiness audit, dual-key decryption ceremony, candidate check-in roster, and live incident logging.",
    href: "/center-console",
    icon: KeyRound,
    badge: "Exam Centres",
  },
  {
    title: "Invigilator & Biometrics Desk",
    category: "Hall Proctoring",
    role: "INVIGILATOR",
    description: "Candidate biometric photo matching, UIDAI QR verification, desk seat lock, and attendance recording.",
    href: "/candidate-verification",
    icon: Fingerprint,
    badge: "Hall Proctors",
  },
  {
    title: "Subject Evaluator Workbench",
    category: "Double-Blind Grading",
    role: "EVALUATOR",
    description: "Double-blind evaluation queue, descriptive rubric marking, and OMR bubble matrix coordinate validation.",
    href: "/evaluator",
    icon: ScanEye,
    badge: "Evaluators",
  },
  {
    title: "Independent Auditor & Forensics",
    category: "Governance & Merkle Proofs",
    role: "AUDITOR",
    description: "Append-only SHA-256 Merkle audit trail, ECDSA signature verification, and institutional trust reports.",
    href: "/audit-timeline",
    icon: Eye,
    badge: "Forensics & Audit",
  },
  {
    title: "SafeBatch Operations Studio",
    category: "Safeguarded Bulk Actions",
    role: "CONTROLLER",
    description: "Bulk allocation preview, conflict detection, guarded execution, and operational handoff note generation.",
    href: "/safebatch",
    icon: Sparkles,
    badge: "Bulk Operations",
  },
];

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] font-sans relative pb-20">
      {/* Top Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center p-1 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
              <img
                src="/logo-icon.png"
                alt="ExamForge Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-sm text-[var(--color-ink)] tracking-tight">EXAM<span className="text-[var(--color-accent)]">FORGE</span></span>
              <span className="text-[10px] text-[var(--color-ink-muted)] block font-mono">Identity Portals Hub</span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Intro */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 relative z-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-mono text-xs uppercase tracking-wider">
            <Sparkles size={12} />
            Zero-Trust Identity Gateway
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
            Select Your Operational Workspace
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
            ExamForge enforces strict role-based access with tailored operational densities. Choose your authorized workspace below.
          </p>
        </div>

        {/* 9 Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PORTALS.map((portal, idx) => {
            const IconComp = portal.icon;
            return (
              <Link
                key={idx}
                href={portal.href}
                className="p-5 sm:p-6 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all duration-200 flex flex-col justify-between group shadow-xs hover:shadow-md relative overflow-hidden text-left"
              >
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <IconComp size={20} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] uppercase tracking-wider">
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-[var(--color-ink-muted)] font-semibold uppercase tracking-wider">
                      {portal.category}
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors mt-0.5">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-[var(--color-ink-secondary)] mt-2 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform">
                  <span>Enter Workspace</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Global Security Footnote */}
        <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-center space-y-1.5 shadow-xs">
          <div className="text-xs font-semibold text-[var(--color-ink)] flex items-center justify-center gap-2">
            <Lock size={14} className="text-[var(--color-accent)]" />
            <span>Security Notice: Cryptographic RBAC & Session Binding</span>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)] max-w-2xl mx-auto">
            Portal entry is validated against role tokens. Operational workspaces enforce dual-controller approval and immutable cryptographic ledger verification.
          </p>
        </div>
      </main>
    </div>
  );
}
