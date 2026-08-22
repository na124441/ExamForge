"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

export interface ForgeAuditEventProps {
  eventId: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: "PASS" | "FAIL" | "WARNING";
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  links?: { label: string; href: string }[];
  className?: string;
}

const riskConfig = {
  LOW: { color: "var(--md-sys-color-info)", icon: Info },
  MEDIUM: { color: "var(--md-sys-color-warning)", icon: AlertTriangle },
  HIGH: { color: "var(--md-sys-color-error)", icon: AlertCircle },
  CRITICAL: { color: "var(--md-sys-color-error)", icon: AlertCircle },
};

const resultConfig = {
  PASS: { color: "var(--md-sys-color-success)", icon: CheckCircle },
  FAIL: { color: "var(--md-sys-color-error)", icon: AlertCircle },
  WARNING: { color: "var(--md-sys-color-warning)", icon: AlertTriangle },
};

export function ForgeAuditEvent({
  eventId,
  timestamp,
  actor,
  action,
  target,
  result,
  risk,
  links,
  className,
}: ForgeAuditEventProps) {
  const RiskIcon = riskConfig[risk].icon;
  const ResultIcon = resultConfig[result].icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 font-sans text-sm shadow-[var(--md-sys-elevation-1)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Event ID</span>
          <span className="font-mono text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
            {eventId}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Timestamp</span>
          <span className="font-mono text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {timestamp}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Actor</dt>
          <dd className="font-medium text-[var(--md-sys-color-on-surface)]">{actor}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Action</dt>
          <dd className="font-medium text-[var(--md-sys-color-on-surface)]">{action}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Target</dt>
          <dd className="font-medium text-[var(--md-sys-color-on-surface)]">{target}</dd>
        </div>

        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Result</dt>
          <dd className="flex items-center gap-1.5 font-semibold">
            <ResultIcon size={14} style={{ color: resultConfig[result].color }} />
            <span style={{ color: resultConfig[result].color }}>{result}</span>
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Risk</dt>
          <dd className="flex items-center gap-1.5 font-semibold">
            <RiskIcon size={14} style={{ color: riskConfig[risk].color }} />
            <span style={{ color: riskConfig[risk].color }}>{risk}</span>
          </dd>
        </div>
      </dl>

      {links && links.length > 0 && (
        <div className="flex gap-3 pt-2">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] rounded-full px-2 py-1 bg-[var(--md-sys-color-primary-container)]/30"
            >
              {link.label} &rarr;
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
