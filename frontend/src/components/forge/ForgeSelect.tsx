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
}

export function ForgeSelect({
  options,
  value,
  onValueChange,
  onChange,
  placeholder = "Select...",
  label,
  className,
}: ForgeSelectProps) {
  const handleValueChange = (val: string) => {
    if (onValueChange) onValueChange(val);
    if (onChange) onChange(val);
  };

  return (
    <div className={cn("flex flex-col gap-1.5 font-sans w-full", className)}>
      {label && (
        <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] tracking-wide">
          {label}
        </label>
      )}
      <Select.Root value={value} onValueChange={handleValueChange}>
        <Select.Trigger
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl",
            "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] px-4 py-2 text-sm",
            "text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-[var(--md-sys-color-primary)]",
            "disabled:cursor-not-allowed disabled:opacity-38 transition-all duration-[var(--duration-fast)] cursor-pointer"
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-60 text-[var(--md-sys-color-on-surface-variant)]" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className={cn(
              "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-2xl",
              "border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] shadow-[var(--md-sys-elevation-3)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
            position="popper"
            sideOffset={6}
          >
            <Select.Viewport className="p-1.5">
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-xl py-2 pl-9 pr-3 text-sm outline-none transition-colors duration-[var(--duration-fast)]",
                    "focus:bg-[var(--md-sys-color-secondary-container)] focus:text-[var(--md-sys-color-on-secondary-container)]",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-38"
                  )}
                >
                  <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
                    <Select.ItemIndicator>
                      <Check className="h-4 w-4 text-[var(--md-sys-color-primary)]" />
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
