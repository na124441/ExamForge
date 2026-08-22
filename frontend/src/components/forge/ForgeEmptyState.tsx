"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { LucideIcon } from "lucide-react";

export interface ForgeEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const ForgeEmptyState = React.forwardRef<HTMLDivElement, ForgeEmptyStateProps>(
  ({ icon: Icon, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center min-h-[220px] p-8 text-center rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-dashed border-[var(--md-sys-color-outline-variant)]",
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] mb-3">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] m3-title-sm">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5 max-w-[320px] leading-relaxed">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);
ForgeEmptyState.displayName = "ForgeEmptyState";
