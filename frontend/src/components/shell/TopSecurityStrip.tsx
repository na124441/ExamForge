"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Database, Key, ShieldAlert } from "lucide-react";

interface TopSecurityStripProps {
  trustScore?: number;
  auditStatus?: "VALID" | "TAMPERED" | string;
  gateStatus?: "READY" | "LOCKED" | string;
  opsStatus?: "HEALTHY" | "DEGRADED" | "DOWN" | string;
  onRefresh?: () => void;
}

export function TopSecurityStrip({
  trustScore = 97,
  auditStatus = "VALID",
  gateStatus = "READY",
  opsStatus = "HEALTHY",
  onRefresh
}: TopSecurityStripProps) {
  const [role, setRole] = useState("CONTROLLER");
  const [userName, setUserName] = useState("Exam Controller");
  const [institution, setInstitution] = useState("National Scholarship Board");
  const [activeExam, setActiveExam] = useState("Hybrid Scholarship Test 2026");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("user_role") || "CONTROLLER";
      const name = localStorage.getItem("user_name") || "Exam Controller";
      const inst = localStorage.getItem("user_institution") || "National Scholarship Board";
      setRole(storedRole);
      setUserName(name);
      setInstitution(inst);
    }
  }, []);

  const isAuditValid = auditStatus.toUpperCase() === "VALID";
  const isGateReady = gateStatus.toUpperCase() === "READY";
  const isOpsHealthy = opsStatus.toUpperCase() === "HEALTHY" || opsStatus.toUpperCase() === "READY" || opsStatus.toUpperCase() === "OK";

  return (
    <div className="bg-[#070A14]/80 backdrop-blur border-b border-white/[0.06] px-6 py-2.5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono shrink-0 select-none">
      {/* Left: Organization & Exam Scope */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-mono text-[11px] uppercase tracking-widest">Tenant:</span>
          <span className="text-slate-300 font-bold font-mono text-[11px] uppercase tracking-wider">{institution}</span>
        </div>
        <div className="w-px h-3 bg-white/10 hidden md:inline" />
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px] uppercase tracking-widest">Exam:</span>
          <span className="text-slate-300 font-mono text-[11px] font-semibold">{activeExam}</span>
        </div>
      </div>

      {/* Right: Security & Ops Status Indicators */}
      <div className="flex items-center gap-3.5 flex-wrap">
        
        {/* Role Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/[0.03] border border-white/[0.06] text-slate-350">
          <Key className="w-3 h-3 text-slate-500" />
          <span>{role}</span>
        </div>

        <div className="w-px h-3 bg-white/10 hidden md:inline" />

        {/* Trust Score Pill */}
        <div 
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
            trustScore >= 95 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${trustScore >= 95 ? "bg-emerald-450 animate-pulse-dot" : "bg-amber-450 animate-pulse"}`} />
          <span>Trust: {trustScore}%</span>
        </div>

        <div className="w-px h-3 bg-white/10 hidden md:inline" />

        {/* Audit status Pill */}
        <div 
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
            isAuditValid 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.12)]"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isAuditValid ? "bg-emerald-450 animate-pulse-dot" : "bg-rose-450 animate-pulse-dot-rose"}`} />
          <span>Audit: {isAuditValid ? "Valid" : "Tampered"}</span>
        </div>

        <div className="w-px h-3 bg-white/10 hidden md:inline" />

        {/* Gate Status Pill */}
        <div 
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
            isGateReady 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]" 
              : "bg-violet-500/10 border-violet-500/20 text-violet-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isGateReady ? "bg-emerald-450 animate-pulse-dot" : "bg-violet-450"}`} />
          <span>Gate: {isGateReady ? "READY" : "LOCKED"}</span>
        </div>

        <div className="w-px h-3 bg-white/10 hidden md:inline" />

        {/* Ops Health Pill */}
        <div 
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
            isOpsHealthy 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOpsHealthy ? "bg-emerald-450 animate-pulse-dot" : "bg-amber-450 animate-pulse"}`} />
          <span>Ops: {isOpsHealthy ? "Healthy" : "Degraded"}</span>
        </div>

      </div>
    </div>
  );
}
