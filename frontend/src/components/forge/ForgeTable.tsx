"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface ForgeTableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  mono?: boolean;
  render?: (row: T, value?: any) => ReactNode;
}

export interface ForgeTableProps<T> {
  columns: ForgeTableColumn<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  emptyMessage?: string;
  keyField?: string;
  className?: string;
}

export function ForgeTable<T extends Record<string, any>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDir,
  emptyMessage = "No data available.",
  keyField,
  className,
}: ForgeTableProps<T>) {
  return (
    <div className={cn("w-full overflow-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--md-sys-elevation-1)]", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] text-[11px] font-sans font-semibold uppercase tracking-wider select-none">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort && onSort(col.key)}
                className={cn(
                  "px-5 py-3.5",
                  onSort && "cursor-pointer select-none hover:text-[var(--md-sys-color-on-surface)]",
                  col.className
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span>{col.header}</span>
                  {sortKey === col.key && (
                    <span className="text-[var(--md-sys-color-primary)]">
                      {sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-8 text-center text-[var(--md-sys-color-on-surface-variant)] font-sans"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = keyField && row[keyField] ? String(row[keyField]) : rowIndex;
              return (
                <tr
                  key={rowKey}
                  tabIndex={0}
                  className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors duration-[var(--duration-fast)]"
                >
                  {columns.map((col) => {
                    const cellValue = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-5 py-3.5 text-[var(--md-sys-color-on-surface)]",
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
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
