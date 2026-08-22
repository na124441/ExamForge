import React from "react";
import { cn } from "@/lib/cn";
import { Wifi, WifiOff, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";

export interface ForgeExamStatusProps {
  connectionStatus: "secure" | "offline" | "syncing";
  deviceStatus: "verified" | "unverified";
  pendingSync?: number;
  className?: string;
}

export function ForgeExamStatus({
  connectionStatus,
  deviceStatus,
  pendingSync = 0,
  className,
}: ForgeExamStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between h-9 px-4 border-t border-[var(--border-default)] bg-[var(--surface-panel)] text-xs font-sans text-[var(--text-secondary)] shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {connectionStatus === "secure" && (
            <>
              <Wifi size={14} className="text-[var(--status-success)]" />
              <span>Connection: Secure</span>
            </>
          )}
          {connectionStatus === "offline" && (
            <>
              <WifiOff size={14} className="text-[var(--status-danger)]" />
              <span>Connection: Offline</span>
              {pendingSync > 0 && <span>({pendingSync} pending)</span>}
            </>
          )}
          {connectionStatus === "syncing" && (
            <>
              <RefreshCw size={14} className="text-[var(--status-info)] animate-spin" />
              <span>Syncing...</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {deviceStatus === "verified" ? (
            <>
              <ShieldCheck size={14} className="text-[var(--status-success)]" />
              <span>Device: Verified</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} className="text-[var(--status-warning)]" />
              <span>Device: Unverified</span>
            </>
          )}
        </div>
      </div>
      
      <div>
        <span>Candidate Environment: Locked</span>
      </div>
    </div>
  );
}
