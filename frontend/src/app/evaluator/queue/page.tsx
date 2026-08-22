"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ScanEye, 
  RefreshCw, 
  ArrowRight, 
  FileCheck, 
  AlertTriangle, 
  Inbox, 
  CheckCircle2, 
  Clock,
  Eye,
  Edit3
} from "lucide-react";
import { ForgePageHeader } from "@/components/forge/ForgePageHeader";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeTable, ForgeTableColumn } from "@/components/forge/ForgeTable";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { ForgeEmptyState } from "@/components/forge/ForgeEmptyState";
import { ForgeSkeleton } from "@/components/forge/ForgeSkeleton";
import { cn } from "@/lib/cn";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface QueueItem {
  anonymous_id: string;
  exam_id: string;
  booklet_hash?: string;
  status: "ASSIGNED" | "EVALUATING" | "LOCKED" | "PENDING";
}

export default function EvaluatorQueuePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");

    if (!storedToken || role !== "EVALUATOR") {
      // Allow demo viewing if in local sandbox
      setUserName(name || "Subject Evaluator");
    } else {
      setToken(storedToken);
      setUserName(name || "Subject Evaluator");
    }
    fetchQueue(storedToken || "");
  }, []);

  const fetchQueue = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const headers: HeadersInit = authToken ? { "Authorization": `Bearer ${authToken}` } : {};
      const res = await fetch(`${BACKEND_URL}/api/evaluation/my-queue`, { headers });
      if (!res.ok) throw new Error("Failed to fetch evaluator queue");
      const data = await res.json();
      setQueue(data);
    } catch (err: any) {
      console.warn("Queue fetch error:", err);
      // Fallback empty if unauthorized
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: ForgeTableColumn<QueueItem>[] = [
    {
      key: "anonymous_id",
      header: "Anonymous Booklet Token",
      isPrimary: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">
          {item.anonymous_id}
        </span>
      )
    },
    {
      key: "exam_id",
      header: "Examination ID",
      render: (item) => (
        <span className="text-xs font-semibold text-[var(--color-ink)]">
          {item.exam_id}
        </span>
      )
    },
    {
      key: "booklet_hash",
      header: "Ingestion State",
      render: (item) => (
        <span className="font-mono text-xs text-[var(--color-ink-muted)]">
          {item.booklet_hash ? "Fully Ingested" : "Scan Ingested"}
        </span>
      )
    },
    {
      key: "status",
      header: "Grading State",
      render: (item) => {
        const variant = 
          item.status === "LOCKED" ? "success" :
          item.status === "EVALUATING" ? "warning" : "info";
        return (
          <ForgeStatusPill variant={variant} dot>
            {item.status}
          </ForgeStatusPill>
        );
      }
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end">
          <ForgeButton
            variant={item.status === "LOCKED" ? "secondary" : "primary"}
            size="sm"
            onClick={() => router.push(`/evaluator/copy/${item.anonymous_id}`)}
            icon={item.status === "LOCKED" ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          >
            {item.status === "LOCKED" ? "Inspect Marks" : "Start Grading"}
          </ForgeButton>
        </div>
      )
    }
  ];

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] font-sans p-4 sm:p-6 lg:p-8 space-y-6 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        <ForgePageHeader
          breadcrumbs={[
            { label: "Evaluation Hub", href: "/evaluator" },
            { label: "Grading Queue" }
          ]}
          title="Double-Blind Grading Queue"
          description={`Active double-masked booklet allocations assigned to ${userName}. All candidate identities and demographics are cryptographically masked.`}
          status={
            <ForgeStatusPill variant="info" dot>
              DOUBLE-BLIND MASKING ACTIVE
            </ForgeStatusPill>
          }
          actions={
            <ForgeButton
              variant="secondary"
              size="md"
              onClick={() => fetchQueue(token)}
              disabled={loading}
              icon={<RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />}
            >
              Refresh Queue
            </ForgeButton>
          }
        />

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 space-y-3 bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)]">
            <ForgeSkeleton variant="text" className="w-48 h-6" />
            <ForgeSkeleton variant="table-row" className="w-full h-10" />
            <ForgeSkeleton variant="table-row" className="w-full h-10" />
            <ForgeSkeleton variant="table-row" className="w-full h-10" />
          </div>
        ) : queue.length === 0 ? (
          <ForgeEmptyState
            icon={Inbox}
            title="Grading Queue Empty"
            description="You currently have no unmasked booklet copies assigned. Check the controller panel to allocate pending subjective response sheets."
            action={
              <ForgeButton
                variant="secondary"
                size="sm"
                onClick={() => router.push("/evaluator")}
              >
                Return to Evaluator Dashboard
              </ForgeButton>
            }
          />
        ) : (
          <div className="bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs">
            <ForgeTable
              columns={columns}
              data={queue}
            />
          </div>
        )}
      </div>
    </main>
  );
}
