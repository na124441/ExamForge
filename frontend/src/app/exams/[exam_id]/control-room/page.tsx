"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Radio, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Play,
  CheckCircle2,
  ChevronRight,
  Database,
  Users,
  Lock,
  Unlock,
  Cpu,
  Layers,
  Scale,
  Briefcase,
  History,
  Activity,
  FileCheck,
  Server,
  Network,
  Inbox,
  UserCheck,
  Key,
  Flame,
  Compass
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrustScoreGauge } from "@/components/ui/TrustScoreGauge";
import { LifecycleStepper } from "@/components/ui/LifecycleStepper";
import { BlockingReasons } from "@/components/ui/BlockingReasons";
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

export default function ExamControlRoom({ params }: { params: any }) {
  const router = useRouter();
  const [examId, setExamId] = useState("EXM-001");
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

  // Resolution states
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<ProofData | null>(null);
  
  // Custom interactive telemetry states
  const [selectedCenter, setSelectedCenter] = useState("CTR-LKO-01");
  const [hoveredSeat, setHoveredSeat] = useState<any>(null);

  // Unwrap params safely
  useEffect(() => {
    if (params) {
      Promise.resolve(params).then((resolved: any) => {
        if (resolved && resolved.exam_id) {
          setExamId(resolved.exam_id);
        }
      });
    }
  }, [params]);

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

  // State transitions
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

  const handleResolveIncident = async (incidentId: string) => {
    const notes = resolutionNotes[incidentId] || "Incident reviewed and resolved by controller.";
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          resolution_notes: notes,
          evidence_text: `Evidence compiled and certified by Controller.`
        })
      });
      if (!res.ok) throw new Error("Failed to resolve incident");
      
      setResolutionNotes(prev => {
        const copy = { ...prev };
        delete copy[incidentId];
        return copy;
      });
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleBlockClick = (block: any) => {
    const proof: ProofData = {
      resourceId: block.resource_id,
      resourceType: block.resource_type,
      payloadHash: block.payload_hash,
      previousHash: block.previous_hash,
      currentHash: block.current_hash,
      signature: "MEYCIQCc9v19sO12X9kGq81jA208B81a3d9f429188e001ba7e44ee52b1ba7d4c9f1a01AiEA2b... (ECDSA signature)",
      actorName: block.actor_name,
      actorRole: "Simulated Signing Authority",
      timestamp: block.timestamp,
      auditEvent: block.action,
      explanation: block.explanation
    };
    setSelectedProof(proof);
    setIsDrawerOpen(true);
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚙️</span>
        <span>ACQUIRING SERVICE COMMAND ROOM DATA...</span>
      </div>
    );
  }

  const examState = summary?.exam_state ?? "DRAFT";
  const score = summary?.trust_score ?? 100;
  
  // Choose next action block dynamically based on state
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

  return (
    <div className="space-y-6">
      {/* Top Banner: Single Exam Control Room */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase font-bold">
            <span>Control Room</span>
            <span>•</span>
            <span className="text-violet-400">Authority Grade Package</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mt-1">
            {summary?.exam_name || "National Scholarship Test 2026"}
          </h1>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal font-mono">
            Exam ID: <span className="text-slate-300 font-semibold">{examId}</span> | Mode: <span className="text-slate-300">Hybrid (OMR + Descriptive Written)</span>
          </p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <div className="bg-slate-950 border border-slate-850 p-2.5 px-4 rounded-xl flex items-center gap-3 font-mono text-xs text-left">
            <div>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Integrity Score</span>
              <span className="text-sm font-black text-white">{score} / 100</span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${score >= 95 ? "bg-emerald-400" : "bg-red-400 animate-ping"}`} />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition flex items-center font-mono text-xs gap-1.5 self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync Control</span>
          </button>
        </div>
      </div>

      {/* Next Best Action Widget */}
      <NextBestAction
        title={nextAction.title}
        description={nextAction.desc}
        actionLabel={nextAction.label}
        onClick={nextAction.action}
        icon={nextAction.icon}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-900 overflow-x-auto pb-px scrollbar-thin">
        {[
          { id: "overview", label: "Overview", icon: Compass },
          { id: "setup", label: "Readiness Checklist", icon: FileCheck },
          { id: "centers", label: "Centers & Seating", icon: Users },
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
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-mono font-bold border-b-2 tracking-wide uppercase transition shrink-0 cursor-pointer ${
                isActive 
                  ? "border-blue-500 text-white" 
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
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
            {/* Overview Stats Cards (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Centers Registry</span>
                  <span className="text-2xl font-black text-white mt-1 font-mono">{summary?.stats.total_centers ?? 0}</span>
                  <span className="text-[9px] text-slate-500">Node centers active</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Verified Check-ins</span>
                  <span className="text-2xl font-black text-white mt-1 font-mono">
                    {summary?.stats.verified_candidates ?? 0} <span className="text-xs text-slate-500">/ {summary?.stats.total_candidates ?? 0}</span>
                  </span>
                  <span className="text-[9px] text-slate-500">Biometric checks sync</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Scans Ingested</span>
                  <span className="text-2xl font-black text-white mt-1 font-mono">
                    {summary?.stats.submission_completed ?? 0} <span className="text-xs text-slate-500">OMR</span>
                  </span>
                  <span className="text-[9px] text-slate-500">Chained receipt sheets</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Active Incidents</span>
                  <span className={`text-2xl font-black mt-1 font-mono ${incidents.filter(i => i.status === "OPEN").length > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                    {incidents.filter(i => i.status === "OPEN").length} open
                  </span>
                  <span className="text-[9px] text-slate-500">Warnings flagged</span>
                </div>
              </div>

              {/* Subsystems integrity grid */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Deployment Subsystems Health</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center text-xs">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Core Database</span>
                    <span className="text-emerald-400 font-bold mt-1.5 block">READY</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Redis Caching</span>
                    <span className="text-emerald-400 font-bold mt-1.5 block">ACTIVE</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Object Storage</span>
                    <span className="text-emerald-400 font-bold mt-1.5 block">READY</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Audit Ledger</span>
                    <span className="text-emerald-400 font-bold mt-1.5 block">INTACT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stepper Summary (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-mono">
                  Guided Stage steppers
                </h3>
                <LifecycleStepper stages={DEFAULT_STAGES.slice(0, 5)} activeSequence={STATE_SEQUENCE[examState]} />
              </div>
              <div className="text-[10px] text-slate-500 font-mono border-t border-slate-850 pt-3 mt-4 flex justify-between">
                <span>Active State: {examState}</span>
                <button onClick={() => setActiveTab("setup")} className="text-blue-400 hover:underline">Readiness checklist →</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Setup Readiness Checklist */}
        {activeTab === "setup" && (
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850 shadow-lg space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Exam Launch Readiness Checklist</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify that all prerequisites are lock-sealed before transitioning the exam to live.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-emerald-500/10 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <div>
                      <span className="text-white font-bold block">Exam details added</span>
                      <span className="text-[9px] text-slate-500">Name and hybrid parameters locked</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">Ready</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-emerald-500/10 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <div>
                      <span className="text-white font-bold block">Integrity package selected</span>
                      <span className="text-[9px] text-slate-500">Authority Grade package active</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">Ready</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-emerald-500/10 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <div>
                      <span className="text-white font-bold block">Question bank ready</span>
                      <span className="text-[9px] text-slate-500">Question sets catalog sealed</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">Ready</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-emerald-500/10 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <div>
                      <span className="text-white font-bold block">Candidates imported</span>
                      <span className="text-[9px] text-slate-500">40,000 admit cards hashed</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">Ready</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-emerald-500/10 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <div>
                      <span className="text-white font-bold block">Centers assigned</span>
                      <span className="text-[9px] text-slate-500">80 center nodes mapped</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">Ready</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-600 font-bold">•</span>
                    <div>
                      <span className="text-slate-400 font-semibold block">Center packages sealed</span>
                      <span className="text-[9px] text-slate-500">Pending package keys generations</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleTransition("PACKAGE_SEALED")}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] uppercase font-bold"
                  >
                    Seal Envelopes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Centers & Seating */}
        {activeTab === "centers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left: Centers Table (7 cols) */}
            <div className="lg:col-span-7 bg-glass p-5 rounded-2xl border border-slate-900/60 shadow-lg space-y-4">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Center Nodes & Seating Registries</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select a center node to inspect its live physical seating map.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-900/60 text-slate-500">
                      <th className="py-2.5 px-3">Center ID</th>
                      <th className="py-2.5 px-3">Key Release</th>
                      <th className="py-2.5 px-3">Verified Present</th>
                      <th className="py-2.5 px-3">Incidents</th>
                      <th className="py-2.5 px-3 text-right">Node status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50 text-slate-350">
                    {summary?.centers.map((c: any) => {
                      const isSelected = selectedCenter === c.center_id;
                      return (
                        <tr 
                          key={c.center_id} 
                          onClick={() => {
                            setSelectedCenter(c.center_id);
                            setHoveredSeat(null);
                          }}
                          className={`hover:bg-slate-900/20 cursor-pointer transition ${
                            isSelected ? "bg-blue-950/20 border-l-2 border-blue-500 font-bold" : ""
                          }`}
                        >
                          <td className="py-3.5 px-3 text-white">{c.center_id}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              c.package_status === "RELEASED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>{c.package_status}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-300">{c.verified_candidates} present</td>
                          <td className="py-3.5 px-3 text-red-400">{c.unresolved_incidents} active</td>
                          <td className="py-3.5 px-3 text-right">
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Seating Map Grid (5 cols) */}
            <div className="lg:col-span-5 bg-glass p-5 rounded-2xl border border-slate-900/60 shadow-lg flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Live telemetry feed</span>
                  <span className="text-[10px] text-cyan-405 font-mono font-bold uppercase">{selectedCenter} Map</span>
                </div>
                
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4">
                  Physical Seating Grid Layout
                </h3>

                {/* Grid */}
                <div className="grid grid-cols-8 gap-2 bg-slate-950/60 p-4 border border-slate-900 rounded-2xl">
                  {Array.from({ length: 48 }).map((_, i) => {
                    // Deterministic state generator for mock layout
                    const val = (i * 7 + selectedCenter.charCodeAt(selectedCenter.length - 1)) % 10;
                    let status: "verified" | "inprogress" | "anomaly" | "absent" = "verified";
                    if (val < 1) status = "anomaly";
                    else if (val < 3) status = "absent";
                    else if (val < 4.5) status = "inprogress";

                    const seatInfo = {
                      id: i + 1,
                      status,
                      candidate: {
                        name: `Candidate #${2400 + i}`,
                        roll: `EXM-26-${selectedCenter}-${100 + i}`,
                        biometrics: status === "verified" ? "MATCHED (100%)" : status === "anomaly" ? "FAILED (DESYNC)" : status === "inprogress" ? "PENDING MATCH" : "N/A (ABSENT)",
                        ip: `10.12.${selectedCenter.charCodeAt(selectedCenter.length - 1)}.${10 + i}`
                      }
                    };

                    let dotColor = "bg-slate-800 border-slate-900";
                    if (status === "verified") dotColor = "bg-emerald-500 shadow-glow-emerald border-emerald-400/30";
                    else if (status === "inprogress") dotColor = "bg-blue-500 shadow-glow-blue border-blue-400/30";
                    else if (status === "anomaly") dotColor = "bg-red-500 shadow-glow-red animate-pulse border-red-400/30";

                    return (
                      <div 
                        key={i}
                        onMouseEnter={() => setHoveredSeat(seatInfo)}
                        className={`w-full aspect-square rounded-lg border flex items-center justify-center transition-all cursor-crosshair hover:scale-115 ${dotColor}`}
                        title={`Seat ${i + 1} - ${status}`}
                      >
                        <span className="text-[7px] text-slate-950 font-black font-mono">{i + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[9px] text-slate-500 px-1 border-b border-slate-900/60 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-glow-blue" />
                    <span>Verifying</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-glow-red animate-pulse" />
                    <span>Anomaly</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                    <span>Absent</span>
                  </div>
                </div>
              </div>

              {/* Inspector Card */}
              <div className="mt-4 bg-slate-950/40 border border-slate-900 p-4.5 rounded-xl min-h-[105px] flex flex-col justify-center font-mono">
                {hoveredSeat ? (
                  <div className="text-[10px] space-y-1 animate-in fade-in duration-150">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Seat Node:</span>
                      <span className="text-white font-bold">#{hoveredSeat.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Candidate:</span>
                      <span className="text-slate-250 font-semibold">{hoveredSeat.candidate.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Roll Reg:</span>
                      <span className="text-slate-250">{hoveredSeat.candidate.roll}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Biometrics:</span>
                      <span className={`font-bold ${hoveredSeat.status === "verified" ? "text-emerald-450" : hoveredSeat.status === "anomaly" ? "text-red-400" : "text-blue-400"}`}>
                        {hoveredSeat.candidate.biometrics}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Machine IP:</span>
                      <span className="text-slate-400 font-bold">{hoveredSeat.candidate.ip}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-600 text-[10px] leading-relaxed">
                    ⚙️ HOVER A SEAT NODE ON THE MAP GRID TO INSPECT REAL-TIME CANDIDATE TELEMETRY
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Question & Paper */}
        {activeTab === "paper" && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-violet-400" />
                  <span>Secure Paper Sets & Blueprints</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Locks the topic weighting distributions and generates cryptographically signed paper sets.
                </p>
              </div>
              <button 
                onClick={() => handleTransition("PAPER_GENERATED")}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-mono uppercase"
              >
                Generate Paper sets
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850 space-y-3">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Subject Distribution Blueprint</span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Mathematics</span>
                    <span className="text-white font-bold">30 questions (60 marks)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Physics</span>
                    <span className="text-white font-bold">25 questions (50 marks)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chemistry</span>
                    <span className="text-white font-bold">25 questions (50 marks)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850 space-y-3">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Generated Paper Sets</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Set A (Alpha)</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] border border-emerald-500/20 font-bold uppercase">Sealed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Set B (Beta)</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] border border-emerald-500/20 font-bold uppercase">Sealed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Set C (Gamma)</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] border border-emerald-500/20 font-bold uppercase">Sealed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Exam Conduct */}
        {activeTab === "conduct" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Live incident responder (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Active Security Incidents</span>
                </h3>

                <div className="space-y-3">
                  {incidents.filter(i => i.status === "OPEN").length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-mono text-xs border border-dashed border-slate-850 rounded-xl">
                      🟢 ALL NODE CHANNELS SECURE. NO ACTIVE ALERTS REPORTED.
                    </div>
                  ) : (
                    incidents.filter(i => i.status === "OPEN").map(inc => (
                      <div key={inc.incident_id} className="p-4 rounded-xl bg-slate-950 border border-red-500/20 flex justify-between items-center gap-4 text-xs font-mono">
                        <div>
                          <div className="flex items-center gap-2 font-bold">
                            <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.2 rounded text-[8px]">{inc.severity}</span>
                            <span className="text-white">{inc.incident_type}</span>
                          </div>
                          <p className="text-slate-400 mt-1.5 font-sans leading-normal">{inc.description}</p>
                        </div>
                        <button 
                          onClick={() => handleResolveIncident(inc.incident_id)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded uppercase text-[10px]"
                        >
                          Resolve
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Logs console (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between h-[240px]">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 mb-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <span>Operations Console</span>
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans mb-3">
                  Live diagnostics and key releases logged during the exam window.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl font-mono text-[9px] text-[#00ff66]/80 flex-1 overflow-y-auto space-y-1">
                <div>[INIT] Decryption keys sealed in HSM storage.</div>
                <div>[AUTH] Dual custody keys check completed.</div>
                <div>[OK] Centers node handshake validated.</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Evaluation Control */}
        {activeTab === "evaluation" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left columns (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Grading modules */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">Evaluation Modules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <Link href="/evaluator/queue" className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 hover:border-slate-700 transition flex justify-between items-center group">
                    <div>
                      <span className="text-slate-200 font-bold block">Anonymous Grading queue</span>
                      <span className="text-[9px] text-slate-500 block mt-1">Assign booklet copies to evaluators</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                  </Link>

                  <Link href="/evaluation-conflicts" className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 hover:border-slate-700 transition flex justify-between items-center group">
                    <div>
                      <span className="text-slate-200 font-bold block">Reconcile Score Variance</span>
                      <span className="text-[9px] text-slate-500 block mt-1">Override double evaluation conflicts</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: stats (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Grading Status</h3>
              <div className="space-y-2.5 font-mono text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Locked Booklets:</span>
                  <span className="text-white font-bold">{gateStatus?.checklist.find((c: any) => c.name.includes("Evaluation"))?.passed ? "100%" : "38,900 / 40,000"}</span>
                </div>
                <div className="flex justify-between">
                  <span>OMR Bubbles Corrected:</span>
                  <span className="text-white font-bold">{gateStatus?.checklist.find((c: any) => c.name.includes("OMR"))?.passed ? "100%" : "98% finalized"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Variance Conflicts:</span>
                  <span className="text-amber-400 font-bold">22 open review files</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Results Gate */}
        {activeTab === "results" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Safety check list (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Result Safety Release Check</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  The gate will block publishing final scores if any P0 security rule fails or the trust score is below 98.
                </p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {gateStatus?.checklist.map((item: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border flex items-center justify-between gap-4 font-mono text-xs ${
                      item.passed ? "border-emerald-500/15 bg-emerald-500/2" : "border-red-500/15 bg-red-500/2"
                    }`}
                  >
                    <div>
                      <span className="text-white font-bold text-[11px] block">{item.name}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5 leading-tight">{item.details}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${item.passed ? "text-emerald-400" : "text-red-400 animate-pulse"}`}>
                      {item.passed ? "✓ Passed" : "❌ Blocked"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verdict card (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg flex flex-col justify-between min-h-[280px]">
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Safety Verdict</span>
                <h4 className={`text-xl font-black tracking-tight mt-1 uppercase ${
                  gateStatus?.allowed ? "text-emerald-400" : "text-red-400"
                }`}>
                  {gateStatus?.allowed ? "🔓 Gate Approved" : "🔒 Locked / Blocked"}
                </h4>
                <p className="text-[11px] text-slate-500 font-sans mt-3 leading-relaxed">
                  {gateStatus?.allowed 
                    ? "Verify and sign the final results block to release grades to the Candidate Portal." 
                    : "The gate has locked the release keyspace. Check the failed checklist items to proceed."}
                </p>
              </div>

              <button
                onClick={() => handleTransition("RESULT_PUBLISHED")}
                disabled={!gateStatus?.allowed || actioning}
                className={`w-full py-2.5 rounded-lg font-mono font-black text-xs uppercase transition tracking-wider ${
                  gateStatus?.allowed 
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-450" 
                    : "bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed"
                }`}
              >
                {actioning ? "Publishing..." : "Publish verified results"}
              </button>
            </div>
          </div>
        )}

        {/* Tab 8: Evidence Timeline */}
        {activeTab === "audit" && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Verifiable Evidence Ledger Blocks</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Inspect chained hashes block by block. Click any record to expand cryptographic signatures.
              </p>
            </div>

            <div className="relative pl-6 border-l border-slate-850 space-y-4 ml-2.5 font-mono text-xs">
              {timeline.slice(0, 4).map((block) => (
                <div
                  key={block.index}
                  onClick={() => handleBlockClick(block)}
                  className="bg-slate-950/40 p-4.5 rounded-xl border border-slate-850 cursor-pointer hover:border-slate-700 transition relative flex flex-col gap-2 hover:shadow-lg hover:shadow-black/20"
                >
                  {/* Dot */}
                  <span className="absolute left-[-29px] top-[22px] w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-950" />
                  
                  <div className="flex justify-between items-center flex-wrap gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-extrabold uppercase text-[9px] px-1.5 py-0.2 bg-slate-900 rounded border border-slate-850">
                        Block #{block.index}
                      </span>
                      <span className="text-white font-bold text-xs uppercase tracking-wide">
                        {block.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-slate-500 font-bold">{new Date(block.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-1">
                    {block.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Reusable Cryptographic proof drawer */}
      <ProofDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        proof={selectedProof} 
      />
    </div>
  );
}
