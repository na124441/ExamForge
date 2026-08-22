"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ForgeSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "metric" | "table-row" | "card" | "block";
}

export function ForgeSkeleton({ variant = "text", className, ...props }: ForgeSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] rounded-xl",
        {
          "h-4 w-3/4 rounded-md": variant === "text",
          "h-14 w-28 rounded-xl": variant === "metric",
          "h-11 w-full rounded-lg": variant === "table-row",
          "h-40 w-full rounded-2xl": variant === "card",
          "h-32 w-full rounded-2xl": variant === "block",
        },
        className
      )}
      {...props}
    />
  );
}

export function ForgeTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 space-y-3 font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
        <ForgeSkeleton variant="text" className="w-32 h-5" />
        <ForgeSkeleton variant="text" className="w-20 h-5" />
      </div>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-2">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <ForgeSkeleton key={cIdx} variant="text" className={cIdx === 0 ? "w-1/3" : "w-1/6"} />
          ))}
        </div>
      ))}
    </div>
  );
}
