"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ForgeMetric } from "@/components/forge/ForgeMetric";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { ForgeStatus } from "@/components/forge/ForgeStatus";
import { ForgeActivityFeed, ForgeActivityEvent } from "@/components/forge/ForgeActivityFeed";
import { ForgeSecurityBadge } from "@/components/forge/ForgeSecurityBadge";
import { ForgeLiveCounter } from "@/components/forge/ForgeLiveCounter";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { Shield, ShieldAlert, Activity, AlertTriangle, AlertCircle, Laptop, Users, CheckCircle } from "lucide-react";

export default function SecurityCommandCenter() {
  const [data, setData] = useState<any>(null);
  const [isError, setIsError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => setCurrentTime(new Date().toISOString());
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/pentest/scorecard");
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        const result = await response.json();
        setData(result);
        setIsError(false);
      } catch (err) {
        setIsError(true);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const demoEvents: ForgeActivityEvent[] = [
    { id: "1", timestamp: "22:41:08", message: "Device fingerprint mismatch", severity: "danger" },
    { id: "2", timestamp: "22:40:52", message: "Multiple login attempts", severity: "warning" },
    { id: "3", timestamp: "22:40:11", message: "Camera permission revoked", severity: "info" },
    { id: "4", timestamp: "22:39:48", message: "Session resumed", severity: "success" },
  ];

  const activeSessions = data?.metrics?.activeSessions ?? 18294;
  const verifiedDevices = data?.metrics?.verifiedDevices ?? 18241;
  const suspiciousSessions = data?.metrics?.suspiciousSessions ?? 7;
  const criticalEvents = data?.metrics?.criticalEvents ?? 0;

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)] min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      {/* SYSTEM STATUS BANNER */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-[var(--space-4)]">
        <div className="flex items-center gap-[var(--space-4)]">
          <ForgeStatus 
            status={isError ? "offline" : "operational"} 
            label={isError ? "Not monitored" : "OPERATIONAL"} 
          />
          <div className="w-px h-6 bg-[var(--border-default)]" />
          <div className="flex items-center gap-[var(--space-2)]">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Threat Level:</span>
            <ForgeSecurityBadge state={isError ? "OFFLINE" : "VERIFIED"} label={isError ? "UNKNOWN" : "LOW"} className="p-1 border-none bg-transparent" />
          </div>
          {isError && (
            <ForgeBadge variant="warning" size="sm">DEMO DATA</ForgeBadge>
          )}
        </div>
        <ForgeMonoText className="text-[var(--text-muted)] text-xs" suppressHydrationWarning>
          {mounted && currentTime ? currentTime : "UTC REALTIME SYNC"}
        </ForgeMonoText>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--space-4)]">
        <div className="flex flex-col gap-1">
           <ForgeLiveCounter value={activeSessions} label="Active Sessions" />
        </div>
        <ForgeMetric 
          label="Verified Devices" 
          value={verifiedDevices} 
        />
        <ForgeMetric 
          label="Suspicious Sessions" 
          value={suspiciousSessions} 
        />
        <ForgeMetric 
          label="Critical Events" 
          value={criticalEvents} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--space-6)]">
        {/* LIVE SECURITY EVENTS */}
        <div className="lg:col-span-2 flex flex-col gap-[var(--space-4)]">
          <h2 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
            <Activity className="w-5 h-5 text-[var(--text-secondary)]" />
            Live Security Events
          </h2>
          <div className="border border-[var(--border-subtle)] rounded-[var(--radius-3)] p-[var(--space-4)] bg-[var(--surface-raised)]">
            <ForgeActivityFeed events={data?.events || demoEvents} />
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-6)]">
          {/* DEVICE TRUST OVERVIEW */}
          <div className="flex flex-col gap-[var(--space-4)]">
            <h2 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
              <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
              Device Trust Overview
            </h2>
            <div className="flex flex-col gap-[var(--space-3)] p-[var(--space-4)] border border-[var(--border-subtle)] rounded-[var(--radius-3)] bg-[var(--surface-raised)]">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] text-sm">Verified Devices</span>
                <span className="font-mono text-[var(--text-primary)]">{data?.deviceTrust?.verified ?? 18241}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] text-sm">Pending Verification</span>
                <span className="font-mono text-[var(--text-primary)]">{data?.deviceTrust?.pending ?? 45}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] text-sm">Flagged Devices</span>
                <span className="font-mono text-[var(--status-danger)]">{data?.deviceTrust?.flagged ?? 8}</span>
              </div>
            </div>
          </div>

          {/* SESSION INTEGRITY */}
          <div className="flex flex-col gap-[var(--space-4)]">
            <h2 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
              <ShieldAlert className="w-5 h-5 text-[var(--text-secondary)]" />
              Session Integrity
            </h2>
            <div className="flex flex-col gap-[var(--space-3)]">
              <ForgeSecurityBadge state="VERIFIED" label="Hardware Enclave Active" description="All sessions cryptographically bound" />
              <ForgeSecurityBadge state="PENDING" label="Continuous Auth" description="Biometric polling every 5s" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
