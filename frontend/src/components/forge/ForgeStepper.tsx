"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { Check, Lock } from "lucide-react";

export interface StepItem {
  id: string | number;
  label: string;
  sublabel?: string;
  status?: "complete" | "current" | "upcoming" | "locked" | "error";
}

export interface ForgeStepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function ForgeStepper({
  steps,
  currentStepIndex,
  onStepClick,
  className,
  orientation = "horizontal",
}: ForgeStepperProps) {
  if (orientation === "vertical") {
    return (
      <div className={cn("flex flex-col gap-0 font-sans", className)}>
        {steps.map((step, idx) => {
          const isComplete = idx < currentStepIndex || step.status === "complete";
          const isCurrent = idx === currentStepIndex || step.status === "current";
          const isLocked = step.status === "locked" || (idx > currentStepIndex && step.status !== "complete");
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4 pb-6 select-none">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[13px] top-7 bottom-0 w-0.5 transition-colors",
                    isComplete ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]"
                  )}
                />
              )}
              <button
                type="button"
                disabled={isLocked || !onStepClick}
                onClick={() => onStepClick && onStepClick(idx)}
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  isComplete && "bg-[var(--color-success)] text-white shadow-xs",
                  isCurrent && "bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent-surface)] shadow-xs",
                  isLocked && "bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink-muted)] cursor-not-allowed",
                  !isComplete && !isCurrent && !isLocked && "bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)]"
                )}
              >
                {isComplete ? <Check size={14} /> : isLocked ? <Lock size={12} /> : idx + 1}
              </button>
              <div className="flex flex-col pt-0.5">
                <span
                  className={cn(
                    "text-xs font-bold leading-tight",
                    isCurrent ? "text-[var(--color-accent)]" : isComplete ? "text-[var(--color-ink)]" : "text-[var(--color-ink-secondary)]"
                  )}
                >
                  {step.label}
                </span>
                {step.sublabel && (
                  <span className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                    {step.sublabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal Stepper with responsive scrollable ribbon
  return (
    <div className={cn("w-full overflow-x-auto no-scrollbar font-sans py-2", className)}>
      <div className="flex items-center min-w-max gap-2 sm:gap-3">
        {steps.map((step, idx) => {
          const isComplete = idx < currentStepIndex || step.status === "complete";
          const isCurrent = idx === currentStepIndex || step.status === "current";
          const isLocked = step.status === "locked" || (idx > currentStepIndex && step.status !== "complete");
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={isLocked || !onStepClick}
                onClick={() => onStepClick && onStepClick(idx)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0",
                  isCurrent
                    ? "bg-[var(--color-accent-surface)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 shadow-xs"
                    : isComplete
                    ? "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20"
                    : "bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink-secondary)] opacity-70",
                  !isLocked && onStepClick ? "cursor-pointer hover:border-[var(--color-border-strong)]" : "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    isComplete
                      ? "bg-[var(--color-success)] text-white"
                      : isCurrent
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]"
                  )}
                >
                  {isComplete ? <Check size={12} /> : isLocked ? <Lock size={10} /> : idx + 1}
                </span>
                <span className="truncate">{step.label}</span>
              </button>

              {!isLast && (
                <div
                  className={cn(
                    "w-4 h-0.5 shrink-0 transition-colors",
                    isComplete ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
