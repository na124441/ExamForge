"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Link2,
  FileLock2,
  Send,
  Fingerprint,
  ScanEye,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  Users,
  AlertTriangle,
  GitCommitHorizontal,
  QrCode,
  Smartphone,
  GitBranch,
  ClipboardCheck,
  BadgeCheck,
  ChevronRight,
  Building2,
  GraduationCap,
  CheckCircle2,
  X,
  LogIn,
  UserCheck,
  Key,
} from "lucide-react";
import { GlassNavbar } from "@/components/landing/GlassNavbar";
import { ExamForgeHero } from "@/components/landing/ExamForgeHero";
import { SystemStatus } from "@/components/landing/SystemStatus";
import { ExamLifecycle } from "@/components/landing/ExamLifecycle";
import { ExamForgeLogo } from "@/components/brand/ExamForgeLogo";

interface AccountPersona {
  id: string;
  role: string;
  category: "Student" | "Vendor" | "Authority" | "Center" | "Evaluator" | "Audit";
  title: string;
  tag: string;
  email: string;
  path: string;
  secondaryPath?: string;
  secondaryLabel?: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  badgeColor: string;
}

const ACCOUNTS: AccountPersona[] = [
  {
    id: "student",
    role: "CANDIDATE",
    category: "Student",
    title: "Candidate / Student",
    tag: "Student",
    email: "student@examforge.org",
    path: "/student-exam",
    secondaryPath: "/candidate",
    secondaryLabel: "Identity Portal",
    desc: "Distraction-free CBT exam window, offline auto-sync, UIDAI QR verification, and signed receipts.",
    Icon: GraduationCap,
    badgeColor: "rgba(138, 216, 184, 0.2)",
  },
  {
    id: "vendor",
    role: "VENDOR",
    category: "Vendor",
    title: "Vendor & Security Checker",
    tag: "Vendor Checker",
    email: "vendor@security-check.org",
    path: "/vendor",
    secondaryPath: "/security-pentest",
    secondaryLabel: "Pentest Suite",
    desc: "Vendor organization directory, center audit checklists, hardware integrity, and compliance checks.",
    Icon: Building2,
    badgeColor: "rgba(138, 216, 184, 0.25)",
  },
  {
    id: "controller",
    role: "CONTROLLER",
    category: "Authority",
    title: "Exam Controller (Admin)",
    tag: "Controller",
    email: "controller@examforge.org",
    path: "/authority",
    secondaryPath: "/publication-gate",
    secondaryLabel: "Release Gates",
    desc: "Full mission control, question blueprinting, time-locked package sealing, and publication safety gate.",
    Icon: ShieldCheck,
    badgeColor: "rgba(64, 133, 118, 0.3)",
  },
  {
    id: "officer",
    role: "OFFICER",
    category: "Center",
    title: "Centre Superintendent",
    tag: "Center Officer",
    email: "officer@center-alpha.org",
    path: "/center-onboarding",
    secondaryPath: "/center-console",
    secondaryLabel: "Live Console",
    desc: "Physical center readiness, package decryption key ceremony, and candidate hall management.",
    Icon: KeyRound,
    badgeColor: "rgba(64, 133, 118, 0.25)",
  },
  {
    id: "invigilator",
    role: "INVIGILATOR",
    category: "Center",
    title: "Invigilator / Hall Proctor",
    tag: "Invigilator",
    email: "invigilator@hall-01.org",
    path: "/candidate-verification",
    secondaryPath: "/seat-map",
    secondaryLabel: "Seat Matrix",
    desc: "Biometric photo matching, admit QR scanning, and seat locks at the exam desk.",
    Icon: Fingerprint,
    badgeColor: "rgba(138, 216, 184, 0.2)",
  },
  {
    id: "evaluator",
    role: "EVALUATOR",
    category: "Evaluator",
    title: "Subject Evaluator",
    tag: "Evaluator",
    email: "evaluator@grading-board.org",
    path: "/evaluator",
    secondaryPath: "/evaluation-conflicts",
    secondaryLabel: "Arbitration",
    desc: "Double-blind subjective grading, OMR coordinate validation, and rubric variance arbitration.",
    Icon: ScanEye,
    badgeColor: "rgba(64, 133, 118, 0.25)",
  },
  {
    id: "auditor",
    role: "AUDITOR",
    category: "Audit",
    title: "Independent Auditor",
    tag: "Auditor",
    email: "auditor@trust-oversight.org",
    path: "/audit-timeline",
    secondaryPath: "/institution-audit-report",
    secondaryLabel: "Audit Reports",
    desc: "Forensic Merkle ledger, compliance audits, cryptographic proofs, and key ceremonies.",
    Icon: Eye,
    badgeColor: "rgba(138, 216, 184, 0.25)",
  },
];

