import * as React from "react";
import { cn } from "@/lib/cn";

export interface ForgeMonoTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  text?: string;
}

export function ForgeMonoText({ children, text, className, ...props }: ForgeMonoTextProps) {
  const content = children ?? text ?? "";
  return (
    <span
      className={cn("font-mono text-[var(--text-secondary)]", className)}
      suppressHydrationWarning
      {...props}
    >
      {content}
    </span>
  );
}
