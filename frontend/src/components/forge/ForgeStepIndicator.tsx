"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

export type StepStatus = "completed" | "current" | "pending";

export interface Step {
  label: string;
  status: StepStatus;
}

export interface ForgeStepIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
}

export function ForgeStepIndicator({ steps, className, ...props }: ForgeStepIndicatorProps) {
  return (
    <div className={cn("flex items-center font-sans overflow-x-auto py-2", className)} {...props}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <React.Fragment key={step.label}>
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-[var(--duration-fast)]",
                  step.status === "completed" && "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs",
                  step.status === "current" && "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-2 ring-[var(--md-sys-color-primary)]",
                  step.status === "pending" && "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  step.status === "completed" || step.status === "current"
                    ? "text-[var(--md-sys-color-on-surface)] font-semibold"
                    : "text-[var(--md-sys-color-on-surface-variant)]"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-3 h-0.5 w-8 rounded-full shrink-0",
                  step.status === "completed" ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline-variant)]"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