const PROBLEMS = [
  {
    problem: "Question paper leaks during transit and early printing",
    solution: "Time-locked center packages stay encrypted until dual-controller keys authorize release inside the exam window.",
    Icon: FileLock2,
  },
  {
    problem: "Impersonation and proxy candidates at the center",
    solution: "Offline UIDAI QR signature checks, biometric logging, and seat-locking confirm every candidate is who they claim.",
    Icon: Fingerprint,
  },
  {
    problem: "Evaluation bias and quiet grade manipulation",
    solution: "Anonymized scripts route through independent dual evaluators, with variance disputes escalated automatically.",
    Icon: ScanEye,
  },
  {
    problem: "Direct database and result tampering after the fact",
    solution: "Every state change is cryptographically linked to the one before it in an append-only Merkle ledger.",
    Icon: GitBranch,
  },
  {
    problem: "No way for candidates to trust a published result",
    solution: "Signed digital receipts and public verification portals let anyone check a scorecard against its proof.",
    Icon: BadgeCheck,
  },
];

const PILLARS = [
  {
    Icon: ShieldCheck,
    title: "Zero-trust chain of custody",
    body: "Every action, from blueprinting to grading, generates an immutable SHA-256 receipt signed with ECDSA keys — an unbroken forensic trail end to end.",
  },
  {
    Icon: Lock,
    title: "Time-locked paper release",
    body: "Question assets stay encrypted at rest and in transit. Center packages open only when schedule windows and dual-admin approval both check out.",
  },
  {
    Icon: Fingerprint,
    title: "Anti-impersonation identity",
    body: "Offline UIDAI Secure QR verification, dual OTP delivery over email and SMS, and invigilator-signed biometric check-in.",
  },
  {
    Icon: ScanEye,
    title: "Double-blind evaluation",
    body: "Descriptive scripts are anonymized before reaching graders. OMR bubble matrices capture coordinate hashes to block manual tampering.",
  },
  {
    Icon: GitCommitHorizontal,
    title: "Pre-publication safety gate",
    body: "A composite trust score blocks release if any P0 incident, audit anomaly, or compromised signing key turns up first.",
  },
  {
    Icon: BadgeCheck,
    title: "Verifiable credentials",
    body: "Candidates get signed submission receipts and tamper-proof certificates with QR codes for instant public verification.",
  },
];

const TRUST_STRIP = [
  { Icon: QrCode, title: "UIDAI secure QR verification", body: "Cryptographic offline RSA-2048/ECDSA signature validation for candidate identity." },
  { Icon: Smartphone, title: "Dual OTP infrastructure", body: "Centralized email OTP and India DLT SMS delivery for every check-in." },
  { Icon: GitBranch, title: "Merkle forensic audit", body: "Tamper-evident timeline tracking identity, questions, seating, and scorecards." },
];

