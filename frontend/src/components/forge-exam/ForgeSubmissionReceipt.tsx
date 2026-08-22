import React from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, Printer, LogOut } from "lucide-react";

export interface ForgeSubmissionReceiptProps {
  candidateId: string;
  examId: string;
  timestamp: string;
  totalQuestions: number;
  answeredCount: number;
  receiptHash: string;
  signature: string;
  onPrint?: () => void;
  onExit?: () => void;
  className?: string;
}

export function ForgeSubmissionReceipt({
  candidateId,
  examId,
  timestamp,
  totalQuestions,
  answeredCount,
  receiptHash,
  signature,
  onPrint,
  onExit,
  className,
}: ForgeSubmissionReceiptProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-full bg-[var(--surface-background)] font-sans p-6",
        className
      )}
    >
      <div className="w-full max-w-xl bg-white border border-[var(--border-default)] rounded-[var(--radius-3)] shadow-lg overflow-hidden">
        <div className="flex flex-col items-center pt-10 pb-6 px-8 border-b border-[var(--border-subtle)] bg-[var(--status-success)]/5">
          <CheckCircle2 size={64} className="text-[var(--status-success)] mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] text-center">
            Exam Submitted Successfully
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-center">
            Your responses have been securely recorded.
          </p>
        </div>

        <div className="p-8 flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Candidate ID
              </dt>
              <dd className="font-mono text-sm text-[var(--text-primary)]">
                {candidateId}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Exam ID
              </dt>
              <dd className="font-mono text-sm text-[var(--text-primary)]">
                {examId}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Submission Time
              </dt>
              <dd className="font-mono text-sm text-[var(--text-primary)]">
                {timestamp}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Questions Answered
              </dt>
              <dd className="font-sans font-medium text-sm text-[var(--text-primary)]">
                {answeredCount} / {totalQuestions}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-4 mt-2 p-4 bg-[var(--surface-panel)] rounded-[var(--radius-2)] border border-[var(--border-subtle)]">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Receipt Hash
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)] break-all">
                {receiptHash}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Digital Signature
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)] break-all">
                {signature}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[var(--border-subtle)] bg-[var(--surface-panel)]">
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-2)] border border-[var(--border-default)] bg-white text-[var(--text-primary)] hover:bg-[var(--surface-interactive)] outline-none transition-colors duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <Printer size={16} />
            Print Receipt
          </button>
          
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-[var(--radius-2)] bg-[var(--accent-primary)] text-white hover:opacity-90 outline-none transition-opacity duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
          >
            <LogOut size={16} />
            Exit Secure Browser
          </button>
        </div>
      </div>
    </div>
  );
}
