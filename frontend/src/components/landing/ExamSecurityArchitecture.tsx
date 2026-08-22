"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Fingerprint, 
  ScanEye, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  FileCheck, 
  Database,
  Cpu,
  AlertTriangle,
  ChevronRight,
  GitCommitHorizontal,
  Scale
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SecurityPillar {
  id: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  threatNeutralized: string;
  mathPrimitive: string;
  description: string;
  tag: string;
  accentColor: string;
}

const SECURITY_PILLARS: SecurityPillar[] = [
  {
    id: "zero-hour-keys",
    icon: KeyRound,
    title: "Zero-Hour Envelope Encryption",
    threatNeutralized: "Pre-Exam Question Paper Leaks",
    mathPrimitive: "AES-256-GCM + Shamir's Secret Sharing (m-of-n)",
    description: "Question blueprints remain encrypted in transit and rest. Decryption keys are split across independent custodians and dynamically reassembled only at scheduled exam zero-hour.",
    tag: "Leak Immune",
    accentColor: "#8AD8B8",
  },
  {
    id: "merkle-ledger",
    icon: GitCommitHorizontal,
    title: "Immutable Merkle Hash Chaining",
    threatNeutralized: "Insider Database & Mark Tampering",
    mathPrimitive: "Sequential SHA-256 Chain H(i) = SHA256(Actor || Payload || H(i-1))",
    description: "Every answer event, score change, and audit log is permanently linked into an immutable block ledger. Any root SQL tampering breaks the entire verifiable audit chain instantly.",
    tag: "Tamper Proof",
    accentColor: "#408576",
  },
  {
    id: "uidai-biometric",
    icon: Fingerprint,
    title: "RSA-2048 Digital Identity Proof",
    threatNeutralized: "Proxy Test Takers & Impersonation",
    mathPrimitive: "RSA-2048 UIDAI XML Signature + Face Embeddings",
    description: "Candidates verify offline with cryptographically signed government QR identity packets and automated neural facial matching at the desk. Fake IDs are mathematically rejected.",
    tag: "Zero Impersonation",
    accentColor: "#8AD8B8",
  },
  {
    id: "blind-evaluation",
    icon: ScanEye,
    title: "Double-Blind Masked Grading",
    threatNeutralized: "Evaluator Bribery & Caste/Gender Bias",
    mathPrimitive: "HMAC-SHA256 Salted Identity Masking",
    description: "Evaluators receive anonymous booklet tokens. Candidate demographics, roll numbers, category, and exam center metadata are completely stripped before grading begins.",
    tag: "100% Unbiased",
    accentColor: "#408576",
  },
  {
    id: "spatial-collusion",
    icon: Cpu,
    title: "Spatial Jaccard Collusion Engine",
    threatNeutralized: "Physical Seat Matrix Cheating",
    mathPrimitive: "Euclidean Grid Proximity vs. Jaccard Vector Correlation",
    description: "Correlates physical Euclidean seating distances with response similarity matrices to flag suspicious answer clusters between adjacent candidates in real time.",
    tag: "AI Monitored",
    accentColor: "#8AD8B8",
  },
  {
    id: "ecdsa-scorecard",
    icon: FileCheck,
    title: "ECDSA Digital Non-Repudiation",
    threatNeutralized: "Forged Transcripts & Certificate Fraud",
    mathPrimitive: "SECP256R1 ECDSA Signatures + Public Merkle Root",
    description: "Published scorecards carry an unforgeable cryptographic digital signature and Merkle root digest. Employers and universities can independently verify marks on the public ledger.",
    tag: "Verifiable Transcript",
    accentColor: "#408576",
  }
];

export function ExamSecurityArchitecture() {
  const [activePillar, setActivePillar] = useState(SECURITY_PILLARS[0]);

  return (
    <section 
      id="security-architecture" 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 select-none relative"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] font-mono text-xs font-bold uppercase tracking-widest shadow-xs">
            <ShieldCheck size={14} className="text-[#8AD8B8]" />
            STATE-OF-THE-ART SECURITY ARCHITECTURE
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#FFF4E2] tracking-tight leading-tight">
            Why High-Stakes Testing Authorities
            <br />
            <span className="bg-gradient-to-r from-[#8AD8B8] via-[#FFF4E2] to-[#8AD8B8] bg-clip-text text-transparent">
              Trust ExamForge
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#FFF4E2]/80 leading-relaxed font-sans max-w-2xl">
            Legacy examination systems rely on physical locks, closed LANs, and perimeter trust &mdash; where 90% of leaks and score tampering occur. ExamForge replaces human discretion with mathematical proof, multi-party consensus, and non-repudiation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/verify-result"
            className="px-4 py-2.5 rounded-xl bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] border border-[rgba(138,216,184,0.25)] hover:border-[#8AD8B8] text-[#FFF4E2] text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
          >
            <span>Test Public Verifier</span>
            <ChevronRight size={14} className="text-[#8AD8B8]" />
          </Link>
          <Link
            href="/security"
            className="px-4 py-2.5 rounded-xl bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span>Full Security Matrix</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 6-Pillar Cryptographic Defense Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {SECURITY_PILLARS.map((p) => {
          const isSelected = activePillar.id === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setActivePillar(p)}
              className={cn(
                "p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden group",
                isSelected
                  ? "bg-[rgba(64,133,118,0.25)] border-[#8AD8B8] shadow-lg shadow-[#132D28]/40 scale-[1.01]"
                  : "bg-[var(--color-surface-raised)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-sunken)]"
              )}
            >
              {/* Card Top Strip */}
              <div className="flex items-start justify-between gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors"
                  style={{
                    backgroundColor: "rgba(64, 133, 118, 0.25)",
                    borderColor: isSelected ? "#8AD8B8" : "rgba(138, 216, 184, 0.2)",
                    color: "#8AD8B8"
                  }}
                >
                  <p.icon size={20} />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] text-[#8AD8B8]">
                  {p.tag}
                </span>
              </div>

              {/* Card Content */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm sm:text-base text-[#FFF4E2] group-hover:text-[#8AD8B8] transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-[#FFF4E2]/75 leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* Card Technical Badges Footer */}
              <div className="pt-3 border-t border-[rgba(138,216,184,0.15)] space-y-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between text-[#8AD8B8]">
                  <span className="text-[var(--color-ink-muted)] uppercase">Neutralizes:</span>
                  <span className="font-bold truncate max-w-[180px]">{p.threatNeutralized}</span>
                </div>
                <div className="text-[var(--color-ink-muted)] truncate">
                  <span className="text-[#8AD8B8]/70">Primitive:</span> {p.mathPrimitive}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Cryptographic Proof Ribbon */}
      <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-[rgba(64,133,118,0.2)] via-[rgba(8,19,16,0.8)] to-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.25)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[#FFF4E2]">
            Active Trust Model: <strong className="text-[#8AD8B8]">Zero-Trust Cryptographic Ledger</strong> &middot; Multi-Party Quorum Gate: <strong className="text-[#8AD8B8]">ACTIVE</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#FFF4E2]/70">
          <span>Hash Function: <strong className="text-[#FFF4E2]">SHA-256</strong></span>
          <span>Signature: <strong className="text-[#FFF4E2]">ECDSA SECP256R1</strong></span>
          <span>Encryption: <strong className="text-[#FFF4E2]">AES-256-GCM</strong></span>
        </div>
      </div>
    </section>
  );
}
