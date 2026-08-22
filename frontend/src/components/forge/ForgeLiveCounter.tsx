import * as React from "react"
import { cn } from "@/lib/cn"

export interface ForgeLiveCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  label: string
}

export function ForgeLiveCounter({ value, label, className, ...props }: ForgeLiveCounterProps) {
  return (
    <div className={cn("flex flex-col items-start gap-1 font-sans", className)} {...props}>
      <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
        {value.toLocaleString()}
      </span>
      <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}
