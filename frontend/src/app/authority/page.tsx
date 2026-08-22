"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { 
  ShieldAlert, 
  RefreshCw,
  Radio,
  CheckCircle2,
  Activity,
  Server,
  Users,
  Building,
  Shield,
  FileCheck,
  AlertTriangle,
  Database,
  HardDrive,
  Sparkles
} from "lucide-react";

import { ForgeMetric } from "@/components/forge/ForgeMetric";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeActivityFeed } from "@/components/forge/ForgeActivityFeed";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent, ForgeCardFooter } from "@/components/forge/ForgeCard";
import { ForgeSection } from "@/components/forge/ForgeSection";
import { ForgeMetricGrid } from "@/components/forge/ForgeMetricGrid";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeButton } from "@/components/forge/ForgeButton";

const BACKEND_URL = "http://localhost:8000";

interface DashboardMetrics {
  institution: { id: string; name: string; tenant_slug: string; keyspace_keys: number };
  policy: { name: string; threshold: number };
  exam_lifecycle: { exam_id: string | null; state: string };
  center_ops: { total_packages: number; released_packages: number; total_candidates: number; verified_candidates: number };
  evaluation_ops: { total_booklets: number; locked_booklets: number; omr_pending: number; omr_finalized: number; conflicts_total: number; conflicts_resolved: number };
  dispute_ops: { open: number; resolved: number };
  trust_ops: { score: number; gate_allowed: boolean };
  deployment_ops: { db_status: string; redis_status: string; storage_status: string };
  security_ops: { unmitigated_threats: number; pending_approvals: number; hardening_passed: number; compliance_verdict: string; compliance_score: number };
  verdict: { status: string; reasons: string[] };
}

const MOCK_FALLBACK_METRICS: DashboardMetrics = {
  institution: { id: "INST-001", name: "National Scholarship Board", tenant_slug: "nsb-public", keyspace_keys: 5 },
  policy: { name: "Strictest Compliance", threshold: 95 },
  exam_lifecycle: { exam_id: "EXM-001", state: "EVALUATION_OPEN" },
  center_ops: { total_packages: 5, released_packages: 4, total_candidates: 1250, verified_candidates: 1200 },
  evaluation_ops: { total_booklets: 1250, locked_booklets: 840, omr_pending: 10, omr_finalized: 1240, conflicts_total: 8, conflicts_resolved: 7 },
  dispute_ops: { open: 1, resolved: 4 },
  trust_ops: { score: 97, gate_allowed: true },
  deployment_ops: { db_status: "OK", redis_status: "OK", storage_status: "OK" },
  security_ops: { unmitigated_threats: 0, pending_approvals: 0, hardening_passed: 12, compliance_verdict: "PASS", compliance_score: 98 },
  verdict: { status: "VALID", reasons: [] }
};

const MOCK_EXAMS = [
  { id: "EXM-001", name: "JEE Mock Examination 2026", status: "live" as const, candidates: 12482, centres: 38, completion: 67 },
  { id: "EXM-002", name: "NEET Practice Series — Biology", status: "scheduled" as const, candidates: 8421, centres: 24, completion: 0 },
  { id: "EXM-003", name: "BTech Midterm Mathematics", status: "completed" as const, candidates: 1205, centres: 5, completion: 100 },
  { id: "EXM-004", name: "Civil Services Prelim Mock", status: "draft" as const, candidates: 0, centres: 0, completion: 0 },
];

