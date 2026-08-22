"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ForgeSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "metric" | "table-row" | "block";
}

export function ForgeSkeleton({ variant = "text", className, ...props }: ForgeSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--md-sys-color-surface-container-high)] rounded-xl",
        {
          "h-4 w-3/4": variant === "text",
          "h-12 w-24": variant === "metric",
          "h-10 w-full": variant === "table-row",
          "h-32 w-full rounded-2xl": variant === "block",
        },
        className
      )}
      {...props}
    />
  );
}
