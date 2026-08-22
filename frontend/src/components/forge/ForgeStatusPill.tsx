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
        scheduled: "bg-[var(--color-info-surface)] text-[var(--color-info-text)] border border-[var(--color-info)]/20",
        completed: "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] border border-[var(--color-border)]",
        draft: "bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] border border-[var(--color-border)]",
        locked: "bg-[var(--color-warning-surface)] text-[var(--color-warning-text)] border border-[var(--color-warning)]/20",
        processing: "bg-[var(--color-info-surface)] text-[var(--color-info-text)] border border-[var(--color-info)]/20",
        failed: "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20",
        verified: "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20",
        active: "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20",
        offline: "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

export interface ForgeStatusPillProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof forgeStatusPillVariants> {
  status:
    | "live"
    | "scheduled"
    | "completed"
    | "draft"
    | "locked"
    | "processing"
    | "failed"
    | "verified"
    | "active"
    | "offline";
}

export const ForgeStatusPill = React.forwardRef<HTMLDivElement, ForgeStatusPillProps>(
  ({ status, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(forgeStatusPillVariants({ status }), className)}
        {...props}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            status === "live" && "bg-[var(--color-success)] animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.6)]",
            status === "scheduled" && "bg-[var(--color-info)]",
            status === "completed" && "bg-[var(--color-ink-muted)]",
            status === "draft" && "bg-[var(--color-ink-disabled)]",
            status === "locked" && "bg-[var(--color-warning)]",
            status === "processing" && "bg-[var(--color-info)] animate-spin",
            status === "failed" && "bg-[var(--color-danger)]",
            status === "verified" && "bg-[var(--color-success)]",
            status === "active" && "bg-[var(--color-success)]",
            status === "offline" && "bg-[var(--color-danger)]"
          )}
        />
        <span>{status}</span>
      </div>
    );
  }
);
ForgeStatusPill.displayName = "ForgeStatusPill";
