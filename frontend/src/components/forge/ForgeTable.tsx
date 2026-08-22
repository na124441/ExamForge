"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";

export interface ForgeTableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  mono?: boolean;
  render?: (row: T, value?: any) => ReactNode;
  /** Whether this column represents the primary title/entity on mobile cards */
  isPrimary?: boolean;
  /** Hide this column on mobile card summary if redundant */
  hideOnMobile?: boolean;
}

export interface ForgeTableProps<T> {
  columns: ForgeTableColumn<T>[];
  data: T[];
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  emptyMessage?: string;
  keyField?: string;
  className?: string;
  /** Custom mobile card renderer if specialized layout is needed */
  renderMobileCard?: (row: T, rowIndex: number) => ReactNode;
  /** Force tabular view on mobile if horizontal scrolling is explicitly desired */
  forceTableOnMobile?: boolean;
}

export function ForgeTable<T extends Record<string, any>>({
  columns,
  data,
  onSort,
  onRowClick,
  sortKey,
  sortDir,
  emptyMessage = "No data available.",
  keyField,
  className,
  renderMobileCard,
  forceTableOnMobile = false,
}: ForgeTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn("w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center text-xs text-[var(--color-ink-muted)] font-sans shadow-xs", className)}>
        {emptyMessage}
      </div>
    );
  }

  const primaryCol = columns.find(c => c.isPrimary) || columns[0];
  const secondaryCols = columns.filter(c => c.key !== primaryCol.key && !c.hideOnMobile);

  return (
    <div className={cn("w-full font-sans", className)}>
      
      {/* 1. MOBILE ADAPTIVE CARD VIEW (< 640px) */}
      {!forceTableOnMobile && (
        <div className="flex flex-col gap-2.5 sm:hidden">
          {data.map((row, rowIndex) => {
            const rowKey = keyField && row[keyField] ? String(row[keyField]) : rowIndex;

            if (renderMobileCard) {
              return (
                <div 
                  key={rowKey} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {renderMobileCard(row, rowIndex)}
                </div>
              );
            }

            const primaryValue = row[primaryCol.key];
            const primaryContent = primaryCol.render ? primaryCol.render(row, primaryValue) : primaryValue;

            return (
              <div
                key={rowKey}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  "p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-3 transition-colors duration-[var(--duration-fast)]",
                  onRowClick && "cursor-pointer hover:bg-[var(--color-surface-sunken)] active:scale-[0.99]"
                )}
              >
                {/* Mobile Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-2.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-ink-muted)] tracking-wider block">
                      {primaryCol.header}
                    </span>
                    <div className="font-bold text-sm text-[var(--color-ink)] mt-0.5 break-words">
                      {primaryContent}
                    </div>
                  </div>
                  {onRowClick && (
                    <ChevronRight className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-1" />
                  )}
                </div>

                {/* Mobile Card Key-Value Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {secondaryCols.map((col) => {
                    const val = row[col.key];
                    const content = col.render ? col.render(row, val) : val;
                    return (
                      <div key={col.key} className="space-y-0.5">
                        <span className="text-[10px] text-[var(--color-ink-muted)] font-medium block uppercase tracking-wider">
                          {col.header}
                        </span>
                        <div className={cn("text-[var(--color-ink)]", col.mono ? "font-mono text-xs" : "font-sans")}>
                          {content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DESKTOP & TABLET TABULAR LEDGER (>= 640px) */}
      <div className={cn(
        "overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-xs",
        !forceTableOnMobile && "hidden sm:block"
      )}>
        <table className="w-full text-xs sm:text-sm text-left">
          <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[var(--color-ink-muted)] text-[11px] font-sans font-semibold uppercase tracking-wider select-none sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort && onSort(col.key)}
                  className={cn(
                    "px-4 sm:px-5 py-3",
                    onSort && "cursor-pointer select-none hover:text-[var(--color-ink)]",
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {sortKey === col.key && (
                      <span className="text-[var(--color-accent)]">
                        {sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {data.map((row, rowIndex) => {
              const rowKey = keyField && row[keyField] ? String(row[keyField]) : rowIndex;
              return (
                <tr
                  key={rowKey}
                  tabIndex={0}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "hover:bg-[var(--color-surface-sunken)] transition-colors duration-[var(--duration-fast)]",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => {
                    const cellValue = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 sm:px-5 py-3 text-[var(--color-ink)]",
                          col.mono ? "font-mono text-xs" : "font-sans",
                          col.className
                        )}
                      >
                        {col.render ? col.render(row, cellValue) : cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
