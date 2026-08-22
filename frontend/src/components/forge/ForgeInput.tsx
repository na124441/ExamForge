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
      <div className="flex flex-col gap-1.5 w-full font-sans">
        {label && (
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leadingIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--md-sys-color-on-surface-variant)]">
              {leadingIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-[var(--md-sys-color-surface)] px-4 py-2 text-sm text-[var(--md-sys-color-on-surface)] transition-all duration-[var(--duration-fast)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-38",
              leadingIcon ? "pl-10" : "",
              trailingIcon ? "pr-10" : "",
              error
                ? "border-[var(--md-sys-color-error)] focus-visible:ring-[var(--md-sys-color-error)] focus-visible:border-[var(--md-sys-color-error)]"
                : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)] focus-visible:border-[var(--md-sys-color-primary)] focus-visible:ring-[var(--md-sys-color-primary)]",
              mono ? "font-mono" : "font-sans",
              className
            )}
            ref={ref}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--md-sys-color-on-surface-variant)]">
              {trailingIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-[var(--md-sys-color-error)]">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
ForgeInput.displayName = "ForgeInput";

export { ForgeInput };
