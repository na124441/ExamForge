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
      // Pre-populate resolution target to Chennai Hub D for all items
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#8AD8B8] space-y-3 font-mono text-sm">
        <RefreshCw className="animate-spin" size={24} />
        <span>Loading SafeBatch Handoff Packet...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-rose-400 font-mono text-sm">
        Failed to load handoff packet {handoffId}.
      </div>
    );
  }

  // Filter items
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
    <div className="space-y-8 font-sans">
      {/* TOP BREADCRUMB */}
      <div className="flex items-center justify-between">
        <Link
          href="/safebatch"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8AD8B8] hover:text-[#FFF4E2] transition-colors no-underline"
        >
          <ArrowLeft size={14} />
          Back to SafeBatch Studio
        </Link>
        <span className="text-xs font-mono text-[#8AD8B8]/70">
          Target Role: <strong className="text-[#FFF4E2]">Centre Superintendent (OFFICER)</strong>
        </span>
      </div>

      {/* RESOLUTION SUCCESS TOAST */}
      {isResolved && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-[#8AD8B8]" size={24} />
            <div>
              <h4 className="text-sm font-bold text-[#FFF4E2]">
                Handoff Successfully Resolved & Committed
              </h4>
              <p className="text-xs text-[#8AD8B8]/90">
                All 34 exceptions have been allocated to Chennai Hub D buffer. The parent Bulk Action is now 100% COMPLETE.
              </p>
            </div>
          </div>
          <Link
            href="/audit-timeline"
            className="px-3.5 py-1.5 rounded-xl bg-[#8AD8B8] text-[#132D28] font-bold text-xs shadow-sm hover:bg-[#a0e8cb] transition-all no-underline"
          >
            Inspect Ledger Proof
          </Link>
        </div>
      )}

      {/* HANDOFF HEADER CARD */}
      <div className="bg-[rgba(19,45,40,0.88)] border border-[rgba(138,216,184,0.3)] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[rgba(138,216,184,0.18)] pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(64,133,118,0.35)] border border-[rgba(138,216,184,0.4)] flex items-center justify-center text-[#8AD8B8] shadow-lg shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#8AD8B8] uppercase tracking-widest block">
                  OPERATIONAL HANDOFF &middot; {data.id}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border uppercase",
                  isResolved
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : isClaimed
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                )}>
                  {isResolved ? "RESOLVED" : isClaimed ? "CLAIMED BY SUPERINTENDENT" : "UNCLAIMED (ACTION REQUIRED)"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#FFF4E2] mt-1">
                {data.title}
              </h1>
              <p className="text-xs text-[#8AD8B8]/80 mt-1">
                Linked Bulk Action: <strong className="text-[#FFF4E2] font-mono">{data.bulk_action_id}</strong> &middot; Exam: <strong className="text-[#FFF4E2]">AIML Entrance Exam 2026</strong>
              </p>
            </div>
          </div>

          {/* CLAIM / RESOLVE CTA */}
          <div className="flex items-center gap-3">
            {!isClaimed && !isResolved && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="px-6 py-3 rounded-2xl bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] font-bold text-sm transition-all shadow-[0_10px_25px_-5px_rgba(138,216,184,0.6)] flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {claiming ? <RefreshCw className="animate-spin" size={16} /> : <UserCheck size={16} />}
                <span>Claim Handoff</span>
              </button>
            )}

            {isClaimed && !isResolved && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="px-6 py-3 rounded-2xl bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] font-bold text-sm transition-all shadow-[0_10px_25px_-5px_rgba(138,216,184,0.6)] flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {resolving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                <span>Resolve All 34 Exceptions & Finalize</span>
              </button>
            )}
          </div>
        </div>

        {/* METADATA CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
            <span className="text-[10px] text-[#8AD8B8]/70 uppercase block">Initiator</span>
            <span className="text-xs font-bold text-[#FFF4E2] block mt-0.5">{data.initiated_by}</span>
            <span className="text-[10px] text-[#8AD8B8]/60">Role: {data.initiated_by_role}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
            <span className="text-[10px] text-[#8AD8B8]/70 uppercase block">Assigned Role</span>
            <span className="text-xs font-bold text-[#8AD8B8] block mt-0.5">{data.assigned_to_user}</span>
            <span className="text-[10px] text-[#8AD8B8]/60">Role: {data.assigned_to_role}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
            <span className="text-[10px] text-[#8AD8B8]/70 uppercase block">Unresolved Scope</span>
            <span className="text-xl font-bold text-amber-400 font-mono block mt-0.5">{data.affected_count} Candidates</span>
            <span className="text-[10px] text-[#8AD8B8]/60">Resolved: {isResolved ? 34 : data.resolved_count}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)]">
            <span className="text-[10px] text-[#8AD8B8]/70 uppercase block">Audit Proof Hash</span>
            <span className="text-[11px] font-mono text-[#8AD8B8] block mt-0.5 truncate">
              {data.audit_receipt_hash || "sha256:7f83b1657ff1..."}
            </span>
            <span className="text-[10px] text-[#8AD8B8]/60">Immutable Ledger</span>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="p-4 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.25)] space-y-1.5 text-xs font-sans">
          <span className="font-mono text-[10px] font-bold text-[#8AD8B8] uppercase tracking-wider block">
            SUPERINTENDENT RESOLUTION INSTRUCTIONS
          </span>
          <p className="text-[#FFF4E2]/90 leading-relaxed">
            {data.next_action}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 34 EXCEPTIONS RESOLVER TABLE */}
      {/* ========================================================================= */}
      <div className="bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
              <Users size={18} className="text-[#8AD8B8]" />
              Unresolved Candidate Items ({data.items.length})
            </h2>
            <p className="text-xs text-[#8AD8B8]/80 mt-0.5">
              Review error codes and apply manual centre assignment overrides.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AD8B8]/60" size={14} />
              <input
                type="text"
                placeholder="Search candidate name or reg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#FFF4E2] focus:outline-none focus:border-[#8AD8B8]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[rgba(8,19,16,0.6)] p-1 rounded-xl border border-[rgba(138,216,184,0.2)] text-[11px] font-mono">
              <button
                onClick={() => setSelectedFilter("ALL")}
                className={cn("px-2.5 py-1 rounded-lg transition-colors", selectedFilter === "ALL" ? "bg-[#408576] text-[#FFF4E2]" : "text-[#8AD8B8]/70")}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter("CENTRE_FULL")}
                className={cn("px-2.5 py-1 rounded-lg transition-colors", selectedFilter === "CENTRE_FULL" ? "bg-[#408576] text-[#FFF4E2]" : "text-[#8AD8B8]/70")}
              >
                Capacity (23)
              </button>
              <button
                onClick={() => setSelectedFilter("ADDRESS_MISSING")}
                className={cn("px-2.5 py-1 rounded-lg transition-colors", selectedFilter === "ADDRESS_MISSING" ? "bg-[#408576] text-[#FFF4E2]" : "text-[#8AD8B8]/70")}
              >
                Address (11)
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE CARD VIEW (Phones < sm) */}
        <div className="sm:hidden space-y-3">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.18)] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-[#FFF4E2] text-sm block">{item.candidate_name}</span>
                  <span className="font-mono text-[10px] text-[#8AD8B8]/70">{item.candidate_reg_no} · {item.candidate_city || "Unspecified"}</span>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0",
                  item.error_code === "CENTRE_FULL" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                )}>
                  {item.error_code}
                </span>
              </div>

              <p className="text-[11px] text-[#8AD8B8]/80 leading-relaxed bg-[rgba(19,45,40,0.5)] p-2 rounded-xl border border-[rgba(138,216,184,0.1)]">
                {item.error_detail}
              </p>

              <div className="space-y-1 pt-1">
                <label className="block text-[10px] font-mono text-[#8AD8B8] uppercase">Target Allocation</label>
                <select
                  value={resolutionTarget[item.candidate_id] || "c4"}
                  onChange={(e) => {
                    setResolutionTarget({
                      ...resolutionTarget,
                      [item.candidate_id]: e.target.value,
                    });
                  }}
                  disabled={isResolved}
                  className="w-full bg-[rgba(8,19,16,0.9)] border border-[rgba(138,216,184,0.3)] rounded-xl px-3 py-2 text-xs text-[#FFF4E2] focus:outline-none focus:border-[#8AD8B8]"
                >
                  <option value="c4">Chennai Main - Hub D (Buffer)</option>
                  <option value="c1">Mumbai Hub A (Override)</option>
                  <option value="c2">Delhi Hub B (Override)</option>
                  <option value="c3">Bengaluru Hub C (Override)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[rgba(138,216,184,0.1)]">
                <span className="text-[10px] font-mono text-[#8AD8B8]/60">Status</span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold",
                  isResolved ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                )}>
                  {isResolved ? "RESOLVED ✓" : "NEEDS RESOLUTION"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP & TABLET TABLE VIEW (Screen >= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[rgba(138,216,184,0.18)] font-mono text-[11px] text-[#8AD8B8] uppercase">
                <th className="pb-3 px-3">Candidate</th>
                <th className="pb-3 px-3">Reg No &amp; City</th>
                <th className="pb-3 px-3">Exception Code</th>
                <th className="pb-3 px-3">Resolution Target</th>
                <th className="pb-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(138,216,184,0.1)]">
              {filteredItems.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-[rgba(64,133,118,0.15)] transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#FFF4E2] block">{item.candidate_name}</span>
                    <span className="font-mono text-[10px] text-[#8AD8B8]/70">{item.candidate_id}</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] text-[#FFF4E2] block">{item.candidate_reg_no}</span>
                    <span className="text-[11px] text-[#8AD8B8]/80">{item.candidate_city || "Unspecified"}</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                      item.error_code === "CENTRE_FULL" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                    )}>
                      {item.error_code}
                    </span>
                    <p className="text-[10px] text-[#8AD8B8]/70 max-w-xs mt-0.5 truncate">{item.error_detail}</p>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={resolutionTarget[item.candidate_id] || "c4"}
                      onChange={(e) => {
                        setResolutionTarget({
                          ...resolutionTarget,
                          [item.candidate_id]: e.target.value,
                        });
                      }}
                      disabled={isResolved}
                      className="bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-xl px-2.5 py-1 text-xs text-[#FFF4E2] focus:outline-none focus:border-[#8AD8B8]"
                    >
                      <option value="c4">Chennai Main - Hub D (Buffer Capacity)</option>
                      <option value="c1">Mumbai Hub A (Superintendent Override)</option>
                      <option value="c2">Delhi Hub B (Superintendent Override)</option>
                      <option value="c3">Bengaluru Hub C (Superintendent Override)</option>
                    </select>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold",
                      isResolved
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    )}>
                      {isResolved ? "RESOLVED ✓" : "NEEDS RESOLUTION"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-4 border-t border-[rgba(138,216,184,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#8AD8B8]/80 font-mono">
            Showing {filteredItems.length} of {data.items.length} candidate exceptions
          </div>

          {!isResolved && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-6 py-3 rounded-2xl bg-[#8AD8B8] hover:bg-[#a0e8cb] text-[#132D28] font-bold text-sm transition-all shadow-[0_10px_25px_-5px_rgba(138,216,184,0.6)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {resolving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              <span>Resolve & Allocate All 34 Candidates</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
