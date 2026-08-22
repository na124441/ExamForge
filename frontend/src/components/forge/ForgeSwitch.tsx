"use client";

import React from "react";
import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export interface ForgeSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function ForgeSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: ForgeSwitchProps) {
  return (
    <div className={cn("flex items-start gap-3 font-sans select-none", className)}>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "peer inline-flex h-[32px] w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-[var(--duration-normal)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-38",
          "data-[state=checked]:bg-[var(--md-sys-color-primary)] data-[state=checked]:border-[var(--md-sys-color-primary)]",
          "data-[state=unchecked]:bg-[var(--md-sys-color-surface-container-highest)] data-[state=unchecked]:border-[var(--md-sys-color-outline)]"
        )}
      >
        <Switch.Thumb
          className={cn(
            "pointer-events-none block h-6 w-6 rounded-full transition-transform duration-[var(--duration-normal)]",
            "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-[var(--md-sys-color-on-primary)] data-[state=checked]:shadow-md",
            "data-[state=unchecked]:translate-x-[2px] data-[state=unchecked]:bg-[var(--md-sys-color-outline)]"
          )}
        />
      </Switch.Root>
      <div className="flex flex-col gap-0.5 pt-0.5">
        <label
          className={cn(
            "text-sm font-medium text-[var(--md-sys-color-on-surface)] leading-snug cursor-pointer",
            disabled && "opacity-38 cursor-not-allowed"
          )}
        >
          {label}
        </label>
        {description && (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
