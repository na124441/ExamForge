"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Unlock,
  RefreshCw,
  FileCheck,
  AlertOctagon,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ForgeMetric } from "@/components/forge/ForgeMetric";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeTable } from "@/components/forge/ForgeTable";
import { ForgeContextualHint } from "@/components/forge/ForgeContextualHint";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";

const BACKEND_URL = "http://localhost:8000";
const EXAM_ID = "EXM-001";

interface ChecklistItem {
  name: string;
  passed: boolean;
  critical: boolean;
  details: string;
}

interface GateStatus {
  exam_id: string;
  allowed: boolean;
  trust_score: number;
  checklist: ChecklistItem[];
  blocking_reasons: string[];
  critical_issues: { code: string; message: string; details: string }[];
  warnings: { code: string; message: string; details: string }[];
}

export default function PublicationGatePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<GateStatus | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [publishError, setPublishError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) setToken(storedToken);
    fetchGateStatus();
    const interval = setInterval(fetchGateStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchGateStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${EXAM_ID}/gate-status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to load publication gate status", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = async () => {
    if (!status?.allowed) return;
    setPublishing(true);
    setPublishResult(null);
    setPublishError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${EXAM_ID}/publish-results`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ? JSON.stringify(err.detail) : "Results release failed");
      }

      const data = await res.json();
      setPublishResult(data);
      alert("Results verified and published successfully!");
    } catch (err: any) {
      try {
        setPublishError(JSON.parse(err.message));
      } catch {
        setPublishError({ message: err.message || "Could not publish results." });
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--text-muted)] text-sm gap-3 font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
        <span>Verifying Publication Safety Gates...</span>
      </div>
    );
  }

  const isAllowed = status?.allowed ?? false;
  const score = status?.trust_score ?? 100;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-3)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-[var(--radius-2)] border",
            isAllowed 
              ? "bg-[var(--status-operational-surface)] border-[var(--status-operational)]" 
              : "bg-[var(--status-danger-surface)] border-[var(--status-danger)]"
          )}>
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              isAllowed ? "bg-[var(--status-operational)]" : "bg-[var(--status-danger)]"
            )} />
            <span className={cn(
              "font-bold text-base tracking-wide",
              isAllowed ? "text-[var(--status-operational-text)]" : "text-[var(--status-danger-text)]"
            )}>
              {isAllowed ? "PUBLICATION PERMITTED" : "GATE LOCKED"}
            </span>
          </div>
          <div className="ml-2 flex flex-col">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Publication Gate</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Cryptographic readiness checks for {EXAM_ID}</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <ForgeMetric
            title="Integrity Trust Score"
            value={`${score}%`}
            status={score >= 90 ? "ok" : "danger"}
            className="w-48"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 bg-[var(--surface-panel)] p-4 border border-[var(--border-subtle)] rounded-[var(--radius-2)]">
        <ForgeButton variant="secondary" onClick={fetchGateStatus} disabled={loading || publishing}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Evaluate Gate Readiness
        </ForgeButton>
        <ForgeButton 
          variant={isAllowed ? "primary" : "ghost"} 
          onClick={handlePublishResults} 
          disabled={!isAllowed || publishing}
          className={!isAllowed ? "opacity-50 cursor-not-allowed border border-[var(--border-strong)]" : ""}
        >
          {isAllowed ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
          {publishing ? "Authorizing..." : "Authorize Result Publication & Seal Ledger"}
        </ForgeButton>
      </div>

      {/* Blocking Reasons & Warnings */}
      {!isAllowed && status?.critical_issues && status.critical_issues.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-[var(--status-danger)]" />
            Blocking Issues
          </h2>
          {status.critical_issues.map((issue, idx) => (
            <ForgeContextualHint
              key={idx}
              severity="warning"
              title={issue.message}
              description={issue.details || "This issue prevents the publication gate from unlocking."}
            />
          ))}
        </div>
      )}

      {/* Checklist Table */}
      <div className="bg-[var(--surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-3)] p-5">
        <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)]" />
          Policy Checklist
        </h2>
        <ForgeTable
          columns={[
            {
              key: "name",
              header: "Policy Rule",
              className: "font-medium text-[var(--text-primary)]",
            },
            {
              key: "critical",
              header: "Criticality",
              render: (row: ChecklistItem) => (
                <ForgeBadge 
                  status={row.critical ? "CRITICAL" : "DEFAULT"} 
                  variant={row.critical ? "danger" : "neutral"} 
                  label={row.critical ? "Strict Rule" : "Standard"} 
                />
              ),
            },
            {
              key: "passed",
              header: "Status",
              render: (row: ChecklistItem) => (
                <ForgeBadge 
                  status={row.passed ? "VERIFIED" : "BLOCKED"} 
                  variant={row.passed ? "success" : "danger"} 
                  label={row.passed ? "Passed" : "Blocked"} 
                />
              ),
            },
            {
              key: "details",
              header: "Explanation / Details",
              className: "text-[var(--text-secondary)] max-w-sm",
            }
          ]}
          data={status?.checklist || []}
          keyField="name"
        />
      </div>

      {/* Success Block */}
      {publishResult && (
        <div className="bg-[var(--surface-elevated)] p-6 rounded-[var(--radius-3)] border border-[var(--status-operational)]">
          <h3 className="text-lg font-bold text-[var(--status-operational-text)] mb-2 flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Cryptographic Publication Sealed
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            {publishResult.message}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--surface-panel)] border border-[var(--border-subtle)] p-4 rounded-[var(--radius-2)]">
              <span className="text-xs text-[var(--text-muted)] uppercase font-semibold block mb-2">Publication Digest</span>
              <ForgeMonoText className="text-xs break-all">
                sha256:881ad3f9429188e001ba7e44cf9901bd34a5d0928f80bb1a980ca... (Issued)
              </ForgeMonoText>
              <div className="mt-4">
                <ForgeBadge status="VERIFIED" label="Certificates Generated" variant="success" />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Issued Results</h4>
              <div className="max-h-48 overflow-y-auto">
                <ForgeTable
                  columns={[
                    { key: "candidate_anonymous_id", header: "Candidate ID", mono: true },
                    { key: "score", header: "Score", render: (r: any) => <span className="font-bold">{r.score} marks</span> }
                  ]}
                  data={publishResult.results || []}
                  keyField="candidate_anonymous_id"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Block */}
      {publishError && (
        <div className="bg-[var(--status-danger-surface)] p-5 rounded-[var(--radius-3)] border border-[var(--status-danger)]">
          <h3 className="text-sm font-bold text-[var(--status-danger-text)] uppercase tracking-wider mb-2">
            Publishing Failure Report
          </h3>
          <p className="text-sm font-medium text-[var(--status-danger-text)] mb-3">
            {publishError.message}
          </p>
          {publishError.failures && publishError.failures.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-[var(--status-danger-text)] space-y-1">
              {publishError.failures.map((f: any, idx: number) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
