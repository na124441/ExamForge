"use client";

import React from "react";
import { 
  Check, 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  XCircle, 
  Lock, 
  Key, 
  FileText, 
  Loader2 
} from "lucide-react";

export type StatusType = 
  | "VERIFIED" 
  | "READY" 
  | "PENDING" 
  | "WARNING" 
  | "BLOCKED" 
  | "FAILED" 
  | "LOCKED" 
  | "SIGNED" 
  | "DRAFT" 
  | "PROCESSING"
  | "HEALTHY"
  | "DEGRADED"
  | "DOWN";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const normStatus = (status || "").toUpperCase() as StatusType;

  let colorClass = "bg-slate-800/80 text-slate-400 border-slate-700/50";
  let Icon: React.ComponentType<any> = FileText;
  let label = status;

  switch (normStatus) {
    case "VERIFIED":
      colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      Icon = Check;
      label = "Verified";
      break;
    case "READY":
    case "HEALTHY":
      colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      Icon = Check;
      label = normStatus === "HEALTHY" ? "Healthy" : "Ready";
      break;
    case "PENDING":
      colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/25";
      Icon = Clock;
      label = "Pending";
      break;
    case "WARNING":
    case "DEGRADED":
      colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/25";
      Icon = AlertTriangle;
      label = normStatus === "DEGRADED" ? "Degraded" : "Warning";
      break;
    case "BLOCKED":
      colorClass = "bg-red-500/10 text-red-400 border-red-500/25";
      Icon = AlertOctagon;
      label = "Blocked";
      break;
    case "FAILED":
    case "DOWN":
      colorClass = "bg-red-500/10 text-red-400 border-red-500/25";
      Icon = XCircle;
      label = normStatus === "DOWN" ? "Down" : "Failed";
      break;
    case "LOCKED":
      colorClass = "bg-violet-500/10 text-violet-400 border-violet-500/25";
      Icon = Lock;
      label = "Locked";
      break;
    case "SIGNED":
      colorClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/25";
      Icon = Key;
      label = "Signed";
      break;
    case "DRAFT":
      colorClass = "bg-slate-800 text-slate-400 border-slate-700";
      Icon = FileText;
      label = "Draft";
      break;
    case "PROCESSING":
      colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/25";
      Icon = Loader2;
      label = "Processing";
      break;
  }

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-wider ${colorClass} ${className}`}
    >
      <Icon className={`w-3 h-3 ${normStatus === "PROCESSING" ? "animate-spin" : ""}`} />
      <span>{label}</span>
    </span>
  );
}
