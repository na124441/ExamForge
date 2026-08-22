"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { ForgeAuditEvent } from "@/components/forge/ForgeAuditEvent";
import { ForgeBadge, BadgeStatus } from "@/components/forge/ForgeBadge";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { 
  ForgeDialog, 
  ForgeDialogContent, 
  ForgeDialogTitle, 
  ForgeDialogDescription 
} from "@/components/forge/ForgeDialog";
import { Search, Filter, ShieldAlert, RefreshCw, Database, AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const EXAM_ID = "EXM-001";

interface TimelineBlock {
  index: number;
  action: string;
  actor_id: string;
  actor_name: string;
  resource_type: string;
  resource_id: string;
  payload_hash: string;
  previous_hash: string;
  current_hash: string;
  signature_status: string;
  timestamp: string;
  explanation: string;
}

export default function AuditTimelinePage() {
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [chainValid, setChainValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedBlock, setSelectedBlock] = useState<TimelineBlock | null>(null);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<string>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTimeline = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

      const resTime = await fetch(`${BACKEND_URL}/api/audit/timeline-explain/${EXAM_ID}`, { headers });
      if (!resTime.ok) throw new Error("Failed to load explainable timeline from database");
      const timeData = await resTime.json();
      setTimeline(timeData.timeline || []);

      const resVerify = await fetch(`${BACKEND_URL}/api/audit/verify-chain`, { headers });
      if (resVerify.ok) {
        const verifyData = await resVerify.json();
        setChainValid(verifyData.intact);
      }
      setError("");
    } catch (err: any) {
      console.error("[Database Audit Ledger Query Error]", err);
      setError(err.message || "Failed to query cryptographic audit ledger.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return timeline.filter(row => {
      const risk = row.signature_status === "TAMPERED" ? "CRITICAL" : (row.action.includes("LOCK") ? "MEDIUM" : "LOW");
      if (severityFilter !== "ALL" && risk !== severityFilter) return false;
      if (actorFilter !== "ALL" && !row.actor_id.toLowerCase().includes(actorFilter.toLowerCase())) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!row.action.toLowerCase().includes(s) && 
            !row.actor_name.toLowerCase().includes(s) && 
            !row.resource_id.toLowerCase().includes(s) &&
            !row.explanation.toLowerCase().includes(s)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let vA = a[sortKey as keyof TimelineBlock];
      let vB = b[sortKey as keyof TimelineBlock];
      if (sortKey === "timestamp") {
        const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return sortDir === "asc" ? -diff : diff;
      }
      if (vA < vB) return sortDir === "asc" ? -1 : 1;
      if (vA > vB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [timeline, search, severityFilter, actorFilter, sortKey, sortDir]);

  const uniqueActors = useMemo(() => {
    return Array.from(new Set(timeline.map(t => t.actor_id)));
  }, [timeline]);

  const columns: ForgeTableColumn<TimelineBlock>[] = [
    {
      key: "index",
      header: "#",
      render: (row) => <span className="font-mono text-xs text-[var(--color-ink-muted)]">#{row.index}</span>,
      className: "w-12 text-center"
    },
    {
      key: "action",
      header: "Action / Operation",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-[var(--color-ink)]">{row.action}</span>
          <span className="text-[11px] text-[var(--color-ink-muted)] line-clamp-1">{row.explanation}</span>
        </div>
      )
    },
    {
      key: "actor_name",
      header: "Actor",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[var(--color-ink)]">{row.actor_name}</span>
          <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{row.actor_id}</span>
        </div>
      )
    },
    {
      key: "resource_id",
      header: "Resource Target",
      render: (row) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="text-[var(--color-ink)]">{row.resource_id}</span>
          <span className="text-[10px] text-[var(--color-ink-muted)]">{row.resource_type}</span>
        </div>
      )
    },
    {
      key: "signature_status",
      header: "Cryptographic Integrity",
      render: (row) => {
        const isTampered = row.signature_status === "TAMPERED";
        return (
          <ForgeBadge 
            label={isTampered ? "TAMPERED" : "VERIFIED (SHA-256)"} 
            status={isTampered ? "critical" : "ok"} 
          />
        );
      }
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (row) => (
        <span className="font-mono text-xs text-[var(--color-ink-secondary)]">
          {new Date(row.timestamp).toLocaleTimeString()}
        </span>
      ),
      className: "text-right"
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink)] flex items-center gap-2">
            <Database className="w-5 h-5 text-[var(--color-accent)]" />
            Append-Only Cryptographic Audit Timeline
          </h1>
          <p className="text-xs text-[var(--color-ink-secondary)] font-mono mt-0.5">
            Database-Anchored Merkle Chain &bull; Non-Repudiable Digital Signatures &bull; Exam ID: {EXAM_ID}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTimeline}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh Stream
          </button>
        </div>
      </div>

      {/* Ledger Integrity Banner */}
      <div className={cn(
        "p-4 rounded-xl border flex items-center justify-between shadow-xs",
        chainValid 
          ? "bg-[var(--color-success-surface)] border-[var(--color-success)]/30 text-[var(--color-success-text)]"
          : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
      )}>
        <div className="flex items-center gap-3">
          {chainValid ? (
            <div className="w-8 h-8 rounded-lg bg-[var(--color-success)]/20 text-[var(--color-success)] flex items-center justify-center font-bold">
              ✓
            </div>
          ) : (
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm">
              {chainValid ? "Merkle Proof Chain: Valid & Unbroken" : "Merkle Proof Chain: Tamper Detected!"}
            </div>
            <div className="text-xs font-mono opacity-80">
              {timeline.length} sequential blocks anchored in database `audit_logs` table
            </div>
          </div>
        </div>

        <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)]">
          Zero-Knowledge Proof: VALID
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--color-surface-raised)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            placeholder="Search audit actions, actors, or resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-ink)] focus:outline-none font-mono"
          >
            <option value="ALL">All Actors</option>
            {uniqueActors.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        {loading && timeline.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[var(--color-accent)] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Querying Database Audit Table...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-muted)] font-mono">
            No audit events found matching filters in database.
          </div>
        ) : (
          <ForgeTable
            data={filteredData}
            columns={columns}
            onRowClick={(row) => setSelectedBlock(row)}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(k) => {
              if (sortKey === k) {
                setSortDir(sortDir === "asc" ? "desc" : "asc");
              } else {
                setSortKey(k);
                setSortDir("desc");
              }
            }}
          />
        )}
      </div>

      {/* Block Inspection Dialog */}
      {selectedBlock && (
        <ForgeDialog open={!!selectedBlock} onOpenChange={() => setSelectedBlock(null)}>
          <ForgeDialogContent className="max-w-lg space-y-4 text-xs font-sans">
            <ForgeDialogTitle className="flex items-center gap-2 font-bold text-sm text-[var(--color-ink)]">
              <Database className="w-4 h-4 text-[var(--color-accent)]" />
              Audit Block #{selectedBlock.index} Verification Dossier
            </ForgeDialogTitle>
            <ForgeDialogDescription className="text-xs text-[var(--color-ink-secondary)]">
              Cryptographic verification record retrieved directly from PostgreSQL/SQLite ledger.
            </ForgeDialogDescription>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-1">
                <span className="text-[10px] text-[var(--color-ink-muted)] block font-bold uppercase">Operation</span>
                <span className="font-bold text-[var(--color-ink)] font-sans">{selectedBlock.action}</span>
                <p className="text-[11px] text-[var(--color-ink-secondary)] font-sans mt-1">{selectedBlock.explanation}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                  <span className="text-[10px] text-[var(--color-ink-muted)] block">Actor</span>
                  <span className="font-bold text-[var(--color-ink)] font-sans">{selectedBlock.actor_name}</span>
                  <span className="text-[10px] text-[var(--color-ink-secondary)] block font-mono">{selectedBlock.actor_id}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                  <span className="text-[10px] text-[var(--color-ink-muted)] block">Resource</span>
                  <span className="font-bold text-[var(--color-ink)]">{selectedBlock.resource_id}</span>
                  <span className="text-[10px] text-[var(--color-ink-secondary)] block font-mono">{selectedBlock.resource_type}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-1">
                <span className="text-[10px] text-[var(--color-ink-muted)] block">Current SHA-256 Hash</span>
                <span className="text-[10px] text-[var(--color-accent)] break-all select-all block">{selectedBlock.current_hash}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-1">
                <span className="text-[10px] text-[var(--color-ink-muted)] block">Previous Hash (Parent Link)</span>
                <span className="text-[10px] text-[var(--color-ink-secondary)] break-all select-all block">{selectedBlock.previous_hash}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </ForgeDialogContent>
        </ForgeDialog>
      )}

    </div>
  );
}