export default function ExamForgeLanding() {
  const router = useRouter();

  // Auth modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<AccountPersona>(ACCOUNTS[0]);
  const [customEmail, setCustomEmail] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [authStep, setAuthStep] = useState<"SELECT" | "CREDENTIALS">("SELECT");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleRoleSelect = (role: string, name: string, path: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_role", role);
      localStorage.setItem("user_name", name);
      localStorage.setItem("access_token", "MOCK_TOKEN_" + role);
      localStorage.setItem("token", "MOCK_TOKEN_" + role);
    }
    router.push(path);
  };

  const handleLaunchPersona = (persona: AccountPersona) => {
    handleRoleSelect(persona.role, persona.title, persona.path);
  };

  const handleExecuteLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setShowLoginModal(false);
      handleLaunchPersona(selectedPersona);
    }, 450);
  };

  return (
    <div data-workspace="landing" className="ef-root relative w-full min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] overflow-x-hidden font-sans select-none">
      
      {/* Background Environmental Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,black_40%,transparent_90%)]" />

      {/* Atmospheric Light Fields */}
      <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(45,122,107,0.2),transparent_70%)] blur-[100px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-10%] w-[750px] h-[750px] rounded-full bg-[radial-gradient(circle,rgba(138,216,184,0.12),transparent_70%)] blur-[120px] pointer-events-none" />
      <div className="absolute top-[60%] left-[15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(45,122,107,0.1),transparent_70%)] blur-[90px] pointer-events-none" />

      {/* 1. FLOATING GLASS NAVBAR */}
      <GlassNavbar onOpenAuthModal={() => setShowLoginModal(true)} />

      {/* 2. SPATIAL HERO EXPERIENCE */}
      <ExamForgeHero onOpenAuthModal={() => setShowLoginModal(true)} />

      {/* 3. EXAMFORGE SYSTEM STATUS STRIP */}
      <SystemStatus />

      {/* 4. EXAMINATION LIFECYCLE PIPELINE */}
      <ExamLifecycle />

      {/* DIVIDER */}
      <div className="w-full max-w-7xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

      {/* 5. WHY EXAMFORGE — PROBLEM / SOLUTION */}
      <section id="platform" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-mono text-xs uppercase tracking-widest mb-3">
            <AlertTriangle size={13} />
            The Stakes
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight font-sans">
            Built for what actually breaks exams
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] mt-3 font-sans leading-relaxed">
            Five failure modes have quietly undermined high-stakes testing for decades. Each one now has a cryptographic answer instead of a policy memo.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {PROBLEMS.map((p) => (
            <div
              key={p.problem}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-5 sm:p-6 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <div className="md:col-span-5 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.25)] flex items-center justify-center text-[#8AD8B8] shrink-0 mt-0.5">
                  <p.Icon size={18} />
                </div>
                <div>
                  <span className="block font-mono text-[11px] font-bold text-[#8AD8B8] uppercase tracking-wider mb-1">
                    Challenge
                  </span>
                  <p className="text-sm font-medium text-[#FFF4E2] leading-snug">
                    {p.problem}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex md:col-span-1 justify-center text-[#8AD8B8]/60">
                <ChevronRight size={18} />
              </div>

              <div className="md:col-span-6 pl-0 md:pl-2">
                <span className="block font-mono text-[11px] font-bold text-[#8AD8B8] uppercase tracking-wider mb-1">
                  ExamForge Solution
                </span>
                <p className="text-sm text-[#FFF4E2]/80 leading-relaxed">
                  {p.solution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="w-full max-w-7xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

      {/* 6. PILLARS OF VERIFIABLE TRUST */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-mono text-xs uppercase tracking-widest mb-3">
            <ShieldCheck size={13} />
            Core Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight font-sans">
            Six pillars of verifiable trust
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] mt-3 font-sans leading-relaxed">
            Every pillar produces cryptographic evidence, not just a log line, so nothing in the lifecycle depends on taking someone's word for it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="p-6 rounded-3xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.25)] flex items-center justify-center text-[#8AD8B8] mb-5 group-hover:scale-110 group-hover:bg-[#8AD8B8] group-hover:text-[#132D28] transition-all duration-300">
                <p.Icon size={22} />
              </div>
              <h3 className="text-base font-bold text-[#FFF4E2] mb-2 font-sans">
                {p.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#8AD8B8]/75 leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="w-full max-w-7xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

      {/* 7. ROLES & WORKSPACES */}
      <section id="solutions" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-mono text-xs uppercase tracking-widest mb-3">
            <Users size={13} />
            Role-Based Access
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight font-sans">
            One platform, seven specialized workspaces
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] mt-3 font-sans leading-relaxed">
            From candidates in distraction-free CBT to external vendor checkers and controllers &mdash; choose your workspace to launch immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ACCOUNTS.map((r) => (
            <div
              key={r.id}
              onClick={() => handleLaunchPersona(r)}
              className="p-6 rounded-3xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between group text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-bold text-[#FFF4E2] uppercase tracking-wider border border-[rgba(138,216,184,0.3)]"
                    style={{ background: r.badgeColor }}
                  >
                    <r.Icon size={12} />
                    {r.tag}
                  </span>
                  <ArrowRight size={16} className="text-[#8AD8B8] group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-base font-bold text-[#FFF4E2] mb-2 font-sans">
                  {r.title}
                </h3>
                <p className="text-xs text-[#8AD8B8]/75 leading-relaxed mb-6">
                  {r.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[rgba(138,216,184,0.15)] flex items-center justify-between font-mono text-xs text-[#8AD8B8]/70">
                <span className="truncate">{r.email}</span>
                <span className="font-semibold text-[#8AD8B8] group-hover:text-[#FFF4E2] flex items-center gap-0.5">
                  Launch <ChevronRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="w-full max-w-7xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

      {/* 8. TRUST INFRASTRUCTURE STRIP */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] font-mono text-xs uppercase tracking-widest mb-3">
            <ClipboardCheck size={13} />
            Verification Infrastructure
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-ink)] tracking-tight font-sans">
            The plumbing behind every guarantee
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TRUST_STRIP.map((t) => (
            <div
              key={t.title}
              className="p-6 rounded-3xl bg-[rgba(19,45,40,0.55)] border border-[rgba(138,216,184,0.18)] backdrop-blur-xl shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.25)] flex items-center justify-center text-[#8AD8B8] mb-4">
                <t.Icon size={19} />
              </div>
              <h3 className="text-base font-bold text-[#FFF4E2] mb-2 font-sans">
                {t.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#8AD8B8]/75 leading-relaxed">
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. CLOSING CTA BANNER */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center select-none">
        <div
          className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-[rgba(19,45,40,0.7)] border border-[rgba(138,216,184,0.25)] backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden"
          style={{
            boxShadow:
              "0 25px 60px -15px rgba(0,0,0,0.8), inset 0 1px 1px 0 rgba(255,255,255,0.2), inset 0 0 40px rgba(138,216,184,0.05)",
          }}
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(138,216,184,0.15),transparent_70%)] blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FFF4E2] tracking-tight font-sans mb-4 relative z-10">
            Ready to Transform Your Examination Process?
          </h2>

          <p className="text-sm sm:text-base text-[#FFF4E2]/80 max-w-xl mx-auto mb-8 font-sans relative z-10 leading-relaxed">
            Join ExamForge and experience a smarter, safer, and simpler way to conduct large-scale, high-stakes assessments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => {
                setSelectedPersona(ACCOUNTS[2]);
                setShowLoginModal(true);
              }}
              className="px-7 py-3.5 rounded-2xl font-bold text-sm text-[#132D28] bg-[#8AD8B8] hover:bg-[#a0e8cb] border border-white/40 shadow-[0_10px_30px_-8px_rgba(138,216,184,0.6)] hover:shadow-[0_15px_35px_-5px_rgba(138,216,184,0.8)] transition-all active:scale-95 cursor-pointer flex items-center gap-2 font-sans"
            >
              <span>Get Started Today</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => router.push("/audit-timeline")}
              className="px-7 py-3.5 rounded-2xl font-semibold text-sm text-[#FFF4E2] bg-[rgba(255,244,226,0.08)] hover:bg-[rgba(255,244,226,0.14)] border border-[rgba(138,216,184,0.25)] hover:border-[rgba(138,216,184,0.4)] backdrop-blur-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 font-sans"
            >
              <Link2 size={16} />
              <span>Inspect the Ledger</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. GLASS FOOTER */}
      <footer className="w-full border-t border-[rgba(138,216,184,0.15)] bg-[rgba(19,45,40,0.5)] backdrop-blur-md py-8 px-4 sm:px-6 lg:px-8 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#8AD8B8]/70">
          <div className="flex items-center gap-3">
            <ExamForgeLogo variant="small" size={20} showSubtitle={false} />
            <span>&copy; 2026 ExamForge. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-[#FFF4E2]/70 font-sans text-xs">
            <a href="#" className="hover:text-[#8AD8B8] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#8AD8B8] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#8AD8B8] transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>

      {/* 11. AUTH & ACCOUNT SWITCHER MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-[rgba(8,19,16,0.85)] backdrop-blur-2xl flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
          <div
            className="w-full max-w-lg bg-[#132D28] border border-[rgba(138,216,184,0.3)] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: "0 25px 70px rgba(0,0,0,0.85), inset 0 1px 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <div className="p-5 border-b border-[rgba(138,216,184,0.18)] flex items-center justify-between bg-[rgba(255,244,226,0.02)]">
              <div className="flex items-center gap-3">
                <ExamForgeLogo variant="mark" size={32} />
                <div>
                  <h3 className="text-base font-bold text-[#FFF4E2] font-sans">ExamForge Identity & Auth</h3>
                  <p className="text-xs font-mono text-[#8AD8B8]/70">Select an account persona or sign in</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1.5 rounded-lg text-[#8AD8B8]/70 hover:text-[#FFF4E2] hover:bg-[rgba(64,133,118,0.3)] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto font-sans">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.2)] mb-5 font-mono text-xs">
                <button
                  onClick={() => setAuthStep("SELECT")}
                  className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    authStep === "SELECT"
                      ? "bg-[#408576] text-[#FFF4E2] shadow-sm"
                      : "text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
                  }`}
                >
                  ⚡ Fast Persona Sign-In
                </button>
                <button
                  onClick={() => setAuthStep("CREDENTIALS")}
                  className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    authStep === "CREDENTIALS"
                      ? "bg-[#408576] text-[#FFF4E2] shadow-sm"
                      : "text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
                  }`}
                >
                  🔐 Manual / OTP Auth
                </button>
              </div>

              {authStep === "SELECT" ? (
                <div className="space-y-4">
                  <p className="text-xs text-[#FFF4E2]/80 leading-relaxed">
                    Choose an account type below for instant 1-click zero-trust workspace session entry:
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {ACCOUNTS.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => {
                          setSelectedPersona(acc);
                          handleLaunchPersona(acc);
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          selectedPersona.id === acc.id
                            ? "bg-[rgba(64,133,118,0.35)] border-[#8AD8B8] shadow-sm"
                            : "bg-[rgba(255,244,226,0.04)] border-[rgba(138,216,184,0.15)] hover:border-[#8AD8B8] hover:bg-[rgba(64,133,118,0.2)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center border"
                            style={{
                              background: acc.badgeColor,
                              borderColor: "rgba(138,216,184,0.25)",
                              color: "#FFF4E2",
                            }}
                          >
                            <acc.Icon size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#FFF4E2]">{acc.title}</span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[rgba(8,19,16,0.8)] text-[#8AD8B8] border border-[rgba(138,216,184,0.25)]">
                                {acc.tag}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-[#8AD8B8]/70">{acc.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-mono text-[#8AD8B8] group-hover:translate-x-1 transition-all">
                          <span>Enter</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleExecuteLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#FFF4E2]/80 mb-1.5 uppercase">
                      Account Type / Role
                    </label>
                    <select
                      value={selectedPersona.id}
                      onChange={(e) => {
                        const target = ACCOUNTS.find((a) => a.id === e.target.value);
                        if (target) {
                          setSelectedPersona(target);
                          setCustomEmail(target.email);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] text-[#FFF4E2] text-sm focus:outline-none focus:border-[#8AD8B8]"
                    >
                      {ACCOUNTS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.tag})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#FFF4E2]/80 mb-1.5 uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder={selectedPersona.email}
                      value={customEmail || selectedPersona.email}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] text-[#FFF4E2] text-sm focus:outline-none focus:border-[#8AD8B8] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#FFF4E2]/80 mb-1.5 uppercase">
                      Password or Time-Based OTP
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] text-[#FFF4E2] text-sm focus:outline-none focus:border-[#8AD8B8] font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full py-3 rounded-xl font-semibold text-sm bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] border border-[rgba(138,216,184,0.3)] flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer shadow-md shadow-[#132D28]/50 transition-all"
                    >
                      {isAuthenticating ? (
                        <>Verifying Zero-Trust Credentials...</>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          Authenticate & Open {selectedPersona.tag} Workspace
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
