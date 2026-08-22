"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Lock,
  LogIn,
  Layers,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { HeroOrbitalSystem } from "./HeroOrbitalSystem";
import { GlassStatusCard } from "./GlassStatusCard";
import { cn } from "@/lib/cn";

export interface ExamForgeHeroProps {
  onOpenAuthModal?: () => void;
}

export function ExamForgeHero({ onOpenAuthModal }: ExamForgeHeroProps) {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handleChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setParallax({ x, y });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[92vh] flex items-center pt-24 pb-12 sm:pt-28 sm:pb-16 overflow-hidden"
    >
      {/* Background Volumetric Lighting Fields */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(64,133,118,0.2),transparent_70%)] blur-3xl pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${parallax.x * 15}px, ${parallax.y * 15}px)`,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(138,216,184,0.15),transparent_70%)] blur-3xl pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${parallax.x * -20}px, ${parallax.y * -20}px)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Hero Copy & Actions (7 cols on LG) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            
            {/* Eyebrow Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.3)] backdrop-blur-md shadow-xs">
              <Sparkles size={13} className="text-[#8AD8B8]" />
              <span className="font-mono text-[11px] font-bold text-[#8AD8B8] uppercase tracking-widest">
                EXAMINATION INFRASTRUCTURE
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-[#FFF4E2] leading-[1.1] font-sans">
              Run Every Part of an Examination.
              <br />
              <span className="bg-gradient-to-r from-[#8AD8B8] via-[#FFF4E2] to-[#8AD8B8] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(138,216,184,0.35)]">
                From One Platform.
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#FFF4E2]/85 leading-relaxed max-w-xl font-sans">
              Registration, identity verification, payments, centre allocation,
              secure examination, evaluation, and results &mdash; connected in
              one controlled workflow.
            </p>

            {/* SafeBatch Killer Feature Spotlight Callout */}
            <Link
              href="/safebatch"
              className="inline-flex items-center gap-2.5 p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/15 transition-all text-xs text-amber-200 group no-underline shadow-xs"
            >
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="font-bold text-amber-300">SafeBatch™ Engine:</span>
              <span className="text-slate-300">Safeguarded bulk actions with operational handoff notes</span>
              <ChevronRight size={14} className="text-amber-400 group-hover:translate-x-1 transition-transform ml-auto" />
            </Link>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/candidate"
                className={cn(
                  "px-6 py-3.5 rounded-2xl font-bold text-sm text-[#132D28] bg-[#8AD8B8] hover:bg-[#a0e8cb]",
                  "border border-white/40 flex items-center justify-center gap-2 shadow-[0_10px_30px_-8px_rgba(138,216,184,0.6)]",
                  "hover:shadow-[0_15px_35px_-5px_rgba(138,216,184,0.8)] transition-all duration-300 active:scale-95 cursor-pointer font-sans no-underline"
                )}
              >
                <span>Register as Candidate</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/create-exam"
                className={cn(
                  "px-6 py-3.5 rounded-2xl font-semibold text-sm text-[#FFF4E2] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)]",
                  "border border-[rgba(138,216,184,0.25)] hover:border-[rgba(138,216,184,0.45)] flex items-center justify-center gap-2",
                  "backdrop-blur-xl transition-all duration-300 active:scale-95 cursor-pointer font-sans no-underline"
                )}
              >
                <span>Conduct an Exam</span>
                <ArrowRight size={16} className="text-[#8AD8B8]" />
              </Link>
            </div>

            {/* Trust Line */}
            <div className="pt-4 border-t border-[rgba(138,216,184,0.15)] flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#8AD8B8]">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck size={15} className="text-[#8AD8B8]" />
                <span className="text-[#FFF4E2]/90">Secure by design</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <BadgeCheck size={15} className="text-[#8AD8B8]" />
                <span className="text-[#FFF4E2]/90">Verified workflows</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Lock size={14} className="text-[#8AD8B8]" />
                <span className="text-[#FFF4E2]/90">Built for high-stakes examinations</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Spatial Examination Lifecycle Orbit & Glass Status Cards (5-6 cols on LG) */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            
            {/* Parallax wrapper for Orbit visualization */}
            <div
              className="relative w-full flex items-center justify-center transition-transform duration-500 ease-out"
              style={{
                transform: `translate(${parallax.x * -10}px, ${parallax.y * -10}px)`,
              }}
            >
              <HeroOrbitalSystem />
            </div>

            {/* 3 Floating Glass Status Cards placed in spatial hierarchy */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 lg:-mt-6 relative z-30">
              <div
                className="transition-transform duration-700 ease-out"
                style={{
                  transform: `translate(${parallax.x * 8}px, ${parallax.y * 8}px)`,
                }}
              >
                <GlassStatusCard type="candidate" floatDelay="0s" />
              </div>

              <div
                className="transition-transform duration-700 ease-out"
                style={{
                  transform: `translate(${parallax.x * -6}px, ${parallax.y * -6}px)`,
                }}
              >
                <GlassStatusCard type="examination" floatDelay="1.2s" />
              </div>

              <div
                className="transition-transform duration-700 ease-out"
                style={{
                  transform: `translate(${parallax.x * 10}px, ${parallax.y * 10}px)`,
                }}
              >
                <GlassStatusCard type="pipeline" floatDelay="2.4s" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
