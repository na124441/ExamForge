"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { AlertOctagon } from "lucide-react";

export interface ForgeErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  reason: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  preserved?: boolean;
}

export function ForgeError({ title, reason, action, preserved, className, ...props }: ForgeErrorProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--md-sys-color-error-container)] bg-[var(--md-sys-color-error-container)]/50 p-5 font-sans",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-error-container)] flex items-center justify-center shrink-0">
          <AlertOctagon className="h-5 w-5 text-[var(--md-sys-color-error)]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-error-container)]">{title}</h4>
          <p className="mt-1 text-xs text-[var(--md-sys-color-on-error-container)]/90 leading-relaxed">{reason}</p>
          
          <div className="mt-3.5 flex items-center justify-between gap-4">
            {preserved !== undefined && (
              <span className="text-xs font-medium text-[var(--md-sys-color-on-error-container)]/75">
                {preserved ? "Your data has been preserved." : "Data may have been affected."}
              </span>
            )}
            
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="ml-auto inline-flex items-center justify-center rounded-full bg-[var(--md-sys-color-surface-container-lowest)] px-4 py-1.5 text-xs font-semibold text-[var(--md-sys-color-error)] border border-[var(--md-sys-color-error-container)] hover:bg-[var(--md-sys-color-surface-container-high)] shadow-xs transition-colors cursor-pointer"
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
