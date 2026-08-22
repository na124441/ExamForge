"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface ForgePageHeaderProps {
  /** Breadcrumb items for Level 0 navigation context */
  breadcrumbs?: BreadcrumbItem[];
  /** Level 1 dominant page title */
  title: string;
  /** Level 2 concise page description */
  description?: string;
  /** Primary and secondary action buttons */
  actions?: ReactNode;
  /** Optional status badge, pill, or live state indicator */
  status?: ReactNode;
  className?: string;
}

export function ForgePageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  status,
  className,
}: ForgePageHeaderProps) {
  return (
    <header className={cn("w-full space-y-4 pb-6 border-b border-[var(--color-border)] font-sans select-none", className)}>
      {/* Level 0: Breadcrumbs / Context */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-ink-muted)]">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight size={12} className="text-[var(--color-ink-muted)] shrink-0 opacity-60" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[var(--color-ink)] transition-colors underline-offset-4 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast ? "font-semibold text-[var(--color-ink)]" : "")}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Level 1 & 2: Title, Description, and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-ink)] tracking-tight font-sans">
              {title}
            </h1>
            {status && <div className="shrink-0">{status}</div>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed font-sans max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Action Controls */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:self-center">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
