"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from "lucide-react";

export interface ForgeTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface ForgeTimelineProps {
  events: ForgeTimelineEvent[];
  className?: string;
}

const severityConfig = {
  low: {
    color: "var(--color-info)",
    bg: "var(--color-info-surface)",
    icon: Info,
  },
  medium: {
    color: "var(--color-warning)",
    bg: "var(--color-warning-surface)",
    icon: AlertTriangle,
  },
  high: {
    color: "var(--color-danger)",
    bg: "var(--color-danger-surface)",
    icon: AlertCircle,
  },
  critical: {
    color: "var(--color-danger)",
    bg: "var(--color-danger-surface)",
    icon: ShieldAlert,
  },
};

export function ForgeTimeline({ events, className }: ForgeTimelineProps) {
  return (
    <div className={cn("flex flex-col font-sans", className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const config = severityConfig[event.severity] || severityConfig.low;
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <div
                className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-[var(--color-border)]"
                aria-hidden="true"
              />
            )}
            <div
              className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-2xs border border-current/20"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Icon size={14} />
            </div>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-[11px] font-mono font-medium text-[var(--color-ink-muted)]">
                {event.timestamp}
              </span>
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                {event.title}
              </span>
              {event.description && (
                <span className="text-xs text-[var(--color-ink-secondary)] leading-relaxed mt-0.5">
                  {event.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
