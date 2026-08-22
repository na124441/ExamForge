"use client";

import React from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ForgeSelectOption {
  value: string;
  label: string;
}

export interface ForgeSelectProps {
  options: ForgeSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ForgeSelect({
  options,
  value,
  onValueChange,
  onChange,
  placeholder = "Select option...",
  label,
  className,
  disabled,
}: ForgeSelectProps) {
  const handleValueChange = (val: string) => {
    if (onValueChange) onValueChange(val);
    if (onChange) onChange(val);
  };

  return (
    <div className={cn("flex flex-col gap-1.5 font-sans w-full select-none", className)}>
      {label && (
        <label className="text-xs font-semibold text-[var(--color-ink-secondary)] tracking-wide font-mono uppercase">
          {label}
        </label>
      )}
      <Select.Root value={value} onValueChange={handleValueChange} disabled={disabled}>
        <Select.Trigger
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl",
            "bg-[var(--color-surface-sunken)] border border-[var(--color-border)] px-3.5 py-2 text-sm",
            "text-[var(--color-ink)] hover:border-[var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface-raised)]",
            "disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-[var(--duration-fast)] cursor-pointer shadow-2xs"
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <ChevronDown className="h-4 w-4 text-[var(--color-ink-muted)] shrink-0" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className={cn(
              "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-[var(--color-border)]",
              "bg-[var(--color-surface-raised)] p-1.5 text-[var(--color-ink)] shadow-xl animate-in fade-in-80",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 duration-[var(--duration-fast)]"
            )}
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-xs font-medium outline-none",
                    "text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] focus:bg-[var(--color-accent-surface)] focus:text-[var(--color-accent)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Select.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
