"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface ForgeKPIProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string | number;
    direction?: "up" | "down" | "neutral";
    label?: string;
  };
  status?: "ok" | "warn" | "danger" | "info" | "neutral";
  mono?: boolean;
}

export function ForgeKPI({
  label,
  value,
  subtext,
  trend,
  status,
  mono = true,
  className,
  ...props
}: ForgeKPIProps) {
  let statusTextColor = "text-[var(--color-ink)]";
  if (status === "ok") statusTextColor = "text-[var(--color-success)]";
  else if (status === "warn") statusTextColor = "text-[var(--color-warning)]";
  else if (status === "danger") statusTextColor = "text-[var(--color-danger)]";
  else if (status === "info") statusTextColor = "text-[var(--color-info)]";

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs select-none",
        className
      )}
      {...props}
    >
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1 font-sans">
        {label}
      </div>

      <div className="flex items-baseline gap-2">
        <div className={cn("text-2xl font-bold tracking-tight ef-metric", statusTextColor, mono ? "font-mono" : "font-sans")}>
          {value}
        </div>

        {trend && (
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono",
              trend.direction === "up"
                ? "bg-[var(--color-success-surface)] text-[var(--color-success-text)]"
                : trend.direction === "down"
                ? "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)]"
                : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]"
            )}
          >
            {trend.direction === "up" && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
            {trend.direction === "down" && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
            {trend.direction === "neutral" && <Minus className="mr-0.5 h-3 w-3 opacity-50" />}
            {trend.label || trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <div className="text-xs text-[var(--color-ink-secondary)] mt-1.5 leading-snug">
          {subtext}
        </div>
      )}
    </div>
  );
}
