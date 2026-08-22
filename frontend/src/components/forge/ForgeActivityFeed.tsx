"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { Info, AlertTriangle, AlertCircle, CheckCircle, LucideIcon } from "lucide-react";

export interface ForgeActivityEvent {
  id: string;
  timestamp: string;
  message?: string;
  title?: string;
  description?: string;
  severity?: "info" | "warning" | "danger" | "success" | string;
  type?: "info" | "warning" | "danger" | "success" | "default" | string;
  icon?: React.ReactNode;
}

export interface ForgeActivityFeedProps {
  events?: ForgeActivityEvent[];
  items?: ForgeActivityEvent[];
  maxItems?: number;
  className?: string;
}

const severityConfig: Record<string, { color: string; bg: string; icon: LucideIcon }> = {
  info: { color: "var(--color-info)", bg: "var(--color-info-surface)", icon: Info },
  warning: { color: "var(--color-warning)", bg: "var(--color-warning-surface)", icon: AlertTriangle },
  danger: { color: "var(--color-danger)", bg: "var(--color-danger-surface)", icon: AlertCircle },
  error: { color: "var(--color-danger)", bg: "var(--color-danger-surface)", icon: AlertCircle },
  success: { color: "var(--color-success)", bg: "var(--color-success-surface)", icon: CheckCircle },
  default: { color: "var(--color-ink-secondary)", bg: "var(--color-surface-sunken)", icon: Info },
};

export function ForgeActivityFeed({
  events,
  items,
  maxItems = 20,
  className,
}: ForgeActivityFeedProps) {
  const sourceList = events || items || [];
  const displayEvents = sourceList.slice(0, maxItems);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 overflow-y-auto max-h-96 pr-1 font-sans",
        className
      )}
    >
      {displayEvents.length === 0 ? (
        <div className="text-xs text-[var(--color-ink-muted)] italic p-4 text-center">
          No activity to display.
        </div>
      ) : (
        displayEvents.map((event) => {
          const rawSeverity = event.severity || event.type || "info";
          const config = severityConfig[rawSeverity] || severityConfig.info;
          const DefaultIcon = config.icon;
          const displayMessage = event.message || (
            <span>
              {event.title && (
                <strong className="font-semibold text-[var(--color-ink)] mr-1.5">
                  {event.title}:
                </strong>
              )}
              <span className="text-[var(--color-ink-secondary)]">{event.description}</span>
            </span>
          );

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-lg hover:bg-[var(--color-surface-sunken)] p-2 transition-colors duration-[var(--duration-fast)] text-xs"
            >
              <span className="font-mono text-[11px] text-[var(--color-ink-muted)] shrink-0 pt-0.5 w-18 text-right font-medium">
                {event.timestamp}
              </span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-current/20"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                {event.icon ? (
                  <span className="w-3.5 h-3.5 flex items-center">{event.icon}</span>
                ) : (
                  <DefaultIcon size={13} />
                )}
              </div>
              <div className="text-[var(--color-ink)] leading-relaxed pt-0.5 flex-1 min-w-0">
                {displayMessage}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
