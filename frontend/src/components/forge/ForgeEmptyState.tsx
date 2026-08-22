"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { LucideIcon, Inbox } from "lucide-react";

export interface ForgeEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const ForgeEmptyState = React.forwardRef<HTMLDivElement, ForgeEmptyStateProps>(
  ({ icon: Icon = Inbox, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center min-h-[220px] p-8 text-center rounded-2xl bg-[var(--color-surface-sunken)] border border-dashed border-[var(--color-border)] select-none font-sans shadow-2xs",
          className
        )}
        {...props}
      >
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] mb-3.5 shadow-2xs">
          <Icon className="w-6 h-6 text-[var(--color-accent)]" />
        </div>
        <h3 className="text-sm font-bold text-[var(--color-ink)] font-sans">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[var(--color-ink-secondary)] mt-1.5 max-w-sm leading-relaxed font-sans">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);
ForgeEmptyState.displayName = "ForgeEmptyState";
