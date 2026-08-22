"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Database, 
  Key, 
  ShieldAlert, 
  Search, 
  Activity, 
  Radio, 
  Lock, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Command
} from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

interface TopSecurityStripProps {
  trustScore?: number;
  auditStatus?: "VALID" | "TAMPERED" | string;
  gateStatus?: "READY" | "LOCKED" | string;
  opsStatus?: "HEALTHY" | "DEGRADED" | "DOWN" | string;
  onOpenCommandPalette?: () => void;
}

export function TopSecurityStrip({
  trustScore = 97,
  auditStatus = "VALID",
  gateStatus = "READY",
  opsStatus = "HEALTHY",
  onOpenCommandPalette
}: TopSecurityStripProps) {
  const [role, setRole] = useState("CONTROLLER");
  const [userName, setUserName] = useState("Exam Controller");
  const [institution, setInstitution] = useState("National Scholarship Board");
  const [activeExam, setActiveExam] = useState("Hybrid Scholarship Test 2026");
  const [epochTime, setEpochTime] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("user_role") || "CONTROLLER";
      const name = localStorage.getItem("user_name") || "Exam Controller";
      const inst = localStorage.getItem("user_institution") || "National Scholarship Board";
      setRole(storedRole);
      setUserName(name);
      setInstitution(inst);
    }

    const updateTime = () => {
      const now = new Date();
      setEpochTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAuditValid = auditStatus.toUpperCase() === "VALID";
  const isGateReady = gateStatus.toUpperCase() === "READY";
  const isOpsHealthy = opsStatus.toUpperCase() === "HEALTHY" || opsStatus.toUpperCase() === "READY" || opsStatus.toUpperCase() === "OK";

  const getRoleBadgeStyle = (r: string) => {
    switch (r.toUpperCase()) {
      case "CONTROLLER":
        return "bg-indigo-50 border-indigo-200 text-indigo-700";
      case "OFFICER":
      case "INVIGILATOR":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "EVALUATOR":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "AUDITOR":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "CANDIDATE":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      default:
        return "bg-slate-100 border-slate-200 text-slate-700";
    }
  };

  return (
    <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 px-6 py-2.5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs font-sans shrink-0 select-none shadow-xs sticky top-0 z-20">
      
      {/* Left: Organization & Scope */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-50 border border-indigo-100 rounded text-indigo-600">
            <Database className="w-3.5 h-3.5" />
          </div>
          <span className="text-slate-400 font-medium text-[11px]">INSTITUTION:</span>
          <span className="text-slate-900 font-bold tracking-tight">{institution}</span>
        </div>

        <div className="w-px h-3.5 bg-slate-200 hidden md:inline" />

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-[11px]">ACTIVE EXAM:</span>
          <span className="text-slate-800 font-semibold bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80 text-[11px]">
            {activeExam}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-200 hidden lg:inline" />

        {/* Live Epoch Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-500 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>UTC {epochTime || "00:00:00"}</span>
        </div>
      </div>

      {/* Right: Telemetry Indicators & Quick Search */}
      <div className="flex items-center gap-2.5 flex-wrap">
        
        {/* Quick Search / Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 transition text-[11px] font-medium cursor-pointer shadow-2xs active-press"
          title="Quick Jump (Ctrl+K / ⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Quick Jump</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-white border border-slate-200 px-1 py-0.2 rounded font-mono text-[9px] text-slate-400 font-semibold">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle />
        <div className="w-px h-3.5 bg-slate-200 hidden sm:inline" />

        {/* Role Persona Badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeStyle(role)}`}>
          <Key className="w-3 h-3" />
          <span>{role}</span>
        </div>

        {/* Trust Index Meter */}
        <div 
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            trustScore >= 95 
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-700" 
              : "bg-amber-50/90 border-amber-200 text-amber-700"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${trustScore >= 95 ? "bg-emerald-500 beacon-emerald" : "bg-amber-500 beacon-amber"}`} />
          <span>Trust: <strong className="font-bold">{trustScore}%</strong></span>
        </div>

        {/* Audit Status */}
        <div 
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            isAuditValid 
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-700" 
              : "bg-red-50/90 border-red-200 text-red-700"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isAuditValid ? "bg-emerald-500" : "bg-red-500 beacon-red"}`} />
          <span>{isAuditValid ? "Ledger Sealed" : "Audit Breach"}</span>
        </div>

        {/* Publication Gate Status */}
        <div 
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            isGateReady 
              ? "bg-indigo-50/90 border-indigo-200 text-indigo-700" 
              : "bg-slate-100 border-slate-200 text-slate-600"
          }`}
        >
          <Lock className="w-3 h-3 text-indigo-600" />
          <span>Gate: {isGateReady ? "Ready" : "Locked"}</span>
        </div>

      </div>
    </header>
  );
}
