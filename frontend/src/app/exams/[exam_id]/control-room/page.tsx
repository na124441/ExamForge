"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Radio, 
  RefreshCw, 
  ShieldAlert, 
  Lock,
  Unlock,
  Users,
  Cpu,
  Layers,
  Scale,
  History,
  Activity,
  FileCheck,
  Server,
  Network,
  Key,
  CheckCircle2,
  Compass,
  ArrowRight,
  Fingerprint
} from "lucide-react";
import { ForgeSection } from "@/components/forge/ForgeSection";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeMetricGrid } from "@/components/forge/ForgeMetricGrid";
import { ForgeMetric } from "@/components/forge/ForgeMetric";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeSeatingEngine } from "@/components/forge/ForgeSeatingEngine";
import { ForgeQuestionPaperStudio } from "@/components/forge/ForgeQuestionPaperStudio";
import { ForgeExamConductWorkbench } from "@/components/forge/ForgeExamConductWorkbench";
import { ForgeEvaluationControlStudio } from "@/components/forge/ForgeEvaluationControlStudio";
import { ForgeBiometricAnalysisStudio } from "@/components/forge/ForgeBiometricAnalysisStudio";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LifecycleStepper } from "@/components/ui/LifecycleStepper";
import { NextBestAction } from "@/components/ui/NextBestAction";
import { ProofDrawer, ProofData } from "@/components/ui/ProofDrawer";

const BACKEND_URL = "http://localhost:8000";

const STATE_SEQUENCE: Record<string, number> = {
  "DRAFT": 1,
  "CONFIG_LOCKED": 2,
  "PAPER_GENERATED": 3,
  "PACKAGE_SEALED": 4,
  "RELEASE_WINDOW_OPEN": 5,
  "IN_PROGRESS": 7,
  "SUBMISSION_LOCKED": 8,
  "EVALUATION_OPEN": 9,
  "RESULT_VERIFICATION": 11,
  "RESULT_PUBLISHED": 12
};

const DEFAULT_STAGES = [
  { name: "SETUP & POLICY LOCK", status: "COMPLETED", sequence: 1 },
  { name: "EXAM CREATION", status: "COMPLETED", sequence: 2 },
  { name: "PAPER GENERATION", status: "COMPLETED", sequence: 3 },
  { name: "PACKAGE SEALING", status: "COMPLETED", sequence: 4 },
  { name: "CENTER RELEASE", status: "COMPLETED", sequence: 5 },
  { name: "CANDIDATE VERIFY", status: "COMPLETED", sequence: 6 },
  { name: "EXAM CONDUCT", status: "COMPLETED", sequence: 7 },
  { name: "OMR SCANNING", status: "COMPLETED", sequence: 8 },
  { name: "DOUBLE EVALUATION", status: "IN_PROGRESS", sequence: 9 },
  { name: "CONFLICT OVERRIDE", status: "PENDING", sequence: 10 },
  { name: "GATE CHECK", status: "PENDING", sequence: 11 },
  { name: "RESULT PUBLISH", status: "PENDING", sequence: 12 },
  { name: "DISPUTE REVIEW", status: "PENDING", sequence: 13 },
  { name: "LEDGER AUDIT", status: "PENDING", sequence: 14 },
  { name: "COMPLIANCE VERDICT", status: "PENDING", sequence: 15 }
];

