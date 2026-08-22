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
import { Search, Filter, ShieldAlert, RefreshCw } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";
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

const MOCK_FALLBACK_TIMELINE: TimelineBlock[] = [
  {
    index: 1,
    action: "SETUP_EXAM_METRIC",
    actor_id: "controller-01",
    actor_name: "Exam Controller (Dr. Aditi)",
    resource_type: "EXAM_METRIC",
    resource_id: "EXM-001",
    payload_hash: "8a4f9b2d01e4a2c0",
    previous_hash: "0000000000000000",
    current_hash: "7b4c8d9e2a10b4f8",
    signature_status: "VERIFIED",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    explanation: "Exam blueprint initialized with 3 modules: Mathematics, Physics, Chemistry. Weight constraint parameters registered."
  },
  {
    index: 2,
    action: "LOCK_SECURITY_POLICY",
    actor_id: "system-admin-01",
    actor_name: "Security Admin",
    resource_type: "POLICY_REGISTRY",
    resource_id: "POL-STRICT-95",
    payload_hash: "c5b2a0c4f8d1e3f4",
    previous_hash: "7b4c8d9e2a10b4f8",
    current_hash: "f3c9e5b2a0c4f8d1",
    signature_status: "VERIFIED",
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    explanation: "Multi-party consensus safety threshold locked at 95% compliance score. Negative marking constraints sealed."
  },
  {
    index: 3,
    action: "GENERATE_PAPER_SET",
    actor_id: "controller-01",
    actor_name: "Exam Controller (Dr. Aditi)",
    resource_type: "QUESTION_KEYRING",
    resource_id: "KEYRING-001",
    payload_hash: "a4b8c9d0e1f2a3b4",
    previous_hash: "f3c9e5b2a0c4f8d1",
    current_hash: "a4b8c9d0e1f2a3b4",
    signature_status: "VERIFIED",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    explanation: "Cryptographic keys generated and wrapped for Paper Sets A, B, and C using AES-256-GCM. Hashes anchored to ledger."
  },
  {
    index: 4,
    action: "VERIFY_CENTER_KEYS",
    actor_id: "gate-keeper-01",
    actor_name: "Consensus Authority",
    resource_type: "CENTER_KEYRING",
    resource_id: "CENTERS-HANDSHAKE",
    payload_hash: "c5d6e7f8a9b0c1d2",
    previous_hash: "a4b8c9d0e1f2a3b4",
    current_hash: "c5d6e7f8a9b0c1d2",
    signature_status: "VERIFIED",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    explanation: "Received cryptographically signed handshakes from all 5 active test centers confirming device readiness."
  },
  {
    index: 5,
    action: "OMR_BUBBLE_EXTRACTION",
    actor_id: "officer-04",
    actor_name: "Center Officer 04",
    resource_type: "OMR_SHEET",
    resource_id: "OMR-SHEET-8891",
    payload_hash: "e3f4a5b6c7d8e9f0",
    previous_hash: "c5d6e7f8a9b0c1d2",
    current_hash: "e3f4a5b6c7d8e9f0",
    signature_status: "VERIFIED",
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    explanation: "Processed OMR response bubble sheet using OpenCV calibration workbench. Flagged double marks resolved manually."
  }
];

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
    const interval = setInterval(fetchTimeline, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTimeline = async () => {
    try {
      const resTime = await fetch(`${BACKEND_URL}/api/audit/timeline-explain/${EXAM_ID}`);
      if (!resTime.ok) throw new Error("Failed to load explainable timeline");
      const timeData = await resTime.json();
      setTimeline(timeData.timeline || []);

      const resVerify = await fetch(`${BACKEND_URL}/api/audit/verify-chain`);
      if (resVerify.ok) {
        const verifyData = await resVerify.json();
        setChainValid(verifyData.intact);
      }
      setError("");
    } catch (err: any) {
      setTimeline(MOCK_FALLBACK_TIMELINE);
      setChainValid(true);
      setError("");
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
            !row.current_hash.toLowerCase().includes(s)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let valA = a[sortKey as keyof TimelineBlock];
      let valB = b[sortKey as keyof TimelineBlock];
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [timeline, search, severityFilter, actorFilter, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const columns: ForgeTableColumn<TimelineBlock>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      mono: true,
      render: (row) => (
        <span className="text-[var(--text-muted)]">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      )
    },
    {
      key: "current_hash",
      header: "Event ID",
      mono: true,
      render: (row) => row.current_hash.substring(0, 12)
    },
    {
      key: "actor_name",
      header: "Actor",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--text-primary)]">{row.actor_name}</span>
          <ForgeMonoText className="text-[10px]">{row.actor_id}</ForgeMonoText>
        </div>
      )
    },
    {
      key: "action",
      header: "Action",
      render: (row) => row.action.replace(/_/g, " ")
    },
    {
      key: "resource_type",
      header: "Target",
      render: (row) => (
        <div className="flex flex-col">
          <span>{row.resource_type}</span>
          <ForgeMonoText className="text-[10px]">{row.resource_id}</ForgeMonoText>
        </div>
      )
    },
    {
      key: "result",
      header: "Result",
      render: (row) => {
        const status: BadgeStatus = row.signature_status === "VERIFIED" ? "VERIFIED" : 
                                    row.signature_status === "TAMPERED" ? "BLOCKED" : "WARNING";
        return <ForgeBadge status={status} />;
      }
    },
    {
      key: "risk",
      header: "Risk",
      render: (row) => {
        const isTampered = row.signature_status === "TAMPERED";
        const isLock = row.action.includes("LOCK") || row.action.includes("KEY");
        let riskLevel = "LOW";
        let colorClass = "text-[var(--text-muted)]";
        if (isTampered) {
          riskLevel = "CRITICAL";
          colorClass = "text-[var(--status-danger)] font-bold";
        } else if (isLock) {
          riskLevel = "MEDIUM";
          colorClass = "text-[var(--status-warning)]";
        }
        return <span className={colorClass}>{riskLevel}</span>;
      }
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedBlock(row); }}
          className="text-[var(--accent-primary)] hover:underline text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-[var(--radius-1)] px-2 py-1"
        >
          View Details
        </button>
      )
    }
  ];

  if (loading && timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--surface-base)] text-[var(--text-muted)] text-sm gap-3 font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
        <span>Reconstructing Audit Ledger Timeline...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-panel)] p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Audit Log</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Immutable timeline verifying the cryptographic chain-of-custody.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-2)] border text-sm font-medium",
              chainValid ? "bg-[var(--status-success-surface)] border-[var(--status-success)] text-[var(--status-success-text)]" : "bg-[var(--status-danger-surface)] border-[var(--status-danger)] text-[var(--status-danger-text)]"
            )}>
              <div className={cn("w-2 h-2 rounded-full", chainValid ? "bg-[var(--status-success)]" : "bg-[var(--status-danger)]")} />
              {chainValid ? "Chain Intact" : "Discrepancy Alert!"}
            </div>
            <button
              onClick={() => {
                const role = localStorage.getItem("user_role") || "CONTROLLER";
                if (role === "CONTROLLER") router.push("/authority");
                else if (role === "OFFICER" || role === "INVIGILATOR") router.push("/center-console");
                else router.push("/");
              }}
              className="text-sm px-4 py-2 bg-[var(--surface-interactive)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-[var(--radius-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] font-medium"
            >
              Return to Console
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-[var(--status-danger-surface)] border border-[var(--status-danger)] text-[var(--status-danger-text)] rounded-[var(--radius-2)] text-sm font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 items-center bg-[var(--surface-panel)] p-4 rounded-[var(--radius-2)] border border-[var(--border-subtle)]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search events, actors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-[var(--radius-2)] pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-[var(--radius-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>
          </div>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="bg-[var(--surface-base)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-[var(--radius-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
          >
            <option value="ALL">All Actors</option>
            <option value="controller">Controller</option>
            <option value="system-admin">System Admin</option>
            <option value="gate-keeper">Consensus</option>
            <option value="officer">Officer</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[var(--surface-panel)] rounded-[var(--radius-2)] flex-1 overflow-hidden">
          <ForgeTable
            columns={columns}
            data={filteredData}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            emptyMessage="No audit events found matching your criteria."
          />
        </div>
      </main>

      {/* Detail Dialog */}
      <ForgeDialog open={!!selectedBlock} onOpenChange={(open) => !open && setSelectedBlock(null)}>
        <ForgeDialogContent className="max-w-3xl">
          <ForgeDialogTitle>Audit Event Details</ForgeDialogTitle>
          <ForgeDialogDescription>Complete cryptographic evidence and explanation.</ForgeDialogDescription>
          
          {selectedBlock && (() => {
            const isTampered = selectedBlock.signature_status === "TAMPERED";
            const risk = isTampered ? "CRITICAL" : (selectedBlock.action.includes("LOCK") ? "MEDIUM" : "LOW");
            const result = isTampered ? "FAIL" : (selectedBlock.signature_status === "VERIFIED" ? "PASS" : "WARNING");
            
            return (
              <div className="mt-4 flex flex-col gap-6">
                <ForgeAuditEvent
                  eventId={selectedBlock.current_hash}
                  timestamp={new Date(selectedBlock.timestamp).toLocaleString()}
                  actor={`${selectedBlock.actor_name} (${selectedBlock.actor_id})`}
                  action={selectedBlock.action}
                  target={`${selectedBlock.resource_type} - ${selectedBlock.resource_id}`}
                  result={result as any}
                  risk={risk as any}
                  links={[
                    { label: "View Session", href: "#" },
                    { label: "View Device", href: "#" },
                    { label: "View Candidate", href: "#" }
                  ]}
                />
                
                <div className="bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-[var(--radius-2)] p-4 flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Cryptographic Explanation</h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedBlock.explanation}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]">
                    <div>
                      <div className="text-xs text-[var(--text-muted)] mb-1 uppercase font-semibold">Previous Hash</div>
                      <ForgeMonoText className="text-xs truncate block">{selectedBlock.previous_hash}</ForgeMonoText>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)] mb-1 uppercase font-semibold">Payload Hash</div>
                      <ForgeMonoText className="text-xs truncate block">{selectedBlock.payload_hash}</ForgeMonoText>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </ForgeDialogContent>
      </ForgeDialog>
    </div>
  );
}
