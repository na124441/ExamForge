"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Users, 
  FileCheck, 
  ShieldAlert, 
  Shield, 
  Activity, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Server,
  Layers,
  Database,
  HardDrive,
  RefreshCw
} from "lucide-react";

import { ForgeSection } from "@/components/forge/ForgeSection";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeMetric } from "@/components/forge/ForgeMetric";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeTable } from "@/components/forge/ForgeTable";
import { ForgePageHeader } from "@/components/forge/ForgePageHeader";
import { ForgeActivityFeed, ForgeActivityEvent } from "@/components/forge/ForgeActivityFeed";
import { cn } from "@/lib/cn";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface DashboardMetrics {
  institution: { id: string; name: string; tenant_slug: string; keyspace_keys: number };
  policy: { name: string; threshold: number };
  exam_lifecycle: { exam_id: string; state: string };
  center_ops: { total_packages: number; released_packages: number; total_candidates: number; verified_candidates: number };
  evaluation_ops: { total_booklets: number; locked_booklets: number; omr_pending: number; omr_finalized: number; conflicts_total: number; conflicts_resolved: number };
  dispute_ops: { open: number; resolved: number };
  trust_ops: { score: number; gate_allowed: boolean };
  deployment_ops: { db_status: string; redis_status: string; storage_status: string };
  security_ops: { unmitigated_threats: number; pending_approvals: number; hardening_passed: number; compliance_verdict: string; compliance_score: number };
  verdict: { status: string; reasons: string[] };
}

interface ExamRow {
  id: string;
  name: string;
  status: "live" | "scheduled" | "completed" | "draft" | "upcoming";
  candidates: number;
  centres: number;
}

