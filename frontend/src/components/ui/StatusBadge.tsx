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
  Loader2,
  ShieldCheck
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
  | "DOWN"
  | "TAMPERED"
  | "CANONICAL";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const normStatus = (status || "").toUpperCase() as StatusType;

  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  let dotClass = "bg-slate-400";
  let Icon: React.ComponentType<any> = FileText;
  let label = status;

  switch (normStatus) {
    case "VERIFIED":
    case "CANONICAL":
      colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
      dotClass = "bg-emerald-500 beacon-emerald";
      Icon = Check;
      label = normStatus === "CANONICAL" ? "Canonical Match" : "Verified";
      break;
    case "READY":
    case "HEALTHY":
      colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
      dotClass = "bg-emerald-500 beacon-emerald";
      Icon = Check;
      label = normStatus === "HEALTHY" ? "Healthy" : "Ready";
      break;
    case "PENDING":
      colorClass = "bg-amber-50 text-amber-800 border-amber-200";
      dotClass = "bg-amber-500 beacon-amber";
      Icon = Clock;
      label = "Pending";
      break;
    case "WARNING":
    case "DEGRADED":
      colorClass = "bg-amber-50 text-amber-800 border-amber-200";
      dotClass = "bg-amber-500 beacon-amber";
      Icon = AlertTriangle;
      label = normStatus === "DEGRADED" ? "Degraded" : "Warning";
      break;
    case "BLOCKED":
    case "TAMPERED":
      colorClass = "bg-red-50 text-red-800 border-red-200";
      dotClass = "bg-red-500 beacon-red";
      Icon = AlertOctagon;
      label = normStatus === "TAMPERED" ? "Tamper Detected" : "Blocked";
      break;
    case "FAILED":
    case "DOWN":
      colorClass = "bg-red-50 text-red-800 border-red-200";
      dotClass = "bg-red-500 beacon-red";
      Icon = XCircle;
      label = normStatus === "DOWN" ? "Down" : "Failed";
      break;
    case "LOCKED":
      colorClass = "bg-indigo-50 text-indigo-800 border-indigo-200";
      dotClass = "bg-indigo-500";
      Icon = Lock;
      label = "Locked";
      break;
    case "SIGNED":
      colorClass = "bg-sky-50 text-sky-800 border-sky-200";
      dotClass = "bg-sky-500";
      Icon = Key;
      label = "Cryptographically Signed";
      break;
    case "DRAFT":
      colorClass = "bg-slate-100 text-slate-700 border-slate-200";
      dotClass = "bg-slate-400";
      Icon = FileText;
      label = "Draft";
      break;
    case "PROCESSING":
      colorClass = "bg-blue-50 text-blue-800 border-blue-200";
      dotClass = "bg-blue-500 animate-ping";
      Icon = Loader2;
      label = "Processing";
      break;
  }

  const isSmall = size === "sm";

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-tight shadow-2xs ${
        isSmall ? "px-2 py-0.2 text-[10px]" : "px-2.5 py-0.5 text-xs"
      } ${colorClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <Icon className={`${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} shrink-0 ${normStatus === "PROCESSING" ? "animate-spin" : ""}`} />
      <span className="truncate">{label}</span>
    </span>
  );
}
