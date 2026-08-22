"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertCircle } from "lucide-react";

export interface ForgeFormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  badge?: string;
}

export function ForgeFormField({
  label,
  required,
  helperText,
  error,
  children,
  className,
  htmlFor,
  badge,
}: ForgeFormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full font-sans select-none", className)}>
      {/* Level 5: Field Label */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-[var(--color-ink-secondary)] tracking-wide uppercase font-mono"
        >
          {label} {required && <span className="text-[var(--color-danger)] font-bold">*</span>}
        </label>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink-muted)]">
            {badge}
          </span>
        )}
      </div>

      {/* Input Control Slot */}
      <div className="relative w-full">
        {children}
      </div>

      {/* Level 6: Helper Text & Validation Error */}
      {error ? (
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-danger-text)] mt-0.5 animate-in fade-in">
          <AlertCircle size={13} className="text-[var(--color-danger)] shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--color-ink-muted)] leading-normal mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
