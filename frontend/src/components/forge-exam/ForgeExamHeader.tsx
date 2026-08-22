import React from "react";
import { cn } from "@/lib/cn";
import { ForgeExamTimer } from "./ForgeExamTimer";

export interface ForgeExamHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: string;
  isWarning?: boolean;
  className?: string;
}

export function ForgeExamHeader({
  questionNumber,
  totalQuestions,
  timeRemaining,
  isWarning = false,
  className,
}: ForgeExamHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between h-12 px-6 border-b border-[var(--border-default)] shrink-0 bg-white",
        className
      )}
    >
      <div className="flex-1 flex items-center justify-start gap-2.5">
        <img
          src="/logo-icon.png"
          alt="ExamForge Logo"
          className="w-7 h-7 rounded-lg object-cover shadow-2xs border border-[var(--border-default)]"
        />
        <span className="font-sans font-bold tracking-tight text-base text-[var(--text-primary)]">
          EXAMFORGE
        </span>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <span className="font-sans font-medium text-sm text-[var(--text-primary)]">
          QUESTION {questionNumber} / {totalQuestions}
        </span>
      </div>
      
      <div className="flex-1 flex items-center justify-end">
        <ForgeExamTimer timeRemaining={timeRemaining} isWarning={isWarning} />
      </div>
    </header>
  );
}