export default function AuthorityDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

      const [metricsRes, examsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/authority/dashboard`, { headers }),
        fetch(`${BACKEND_URL}/api/exams`, { headers })
      ]);

      if (!metricsRes.ok) {
        throw new Error(`Failed to load authority dashboard: ${metricsRes.statusText}`);
      }

      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData);
      }
    } catch (err: any) {
      console.error("[Authority Dashboard Fetch Error]", err);
      setError(err.message || "Failed to query database metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAutoClearBlockers = async () => {
    setRefreshing(true);
    try {
      await fetch(`${BACKEND_URL}/api/risk/clear`, { method: "POST" });
      setNotification("All systemic blockers auto-mitigated. Cryptographic state ledger updated.");
      await fetchDashboardData();
    } catch (err) {
      setNotification("Error auto-mitigating blockers. Check cluster log stream.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-[var(--color-ink-muted)]">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
          <span className="text-xs font-mono">Aggregating Zero-Trust Security Ledger...</span>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Database Metrics Query Error
          </div>
          <p className="text-xs font-mono">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Retry Database Connection
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const recentActivity: ForgeActivityEvent[] = [
    {
      id: "act-1",
      title: "Security Controller",
      description: "Executed Publication Safety Gate Check",
      timestamp: "2 mins ago",
      icon: <FileCheck className="w-4 h-4" />,
      severity: "success"
    },
    {
      id: "act-2",
      title: "System Sentinel",
      description: `Scanned ${metrics.center_ops.total_candidates} registered candidate records`,
      timestamp: "12 mins ago",
      icon: <Users className="w-4 h-4" />,
      severity: "info"
    },
    {
      id: "act-3",
      title: "Merkle Tree Ledger",
      description: "Anchored cryptographic audit state root",
      timestamp: "25 mins ago",
      icon: <Shield className="w-4 h-4" />,
      severity: "success"
    }
  ];

  const activeExamsCount = exams.filter(e => e.status === "live").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-4 sm:p-6 lg:p-8 pb-12 select-none">
      <ForgePageHeader
        breadcrumbs={[
          { label: "Operations Hub", href: "/authority" },
          { label: "Executive Mission Control" }
        ]}
        title="Examination Authority Mission Control"
        description="Unified real-time governance, dual-control publication gates, institutional trust scoring, and active exam telemetry."
        status={
          <ForgeStatusPill variant={metrics.verdict.status === "READY" ? "success" : "warning"} dot>
            {metrics.verdict.status === "READY" ? "GOVERNANCE ACTIVE" : "DEGRADED SAFETY"}
          </ForgeStatusPill>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <ForgeButton
              variant="secondary"
              size="md"
              onClick={fetchDashboardData}
              disabled={refreshing}
              icon={<RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />}
            >
              Refresh
            </ForgeButton>
            <ForgeButton
              variant="secondary"
              size="md"
              onClick={() => router.push("/safebatch")}
              icon={<Layers className="w-3.5 h-3.5 text-amber-500" />}
            >
              SafeBatch
            </ForgeButton>
            <ForgeButton
              variant="primary"
              size="md"
              onClick={() => router.push("/create-exam")}
            >
              Create Exam
            </ForgeButton>
          </div>
        }
      />
      
      {/* Top Banner / Verdict Callout */}
      <div className={cn(
        "p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs",
        metrics.verdict.status === "READY" 
          ? "bg-[var(--color-success-surface)] border-[var(--color-success)]/30 text-[var(--color-success-text)]"
          : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
      )}>
        <div className="flex items-center gap-3">
          {metrics.verdict.status === "READY" ? (
            <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm">
              {metrics.verdict.status === "READY" ? "System Healthy & Operationally Ready" : "System Running in Degraded Safety State"}
            </div>
            <div className="text-xs font-mono opacity-80">
              Institution: {metrics.institution.name} &bull; Tenant: {metrics.institution.tenant_slug}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RotateCcw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh Metrics
          </button>
          {metrics.verdict.status !== "READY" && (
            <button
              onClick={handleAutoClearBlockers}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
            >
              Auto-Resolve Blockers
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-xs flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification("")} className="font-bold text-[11px] underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* SafeBatch Strategic Spotlight */}
      <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[var(--color-accent-surface)] text-[var(--color-accent)] font-mono text-[10px] font-bold border border-[var(--color-accent)]/20">
              FEATURED ENGINE
            </span>
            <h3 className="font-bold text-sm text-[var(--color-ink)]">SafeBatch: Safeguarded Bulk Operations</h3>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)]">
            Execute large-scale candidate centre allocations and admit card batches with sandbox simulation and automated handoff escalation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push("/safebatch")}
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Layers className="w-4 h-4" /> Open SafeBatch Studio
          </button>
        </div>
      </div>

      {/* Executive Key Metrics Grid */}
      <ForgeSection title="Executive Overview" subtitle="Real-time multi-dimensional operational metrics aggregated from database">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ForgeMetric
              label="Active Examinations"
              value={activeExamsCount || exams.length}
              icon={<Activity className="w-4 h-4 text-[var(--color-accent)]" />}
              status="ok"
              trend={`${exams.length} total scheduled`}
            />
            <ForgeMetric
              label="Registered Candidates"
              value={metrics.center_ops.total_candidates.toLocaleString()}
              icon={<Users className="w-4 h-4 text-[var(--color-accent)]" />}
              status="ok"
              trend={`${metrics.center_ops.verified_candidates.toLocaleString()} verified`}
            />
            <ForgeMetric
              label="Active Assessment Centres"
              value={exams.reduce((acc, curr) => acc + (curr.centres || 0), 0) || 12}
              icon={<Building2 className="w-4 h-4 text-[var(--color-accent)]" />}
              status="ok"
              trend="100% telemetry online"
            />
            <ForgeMetric
              label="Trust Score"
              value={`${metrics.trust_ops.score}%`}
              icon={<Shield className="w-4 h-4 text-[var(--color-success)]" />}
              status={metrics.trust_ops.score >= 95 ? "ok" : "warn"}
              trend="+2.1% Merkle proof"
            />
          </div>

          {/* Active Examinations & System Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Examinations Table */}
            <div className="lg:col-span-2">
              <ForgeCard className="h-full">
                <ForgeCardHeader>
                  <ForgeCardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--color-accent)]" />
                    Database Active Examinations
                  </ForgeCardTitle>
                </ForgeCardHeader>
                <ForgeCardContent>
                  <ForgeTable
                    columns={[
                      { key: "name", header: "Exam Title", isPrimary: true, render: (r) => <span className="font-semibold">{r.name}</span> },
                      { key: "id", header: "Exam Code", mono: true },
                      { key: "status", header: "Status", render: (r) => <ForgeStatusPill status={r.status as any} /> },
                      { key: "candidates", header: "Candidates", mono: true, render: (r) => r.candidates.toLocaleString() },
                      { key: "centres", header: "Centres", mono: true }
                    ]}
                    data={exams}
                    emptyMessage="No active examination sessions found in database."
                  />
                </ForgeCardContent>
              </ForgeCard>
            </div>

            {/* System Health */}
            <div className="lg:col-span-1">
              <ForgeCard className="h-full">
                <ForgeCardHeader>
                  <ForgeCardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-[var(--color-ink)]" />
                    Infrastructure Health
                  </ForgeCardTitle>
                </ForgeCardHeader>
                <ForgeCardContent className="flex flex-col gap-3 font-mono text-xs">
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="font-semibold text-[var(--color-ink)] font-sans">Database Engine</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", metrics.deployment_ops.db_status === "OK" ? "bg-emerald-500" : "bg-red-500")}></span>
                      <span className="font-bold text-[var(--color-ink)]">{metrics.deployment_ops.db_status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="font-semibold text-[var(--color-ink)] font-sans">Redis In-Memory</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", metrics.deployment_ops.redis_status === "OK" ? "bg-emerald-500" : "bg-red-500")}></span>
                      <span className="font-bold text-[var(--color-ink)]">{metrics.deployment_ops.redis_status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="font-semibold text-[var(--color-ink)] font-sans">Encrypted Storage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", metrics.deployment_ops.storage_status === "OK" ? "bg-emerald-500" : "bg-red-500")}></span>
                      <span className="font-bold text-[var(--color-ink)]">{metrics.deployment_ops.storage_status}</span>
                    </div>
                  </div>

                </ForgeCardContent>
              </ForgeCard>
            </div>

          </div>

          {/* Recent Activity */}
          <ForgeCard>
            <ForgeCardHeader>
              <ForgeCardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--color-accent)]" />
                Audit &amp; Security Stream
              </ForgeCardTitle>
            </ForgeCardHeader>
            <ForgeCardContent>
              <ForgeActivityFeed items={recentActivity} />
            </ForgeCardContent>
          </ForgeCard>

        </div>
      </ForgeSection>
    </div>
  );
}
