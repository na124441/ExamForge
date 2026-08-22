import React from "react";
import { cn } from "@/lib/cn";
import { Circle } from "lucide-react";

export type QuestionStatus =
  | "answered"
  | "unanswered"
  | "marked"
  | "answered_marked";

export interface NavigatorQuestion {
  id: string;
  status: QuestionStatus;
}

export interface ForgeQuestionNavigatorProps {
  questions: NavigatorQuestion[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  className?: string;
}

const statusClasses: Record<QuestionStatus, string> = {
  answered: "bg-[var(--status-operational-surface)] text-[var(--text-primary)] border-transparent",
  unanswered: "bg-[var(--surface-interactive)] text-[var(--text-primary)] border-transparent",
  marked: "bg-[var(--status-info-surface)] text-[var(--text-primary)] border-transparent",
  answered_marked: "bg-[var(--status-operational-surface)] text-[var(--text-primary)] border-[var(--status-info)]",
};

export function ForgeQuestionNavigator({
  questions,
  currentIndex,
  onNavigate,
  className,
}: ForgeQuestionNavigatorProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 content-start font-sans",
        className
      )}
    >
      {questions.map((q, index) => {
        const isCurrent = index === currentIndex;
        return (
          <button
            key={q.id}
            onClick={() => onNavigate(index)}
            className={cn(
              "relative flex items-center justify-center w-8 h-8 rounded-[var(--radius-1)] text-xs font-semibold border-2 outline-none transition-all duration-[var(--duration-fast)]",
              statusClasses[q.status],
              isCurrent && "ring-2 ring-[var(--accent-primary)] ring-offset-1 border-[var(--accent-primary)]",
              !isCurrent && "hover:opacity-80",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1"
            )}
            aria-label={`Question ${index + 1} (${q.status})`}
            aria-current={isCurrent ? "true" : "false"}
          >
            {index + 1}
            {q.status === "answered_marked" && (
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--status-info)] border border-white">
                <Circle size={8} className="text-white fill-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