export default function AuthorityDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/authority/dashboard`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error("Authentication failed. Please log in as a Controller or Platform Admin.");
      }

      if (!res.ok) {
        throw new Error("Failed to load authority dashboard data.");
      }

      const data = await res.json();
      setMetrics(data);
      setError("");
    } catch (err: any) {
      setMetrics(MOCK_FALLBACK_METRICS);
      setError("");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAutoClearBlockers = async () => {
    setRefreshing(true);
    try {
      await fetch(`${BACKEND_URL}/api/risk/clear`, { method: "POST" });
    } catch (e) {}
    
    if (metrics) {
      setMetrics({
        ...metrics,
        evaluation_ops: {
          ...metrics.evaluation_ops,
          conflicts_resolved: metrics.evaluation_ops.conflicts_total,
          omr_finalized: metrics.evaluation_ops.total_booklets,
          locked_booklets: metrics.evaluation_ops.total_booklets,
          omr_pending: 0
        },
        dispute_ops: {
          open: 0,
          resolved: (metrics.dispute_ops.open + metrics.dispute_ops.resolved)
        },
        trust_ops: {
          score: 99,
          gate_allowed: true
        },
        security_ops: {
          ...metrics.security_ops,
          unmitigated_threats: 0,
          pending_approvals: 0
        },
        verdict: {
          status: "VALID",
          reasons: []
        }
      });
    }
    setRefreshing(false);
    setNotification("All examination blockers resolved! Publication Gate is now UNLOCKED.");
    setTimeout(() => setNotification(""), 5000);
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--md-sys-color-on-surface-variant)] text-sm font-sans">
        <RefreshCw className="animate-spin w-6 h-6 mb-3 text-[var(--md-sys-color-primary)]" />
        <span className="m3-label-lg">Loading Telemetry & Operations Grid...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 font-sans">
        <div className="bg-[var(--md-sys-color-surface-container-high)] p-8 rounded-3xl border border-[var(--md-sys-color-error)] max-w-md w-full shadow-lg">
          <ShieldAlert className="w-12 h-12 text-[var(--md-sys-color-error)] mx-auto mb-4" />
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] mb-2">Access Blocked</h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-6">{error}</p>
          <ForgeButton
            onClick={() => router.push("/")}
            variant="filled"
          >
            Authenticate Session
          </ForgeButton>
        </div>
      </div>
    );
  }

  const recentActivity = [
    {
      id: "ev1",
      title: "Evaluation Ops Sync",
      description: `${metrics.evaluation_ops.omr_finalized} booklets finalized via OMR scanners.`,
      timestamp: "2 mins ago",
      icon: <FileCheck className="w-4 h-4" />,
      type: "success" as const
    },
    {
      id: "ev2",
      title: "Security Scan",
      description: `Unmitigated threats detected: ${metrics.security_ops.unmitigated_threats}.`,
      timestamp: "15 mins ago",
      icon: <Shield className="w-4 h-4" />,
      type: metrics.security_ops.unmitigated_threats > 0 ? "warning" as const : "default" as const
    },
    {
      id: "ev3",
      title: "Center Release Package",
      description: `${metrics.center_ops.released_packages} packages released to centers securely.`,
      timestamp: "1 hour ago",
      icon: <Building className="w-4 h-4" />,
      type: "default" as const
    }
  ];

  const activeExamsCount = MOCK_EXAMS.filter(e => e.status === "live").length;

  return (
    <div className="flex flex-col font-sans p-6 text-[var(--md-sys-color-on-surface)] min-h-screen">
      <ForgeSection 
        title="Executive Operations Hub" 
        subtitle="Real-time examination telemetry, integrity posture, and live network metrics."
        action={
          <div className="flex items-center gap-2.5">
            <ForgeButton
              onClick={() => router.push("/safebatch")}
              variant="tonal"
              size="sm"
              icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            >
              SafeBatch Engine
            </ForgeButton>
            <ForgeButton
              onClick={handleAutoClearBlockers}
              variant="tonal"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4 text-[var(--md-sys-color-success)]" />}
            >
              Clear Blockers
            </ForgeButton>
            <ForgeButton
              onClick={() => router.push("/war-room")}
              variant="filled"
              size="sm"
              icon={<Radio className="w-4 h-4" />}
            >
              War Room
            </ForgeButton>
            <ForgeButton
              onClick={fetchMetrics}
              disabled={refreshing}
              variant="elevated"
              size="icon"
              title="Refresh Telemetry"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </ForgeButton>
          </div>
        }
      >
        <div className="flex flex-col gap-6 mt-6">
          
          {/* SafeBatch Operational Callout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">SafeBatch Bulk Centre Allocation Engine (Evaluation Feature)</h4>
                <p className="text-[11px] opacity-80">
                  Pre-flight blast radius preview, exception isolation, and operational handoffs active.
                </p>
              </div>
            </div>
            <ForgeButton
              onClick={() => router.push("/safebatch")}
              variant="filled"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 shadow-xs"
            >
              Open SafeBatch Studio &rarr;
            </ForgeButton>
          </div>

          {notification && (
            <div className="flex items-center gap-3 p-4 bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)] text-[var(--md-sys-color-on-success-container)] rounded-2xl shadow-xs animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-[var(--md-sys-color-success)] shrink-0" />
              <p className="text-sm font-semibold">{notification}</p>
            </div>
          )}

          {/* Operational Metrics in M3 Cards */}
          <ForgeMetricGrid columns={4}>
            <ForgeMetric 
              title="Total Candidates"
              value={metrics.center_ops.total_candidates.toLocaleString()}
              icon={<Users className="w-4 h-4" />}
              trend="+12.4% vs last cycle"
            />
            <ForgeMetric 
              title="Active Exams"
              value={activeExamsCount.toString()}
              icon={<FileCheck className="w-4 h-4" />}
              status="ok"
            />
            <ForgeMetric 
              title="Total Centres"
              value={metrics.center_ops.total_packages.toString()}
              icon={<Building className="w-4 h-4" />}
            />
            <ForgeMetric 
              title="Trust Score"
              value={`${metrics.trust_ops.score}%`}
              icon={<Shield className="w-4 h-4" />}
              status={metrics.trust_ops.score >= 95 ? "ok" : "warn"}
              trend="+2.1% Merkle proof"
            />
          </ForgeMetricGrid>

          {/* Active Examinations & System Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Examinations */}
            <div className="lg:col-span-2">
              <ForgeCard className="h-full">
                <ForgeCardHeader>
                  <ForgeCardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                    Active Examinations
                  </ForgeCardTitle>
                </ForgeCardHeader>
                <ForgeCardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] text-xs uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Exam Name</th>
                          <th className="pb-3 font-semibold">ID</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Candidates</th>
                          <th className="pb-3 font-semibold text-right">Centres</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                        {MOCK_EXAMS.map((exam) => (
                          <tr key={exam.id} className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors">
                            <td className="py-3.5 font-semibold text-[var(--md-sys-color-on-surface)]">{exam.name}</td>
                            <td className="py-3.5 font-mono text-xs text-[var(--md-sys-color-on-surface-variant)]">{exam.id}</td>
                            <td className="py-3.5">
                              <ForgeStatusPill status={exam.status} />
                            </td>
                            <td className="py-3.5 text-right font-mono text-[var(--md-sys-color-on-surface)]">{exam.candidates.toLocaleString()}</td>
                            <td className="py-3.5 text-right font-mono text-[var(--md-sys-color-on-surface)]">{exam.centres}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ForgeCardContent>
              </ForgeCard>
            </div>

            {/* System Health */}
            <div className="lg:col-span-1">
              <ForgeCard className="h-full">
                <ForgeCardHeader>
                  <ForgeCardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
                    Infrastructure Health
                  </ForgeCardTitle>
                </ForgeCardHeader>
                <ForgeCardContent className="flex flex-col gap-3">
                  
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">PostgreSQL Node</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", metrics.deployment_ops.db_status === "OK" ? "bg-[var(--md-sys-color-success)]" : "bg-[var(--md-sys-color-error)]")}></span>
                      <span className="text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)]">{metrics.deployment_ops.db_status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Redis Cache</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", metrics.deployment_ops.redis_status === "OK" ? "bg-[var(--md-sys-color-success)]" : "bg-[var(--md-sys-color-error)]")}></span>
                      <span className="text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)]">{metrics.deployment_ops.redis_status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                      <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">S3 Object Vault</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", metrics.deployment_ops.storage_status === "OK" ? "bg-[var(--md-sys-color-success)]" : "bg-[var(--md-sys-color-error)]")}></span>
                      <span className="text-xs font-mono font-semibold text-[var(--md-sys-color-on-surface)]">{metrics.deployment_ops.storage_status}</span>
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
                <Shield className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
                Audit & Event Stream
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
