import React from "react";
import { cn } from "@/lib/cn";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export interface ForgeConnectionStateProps {
  status: "secure" | "offline" | "syncing";
  pendingCount?: number;
  className?: string;
}

export function ForgeConnectionState({
  status,
  pendingCount = 0,
  className,
}: ForgeConnectionStateProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-5)] border font-sans text-sm font-medium transition-colors duration-[var(--duration-normal)]",
        status === "secure" && "bg-[var(--status-success)]/10 border-[var(--status-success)] text-[var(--status-success)]",
        status === "offline" && "bg-[var(--status-danger)]/10 border-[var(--status-danger)] text-[var(--status-danger)]",
        status === "syncing" && "bg-[var(--status-info)]/10 border-[var(--status-info)] text-[var(--status-info)]",
        className
      )}
    >
      {status === "secure" && <Wifi size={16} />}
      {status === "offline" && <WifiOff size={16} />}
      {status === "syncing" && <RefreshCw size={16} className="animate-spin" />}
      
      <span>
        {status === "secure" && "Secure"}
        {status === "offline" && "Offline"}
        {status === "syncing" && "Syncing"}
      </span>
      
      {status === "offline" && pendingCount > 0 && (
        <span className="text-xs opacity-80">({pendingCount} pending)</span>
      )}
    </div>
  );
}
