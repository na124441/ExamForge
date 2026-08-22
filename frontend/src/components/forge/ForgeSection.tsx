"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface ForgeSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const ForgeSection = React.forwardRef<HTMLDivElement, ForgeSectionProps>(
  ({ title, subtitle, action, children, className, ...props }, ref) => {
    return (
      <section ref={ref} className={cn("flex flex-col gap-6 font-sans", className)} {...props}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] leading-tight tracking-tight ef-heading-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] mt-1 ef-body-sm">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
        </div>
        <div>
          {children}
        </div>
      </section>
    );
  }
);
ForgeSection.displayName = "ForgeSection";
