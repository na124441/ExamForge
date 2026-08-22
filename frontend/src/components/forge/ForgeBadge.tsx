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
    surface: "bg-[var(--color-success-surface)] border border-[var(--color-success)]/20",
    text: "text-[var(--color-success-text)]",
    dot: "bg-[var(--color-success)]",
  },
  OPERATIONAL: {
    icon: CheckCircle2,
    surface: "bg-[var(--color-success-surface)] border border-[var(--color-success)]/20",
    text: "text-[var(--color-success-text)]",
    dot: "bg-[var(--color-success)]",
  },
  ACTIVE: {
    icon: CheckCircle2,
    surface: "bg-[var(--color-success-surface)] border border-[var(--color-success)]/20",
    text: "text-[var(--color-success-text)]",
    dot: "bg-[var(--color-success)]",
  },
  READY: {
    icon: CheckCircle2,
    surface: "bg-[var(--color-success-surface)] border border-[var(--color-success)]/20",
    text: "text-[var(--color-success-text)]",
    dot: "bg-[var(--color-success)]",
  },
  LIVE: {
    icon: ShieldCheck,
    surface: "bg-[var(--color-success-surface)] border border-[var(--color-success)]/20",
    text: "text-[var(--color-success-text)]",
    dot: "bg-[var(--color-success)]",
  },
  PENDING: {
    icon: Clock,
    surface: "bg-[var(--color-warning-surface)] border border-[var(--color-warning)]/20",
    text: "text-[var(--color-warning-text)]",
    dot: "bg-[var(--color-warning)]",
  },
  WARNING: {
    icon: AlertTriangle,
    surface: "bg-[var(--color-warning-surface)] border border-[var(--color-warning)]/20",
    text: "text-[var(--color-warning-text)]",
    dot: "bg-[var(--color-warning)]",
  },
  SUSPICIOUS: {
    icon: AlertTriangle,
    surface: "bg-[var(--color-warning-surface)] border border-[var(--color-warning)]/20",
    text: "text-[var(--color-warning-text)]",
    dot: "bg-[var(--color-warning)]",
  },
  BLOCKED: {
    icon: ShieldAlert,
    surface: "bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20",
    text: "text-[var(--color-danger-text)]",
    dot: "bg-[var(--color-danger)]",
  },
  CRITICAL: {
    icon: AlertOctagon,
    surface: "bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20",
    text: "text-[var(--color-danger-text)]",
    dot: "bg-[var(--color-danger)]",
  },
  LOCKED: {
    icon: ShieldAlert,
    surface: "bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20",
    text: "text-[var(--color-danger-text)]",
    dot: "bg-[var(--color-danger)]",
  },
  OFFLINE: {
    icon: WifiOff,
    surface: "bg-[var(--color-surface-sunken)] border border-[var(--color-border)]",
    text: "text-[var(--color-ink-secondary)]",
    dot: "bg-[var(--color-ink-disabled)]",
  },
  EXPIRED: {
    icon: Clock,
    surface: "bg-[var(--color-surface-sunken)] border border-[var(--color-border)]",
    text: "text-[var(--color-ink-secondary)]",
    dot: "bg-[var(--color-ink-disabled)]",
  },
  DEFAULT: {
    icon: CheckCircle2,
    surface: "bg-[var(--color-surface-sunken)] border border-[var(--color-border)]",
    text: "text-[var(--color-ink-secondary)]",
    dot: "bg-[var(--color-ink-disabled)]",
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
        "inline-flex items-center rounded-full font-sans font-semibold transition-colors select-none",
        config.surface,
        config.text,
        size === "sm" ? "px-2.5 py-0.5 text-[11px] gap-1.5" : "px-3 py-1 text-xs gap-2",
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
