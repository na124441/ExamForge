"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Activity, 
  Lock,
  Unlock,
  Radio, 
  Database,
  Cpu,
  Layers,
  Key,
  ShieldCheck,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { ForgeSection } from "@/components/forge/ForgeSection";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeTabs, ForgeTabItem } from "@/components/forge/ForgeTabs";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeActivityFeed, ForgeActivityEvent } from "@/components/forge/ForgeActivityFeed";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { cn } from "@/lib/cn";

interface Paper {
  id: string;
  name: string;
  hash: string;
  progress: number;
  status: "IDLE" | "ENCRYPTING" | "SECURED";
}

interface OMRQuestion {
  id: number;
  ans: string;
  density: number;
  conf: number;
  status: "VERIFIED" | "AMBIGUOUS" | "RESOLVED";
  isDouble?: boolean;
}

interface LedgerEvent {
  id: number;
  type: string;
  label: string;
  desc: string;
  timestamp: string;
  actor: string;
  status: "SECURED" | "FRACTURED";
  prevHash: string;
  currHash: string;
}

export default function WarRoomPage() {
  const [systemLatency, setSystemLatency] = useState<number>(140);
  const [timeStr, setTimeStr] = useState<string>("");
  const [activeWorkstations, setActiveWorkstations] = useState<number>(10477);
  
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>(
    "UPDATE grades SET total_score = 98 WHERE candidate_id = 'ANON-8891';"
  );

  const [papers, setPapers] = useState<Paper[]>([
    { id: "SET_A", name: "Paper Set A (General)", hash: "-------------------------", progress: 0, status: "IDLE" },
    { id: "SET_B", name: "Paper Set B (Advanced)", hash: "-------------------------", progress: 0, status: "IDLE" },
    { id: "SET_C", name: "Paper Set C (Reserves)", hash: "-------------------------", progress: 0, status: "IDLE" }
  ]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [centerNodes, setCenterNodes] = useState([
    { id: "BOM_01", name: "West Node (Mumbai)", status: "VERIFIED" },
    { id: "DEL_02", name: "North Node (Delhi)", status: "VERIFIED" },
    { id: "BLR_03", name: "South Node (Bangalore)", status: "VERIFIED" },
    { id: "MAA_04", name: "East Node (Chennai)", status: "VERIFIED" },
    { id: "KOL_05", name: "Reserve Node (Kolkata)", status: "PENDING" }
  ]);

  const [omrList, setOmrList] = useState<OMRQuestion[]>([
    { id: 11, ans: "A", density: 98, conf: 99.4, status: "VERIFIED" },
    { id: 12, ans: "C", density: 95, conf: 98.9, status: "VERIFIED" },
    { id: 13, ans: "B", density: 91, conf: 97.6, status: "VERIFIED" },
    { id: 14, ans: "C / D", density: 88, conf: 41.2, status: "AMBIGUOUS", isDouble: true },
    { id: 15, ans: "A", density: 96, conf: 99.1, status: "VERIFIED" },
    { id: 16, ans: "D", density: 94, conf: 98.5, status: "VERIFIED" },
    { id: 17, ans: "A / B", density: 79, conf: 38.5, status: "AMBIGUOUS", isDouble: true },
    { id: 18, ans: "C", density: 97, conf: 99.3, status: "VERIFIED" },
  ]);
  
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([
    { 
      id: 1, 
      type: "GEN_PAPERS", 
      label: "PAPER CRYPTO KEYRING GENERATION", 
      desc: "Generated paper sets (SET A, B, C) with cryptographic key wraps.",
      timestamp: "12:05:14", 
      actor: "SYSTEM // AUTH", 
      status: "SECURED", 
      prevHash: "0000000000000000",
      currHash: "7b4c8d9e2a10b4f8"
    },
    { 
      id: 2, 
      type: "KEY_LOCK", 
      label: "ON-CHAIN KEYLOCK REGISTERED", 
      desc: "Anchored time-locked decryption key contract to consensus layer.",
      timestamp: "12:08:22", 
      actor: "VAULT COMMAND", 
      status: "SECURED", 
      prevHash: "7b4c8d9e2a10b4f8",
      currHash: "f3c9e5b2a0c4f8d1"
    },
    { 
      id: 3, 
      type: "CENTER_VERIFY", 
      label: "CENTER IDENTITY HANDSHAKE", 
      desc: "ECDSA key signatures received from all 5 operational testing nodes.",
      timestamp: "12:12:45", 
      actor: "GATE KEEPER", 
      status: "SECURED", 
      prevHash: "f3c9e5b2a0c4f8d1",
      currHash: "a4b8c9d0e1f2a3b4"
    },
    { 
      id: 4, 
      type: "OMR_INGEST", 
      label: "OMR BUBBLE EXTRACTED", 
      desc: "Scanned bubble sheet input processed by OpenCV ingestion workbench.",
      timestamp: "12:15:30", 
      actor: "OFFICER-04", 
      status: "SECURED", 
      prevHash: "a4b8c9d0e1f2a3b4",
      currHash: "c5d6e7f8a9b0c1d2"
    },
    { 
      id: 5, 
      type: "AI_GRADE_LOCK", 
      label: "AI EVALUATION REGISTERED", 
      desc: "Anonymized grading results signature appended by Evaluator EV-09.",
      timestamp: "12:17:11", 
      actor: "EVAL PANEL", 
      status: "SECURED", 
      prevHash: "c5d6e7f8a9b0c1d2",
      currHash: "e3f4a5b6c7d8e9f0"
    }
  ]);

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toUTCString());
    tick();
    const clockInt = setInterval(tick, 1000);

    const latencyInt = setInterval(() => {
      setSystemLatency(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next < 120 ? 120 : next > 250 ? 250 : next;
      });
      setActiveWorkstations(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return next > 10500 ? 10500 : next < 10470 ? 10470 : next;
      });
    }, 3000);

    return () => {
      clearInterval(clockInt);
      clearInterval(latencyInt);
    };
  }, []);

  const handleGeneratePapers = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    setPapers(prev => prev.map(p => ({ ...p, progress: 0, status: "ENCRYPTING", hash: "GENERATING..." })));

    let currentPaperIdx = 0;
    const progressInterval = setInterval(() => {
      setPapers(prev => {
        const next = [...prev];
        const paper = next[currentPaperIdx];
        if (paper.progress < 100) {
          paper.progress += 20;
        } else {
          paper.status = "SECURED";
          paper.hash = Math.random().toString(16).substring(2, 10).toUpperCase() + 
                       Math.random().toString(16).substring(2, 10).toUpperCase() + 
                       Math.random().toString(16).substring(2, 10).toUpperCase() + 
                       "8A6E";
          
          if (currentPaperIdx < prev.length - 1) {
            currentPaperIdx++;
          } else {
            clearInterval(progressInterval);
            setIsGenerating(false);
          }
        }
        return next;
      });
    }, 250);
  };

  const toggleCenterNode = (id: string) => {
    setCenterNodes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, status: n.status === "VERIFIED" ? "PENDING" : "VERIFIED" };
      }
      return n;
    }));
  };

  const resolveOMRQuestion = (id: number, forcedAns: string) => {
    setOmrList(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          ans: forcedAns,
          conf: 99.8,
          density: 96,
          status: "RESOLVED"
        };
      }
      return q;
    }));
  };

  const handleInjectMutation = () => {
    setIsTampered(true);
    setLedgerEvents(prev => [{
      id: Date.now(),
      type: "TAMPER_DETECTED",
      label: "DBA INTEGRITY VIOLATION",
      desc: "Unauthorized SQL mutation intercepted via pub-gate monitor. Publication lock engaged.",
      timestamp: new Date().toTimeString().split(" ")[0],
      actor: "INTERCEPTOR SYS",
      status: "FRACTURED",
      prevHash: prev[prev.length - 1].currHash,
      currHash: "CORRUPTED_HASH_CHAIN"
    }, ...prev]);
  };

  const handleHealDatabase = () => {
    setIsTampered(false);
    setLedgerEvents(prev => [{
      id: Date.now(),
      type: "TAMPER_RESOLVED",
      label: "LEDGER SYNCHRONIZATION",
      desc: "Mutation rolled back. Cryptographic state restored.",
      timestamp: new Date().toTimeString().split(" ")[0],
      actor: "VAULT COMMAND",
      status: "SECURED",
      prevHash: prev[0].currHash,
      currHash: Math.random().toString(16).substring(2, 10).toUpperCase() + Math.random().toString(16).substring(2, 10).toUpperCase()
    }, ...prev]);
  };

  const centerNodeCols: ForgeTableColumn<typeof centerNodes[0]>[] = [
    { 
      key: "id", 
      header: "Node ID", 
      mono: true,
      render: (row) => <ForgeMonoText className="font-semibold text-[var(--text-primary)]">{row.id}</ForgeMonoText> 
    },
    { 
      key: "name", 
      header: "Location",
      render: (row) => <span className="font-medium text-[var(--text-primary)]">{row.name}</span>
    },
    { 
      key: "status", 
      header: "Status",
      render: (row) => <ForgeStatusPill status={row.status === "VERIFIED" ? "verified" : "locked"} />
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <ForgeButton size="sm" variant="secondary" onClick={() => toggleCenterNode(row.id)}>
          Toggle Connection
        </ForgeButton>
      )
    }
  ];

  const omrCols: ForgeTableColumn<OMRQuestion>[] = [
    { key: "id", header: "Q ID", mono: true },
    { key: "ans", header: "Answer", mono: true },
    { 
      key: "conf", 
      header: "Confidence", 
      render: (row) => `${row.conf}%` 
    },
    { 
      key: "status", 
      header: "Status",
      render: (row) => <ForgeStatusPill status={row.status === "VERIFIED" ? "verified" : row.status === "AMBIGUOUS" ? "locked" : "completed"} />
    },
    {
      key: "action",
      header: "Resolution",
      render: (row) => row.status === "AMBIGUOUS" ? (
        <div className="flex gap-2">
          <ForgeButton size="sm" variant="secondary" onClick={() => resolveOMRQuestion(row.id, "C")}>Force C</ForgeButton>
          <ForgeButton size="sm" variant="secondary" onClick={() => resolveOMRQuestion(row.id, "D")}>Force D</ForgeButton>
        </div>
      ) : (
        <span className="text-[var(--text-muted)] text-xs">Locked</span>
      )
    }
  ];

  const activityFeedEvents: ForgeActivityEvent[] = ledgerEvents.map(evt => ({
    id: String(evt.id),
    timestamp: evt.timestamp,
    title: evt.label,
    description: evt.desc,
    severity: evt.status === "SECURED" ? "success" : "danger"
  }));

  const tabs: ForgeTabItem[] = [
    {
      value: "nodes",
      label: (
        <span className="flex items-center gap-2 font-medium">
          <Radio size={16} /> Live Center Nodes
        </span>
      ),
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <ForgeCard>
            <ForgeCardHeader>
              <ForgeCardTitle>Test Center Consensus</ForgeCardTitle>
            </ForgeCardHeader>
            <ForgeCardContent className="p-0">
              <ForgeTable columns={centerNodeCols} data={centerNodes} keyField="id" />
            </ForgeCardContent>
          </ForgeCard>

          <ForgeCard variant="dark">
            <ForgeCardHeader>
              <ForgeCardTitle className="text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[var(--forge-cyan)]" />
                Paper Decryption Keys (Dual-Custody)
              </ForgeCardTitle>
            </ForgeCardHeader>
            <ForgeCardContent className="space-y-4">
              <ForgeButton 
                variant="primary" 
                onClick={handleGeneratePapers} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? <Clock className="animate-spin mr-2 h-4 w-4" /> : <Key className="mr-2 h-4 w-4" />}
                Release Package Decryption Keys
              </ForgeButton>

              <div className="space-y-3">
                {papers.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3.5 border border-white/10 rounded-[var(--radius-control)] bg-white/5">
                    <div>
                      <div className="font-semibold text-sm text-white">{p.name}</div>
                      <ForgeMonoText className="text-xs text-white/60">{p.hash}</ForgeMonoText>
                    </div>
                    <ForgeStatusPill status={p.status === "ENCRYPTING" ? "processing" : p.status === "SECURED" ? "completed" : "draft"} />
                  </div>
                ))}
              </div>
            </ForgeCardContent>
          </ForgeCard>
        </div>
      )
    },
    {
      value: "omr",
      label: (
        <span className="flex items-center gap-2 font-medium">
          <Cpu size={16} /> OMR Real-time Scanner Feed
        </span>
      ),
      content: (
        <ForgeCard className="mt-4">
          <ForgeCardHeader>
            <ForgeCardTitle>Live Bubble Extraction Stream</ForgeCardTitle>
          </ForgeCardHeader>
          <ForgeCardContent className="p-0">
            <ForgeTable columns={omrCols} data={omrList} keyField="id" />
          </ForgeCardContent>
        </ForgeCard>
      )
    },
    {
      value: "security",
      label: (
        <span className="flex items-center gap-2 font-medium">
          <Layers size={16} /> Security & Tamper Interceptor
        </span>
      ),
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <ForgeCard variant="dark">
            <ForgeCardHeader>
              <ForgeCardTitle className="text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-red-400" />
                Simulate Rogue Database Modification
              </ForgeCardTitle>
            </ForgeCardHeader>
            <ForgeCardContent className="space-y-4">
              <textarea
                rows={4}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full p-3 font-mono text-sm bg-black/40 border border-white/15 rounded-[var(--radius-control)] text-white focus:outline-none focus:border-[var(--forge-blue)] focus:ring-1 focus:ring-[var(--forge-blue)]"
              />
              <div className="flex gap-3">
                <ForgeButton 
                  variant="danger" 
                  onClick={handleInjectMutation}
                  disabled={isTampered}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Inject SQL Payload
                </ForgeButton>
                {isTampered && (
                  <ForgeButton 
                    variant="primary" 
                    onClick={handleHealDatabase}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Heal & Restore Ledger
                  </ForgeButton>
                )}
              </div>
            </ForgeCardContent>
          </ForgeCard>

          <ForgeCard>
            <ForgeCardHeader>
              <ForgeCardTitle>Live Ledger Activity</ForgeCardTitle>
            </ForgeCardHeader>
            <ForgeCardContent>
              <ForgeActivityFeed events={activityFeedEvents} maxItems={10} />
            </ForgeCardContent>
          </ForgeCard>
        </div>
      )
    }
  ];

  return (
    <ForgeSection
      title="Live War Room"
      subtitle={timeStr || "Real-time Examination Telemetry & Security Operations"}
      action={
        <ForgeStatusPill status={isTampered ? "failed" : "live"} />
      }
    >
      {/* Tamper Alert Banner */}
      {isTampered && (
        <div className="bg-[var(--status-danger-surface)] border border-[var(--status-danger-border)] text-[var(--status-danger-text)] px-4 py-3 rounded-[var(--radius-card)] flex items-center justify-between shadow-sm animate-pulse mb-6">
          <div className="flex items-center gap-3 font-semibold text-sm">
            <ShieldAlert className="h-5 w-5" />
            <span>CRITICAL: PUBLICATION GATE LOCKED. DATABASE TAMPERING DETECTED.</span>
          </div>
          <ForgeButton variant="primary" size="sm" onClick={handleHealDatabase}>
            Heal Network
          </ForgeButton>
        </div>
      )}

      {/* Modern High-Contrast Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Active Candidates */}
        <ForgeCard variant="dark" className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70">
            <span className="text-xs font-bold uppercase tracking-wider">ACTIVE CANDIDATES</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {activeWorkstations.toLocaleString()} <span className="text-sm font-normal text-white/60">/ 10,500</span>
            </div>
            <div className="text-xs text-white/70 mt-1">Live workstation connections</div>
          </div>
        </ForgeCard>

        {/* Sync Latency */}
        <ForgeCard variant="dark" className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70">
            <span className="text-xs font-bold uppercase tracking-wider">SYNC LATENCY</span>
            <Activity className="w-4 h-4 text-[var(--forge-cyan)]" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{systemLatency}ms</span>
              <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center">
                <ArrowDownRight className="w-3 h-3 mr-0.5" /> -12ms
              </span>
            </div>
            <div className="text-xs text-white/70 mt-1">Average cluster response time</div>
          </div>
        </ForgeCard>

        {/* Buffer Queue */}
        <ForgeCard variant="dark" className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70">
            <span className="text-xs font-bold uppercase tracking-wider">BUFFER QUEUE</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">48,291</span>
              <span className="text-xs font-semibold text-white/60">Stable</span>
            </div>
            <div className="text-xs text-white/70 mt-1">Encrypted packets processing</div>
          </div>
        </ForgeCard>

        {/* Security Gate */}
        <ForgeCard variant="dark" className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70">
            <span className="text-xs font-bold uppercase tracking-wider">SECURITY GATE</span>
            {isTampered ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="my-3">
            <div className={cn("text-2xl font-bold tracking-tight font-mono", isTampered ? "text-red-400" : "text-emerald-400")}>
              {isTampered ? "LOCKED" : "READY"}
            </div>
            <div className="text-xs text-white/70 mt-1">Consensus publication lock</div>
          </div>
        </ForgeCard>

      </div>

      {/* Tabs */}
      <ForgeTabs tabs={tabs} />
    </ForgeSection>
  );
}
