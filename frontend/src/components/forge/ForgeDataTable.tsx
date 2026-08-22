"use client";

import React, { useState, useMemo, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  CheckSquare,
  Square,
  Sparkles
} from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  mono?: boolean;
  className?: string;
  render?: (row: T, value: any) => ReactNode;
}

export interface DataTableBulkAction<T> {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "danger" | "secondary";
  onClick: (selectedRows: T[]) => void;
}

export interface ForgeDataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyField: keyof T;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilterFields?: (keyof T)[];
  bulkActions?: DataTableBulkAction<T>[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyState?: ReactNode;
  className?: string;
}

export function ForgeDataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  searchable = true,
  searchPlaceholder = "Filter records...",
  searchFilterFields,
  bulkActions = [],
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  emptyState,
  className,
}: ForgeDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedKeys, setSelectedKeys] = useState<Set<any>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchFilterFields && searchFilterFields.length > 0) {
        return searchFilterFields.some((field) => {
          const val = row[field];
          return val ? String(val).toLowerCase().includes(term) : false;
        });
      }
      return Object.values(row).some((val) =>
        val ? String(val).toLowerCase().includes(term) : false
      );
    });
  }, [data, searchTerm, searchFilterFields]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Selection
  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedKeys.has(row[keyField]));

  const toggleSelectAll = () => {
    const newSet = new Set(selectedKeys);
    if (allCurrentPageSelected) {
      paginatedData.forEach((row) => newSet.delete(row[keyField]));
    } else {
      paginatedData.forEach((row) => newSet.add(row[keyField]));
    }
    setSelectedKeys(newSet);
  };

  const toggleSelectRow = (key: any) => {
    const newSet = new Set(selectedKeys);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedKeys(newSet);
  };

  const selectedRowObjects = useMemo(() => {
    return data.filter((row) => selectedKeys.has(row[keyField]));
  }, [data, selectedKeys, keyField]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 font-sans w-full", className)}>
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-surface-raised)] p-3 rounded-xl border border-[var(--color-border)] shadow-xs">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--color-border-focus)] focus:bg-[var(--color-surface-raised)] transition-all"
            />
          </div>
        )}

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Density Toggle */}
          <button
            type="button"
            onClick={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors flex items-center gap-1.5"
            title="Toggle Density"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline capitalize">{density}</span>
          </button>

          {/* Page Size Select */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-xs text-[var(--color-ink-secondary)] focus:outline-none focus:border-[var(--color-border-focus)]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedKeys.size > 0 && bulkActions.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] animate-slide-up shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-[10px]">
              {selectedKeys.size}
            </span>
            <span>records selected</span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => action.onClick(selectedRowObjects)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs",
                  action.variant === "danger"
                    ? "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]"
                    : action.variant === "secondary"
                    ? "bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                    : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                )}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table Surface */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[11px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider select-none sticky top-0 z-10">
            <tr>
              {bulkActions.length > 0 && (
                <th className="w-10 px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-[var(--color-accent)]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={cn(
                    "px-4 py-3 font-semibold",
                    col.sortable !== false && "cursor-pointer hover:text-[var(--color-ink)]",
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="text-[var(--color-ink-muted)]">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                  className="p-8 text-center text-[var(--color-ink-muted)] font-sans text-xs"
                >
                  {emptyState || "No matching records found."}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const key = row[keyField];
                const isSelected = selectedKeys.has(key);

                return (
                  <tr
                    key={String(key) || idx}
                    className={cn(
                      "transition-colors",
                      isSelected
                        ? "bg-[var(--color-accent-surface)]/40"
                        : "hover:bg-[var(--color-surface-sunken)]"
                    )}
                  >
                    {bulkActions.length > 0 && (
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(key)}
                          className="flex items-center text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[var(--color-accent)]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}

                    {columns.map((col) => {
                      const val = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            density === "compact" ? "py-2 px-4 text-xs" : "py-3.5 px-4 text-xs",
                            "text-[var(--color-ink)]",
                            col.mono ? "font-mono" : "font-sans",
                            col.className
                          )}
                        >
                          {col.render ? col.render(row, val) : val}
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

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-ink-secondary)] px-1">
        <div className="font-mono">
          Showing {Math.min((page - 1) * pageSize + 1, sortedData.length)}–
          {Math.min(page * pageSize, sortedData.length)} of {sortedData.length} entries
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-mono font-semibold text-[var(--color-ink)]">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