export default function ExamControlRoom() {
  const router = useRouter();
  const routeParams = useParams();
  const rawExamId = (routeParams?.exam_id as string) || "EXM-001";
  const [examId, setExamId] = useState(rawExamId);
  const [activeTab, setActiveTab] = useState("overview");

  // Telemetry states
  const [summary, setSummary] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [chainValid, setChainValid] = useState(true);
  const [gateStatus, setGateStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState(false);

  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<ProofData | null>(null);
  
  const [selectedCenter, setSelectedCenter] = useState("CTR-LKO-01");

  useEffect(() => {
    if (routeParams?.exam_id) {
      setExamId(routeParams.exam_id as string);
    }
  }, [routeParams]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [examId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const [resSum, resInc, resTimeline, resVerify, resGate] = await Promise.all([
        fetch(`${BACKEND_URL}/api/ops/exam-ops-summary/EXM-001`),
        fetch(`${BACKEND_URL}/api/incidents`),
        fetch(`${BACKEND_URL}/api/audit/timeline-explain/EXM-001`),
        fetch(`${BACKEND_URL}/api/audit/verify-chain`),
        fetch(`${BACKEND_URL}/api/exams/EXM-001/gate-status`)
      ]);

      if (resSum.ok) setSummary(await resSum.json());
      if (resInc.ok) setIncidents(await resInc.json());
      if (resTimeline.ok) {
        const timeData = await resTimeline.json();
        setTimeline(timeData.timeline || []);
      }
      if (resVerify.ok) {
        const verifyData = await resVerify.json();
        setChainValid(verifyData.intact);
      }
      if (resGate.ok) setGateStatus(await resGate.json());

    } catch (err) {
      console.error("Failed to sync control room telemetry", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTransition = async (nextState: string) => {
    setActioning(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/exams/EXM-001/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ new_state: nextState })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "State transition rejected.");
      }
      await fetchData();
    } catch (err: any) {
      alert(`Lifecycle Transition Error: ${err.message}`);
    } finally {
      setActioning(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--text-muted)] text-xs gap-3 font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
        <span>Acquiring Control Room Telemetry...</span>
      </div>
    );
  }

  const examState = summary?.exam_state ?? "DRAFT";
  const score = summary?.trust_score ?? 100;
  
  const getNextActionConfig = () => {
    switch (examState) {
      case "DRAFT":
        return {
          title: "Lock Exam Configurations",
          desc: "Admit candidates and center nodes lists are loaded. Seal configurations to prevent post-creation modifications.",
          label: "Lock Configuration",
          action: () => handleTransition("CONFIG_LOCKED"),
          icon: Lock
        };
      case "CONFIG_LOCKED":
        return {
          title: "Generate Paper Sets",
          desc: "Integrity configuration locked. Compile balanced question sheets and compute secure paper sets.",
          label: "Generate Papers",
          action: () => handleTransition("PAPER_GENERATED"),
          icon: FileCheck
        };
      case "PAPER_GENERATED":
        return {
          title: "Seal Center Envelopes",
          desc: "Encryption keys are prepared. Encrypt question sets into center-specific secure packages.",
          label: "Seal Packages",
          action: () => handleTransition("PACKAGE_SEALED"),
          icon: Lock
        };
      case "PACKAGE_SEALED":
        return {
          title: "Open Key Release Window",
          desc: "Exam packages are sealed and queued. Open time-lock key window to prepare dual-custody releases.",
          label: "Open Key Window",
          action: () => handleTransition("RELEASE_WINDOW_OPEN"),
          icon: Network
        };
      case "RELEASE_WINDOW_OPEN":
        return {
          title: "Deploy Exam Live In-Progress",
          desc: "Centers are downloading keys. Transition exam status to live in-progress to verify candidate check-ins.",
          label: "Launch Exam Live",
          action: () => handleTransition("IN_PROGRESS"),
          icon: Radio
        };
      case "IN_PROGRESS":
        return {
          title: "Commit Submissions Lock",
          desc: "Examination duration concluded. Seal OMR bubble scans and descriptive booklets, closing uploads.",
          label: "Lock Submissions",
          action: () => handleTransition("SUBMISSION_LOCKED"),
          icon: Lock
        };
      case "SUBMISSION_LOCKED":
        return {
          title: "Initialize Double Evaluation",
          desc: "Copies are anonymized. Start the double evaluation rubrics marking and OMR review gates.",
          label: "Start Grading",
          action: () => handleTransition("EVALUATION_OPEN"),
          icon: Scale
        };
      case "EVALUATION_OPEN":
        return {
          title: "Review Result Safety Gate",
          desc: "Evaluation and OMR bubble scans concluded. Run safety checklist verification before publication release.",
          label: "Verify Safety Checklist",
          action: () => setActiveTab("results"),
          icon: CheckCircle2
        };
      case "RESULT_VERIFICATION":
        return {
          title: "Publish Exam Results",
          desc: "All critical safety gates passed checks. Publish certified results ledger and candidate transcripts.",
          label: "Publish Results Ledger",
          action: () => handleTransition("RESULT_PUBLISHED"),
          icon: Unlock
        };
      default:
        return {
          title: "Operations Fully Concluded",
          desc: "Ledger audit timeline closed. Final certificates and compliance evidence binder are signed.",
          label: "View Evidence Report",
          action: () => setActiveTab("audit"),
          icon: CheckCircle2
        };
    }
  };

  const nextAction = getNextActionConfig();

  const centerColumns: ForgeTableColumn<any>[] = [
    {
      key: "center_id",
      header: "Center ID",
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.center_id}</ForgeMonoText>
    },
    {
      key: "package_status",
      header: "Key Release",
      render: (row) => (
        <ForgeStatusPill status={row.package_status === "RELEASED" ? "completed" : "scheduled"} />
      )
    },
    {
      key: "verified_candidates",
      header: "Verified Present",
      render: (row) => <span className="text-[var(--text-secondary)] font-medium">{row.verified_candidates} present</span>
    },
    {
      key: "status",
      header: "Node Status",
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <ForgeSection
      title={summary?.exam_name || "National Scholarship Test 2026"}
      subtitle={`Exam ID: ${examId} | Mode: Hybrid (OMR + Descriptive Written)`}
      action={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-control)] bg-[var(--surface-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)]">
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase">Integrity Score</span>
            <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{score} / 100</span>
            <div className={`w-2.5 h-2.5 rounded-full ${score >= 95 ? "bg-emerald-500" : "bg-red-500"}`} />
          </div>
          <ForgeButton variant="secondary" size="compact" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? "animate-spin text-[var(--accent-primary)]" : ""}`} />
            Sync Control
          </ForgeButton>
        </div>
      }
    >
      {/* Next Best Action Widget */}
      <NextBestAction
        title={nextAction.title}
        description={nextAction.desc}
        actionLabel={nextAction.label}
        onClick={nextAction.action}
        icon={nextAction.icon}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto my-4 pb-px">
        {[
          { id: "overview", label: "Overview", icon: Compass },
          { id: "setup", label: "Readiness Checklist", icon: FileCheck },
          { id: "centers", label: "Centers & Seating", icon: Users },
          { id: "biometrics", label: "Biometric Registry", icon: Fingerprint },
          { id: "paper", label: "Question & Paper", icon: Key },
          { id: "conduct", label: "Exam Conduct", icon: Radio },
          { id: "evaluation", label: "Evaluation Control", icon: Scale },
          { id: "results", label: "Result Safety", icon: Lock },
          { id: "audit", label: "Evidence Timeline", icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 tracking-wide transition shrink-0 cursor-pointer ${
                isActive 
                  ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary-surface)]" 
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            <div className="lg:col-span-8 space-y-6">
              
              <ForgeMetricGrid columns={4}>
                <ForgeMetric 
                  label="Centers Registry"
                  value={summary?.stats.total_centers ?? 0}
                  description="Node centers active"
                />
                <ForgeMetric 
                  label="Verified Check-ins"
                  value={`${summary?.stats.verified_candidates ?? 0} / ${summary?.stats.total_candidates ?? 0}`}
                  description="Biometric checks sync"
                />
                <ForgeMetric 
                  label="Scans Ingested"
                  value={`${summary?.stats.submission_completed ?? 0} OMR`}
                  description="Chained receipt sheets"
                />
                <ForgeMetric 
                  label="Active Incidents"
                  value={`${incidents.filter(i => i.status === "OPEN").length} open`}
                  status={incidents.filter(i => i.status === "OPEN").length > 0 ? "danger" : "ok"}
                  description="Warnings flagged"
                />
              </ForgeMetricGrid>

              <ForgeCard>
                <ForgeCardHeader>
                  <ForgeCardTitle className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[var(--accent-primary)]" />
                    Deployment Subsystems Health
                  </ForgeCardTitle>
                </ForgeCardHeader>
                <ForgeCardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
                    <div className="bg-[var(--surface-interactive)] p-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Core Database</span>
                      <span className="text-[var(--status-operational-text)] font-bold mt-1 block">READY</span>
                    </div>
                    <div className="bg-[var(--surface-interactive)] p-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Redis Caching</span>
                      <span className="text-[var(--status-operational-text)] font-bold mt-1 block">ACTIVE</span>
                    </div>
                    <div className="bg-[var(--surface-interactive)] p-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Object Storage</span>
                      <span className="text-[var(--status-operational-text)] font-bold mt-1 block">READY</span>
                    </div>
                    <div className="bg-[var(--surface-interactive)] p-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block">Audit Ledger</span>
                      <span className="text-[var(--status-operational-text)] font-bold mt-1 block">INTACT</span>
                    </div>
                  </div>
                </ForgeCardContent>
              </ForgeCard>

            </div>

            <div className="lg:col-span-4 flex flex-col justify-between">
              <ForgeCard className="h-full flex flex-col justify-between">
                <ForgeCardHeader>
                  <ForgeCardTitle>Guided Stage Steppers</ForgeCardTitle>
                </ForgeCardHeader>
                <ForgeCardContent className="space-y-4 flex-1">
                  <LifecycleStepper stages={DEFAULT_STAGES.slice(0, 5)} activeSequence={STATE_SEQUENCE[examState]} />
                </ForgeCardContent>
                <div className="p-[var(--space-card)] border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex justify-between items-center font-medium">
                  <span>Active State: <span className="font-semibold text-[var(--text-primary)]">{examState}</span></span>
                  <button onClick={() => setActiveTab("setup")} className="text-[var(--accent-primary)] font-semibold hover:underline cursor-pointer flex items-center">
                    Readiness checklist <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </ForgeCard>
            </div>
          </div>
        )}

        {/* Tab 2: Setup Readiness */}
        {activeTab === "setup" && (
          <ForgeCard className="animate-in fade-in duration-200">
            <ForgeCardHeader>
              <ForgeCardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-operational-text)]" />
                Exam Launch Readiness Checklist
              </ForgeCardTitle>
            </ForgeCardHeader>
            <ForgeCardContent className="space-y-4">
              <p className="text-xs text-[var(--text-muted)]">
                Verify that all prerequisites are lock-sealed before transitioning the exam to live.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div className="p-3.5 bg-[var(--status-operational-surface)] rounded-[var(--radius-control)] border border-[var(--status-operational-border)] flex justify-between items-center">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-[var(--status-operational-text)] font-bold">✓</span>
                      <div>
                        <span className="text-[var(--text-primary)] font-bold block">Exam details added</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Name and hybrid parameters locked</span>
                      </div>
                    </div>
                    <ForgeStatusPill status="completed" />
                  </div>
                  <div className="p-3.5 bg-[var(--status-operational-surface)] rounded-[var(--radius-control)] border border-[var(--status-operational-border)] flex justify-between items-center">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-[var(--status-operational-text)] font-bold">✓</span>
                      <div>
                        <span className="text-[var(--text-primary)] font-bold block">Integrity package selected</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Authority Grade package active</span>
                      </div>
                    </div>
                    <ForgeStatusPill status="completed" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[var(--status-operational-surface)] rounded-[var(--radius-control)] border border-[var(--status-operational-border)] flex justify-between items-center">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-[var(--status-operational-text)] font-bold">✓</span>
                      <div>
                        <span className="text-[var(--text-primary)] font-bold block">Candidates imported</span>
                        <span className="text-[10px] text-[var(--text-muted)]">40,000 admit cards hashed</span>
                      </div>
                    </div>
                    <ForgeStatusPill status="completed" />
                  </div>
                  <div className="p-3.5 bg-[var(--status-operational-surface)] rounded-[var(--radius-control)] border border-[var(--status-operational-border)] flex justify-between items-center">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-[var(--status-operational-text)] font-bold">✓</span>
                      <div>
                        <span className="text-[var(--text-primary)] font-bold block">Centers assigned</span>
                        <span className="text-[10px] text-[var(--text-muted)]">80 center nodes mapped</span>
                      </div>
                    </div>
                    <ForgeStatusPill status="completed" />
                  </div>
                </div>
              </div>
            </ForgeCardContent>
          </ForgeCard>
        )}

        {/* Tab 3: Centers & Seating */}
        {activeTab === "centers" && (
          <div className="animate-in fade-in duration-200">
            <ForgeSeatingEngine />
          </div>
        )}

        {/* Tab: Biometric Registry Studio */}
        {activeTab === "biometrics" && (
          <div className="animate-in fade-in duration-200">
            <ForgeBiometricAnalysisStudio />
          </div>
        )}

        {/* Tab 4: Question & Paper Studio */}
        {activeTab === "paper" && (
          <div className="animate-in fade-in duration-200">
            <ForgeQuestionPaperStudio />
          </div>
        )}

        {/* Tab 5: Exam Conduct Workbench */}
        {activeTab === "conduct" && (
          <div className="animate-in fade-in duration-200">
            <ForgeExamConductWorkbench />
          </div>
        )}

        {/* Tab 6: Evaluation Control Studio */}
        {activeTab === "evaluation" && (
          <div className="animate-in fade-in duration-200">
            <ForgeEvaluationControlStudio />
          </div>
        )}

      </div>

      <ProofDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        proof={selectedProof} 
      />
    </ForgeSection>
  );
}
