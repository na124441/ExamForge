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
    color: "var(--md-sys-color-info)",
    bg: "var(--md-sys-color-info-container)",
    icon: Info,
  },
  medium: {
    color: "var(--md-sys-color-warning)",
    bg: "var(--md-sys-color-warning-container)",
    icon: AlertTriangle,
  },
  high: {
    color: "var(--md-sys-color-error)",
    bg: "var(--md-sys-color-error-container)",
    icon: AlertCircle,
  },
  critical: {
    color: "var(--md-sys-color-error)",
    bg: "var(--md-sys-color-error-container)",
    icon: ShieldAlert,
  },
};

export function ForgeTimeline({ events, className }: ForgeTimelineProps) {
  return (
    <div className={cn("flex flex-col font-sans", className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const config = severityConfig[event.severity];
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <div
                className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-[var(--md-sys-color-outline-variant)]"
                aria-hidden="true"
              />
            )}
            <div
              className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-2xs"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Icon size={14} />
            </div>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-xs font-mono font-medium text-[var(--md-sys-color-on-surface-variant)]">
                {event.timestamp}
              </span>
              <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                {event.title}
              </span>
              {event.description && (
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-0.5">
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
