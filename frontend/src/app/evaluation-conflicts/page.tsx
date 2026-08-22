"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  FileText
} from "lucide-react";

import { cn } from "@/lib/cn";
import { ForgeMetric } from "@/components/forge/ForgeMetric";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeDialog, ForgeDialogContent, ForgeDialogTitle, ForgeDialogDescription } from "@/components/forge/ForgeDialog";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";

const BACKEND_URL = "http://localhost:8000";

export default function ConflictsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Resolution States
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [finalMarks, setFinalMarks] = useState<number>(0.0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    setToken(storedToken || "");
    fetchConflicts(storedToken || "");
  }, []);

  const fetchConflicts = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluation/conflicts`, {
        headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch evaluation conflicts list");
      const data = await res.json();
      setConflicts(data || []);
    } catch (err: any) {
      // Mock demonstration fallback
      setConflicts([
        { id: "CONF-101", anonymous_id: "ANON-8891", question_id: "Q-04", marks_a: 8.5, marks_b: 4.0, variance: 4.5, status: "PENDING" },
        { id: "CONF-102", anonymous_id: "ANON-9042", question_id: "Q-07", marks_a: 10.0, marks_b: 3.5, variance: 6.5, status: "SENIOR_REVIEW" },
        { id: "CONF-103", anonymous_id: "ANON-7123", question_id: "Q-02", marks_a: 7.0, marks_b: 6.5, variance: 0.5, status: "RESOLVED" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;
    setSubmitting(true);

    try {
      const endpoint = selectedConflict.variance > 5.0 
        ? `${BACKEND_URL}/api/evaluation/conflicts/${selectedConflict.id}/senior-review`
        : `${BACKEND_URL}/api/evaluation/conflicts/${selectedConflict.id}/resolve`;

      const payload = { final_marks: finalMarks, decision_notes: notes };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      setConflicts((prev) => 
        prev.map((c) => c.id === selectedConflict.id ? { ...c, status: "RESOLVED" } : c)
      );
      handleCloseDialog();
    } catch (err: any) {
      // Local resolution update for mock
      setConflicts((prev) => 
        prev.map((c) => c.id === selectedConflict.id ? { ...c, status: "RESOLVED" } : c)
      );
      handleCloseDialog();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectConflict = (c: any) => {
    setSelectedConflict(c);
    const average = (c.marks_a + c.marks_b) / 2;
    setFinalMarks(average);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setSelectedConflict(null);
      setNotes("");
    }, 200);
  };

  const tableColumns: ForgeTableColumn<any>[] = [
    {
      key: "anonymous_id",
      header: "Anonymous ID",
      mono: true,
      render: (row) => <ForgeMonoText>{row.anonymous_id}</ForgeMonoText>
    },
    {
      key: "question_id",
      header: "Question",
      mono: true,
      render: (row) => row.question_id
    },
    {
      key: "evaluators",
      header: "Evaluator 1 vs 2",
      mono: true,
      render: (row) => (
        <span>
          <span className="text-[var(--accent-primary)] font-bold">{row.marks_a}</span>
          <span className="text-[var(--text-muted)] mx-2">vs</span>
          <span className="text-[var(--text-primary)] font-bold">{row.marks_b}</span>
        </span>
      )
    },
    {
      key: "variance",
      header: "Variance",
      mono: true,
      render: (row) => {
        const isHigh = row.variance > 2.0;
        return (
          <span className={cn(
            "px-2 py-0.5 rounded-[var(--radius-1)] text-xs font-medium border",
            isHigh 
              ? "bg-[var(--status-danger-surface)] text-[var(--status-danger-text)] border-[var(--status-danger)]/20" 
              : "bg-[var(--surface-interactive)] text-[var(--text-primary)] border-[var(--border-default)]"
          )}>
            Δ {row.variance.toFixed(1)}
          </span>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <ForgeBadge 
          status={row.status === "RESOLVED" ? "VERIFIED" : row.status === "SENIOR_REVIEW" ? "CRITICAL" : "PENDING"} 
          label={row.status.replace("_", " ")}
        />
      )
    },
    {
      key: "action",
      header: "Action",
      className: "text-right",
      render: (row) => (
        row.status !== "RESOLVED" ? (
          <ForgeButton size="sm" onClick={() => handleSelectConflict(row)}>
            Reconcile
          </ForgeButton>
        ) : (
          <span className="text-xs font-bold text-[var(--status-operational-text)] flex items-center justify-end gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sealed
          </span>
        )
      )
    }
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-app)] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-panel)] p-6 md:p-8 rounded-[var(--radius-4)] border border-[var(--border-default)]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5 font-mono">
              <Link href="/evaluation-ops" className="hover:text-[var(--accent-primary)] font-semibold transition-colors duration-[var(--duration-fast)]">EvaluationOps</Link>
              <span>/</span>
              <span className="text-[var(--text-primary)]">Variance Arbitrator</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
              <span>Double-Blind Evaluation Variance Arbitrator</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Audit double-blind grading variances between Evaluators to enforce grading consistency.
            </p>
          </div>
          <div>
            <ForgeButton variant="secondary" onClick={() => fetchConflicts(token)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Ledger
            </ForgeButton>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[var(--status-danger-surface)] border border-[var(--status-danger)]/20 text-[var(--status-danger-text)] rounded-[var(--radius-3)] text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ForgeMetric 
            title="Total Booklets Evaluated" 
            value="12,450" 
            trend={{ direction: "up", label: "+145 this week" }} 
            icon={<FileText className="w-4 h-4" />}
          />
          <ForgeMetric 
            title="Mark Variance Conflicts" 
            value={conflicts.length} 
            status="warn"
            description="Delta > 2.0"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <ForgeMetric 
            title="Resolved Arbitrations" 
            value="842" 
            status="ok"
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
          <ForgeMetric 
            title="Pending Quorum" 
            value="12" 
            trend={{ direction: "down", label: "-3 today" }}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        {/* Conflicts Table */}
        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-4)] border border-[var(--border-default)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-panel)]">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Conflict Queue
            </h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="py-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin w-6 h-6 text-[var(--accent-primary)]" />
                <p className="text-sm font-medium">Fetching double evaluation conflicts ledger...</p>
              </div>
            ) : conflicts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[var(--status-operational-text)] mx-auto" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Zero Grading Discrepancies</h3>
                <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
                  All double-evaluation scores satisfy the institutional compliance variance threshold.
                </p>
              </div>
            ) : (
              <ForgeTable 
                columns={tableColumns} 
                data={conflicts} 
                keyField="id" 
              />
            )}
          </div>
        </div>

      </div>

      <ForgeDialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <ForgeDialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-full">
          <div className="mb-4">
            <ForgeDialogTitle className="text-xl flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--accent-primary)]" />
              Reconciliation Console
            </ForgeDialogTitle>
            <ForgeDialogDescription className="mt-1 text-sm">
              Review rubric breakdowns and commit overrides for <ForgeMonoText>{selectedConflict?.anonymous_id}</ForgeMonoText> on <ForgeMonoText>{selectedConflict?.question_id}</ForgeMonoText>.
            </ForgeDialogDescription>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Left: Evaluator 1 */}
            <div className="flex flex-col gap-4 p-5 rounded-[var(--radius-3)] bg-[var(--surface-panel)] border border-[var(--border-default)]">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h4 className="font-bold text-[var(--text-primary)]">Evaluator 1</h4>
                <div className="text-xl font-mono font-bold text-[var(--accent-primary)]">
                  {selectedConflict?.marks_a}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-2">Rubric Breakdown</p>
                <div className="space-y-2 text-sm text-[var(--text-primary)]">
                  <div className="flex justify-between items-center"><span>Concept Understanding</span><ForgeMonoText>3.5/4.0</ForgeMonoText></div>
                  <div className="flex justify-between items-center"><span>Execution/Calculation</span><ForgeMonoText>3.0/4.0</ForgeMonoText></div>
                  <div className="flex justify-between items-center"><span>Final Answer</span><ForgeMonoText>2.0/2.0</ForgeMonoText></div>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-2">Subjective Commentary</p>
                <p className="text-sm text-[var(--text-muted)] italic bg-[var(--surface-elevated)] p-3 rounded-[var(--radius-2)] border border-[var(--border-subtle)]">
                  "Candidate demonstrated clear conceptual understanding but missed a minor step in derivation. Adjusted accordingly."
                </p>
              </div>
            </div>

            {/* Center: Arbitrator */}
            <div className="flex flex-col gap-4 p-5 rounded-[var(--radius-3)] bg-[var(--surface-elevated)] border border-[var(--border-focus)] shadow-md">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
                <h4 className="font-bold text-[var(--text-primary)]">Senior Arbitrator</h4>
              </div>

              {selectedConflict?.variance > 5.0 && (
                <div className="p-3 bg-[var(--status-danger-surface)] border border-[var(--status-danger)]/20 text-[var(--status-danger-text)] rounded-[var(--radius-2)] text-xs font-medium flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-0.5">High Variance Escalation</strong>
                    Variance exceeds 5.0 marks threshold. Immediate senior intervention logged.
                  </div>
                </div>
              )}

              <div className="space-y-4 flex-1">
                <ForgeInput 
                  label="Final Agreed Mark" 
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={finalMarks}
                  onChange={(e) => setFinalMarks(parseFloat(e.target.value) || 0)}
                  mono
                />

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-medium text-[var(--text-secondary)] font-sans">
                    Consensus Rationale
                  </label>
                  <textarea 
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter audit-ready justification..."
                    className="flex w-full rounded-[var(--radius-2)] border border-[var(--border-default)] bg-[var(--surface-interactive)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] resize-none"
                  />
                </div>
              </div>

              <ForgeButton 
                className="w-full mt-2" 
                onClick={handleResolveConflict} 
                disabled={submitting}
              >
                {submitting ? "Committing..." : "Lock Final Arbitrated Score & Commit to Marks-Chain"}
              </ForgeButton>
            </div>

            {/* Right: Evaluator 2 */}
            <div className="flex flex-col gap-4 p-5 rounded-[var(--radius-3)] bg-[var(--surface-panel)] border border-[var(--border-default)]">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h4 className="font-bold text-[var(--text-primary)]">Evaluator 2</h4>
                <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                  {selectedConflict?.marks_b}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-2">Rubric Breakdown</p>
                <div className="space-y-2 text-sm text-[var(--text-primary)]">
                  <div className="flex justify-between items-center"><span>Concept Understanding</span><ForgeMonoText>2.0/4.0</ForgeMonoText></div>
                  <div className="flex justify-between items-center"><span>Execution/Calculation</span><ForgeMonoText>2.0/4.0</ForgeMonoText></div>
                  <div className="flex justify-between items-center"><span>Final Answer</span><ForgeMonoText>0.0/2.0</ForgeMonoText></div>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-2">Subjective Commentary</p>
                <p className="text-sm text-[var(--text-muted)] italic bg-[var(--surface-elevated)] p-3 rounded-[var(--radius-2)] border border-[var(--border-subtle)]">
                  "Calculation errors in the middle section completely invalidated the final result. Concept partially misunderstood."
                </p>
              </div>
            </div>

          </div>
        </ForgeDialogContent>
      </ForgeDialog>
    </main>
  );
}
