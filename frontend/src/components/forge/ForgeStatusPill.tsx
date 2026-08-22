"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { cva, type VariantProps } from "class-variance-authority";

const forgeStatusPillVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono select-none",
  {
    variants: {
      status: {
        live: "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20",
        active: "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20",
        verified: "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20",
        success: "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20",
        scheduled: "bg-[var(--color-info-surface)] text-[var(--color-info-text)] border border-[var(--color-info)]/20",
        info: "bg-[var(--color-info-surface)] text-[var(--color-info-text)] border border-[var(--color-info)]/20",
        processing: "bg-[var(--color-info-surface)] text-[var(--color-info-text)] border border-[var(--color-info)]/20",
        warning: "bg-[var(--color-warning-surface)] text-[var(--color-warning-text)] border border-[var(--color-warning)]/20",
        locked: "bg-[var(--color-warning-surface)] text-[var(--color-warning-text)] border border-[var(--color-warning)]/20",
        completed: "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] border border-[var(--color-border)]",
        draft: "bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] border border-[var(--color-border)]",
        failed: "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20",
        danger: "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20",
        offline: "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

export interface ForgeStatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  status?:
    | "live"
    | "active"
    | "verified"
    | "success"
    | "scheduled"
    | "info"
    | "processing"
    | "warning"
    | "locked"
    | "completed"
    | "draft"
    | "failed"
    | "danger"
    | "offline";
  variant?:
    | "live"
    | "active"
    | "verified"
    | "success"
    | "scheduled"
    | "info"
    | "processing"
    | "warning"
    | "locked"
    | "completed"
    | "draft"
    | "failed"
    | "danger"
    | "offline";
  dot?: boolean;
}

export const ForgeStatusPill = React.forwardRef<HTMLDivElement, ForgeStatusPillProps>(
  ({ status, variant, dot = true, className, children, ...props }, ref) => {
    const activeKey = (variant || status || "draft") as NonNullable<ForgeStatusPillProps["status"]>;

    return (
      <div
        ref={ref}
        className={cn(forgeStatusPillVariants({ status: activeKey }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              (activeKey === "live" || activeKey === "active" || activeKey === "verified" || activeKey === "success") &&
                "bg-[var(--color-success)] animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.6)]",
              (activeKey === "scheduled" || activeKey === "info" || activeKey === "processing") &&
                "bg-[var(--color-info)]",
              (activeKey === "warning" || activeKey === "locked") &&
                "bg-[var(--color-warning)]",
              activeKey === "completed" && "bg-[var(--color-ink-muted)]",
              activeKey === "draft" && "bg-[var(--color-ink-disabled)]",
              (activeKey === "failed" || activeKey === "danger" || activeKey === "offline") &&
                "bg-[var(--color-danger)]"
            )}
          />
        )}
        {children || activeKey}
      </div>
    );
  }
);
ForgeStatusPill.displayName = "ForgeStatusPill";
