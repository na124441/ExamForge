"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Scale,
  Shield,
  Search,
  Briefcase,
  Layers,
  Server,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Lock,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from "lucide-react";

interface PortalCard {
  title: string;
  category: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  badge: string;
  badgeColor: string;
  borderAccent: string;
  gradient: string;
}

const PORTALS: PortalCard[] = [
  {
    title: "Candidate Portal",
    category: "Student & Examinee",
    description: "Sign in to take assigned CBT examinations, download scorecards, and verify receipts.",
    href: "/candidate/login",
    icon: GraduationCap,
    badge: "Public Access",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderAccent: "hover:border-emerald-500/50",
    gradient: "from-emerald-500/10 to-transparent",
  },
  {
    title: "Examination Operations",
    category: "Controller, Officer, Invigilator",
    description: "Exam blueprint configuration, lifecycle controls, center consoles, and candidate check-in.",
    href: "/staff/login",
    icon: Building2,
    badge: "MFA Protected",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    borderAccent: "hover:border-indigo-500/50",
    gradient: "from-indigo-500/10 to-transparent",
  },
  {
    title: "Evaluation Workspace",
    category: "Evaluator, Senior Evaluator",
    description: "Double-blind subjective booklet grading, conflict arbitration, and score reviews.",
    href: "/evaluation/login",
    icon: Scale,
    badge: "Double-Blind Sealed",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderAccent: "hover:border-amber-500/50",
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    title: "Security Command",
    category: "Security Admin, CISO, Pentester",
    description: "HSM key management, threat models, emergency lockdown, and P0 incident triage.",
    href: "/security/login",
    icon: Shield,
    badge: "Critical & Step-Up MFA",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    borderAccent: "hover:border-rose-500/50",
    gradient: "from-rose-500/10 to-transparent",
  },
  {
    title: "Forensic Audit & Ledger",
    category: "Auditor, Compliance Officer",
    description: "Independent oversight, append-only Merkle ledger inspection, and evidence export.",
    href: "/audit/login",
    icon: Search,
    badge: "Forensic Read-Only",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    borderAccent: "hover:border-purple-500/50",
    gradient: "from-purple-500/10 to-transparent",
  },
  {
    title: "Dispute Operations",
    category: "Dispute Officer",
    description: "Candidate score contestation triage, re-evaluation workflow, and SLA monitoring.",
    href: "/dispute/login",
    icon: Briefcase,
    badge: "SLA Monitored",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    borderAccent: "hover:border-blue-500/50",
    gradient: "from-blue-500/10 to-transparent",
  },
  {
    title: "Vendor Portal",
    category: "Partner Services & Hardware",
    description: "Third-party vendor directory, hardware verification, and compliance attestations.",
    href: "/vendor/login",
    icon: Layers,
    badge: "Partner Scoped",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    borderAccent: "hover:border-orange-500/50",
    gradient: "from-orange-500/10 to-transparent",
  },
  {
    title: "Platform Admin Control",
    category: "SaaS Super Admin, Tenant Admin",
    description: "Multi-tenant institutional onboarding, staff provisioning, and SaaS governance.",
    href: "/admin/login",
    icon: Server,
    badge: "Root Control",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    borderAccent: "hover:border-violet-500/50",
    gradient: "from-violet-500/10 to-transparent",
  },
  {
    title: "DevOps & Infrastructure",
    category: "Ops Engineer, DevOps Lead",
    description: "Subsystem health probes, background jobs, telemetry metrics, and rate limit rules.",
    href: "/ops/login",
    icon: Cpu,
    badge: "Infra Monitored",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    borderAccent: "hover:border-cyan-500/50",
    gradient: "from-cyan-500/10 to-transparent",
  },
  {
    title: "SafeBatch Operations Hub",
    category: "Vendor Controller, Centre Superintendent",
    description: "Safeguarded bulk candidate allocations, blast-radius impact preview, and operational handoffs.",
    href: "/safebatch",
    icon: Sparkles,
    badge: "Operational Safety",
    badgeColor: "bg-[#8AD8B8]/15 text-[#8AD8B8] border-[#8AD8B8]/30",
    borderAccent: "hover:border-[#8AD8B8]",
    gradient: "from-[#408576]/20 to-transparent",
  },
];

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-[#081310] text-[#FFF4E2] font-sans relative overflow-hidden pb-20">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(138,216,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(138,216,184,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-[rgba(138,216,184,0.15)] bg-[rgba(8,19,16,0.8)] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.3)] flex items-center justify-center p-1 overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
              <img
                src="/logo-icon.png"
                alt="ExamForge Logo"
                className="w-full h-full object-contain mix-blend-screen"
              />
            </div>
            <div>
              <span className="font-bold text-sm text-[#FFF4E2] tracking-tight">EXAM<span className="text-[#8AD8B8]">FORGE</span></span>
              <span className="text-[10px] text-[#8AD8B8]/80 block font-mono">Identity Portals Hub</span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Intro */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs uppercase tracking-wider">
            <Sparkles size={12} className="text-indigo-400" />
            Zero-Trust Identity Gateway
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Where are you signing in today?
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Select your authorized operational portal below. The ExamForge identity engine will authenticate your credentials and route you directly to your assigned workspace.
          </p>
        </div>

        {/* 9 Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PORTALS.map((portal, idx) => {
            const IconComp = portal.icon;
            return (
              <Link
                key={idx}
                href={portal.href}
                className="p-6 rounded-3xl bg-[rgba(19,45,40,0.7)] hover:bg-[rgba(19,45,40,0.9)] border border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8] transition-all duration-300 flex flex-col justify-between group shadow-xl relative overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(138,216,184,0.15),transparent_70%)] rounded-full blur-xl pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(8,19,16,0.85)] border border-[rgba(138,216,184,0.25)] text-[#8AD8B8] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <IconComp size={22} className="text-[#8AD8B8]" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border border-[rgba(138,216,184,0.25)] bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] uppercase tracking-wider">
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-[#8AD8B8]/80 font-medium uppercase tracking-wider">
                      {portal.category}
                    </div>
                    <h3 className="text-lg font-bold text-[#FFF4E2] group-hover:text-[#8AD8B8] transition-colors mt-0.5">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-[#8AD8B8]/70 mt-2 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[rgba(138,216,184,0.15)] flex items-center justify-between text-xs font-semibold text-[#8AD8B8] group-hover:text-[#FFF4E2] transition-colors">
                  <span>Enter Portal</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Global Security Footnote */}
        <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.6)] border border-[rgba(138,216,184,0.2)] text-center space-y-2 backdrop-blur-xl">
          <div className="text-xs font-semibold text-[#FFF4E2] flex items-center justify-center gap-2">
            <Lock size={14} className="text-[#8AD8B8]" />
            Security Notice: Strict Server-Enforced RBAC
          </div>
          <p className="text-xs text-[#8AD8B8]/70 max-w-2xl mx-auto">
            Portal entry selection does not grant permissions. Every authenticated account is authoritatively verified by FastAPI dependency guards before accessing any resources.
          </p>
        </div>
      </main>
    </div>
  );
}
