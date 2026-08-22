import React from "react";
import { cn } from "@/lib/cn";
import { Clock } from "lucide-react";

export interface ForgeExamTimerProps {
  timeRemaining: string;
  isWarning?: boolean;
  className?: string;
}

export function ForgeExamTimer({
  timeRemaining,
  isWarning = false,
  className,
}: ForgeExamTimerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 font-mono text-lg font-medium",
        isWarning ? "text-[var(--status-danger)]" : "text-[var(--text-primary)]",
        className
      )}
    >
      <Clock size={18} className={isWarning ? "animate-pulse" : ""} />
      <span>{timeRemaining}</span>
    </div>
  );
}
