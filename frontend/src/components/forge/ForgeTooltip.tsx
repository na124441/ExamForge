"use client";

import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export const ForgeTooltipProvider = Tooltip.Provider;

export interface ForgeTooltipProps extends Tooltip.TooltipProps {
  children: React.ReactNode;
}

export function ForgeTooltip({ children, ...props }: ForgeTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root {...props}>{children}</Tooltip.Root>
    </Tooltip.Provider>
  );
}

export const ForgeTooltipTrigger = Tooltip.Trigger;

export const ForgeTooltipContent = React.forwardRef<
  HTMLDivElement,
  Tooltip.TooltipContentProps
>(({ className, sideOffset = 6, ...props }, ref) => (
  <Tooltip.Portal>
    <Tooltip.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-lg bg-[var(--md-sys-color-inverse-surface)] px-3 py-1.5",
        "text-xs font-medium text-[var(--md-sys-color-inverse-on-surface)] font-sans shadow-[var(--md-sys-elevation-2)]",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    />
  </Tooltip.Portal>
));
ForgeTooltipContent.displayName = Tooltip.Content.displayName;
