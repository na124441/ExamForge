"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { cva, type VariantProps } from "class-variance-authority";

const forgeStatusPillVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider font-sans select-none",
  {
    variants: {
      status: {
        live: "bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]",
        scheduled: "bg-[var(--md-sys-color-info-container)] text-[var(--md-sys-color-on-info-container)]",
        completed: "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
        draft: "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]",
        locked: "bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]",
        processing: "bg-[var(--md-sys-color-info-container)] text-[var(--md-sys-color-on-info-container)]",
        failed: "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]",
        verified: "bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]",
        active: "bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]",
        offline: "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]",
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
            "w-1.5 h-1.5 rounded-full bg-current shrink-0",
            status === "live" && "animate-pulse"
          )}
        />
        <span>{status}</span>
      </div>
    );
  }
);
ForgeStatusPill.displayName = "ForgeStatusPill";
