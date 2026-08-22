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
  info: { color: "var(--md-sys-color-info)", bg: "var(--md-sys-color-info-container)", icon: Info },
  warning: { color: "var(--md-sys-color-warning)", bg: "var(--md-sys-color-warning-container)", icon: AlertTriangle },
  danger: { color: "var(--md-sys-color-error)", bg: "var(--md-sys-color-error-container)", icon: AlertCircle },
  error: { color: "var(--md-sys-color-error)", bg: "var(--md-sys-color-error-container)", icon: AlertCircle },
  success: { color: "var(--md-sys-color-success)", bg: "var(--md-sys-color-success-container)", icon: CheckCircle },
  default: { color: "var(--md-sys-color-on-surface-variant)", bg: "var(--md-sys-color-surface-container-high)", icon: Info },
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
        "flex flex-col gap-2 overflow-y-auto max-h-96 pr-1 font-sans",
        className
      )}
    >
      {displayEvents.length === 0 ? (
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic p-4 text-center">
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
                <strong className="font-semibold text-[var(--md-sys-color-on-surface)] mr-1.5">
                  {event.title}:
                </strong>
              )}
              <span className="text-[var(--md-sys-color-on-surface-variant)]">{event.description}</span>
            </span>
          );

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] p-2 transition-colors duration-[var(--duration-fast)] text-xs"
            >
              <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] shrink-0 pt-0.5 w-18 text-right font-medium">
                {event.timestamp}
              </span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                {event.icon ? (
                  <span className="w-3.5 h-3.5 flex items-center">{event.icon}</span>
                ) : (
                  <DefaultIcon size={14} />
                )}
              </div>
              <div className="text-[var(--md-sys-color-on-surface)] leading-relaxed pt-0.5 flex-1 min-w-0">
                {displayMessage}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
