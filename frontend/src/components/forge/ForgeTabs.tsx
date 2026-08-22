"use client";

import React, { ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export interface ForgeTabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
}

export interface ForgeTabsProps {
  tabs: ForgeTabItem[];
  defaultValue?: string;
  className?: string;
  variant?: "primary" | "secondary";
}

export function ForgeTabs({ tabs, defaultValue, className, variant = "primary" }: ForgeTabsProps) {
  return (
    <Tabs.Root
      defaultValue={defaultValue || tabs[0]?.value}
      className={cn("w-full flex flex-col font-sans", className)}
    >
      <Tabs.List
        className={cn(
          "flex w-full overflow-x-auto select-none border-b border-[var(--md-sys-color-outline-variant)]",
          variant === "secondary" && "gap-2 border-b-0 p-1 bg-[var(--md-sys-color-surface-container-low)] rounded-2xl w-fit"
        )}
      >
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "relative px-5 py-3 text-sm font-medium transition-all duration-[var(--duration-fast)] cursor-pointer whitespace-nowrap",
              variant === "primary" && [
                "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]",
                "data-[state=active]:text-[var(--md-sys-color-primary)] data-[state=active]:font-semibold",
                "after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-t-full after:bg-transparent",
                "data-[state=active]:after:bg-[var(--md-sys-color-primary)]",
              ],
              variant === "secondary" && [
                "rounded-xl px-4 py-2 text-xs",
                "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]",
                "data-[state=active]:bg-[var(--md-sys-color-surface-container-lowest)] data-[state=active]:text-[var(--md-sys-color-primary)] data-[state=active]:shadow-[var(--md-sys-elevation-1)] data-[state=active]:font-semibold",
              ]
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.value}
          value={tab.value}
          className="py-4 focus-visible:outline-none"
        >
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
