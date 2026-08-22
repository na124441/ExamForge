"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert, AlertOctagon, WifiOff, LucideIcon } from "lucide-react";

export type SecurityState = "VERIFIED" | "PENDING" | "WARNING" | "SUSPICIOUS" | "BLOCKED" | "CRITICAL" | "OFFLINE" | "EXPIRED";

interface StateConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
}

const stateMap: Record<SecurityState, StateConfig> = {
  VERIFIED: { icon: CheckCircle2, color: "var(--md-sys-color-success)", bg: "var(--md-sys-color-success-container)" },
  PENDING: { icon: Clock, color: "var(--md-sys-color-warning)", bg: "var(--md-sys-color-warning-container)" },
  WARNING: { icon: AlertTriangle, color: "var(--md-sys-color-warning)", bg: "var(--md-sys-color-warning-container)" },
  SUSPICIOUS: { icon: AlertTriangle, color: "var(--md-sys-color-warning)", bg: "var(--md-sys-color-warning-container)" },
  BLOCKED: { icon: ShieldAlert, color: "var(--md-sys-color-error)", bg: "var(--md-sys-color-error-container)" },
  CRITICAL: { icon: AlertOctagon, color: "var(--md-sys-color-error)", bg: "var(--md-sys-color-error-container)" },
  OFFLINE: { icon: WifiOff, color: "var(--md-sys-color-on-surface-variant)", bg: "var(--md-sys-color-surface-container-high)" },
  EXPIRED: { icon: Clock, color: "var(--md-sys-color-on-surface-variant)", bg: "var(--md-sys-color-surface-container-high)" },
};

export interface ForgeSecurityBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  state: SecurityState;
  label: string;
  description?: string;
}

export function ForgeSecurityBadge({ state, label, description, className, ...props }: ForgeSecurityBadgeProps) {
  const config = stateMap[state];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3.5 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-4 font-sans shadow-[var(--md-sys-elevation-1)]",
        className
      )}
      {...props}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
          {label}
        </span>
        {description && (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
