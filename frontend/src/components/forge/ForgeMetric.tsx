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

  let statusTextColor = "text-[var(--md-sys-color-on-surface)]";
  if (status === "ok" || status === "success") statusTextColor = "text-[var(--md-sys-color-success)]";
  else if (status === "warn" || status === "warning") statusTextColor = "text-[var(--md-sys-color-warning)]";
  else if (status === "danger" || status === "error") statusTextColor = "text-[var(--md-sys-color-error)]";

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] transition-all duration-[var(--duration-normal)] select-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] font-sans uppercase tracking-wider">
          {displayLabel}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className={cn("text-3xl font-bold tracking-tight", statusTextColor, mono ? "font-mono" : "font-sans")}>
          {value}
        </span>
        {trendText && (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono",
              isPositive
                ? "bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]"
                : isNegative
                ? "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]"
                : "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
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
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{description}</span>
      )}
    </div>
  );
}
