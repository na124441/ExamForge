"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Info, AlertTriangle } from "lucide-react";

export interface ForgeContextualHintProps extends React.HTMLAttributes<HTMLDivElement> {
  severity: "info" | "warning";
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function ForgeContextualHint({ severity, title, description, action, className, ...props }: ForgeContextualHintProps) {
  const isWarning = severity === "warning";
  const Icon = isWarning ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        "flex gap-3.5 p-4 font-sans rounded-2xl border transition-colors",
        isWarning
          ? "bg-[var(--md-sys-color-warning-container)]/40 border-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]"
          : "bg-[var(--md-sys-color-info-container)]/40 border-[var(--md-sys-color-info-container)] text-[var(--md-sys-color-on-info-container)]",
        className
      )}
      {...props}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className={cn("h-5 w-5", isWarning ? "text-[var(--md-sys-color-warning)]" : "text-[var(--md-sys-color-info)]")} />
      </div>
      <div className="flex-1">
        <h5 className="text-sm font-semibold leading-snug">{title}</h5>
        <p className="mt-1 text-xs leading-relaxed opacity-90">{description}</p>
        {action && (
          <a
            href={action.href}
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline",
              isWarning ? "text-[var(--md-sys-color-warning)]" : "text-[var(--md-sys-color-primary)]"
            )}
          >
            <span>{action.label}</span>
            <span>&rarr;</span>
          </a>
        )}
      </div>
    </div>
  );
}
