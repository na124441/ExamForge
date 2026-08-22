"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ForgeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mono?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const ForgeInput = React.forwardRef<HTMLInputElement, ForgeInputProps>(
  ({ className, label, error, helperText, mono, leadingIcon, trailingIcon, type, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full font-sans select-none">
        {label && (
          <label className="text-xs font-semibold text-[var(--color-ink-secondary)] tracking-wide font-mono uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leadingIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--color-ink-muted)]">
              {leadingIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-[var(--color-surface-sunken)] px-3.5 py-2 text-sm text-[var(--color-ink)] transition-all duration-[var(--duration-fast)] placeholder:text-[var(--color-ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:bg-[var(--color-surface-raised)] disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs",
              leadingIcon ? "pl-10" : "",
              trailingIcon ? "pr-10" : "",
              error
                ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)] focus-visible:border-[var(--color-danger)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus-visible:border-[var(--color-accent)] focus-visible:ring-[var(--color-accent)]",
              mono ? "font-mono" : "font-sans",
              className
            )}
            ref={ref}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--color-ink-muted)]">
              {trailingIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-[var(--color-danger-text)]">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-[var(--color-ink-muted)]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
ForgeInput.displayName = "ForgeInput";

export { ForgeInput };
