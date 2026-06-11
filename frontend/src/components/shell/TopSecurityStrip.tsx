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
    <div className="bg-slate-950 border-b border-slate-900 px-6 py-2.5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono shrink-0 select-none">
      {/* Left: Organization & Exam Scope */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-semibold">Tenant:</span>
          <span className="text-white font-bold">{institution}</span>
        </div>
        <span className="text-slate-700 hidden md:inline">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold">Exam:</span>
          <span className="text-slate-300 font-semibold">{activeExam}</span>
        </div>
      </div>

      {/* Right: Security & Ops Status Indicators */}
      <div className="flex items-center gap-4 flex-wrap">
        
        {/* Role Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Key className="w-3 h-3" />
          <span>{role}</span>
        </div>

        <span className="text-slate-700 hidden md:inline">|</span>

        {/* Trust Score Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
            trustScore >= 95 
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/25 text-amber-400"
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Trust Score: {trustScore}/100</span>
        </div>

        {/* Audit status Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
            isAuditValid 
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
              : "bg-red-500/10 border-red-500/25 text-red-400 animate-pulse"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isAuditValid ? "bg-emerald-400" : "bg-red-400 animate-ping"}`} />
          <span>Audit Chain: {isAuditValid ? "Valid" : "Compromised"}</span>
        </div>

        {/* Gate Status Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
            isGateReady 
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
              : "bg-violet-500/10 border-violet-500/25 text-violet-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isGateReady ? "bg-emerald-400" : "bg-violet-400"}`} />
          <span>Gate: {isGateReady ? "READY" : "LOCKED"}</span>
        </div>

        {/* Ops Health Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
            isOpsHealthy 
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/25 text-amber-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOpsHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span>Ops: {isOpsHealthy ? "Healthy" : "Degraded"}</span>
        </div>

      </div>
    </div>
  );
}
