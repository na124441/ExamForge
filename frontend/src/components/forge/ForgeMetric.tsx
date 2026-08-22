"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface TrendConfig {
  value?: number | string;
  direction?: "up" | "down" | "neutral" | string;
  label?: string;
}

export interface ForgeMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  title?: string;
  value: string | number;
  trend?: string | TrendConfig;
  icon?: React.ReactNode;
  mono?: boolean;
  description?: string;
  status?: "ok" | "warn" | "danger" | "info" | "neutral" | string;
}

export function ForgeMetric({
  label,
  title,
  value,
  trend,
  icon,
  mono = true,
  description,
  status,
  className,
  ...props
}: ForgeMetricProps) {
  const displayLabel = label || title || "";

  let trendText: string | null = null;
  let isPositive = false;
  let isNegative = false;

  if (typeof trend === "string") {
    trendText = trend;
    isPositive = trend.startsWith("+");
    isNegative = trend.startsWith("-");
  } else if (trend && typeof trend === "object") {
    trendText = trend.label || `${trend.value ?? ""}`;
    if (trend.direction === "up") isPositive = true;
    else if (trend.direction === "down") isNegative = true;
  }

  let statusTextColor = "text-[var(--color-ink)]";
  if (status === "ok" || status === "success") statusTextColor = "text-[var(--color-success)]";
  else if (status === "warn" || status === "warning") statusTextColor = "text-[var(--color-warning)]";
  else if (status === "danger" || status === "error") statusTextColor = "text-[var(--color-danger)]";

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs hover:shadow-sm transition-all duration-[var(--duration-normal)] select-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[var(--color-ink-secondary)] font-sans uppercase tracking-wider">
          {displayLabel}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-secondary)]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className={cn("text-2xl sm:text-3xl font-bold tracking-tight ef-metric", statusTextColor, mono ? "font-mono" : "font-sans")}>
          {value}
        </span>
        {trendText && (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono",
              isPositive
                ? "bg-[var(--color-success-surface)] text-[var(--color-success-text)]"
                : isNegative
                ? "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)]"
                : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]"
            )}
          >
            {isPositive && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
            {isNegative && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
            {!isPositive && !isNegative && <Minus className="mr-0.5 h-3 w-3 opacity-50" />}
            {trendText}
          </span>
        )}
      </div>

      {description && (
        <span className="text-xs text-[var(--color-ink-secondary)] mt-1">{description}</span>
      )}
    </div>
  );
}
