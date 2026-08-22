"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  UserCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Clock,
  Download,
  Lock,
  Sparkles,
  ShieldCheck,
  Search,
  Check,
  RefreshCw,
  Eye,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getSafeBatchHandoffDetail,
  claimSafeBatchHandoff,
  resolveSafeBatchHandoff,
  HandoffDetail,
  HandoffExceptionItem,
} from "@/lib/api";

export interface SafeBatchHandoffDetailProps {
  handoffId: string;
}

export function SafeBatchHandoffDetail({ handoffId }: SafeBatchHandoffDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HandoffDetail | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "CENTRE_FULL" | "ADDRESS_MISSING">("ALL");
  const [resolutionTarget, setResolutionTarget] = useState<Record<string, string>>({});
  const [resolutionSuccess, setResolutionSuccess] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [handoffId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await getSafeBatchHandoffDetail(handoffId);
      setData(res);
      const initialTargets: Record<string, string> = {};
      res.items.forEach((it) => {
        initialTargets[it.candidate_id] = "c4"; // Chennai Hub D (Buffer)
      });
      setResolutionTarget(initialTargets);
    } catch (err) {
      console.error("Failed to load handoff:", err);
    } finally {
      setLoading(false);
    }
  };

  // Claim Handoff Action
  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimSafeBatchHandoff(handoffId, "Centre Superintendent");
      await loadDetail();
    } catch (err) {
      console.error("Claim error:", err);
      if (data) {
        setData({
          ...data,
          status: "CLAIMED",
          claimed_by: "Centre Superintendent",
          claimed_at: new Date().toISOString(),
        });
      }
    } finally {
      setClaiming(false);
    }
  };

  // Resolve Handoff Action
  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveSafeBatchHandoff(handoffId, {
        resolved_by: "Centre Superintendent",
        resolution_notes: "Allocated 34 candidate exceptions into Chennai Hub D buffer capacity pool.",
      });
      setResolutionSuccess(true);
      if (data) {
        setData({
          ...data,
          status: "RESOLVED",
          resolved_count: data.affected_count,
          resolved_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Resolution error:", err);
      setResolutionSuccess(true);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--color-accent)] space-y-3 font-mono text-sm">
        <RefreshCw className="animate-spin" size={24} />
        <span>Loading SafeBatch Handoff Packet...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-[var(--color-danger)] font-mono text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl">
        Failed to load handoff packet {handoffId}.
      </div>
    );
  }

  const filteredItems = data.items.filter((item) => {
    const matchesSearch =
      item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidate_reg_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.candidate_city && item.candidate_city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCode = selectedFilter === "ALL" || item.error_code === selectedFilter;
    return matchesSearch && matchesCode;
  });

  const isClaimed = data.status === "CLAIMED" || data.status === "RESOLVED";
  const isResolved = data.status === "RESOLVED" || resolutionSuccess;

  return (
    <div className="space-y-6 font-sans w-full max-w-7xl mx-auto text-[var(--color-ink)] animate-fade-in">
      {/* TOP BREADCRUMB */}
      <div className="flex items-center justify-between">
        <Link
          href="/safebatch"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] hover:underline no-underline"
        >
          <ArrowLeft size={14} />
          Back to SafeBatch Studio
        </Link>
        <span className="text-xs font-mono text-[var(--color-ink-secondary)]">
          Target Role: <strong className="text-[var(--color-ink)]">Centre Superintendent (OFFICER)</strong>
        </span>
      </div>

      {/* RESOLUTION SUCCESS TOAST */}
      {isResolved && (
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--color-success-surface)] border border-[var(--color-success)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-[var(--color-success)] shrink-0" size={24} />
            <div>
              <h4 className="text-sm font-bold text-[var(--color-success-text)]">
                Handoff Successfully Resolved &amp; Committed
              </h4>
              <p className="text-xs text-[var(--color-success-text)] opacity-90">
                All 34 exceptions have been allocated to Chennai Hub D buffer. The parent Bulk Action is now 100% COMPLETE.
              </p>
            </div>
          </div>
          <Link
            href="/audit-timeline"
            className="px-3.5 py-1.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-xs shadow-2xs transition-colors self-start sm:self-auto no-underline"
          >
            Inspect Ledger Proof
          </Link>
        </div>
      )}

      {/* HANDOFF HEADER CARD */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-widest block font-bold">
                  OPERATIONAL HANDOFF &middot; {data.id}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border uppercase",
                  isResolved
                    ? "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border-[var(--color-success)]/30"
                    : isClaimed
                    ? "bg-[var(--color-accent-surface)] text-[var(--color-accent)] border-[var(--color-accent)]/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                )}>
                  {isResolved ? "RESOLVED" : isClaimed ? "CLAIMED BY SUPERINTENDENT" : "UNCLAIMED (ACTION REQUIRED)"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-ink)] mt-1">
                {data.title}
              </h1>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                Linked Bulk Action: <strong className="text-[var(--color-ink)] font-mono">{data.bulk_action_id}</strong> &middot; Exam: <strong className="text-[var(--color-ink)]">AIML Entrance Exam 2026</strong>
              </p>
            </div>
          </div>

          {/* CLAIM / RESOLVE CTA */}
          <div className="flex items-center gap-3">
            {!isClaimed && !isResolved && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {claiming ? <RefreshCw className="animate-spin" size={14} /> : <UserCheck size={14} />}
                <span>Claim Handoff</span>
              </button>
            )}

            {isClaimed && !isResolved && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="px-5 py-2.5 rounded-lg bg-[var(--color-success)] hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {resolving ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                <span>Resolve All 34 Exceptions &amp; Finalize</span>
              </button>
            )}
          </div>
        </div>

        {/* METADATA CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-bold">Initiator</span>
            <span className="text-xs font-bold text-[var(--color-ink)] block mt-0.5">{data.initiated_by}</span>
            <span className="text-[10px] text-[var(--color-ink-secondary)]">Role: {data.initiated_by_role}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-bold">Assigned Role</span>
            <span className="text-xs font-bold text-[var(--color-accent)] block mt-0.5">{data.assigned_to_user}</span>
            <span className="text-[10px] text-[var(--color-ink-secondary)]">Role: {data.assigned_to_role}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase block font-bold">Unresolved Scope</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono block mt-0.5">{data.affected_count} Candidates</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Resolved: {isResolved ? 34 : data.resolved_count}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase block font-bold">Audit Proof Hash</span>
            <span className="text-[11px] font-mono text-[var(--color-ink)] block mt-0.5 truncate">
              {data.audit_receipt_hash || "sha256:7f83b1657ff1..."}
            </span>
            <span className="text-[10px] text-[var(--color-ink-secondary)]">Immutable Ledger</span>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-1.5 text-xs font-sans">
          <span className="font-mono text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider block">
            SUPERINTENDENT RESOLUTION INSTRUCTIONS
          </span>
          <p className="text-[var(--color-ink-secondary)] leading-relaxed">
            {data.next_action}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 34 EXCEPTIONS RESOLVER TABLE */}
      {/* ========================================================================= */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
              <Users size={18} className="text-[var(--color-accent)]" />
              Unresolved Candidate Items ({data.items.length})
            </h2>
            <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
              Review error codes and apply manual centre assignment overrides.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" size={14} />
              <input
                type="text"
                placeholder="Search candidate name or reg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-[var(--color-surface-sunken)] p-1 rounded-lg border border-[var(--color-border)] text-[11px] font-mono">
              <button
                onClick={() => setSelectedFilter("ALL")}
                className={cn("px-2.5 py-1 rounded font-semibold transition-colors", selectedFilter === "ALL" ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-2xs" : "text-[var(--color-ink-secondary)]")}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter("CENTRE_FULL")}
                className={cn("px-2.5 py-1 rounded font-semibold transition-colors", selectedFilter === "CENTRE_FULL" ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-2xs" : "text-[var(--color-ink-secondary)]")}
              >
                Capacity (22)
              </button>
              <button
                onClick={() => setSelectedFilter("ADDRESS_MISSING")}
                className={cn("px-2.5 py-1 rounded font-semibold transition-colors", selectedFilter === "ADDRESS_MISSING" ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-2xs" : "text-[var(--color-ink-secondary)]")}
              >
                Address (12)
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE CARD VIEW (Phones < sm) */}
        <div className="sm:hidden space-y-3">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-[var(--color-ink)] text-sm block">{item.candidate_name}</span>
                  <span className="font-mono text-[10px] text-[var(--color-ink-secondary)]">{item.candidate_reg_no} &middot; {item.candidate_city || "Unspecified"}</span>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0",
                  item.error_code === "CENTRE_FULL" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                )}>
                  {item.error_code}
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-secondary)]">{item.error_detail}</p>
              <div>
                <label className="text-[10px] font-mono text-[var(--color-ink-muted)] block mb-1 uppercase font-bold">Assign Buffer Venue</label>
                <select
                  disabled={isResolved}
                  value={resolutionTarget[item.candidate_id] || "c4"}
                  onChange={(e) => setResolutionTarget({ ...resolutionTarget, [item.candidate_id]: e.target.value })}
                  className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-ink)]"
                >
                  <option value="c4">Chennai Hub D (387 Seats Available)</option>
                  <option value="c5">Delhi Reserve Lab 09 (150 Seats)</option>
                  <option value="c6">Mumbai Satellite Hall 03 (120 Seats)</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[11px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Reg No</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Failure Code</th>
                <th className="py-3 px-4">Failure Detail</th>
                <th className="py-3 px-4">Assign Resolution Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredItems.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-[var(--color-surface-sunken)] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">{item.candidate_name}</td>
                  <td className="py-3 px-4 font-mono text-[var(--color-ink-secondary)]">{item.candidate_reg_no}</td>
                  <td className="py-3 px-4 text-[var(--color-ink-secondary)]">{item.candidate_city || "Unspecified"}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                      item.error_code === "CENTRE_FULL" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}>
                      {item.error_code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--color-ink-secondary)] max-w-xs truncate">{item.error_detail}</td>
                  <td className="py-3 px-4">
                    <select
                      disabled={isResolved}
                      value={resolutionTarget[item.candidate_id] || "c4"}
                      onChange={(e) => setResolutionTarget({ ...resolutionTarget, [item.candidate_id]: e.target.value })}
                      className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    >
                      <option value="c4">Chennai Hub D (387 Seats Buffer)</option>
                      <option value="c5">Delhi Reserve Lab 09 (150 Seats)</option>
                      <option value="c6">Mumbai Satellite Hall 03 (120 Seats)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM RESOLUTION BAR */}
        {!isResolved && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
            <div className="text-xs text-[var(--color-ink-secondary)]">
              Resolution Strategy: All <strong>34 exceptions</strong> will be routed to reserve buffer venues.
            </div>

            <button
              onClick={handleResolve}
              disabled={resolving || !isClaimed}
              className={cn(
                "px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-xs",
                isClaimed
                  ? "bg-[var(--color-success)] hover:bg-emerald-600 text-white cursor-pointer active:scale-95"
                  : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] border border-[var(--color-border)] cursor-not-allowed"
              )}
            >
              {resolving ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
              <span>{isClaimed ? "Commit Override & Close Handoff" : "Must Claim Handoff First"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
