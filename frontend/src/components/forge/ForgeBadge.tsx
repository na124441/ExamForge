"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
  WifiOff,
  LucideIcon,
  ShieldCheck,
} from "lucide-react";

export type BadgeStatus =
  | "VERIFIED"
  | "PENDING"
  | "WARNING"
  | "SUSPICIOUS"
  | "BLOCKED"
  | "CRITICAL"
  | "OFFLINE"
  | "EXPIRED"
  | "OPERATIONAL"
  | "ACTIVE"
  | "LIVE"
  | "READY"
  | "LOCKED"
  | "DEFAULT";

interface StatusConfig {
  icon: LucideIcon;
  surface: string;
  text: string;
  dot: string;
}

const statusMap: Record<string, StatusConfig> = {
  VERIFIED: {
    icon: CheckCircle2,
    surface: "bg-[var(--md-sys-color-success-container)]",
    text: "text-[var(--md-sys-color-on-success-container)]",
    dot: "bg-[var(--md-sys-color-success)]",
  },
  OPERATIONAL: {
    icon: CheckCircle2,
    surface: "bg-[var(--md-sys-color-success-container)]",
    text: "text-[var(--md-sys-color-on-success-container)]",
    dot: "bg-[var(--md-sys-color-success)]",
  },
  ACTIVE: {
    icon: CheckCircle2,
    surface: "bg-[var(--md-sys-color-success-container)]",
    text: "text-[var(--md-sys-color-on-success-container)]",
    dot: "bg-[var(--md-sys-color-success)]",
  },
  READY: {
    icon: CheckCircle2,
    surface: "bg-[var(--md-sys-color-success-container)]",
    text: "text-[var(--md-sys-color-on-success-container)]",
    dot: "bg-[var(--md-sys-color-success)]",
  },
  LIVE: {
    icon: ShieldCheck,
    surface: "bg-[var(--md-sys-color-success-container)]",
    text: "text-[var(--md-sys-color-on-success-container)]",
    dot: "bg-[var(--md-sys-color-success)]",
  },
  PENDING: {
    icon: Clock,
    surface: "bg-[var(--md-sys-color-warning-container)]",
    text: "text-[var(--md-sys-color-on-warning-container)]",
    dot: "bg-[var(--md-sys-color-warning)]",
  },
  WARNING: {
    icon: AlertTriangle,
    surface: "bg-[var(--md-sys-color-warning-container)]",
    text: "text-[var(--md-sys-color-on-warning-container)]",
    dot: "bg-[var(--md-sys-color-warning)]",
  },
  SUSPICIOUS: {
    icon: AlertTriangle,
    surface: "bg-[var(--md-sys-color-warning-container)]",
    text: "text-[var(--md-sys-color-on-warning-container)]",
    dot: "bg-[var(--md-sys-color-warning)]",
  },
  BLOCKED: {
    icon: ShieldAlert,
    surface: "bg-[var(--md-sys-color-error-container)]",
    text: "text-[var(--md-sys-color-on-error-container)]",
    dot: "bg-[var(--md-sys-color-error)]",
  },
  CRITICAL: {
    icon: AlertOctagon,
    surface: "bg-[var(--md-sys-color-error-container)]",
    text: "text-[var(--md-sys-color-on-error-container)]",
    dot: "bg-[var(--md-sys-color-error)]",
  },
  LOCKED: {
    icon: ShieldAlert,
    surface: "bg-[var(--md-sys-color-error-container)]",
    text: "text-[var(--md-sys-color-on-error-container)]",
    dot: "bg-[var(--md-sys-color-error)]",
  },
  OFFLINE: {
    icon: WifiOff,
    surface: "bg-[var(--md-sys-color-secondary-container)]",
    text: "text-[var(--md-sys-color-on-secondary-container)]",
    dot: "bg-[var(--md-sys-color-secondary)]",
  },
  EXPIRED: {
    icon: Clock,
    surface: "bg-[var(--md-sys-color-secondary-container)]",
    text: "text-[var(--md-sys-color-on-secondary-container)]",
    dot: "bg-[var(--md-sys-color-secondary)]",
  },
  DEFAULT: {
    icon: CheckCircle2,
    surface: "bg-[var(--md-sys-color-secondary-container)]",
    text: "text-[var(--md-sys-color-on-secondary-container)]",
    dot: "bg-[var(--md-sys-color-secondary)]",
  },
};

export interface ForgeBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: BadgeStatus | string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | string;
  label?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  children?: React.ReactNode;
}

export function ForgeBadge({
  status,
  variant,
  label,
  icon,
  size = "sm",
  children,
  className,
  ...props
}: ForgeBadgeProps) {
  let effectiveKey = (status || "").toUpperCase();
  if (!effectiveKey && variant) {
    switch (variant.toLowerCase()) {
      case "success":
      case "ok":
        effectiveKey = "VERIFIED";
        break;
      case "warning":
      case "warn":
        effectiveKey = "WARNING";
        break;
      case "danger":
      case "error":
      case "critical":
        effectiveKey = "CRITICAL";
        break;
      case "info":
        effectiveKey = "ACTIVE";
        break;
      default:
        effectiveKey = "DEFAULT";
    }
  }
  if (!effectiveKey || !statusMap[effectiveKey]) {
    effectiveKey = "DEFAULT";
  }

  const config = statusMap[effectiveKey] || statusMap.DEFAULT;
  const DefaultIcon = config.icon;
  const displayText = children || label || status || effectiveKey;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-sans font-medium transition-colors select-none",
        config.surface,
        config.text,
        size === "sm" ? "px-2.5 py-0.5 text-xs gap-1.5" : "px-3 py-1 text-sm gap-2",
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center shrink-0">
        {icon ? (
          <span className={cn(size === "sm" ? "h-3.5 w-3.5 flex items-center" : "h-4 w-4 flex items-center")}>{icon}</span>
        ) : (
          <DefaultIcon className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        )}
      </div>
      <span className="truncate">{displayText}</span>
    </div>
  );
}
