"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface ForgeMetricGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
}

export const ForgeMetricGrid = React.forwardRef<HTMLDivElement, ForgeMetricGridProps>(
  ({ columns = 4, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-card)]",
          {
            "lg:grid-cols-2": columns === 2,
            "lg:grid-cols-3": columns === 3,
            "lg:grid-cols-4": columns === 4,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ForgeMetricGrid.displayName = "ForgeMetricGrid";
