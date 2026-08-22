"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Fingerprint,
  CreditCard,
  Building2,
  ScanEye,
  Award,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface OrbitNode {
  id: string;
  label: string;
  shortLabel: string;
  hash: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  angleDeg: number;
}

const ORBIT_NODES: OrbitNode[] = [
  { id: "reg", label: "Registration", shortLabel: "REG", hash: "9F3A0C1E", icon: UserCheck, angleDeg: -90 },
  { id: "ver", label: "Verification", shortLabel: "VERIFY", hash: "E15C8F02", icon: Fingerprint, angleDeg: -30 },
  { id: "pay", label: "Payment", shortLabel: "PAY", hash: "4D89A120", icon: CreditCard, angleDeg: 30 },
  { id: "cen", label: "Centre Allocation", shortLabel: "CENTRE", hash: "2B7D44A9", icon: Building2, angleDeg: 90 },
  { id: "eva", label: "Evaluation", shortLabel: "EVAL", hash: "77A1D3B6", icon: ScanEye, angleDeg: 150 },
  { id: "res", label: "Results", shortLabel: "RESULTS", hash: "C40E9F58", icon: Award, angleDeg: 210 },
];

export function HeroOrbitalSystem() {
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveNodeIndex((prev) => (prev + 1) % ORBIT_NODES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const activeNode = ORBIT_NODES[activeNodeIndex];

  return (
    <div className="relative w-full aspect-square max-w-[480px] sm:max-w-[540px] lg:max-w-[580px] mx-auto select-none flex items-center justify-center">
      
      {/* Background Volumetric Glow */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(138,216,184,0.18),rgba(64,133,118,0.08)_45%,transparent_70%)] blur-2xl pointer-events-none" />

      {/* SVG Connecting Tracks & Travelling Pulse */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="orbitRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8AD8B8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#408576" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8AD8B8" stopOpacity="0.35" />
          </linearGradient>

          <linearGradient id="signalPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF4E2" />
            <stop offset="50%" stopColor="#8AD8B8" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="mintGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Orbit Track */}
        <circle
          cx="250"
          cy="250"
          r="190"
          stroke="url(#orbitRingGrad)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          className="opacity-70 animate-[spin_120s_linear_infinite]"
        />

        {/* Mid Track */}
        <circle
          cx="250"
          cy="250"
          r="135"
          stroke="rgba(64, 133, 118, 0.3)"
          strokeWidth="1"
          strokeDasharray="2 8"
          className="opacity-60 animate-[spin_80s_linear_infinite_reverse]"
        />

        {/* Inner Aura Ring */}
        <circle
          cx="250"
          cy="250"
          r="80"
          stroke="rgba(138, 216, 184, 0.25)"
          strokeWidth="1.5"
          className="opacity-80"
        />

        {/* Dynamic Connected Lines between all Nodes to Center */}
        {ORBIT_NODES.map((node) => {
          const rad = (node.angleDeg * Math.PI) / 180;
          const x = 250 + 190 * Math.cos(rad);
          const y = 250 + 190 * Math.sin(rad);
          return (
            <g key={node.id}>
              <line
                x1="250"
                y1="250"
                x2={x}
                y2={y}
                stroke="rgba(138, 216, 184, 0.18)"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
            </g>
          );
        })}

        {/* Animated Signal Path flowing clockwise along the orbit */}
        <circle
          cx="250"
          cy="250"
          r="190"
          stroke="#8AD8B8"
          strokeWidth="2.5"
          strokeDasharray="30 400"
          strokeLinecap="round"
          filter="url(#mintGlow)"
          className="opacity-80 animate-[spin_12s_linear_infinite]"
        />
      </svg>

      {/* Central Spatial EF Node */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <div
          className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 flex items-center justify-center transition-transform duration-500 hover:scale-105 overflow-hidden group"
          style={{
            background: "radial-gradient(circle at 40% 35%, rgba(64, 133, 118, 0.65), rgba(19, 45, 40, 0.95) 75%)",
            border: "1.5px solid rgba(138, 216, 184, 0.45)",
            boxShadow:
              "0 0 50px -5px rgba(64, 133, 118, 0.6), 0 0 25px rgba(138, 216, 184, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Fitted Emissive EF mark */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <img
              src="/logo-icon.png"
              alt="EF Identity"
              className="w-full h-full object-contain mix-blend-screen drop-shadow-[0_0_16px_rgba(138,216,184,0.85)] filter brightness-110 group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Central Halo Ring */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-[rgba(255,255,255,0.2)] pointer-events-none" />
        </div>

        {/* Cryptographic Ticker Badge */}
        <div className="mt-2 sm:mt-3 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.3)] shadow-lg backdrop-blur-md flex items-center gap-1.5 font-mono text-[9px] sm:text-[11px] text-[#8AD8B8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8AD8B8] animate-ping" />
          <span>CHAIN&nbsp;VERIFIED</span>
        </div>
      </div>

      {/* Floating Lifecycle Nodes on the 190px Orbit */}
      {ORBIT_NODES.map((node, index) => {
        const rad = (node.angleDeg * Math.PI) / 180;
        // Map 190px radius in a 500px box to percentage
        const leftPercent = 50 + 38 * Math.cos(rad);
        const topPercent = 50 + 38 * Math.sin(rad);
        const isActive = mounted && index === activeNodeIndex;
        const Icon = node.icon;

        return (
          <div
            key={node.id}
            onClick={() => setActiveNodeIndex(index)}
            className={cn(
              "absolute z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-all duration-500",
              isActive ? "scale-110" : "hover:scale-105"
            )}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
            }}
          >
            {/* Glass Node Surface */}
            <div
              className={cn(
                "w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500",
                isActive
                  ? "bg-[#8AD8B8] text-[#132D28] border-2 border-white shadow-[0_0_30px_rgba(138,216,184,0.8)]"
                  : "bg-[rgba(19,45,40,0.75)] text-[#8AD8B8] border border-[rgba(138,216,184,0.25)] hover:border-[#8AD8B8] shadow-lg backdrop-blur-xl hover:bg-[rgba(64,133,118,0.3)]"
              )}
              style={{
                boxShadow: isActive
                  ? "0 0 30px rgba(138,216,184,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
                  : "0 10px 25px -5px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)",
              }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" strokeWidth={isActive ? 2.4 : 1.8} />
            </div>

            {/* Floating Text Pill */}
            <span
              className={cn(
                "mt-1 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[8px] sm:text-[10px] uppercase tracking-wider transition-all duration-300 backdrop-blur-md shadow-xs",
                isActive
                  ? "bg-[rgba(19,45,40,0.95)] text-[#FFF4E2] border border-[#8AD8B8] font-bold"
                  : "bg-[rgba(19,45,40,0.6)] text-[#8AD8B8]/80 border border-[rgba(138,216,184,0.15)] group-hover:text-[#FFF4E2]"
              )}
            >
              <span className="hidden sm:inline">{node.label}</span>
              <span className="sm:hidden">{node.shortLabel}</span>
            </span>
          </div>
        );
      })}

      {/* Dynamic Status Ticker at bottom */}
      <div className="absolute -bottom-4 sm:bottom-0 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-[rgba(19,45,40,0.9)] border border-[rgba(138,216,184,0.25)] shadow-xl backdrop-blur-xl flex items-center gap-2 font-mono text-xs text-[#8AD8B8]/90 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-[#8AD8B8] animate-pulse" />
        <span>
          verifying &rarr; <strong className="text-[#FFF4E2] font-sans">{activeNode.label}</strong>&nbsp;
          <span className="text-[#8AD8B8]/60 text-[10px]">sha256:{activeNode.hash}&hellip;</span>
        </span>
      </div>
    </div>
  );
}
