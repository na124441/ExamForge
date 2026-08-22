"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ForgeStatusType = "operational" | "degraded" | "critical" | "offline";

interface StatusConfig {
  dot: string;
  defaultLabel: string;
}

const statusMap: Record<ForgeStatusType, StatusConfig> = {
  operational: { dot: "bg-[var(--md-sys-color-success)]", defaultLabel: "Operational" },
  degraded: { dot: "bg-[var(--md-sys-color-warning)]", defaultLabel: "Degraded" },
  critical: { dot: "bg-[var(--md-sys-color-error)]", defaultLabel: "Critical" },
  offline: { dot: "bg-[var(--md-sys-color-on-surface-variant)]", defaultLabel: "Offline" },
};

export interface ForgeStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  status: ForgeStatusType;
  label?: string;
  description?: string;
}

export function ForgeStatus({ status, label, description, className, ...props }: ForgeStatusProps) {
  const config = statusMap[status];

  return (
    <div className={cn("flex flex-col gap-0.5 font-sans", className)} {...props}>
      <div className="flex items-center gap-2">
        <div className={cn("h-2.5 w-2.5 rounded-full", config.dot)} />
        <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
          {label || config.defaultLabel}
        </span>
      </div>
      {description && (
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-4.5">
          {description}
        </span>
      )}
    </div>
  );
}
