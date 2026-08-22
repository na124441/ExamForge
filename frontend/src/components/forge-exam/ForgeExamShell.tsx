import React, { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ForgeExamShellProps {
  children: ReactNode;
  className?: string;
}

export function ForgeExamShell({ children, className }: ForgeExamShellProps) {
  return (
    <div
      className={cn(
        "forge-exam flex flex-col h-[100dvh] w-full bg-white text-[var(--text-primary)] font-sans overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
