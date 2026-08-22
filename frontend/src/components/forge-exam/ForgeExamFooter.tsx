import React from "react";
import { cn } from "@/lib/cn";
import { Bookmark, ChevronLeft, ChevronRight, XCircle, Send } from "lucide-react";

export interface ForgeExamFooterProps {
  onPrevious: () => void;
  onNext: () => void;
  onMarkForReview: () => void;
  onClearResponse: () => void;
  isMarked: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onSubmit?: () => void;
  className?: string;
}

export function ForgeExamFooter({
  onPrevious,
  onNext,
  onMarkForReview,
  onClearResponse,
  isMarked,
  hasPrevious,
  hasNext,
  onSubmit,
  className,
}: ForgeExamFooterProps) {
  return (
    <footer
      className={cn(
        "flex items-center justify-between p-4 border-t border-[var(--border-default)] bg-white shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMarkForReview}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-2)] outline-none transition-colors duration-[var(--duration-fast)]",
            isMarked
              ? "bg-[var(--status-info-surface)] text-[var(--status-info)] hover:bg-[var(--status-info)]/20"
              : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-interactive)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--status-info)]"
          )}
        >
          <Bookmark size={16} className={isMarked ? "fill-current" : ""} />
          {isMarked ? "Marked for Review" : "Mark for Review"}
        </button>

        <button
          onClick={onClearResponse}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-2)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-interactive)] outline-none transition-colors duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          <XCircle size={16} />
          Clear Response
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-[var(--radius-2)] bg-[var(--surface-interactive)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] outline-none transition-colors duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {hasNext ? (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-[var(--radius-2)] bg-[var(--accent-primary)] text-white hover:opacity-90 outline-none transition-opacity duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          onSubmit && (
            <button
              onClick={onSubmit}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-[var(--radius-2)] bg-[var(--status-success)] text-white hover:opacity-90 outline-none transition-opacity duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-[var(--status-success)] focus-visible:ring-offset-2"
            >
              <Send size={16} />
              Submit Exam
            </button>
          )
        )}
      </div>
    </footer>
  );
}
