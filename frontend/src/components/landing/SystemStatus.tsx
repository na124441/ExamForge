"use client";

import React from "react";
import {
  UserPlus,
  ShieldCheck,
  CreditCard,
  Building2,
  FileText,
  ClipboardCheck,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SystemModule {
  name: string;
  status: "ONLINE" | "VERIFIED" | "READY" | "MANAGED";
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SYSTEM_MODULES: SystemModule[] = [
  { name: "Registration", status: "ONLINE", icon: UserPlus },
  { name: "Identity", status: "VERIFIED", icon: ShieldCheck },
  { name: "Payments", status: "READY", icon: CreditCard },
  { name: "Centres", status: "MANAGED", icon: Building2 },
  { name: "Examination", status: "READY", icon: FileText },
  { name: "Evaluation", status: "READY", icon: ClipboardCheck },
  { name: "Results", status: "READY", icon: BarChart3 },
];

export function SystemStatus() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 select-none">
      <div
        className="rounded-3xl p-6 sm:p-8 bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)]"
        style={{
          boxShadow:
            "0 20px 50px -15px rgba(0,0,0,0.7), inset 0 1px 1px 0 rgba(255,255,255,0.15), inset 0 0 24px rgba(138,216,184,0.03)",
        }}
      >
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-[rgba(138,216,184,0.15)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[rgba(64,133,118,0.3)] border border-[rgba(138,216,184,0.3)] flex items-center justify-center text-[#8AD8B8]">
              <Activity size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wider text-[#FFF4E2] uppercase font-sans">
                EXAMFORGE SYSTEM
              </h3>
            </div>
          </div>

          {/* Operational Beacon */}
          <div className="px-3.5 py-1.5 rounded-full bg-[rgba(138,216,184,0.15)] border border-[rgba(138,216,184,0.35)] shadow-xs flex items-center gap-2 font-mono text-[11px] font-bold text-[#8AD8B8] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#8AD8B8] animate-ping" />
            <span>ALL SERVICES OPERATIONAL</span>
          </div>
        </div>

        {/* 7 Modular Glass Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mt-6">
          {SYSTEM_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.name}
                className={cn(
                  "p-4 rounded-2xl transition-all duration-300 group flex flex-col items-center justify-center text-center",
                  "bg-[rgba(19,45,40,0.55)] border border-[rgba(138,216,184,0.15)] hover:border-[rgba(138,216,184,0.4)]",
                  "hover:bg-[rgba(64,133,118,0.2)] hover:-translate-y-1 hover:shadow-lg shadow-sm"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.2)] flex items-center justify-center text-[#8AD8B8] mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={18} />
                </div>
                <span className="text-xs font-semibold text-[#FFF4E2] tracking-tight mb-1.5 font-sans">
                  {mod.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#8AD8B8] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8AD8B8]" />
                  {mod.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
