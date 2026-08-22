"use client";

import React, { useRef, useState } from "react";
import { UserCheck, FileText, BarChart3, CheckCircle2, ShieldCheck, MapPin, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/cn";

export interface GlassStatusCardProps {
  type: "candidate" | "examination" | "pipeline";
  className?: string;
  floatDelay?: string;
}

export function GlassStatusCard({ type, className, floatDelay }: GlassStatusCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative rounded-2xl p-4 sm:p-5 transition-all duration-300 select-none group",
        "bg-[rgba(19,45,40,0.75)] border border-[rgba(138,216,184,0.25)] hover:border-[rgba(138,216,184,0.5)]",
        "backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] hover:shadow-[0_25px_50px_-10px_rgba(0,0,0,0.8)]",
        className
      )}
      style={{
        animationDelay: floatDelay || "0s",
        boxShadow:
          "0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 1px 0 rgba(255,255,255,0.18), inset 0 0 20px rgba(138,216,184,0.03)",
      }}
    >
      {/* Specular Radial Cursor Highlight */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(138, 216, 184, 0.15), transparent 60%)`,
        }}
      />

      {/* CANDIDATE CARD */}
      {type === "candidate" && (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[rgba(64,133,118,0.3)] flex items-center justify-center text-[#8AD8B8]">
                <UserCheck size={14} />
              </div>
              <span className="font-mono text-[11px] font-bold text-[#FFF4E2] uppercase tracking-wider">
                CANDIDATE
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(138,216,184,0.15)] text-[#8AD8B8] border border-[rgba(138,216,184,0.3)] font-mono text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8AD8B8] animate-pulse" />
              Live
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8AD8B8]/70">Identity</span>
              <span className="font-medium text-[#8AD8B8] flex items-center gap-1">
                Verified <CheckCircle2 size={12} className="text-[#8AD8B8]" />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8AD8B8]/70">Registration</span>
              <span className="font-medium text-[#8AD8B8] flex items-center gap-1">
                Complete <CheckCircle2 size={12} className="text-[#8AD8B8]" />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8AD8B8]/70">Payment</span>
              <span className="font-medium text-[#8AD8B8] flex items-center gap-1">
                Confirmed <CheckCircle2 size={12} className="text-[#8AD8B8]" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[rgba(138,216,184,0.1)]">
              <span className="text-[#8AD8B8]/70 flex items-center gap-1">
                <MapPin size={11} /> Centre
              </span>
              <span className="font-mono text-[11px] text-[#FFF4E2] font-semibold">
                Knowledge Park &middot; N-12
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EXAMINATION CARD */}
      {type === "examination" && (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[rgba(64,133,118,0.3)] flex items-center justify-center text-[#8AD8B8]">
                <FileText size={14} />
              </div>
              <span className="font-mono text-[11px] font-bold text-[#FFF4E2] uppercase tracking-wider">
                EXAMINATION
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] border border-[rgba(138,216,184,0.3)] font-mono text-[10px] font-semibold">
              Scheduled
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#FFF4E2] truncate">
              M.S Computer Science 2026
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-[rgba(19,45,40,0.6)] border border-[rgba(138,216,184,0.12)]">
              <span className="text-[10px] text-[#8AD8B8]/70 block font-mono">Candidates</span>
              <span className="font-bold text-[#FFF4E2] font-mono">1,248</span>
            </div>
            <div className="p-2 rounded-xl bg-[rgba(19,45,40,0.6)] border border-[rgba(138,216,184,0.12)]">
              <span className="text-[10px] text-[#8AD8B8]/70 block font-mono">Centres</span>
              <span className="font-bold text-[#FFF4E2] font-mono">18</span>
            </div>
            <div className="p-2 rounded-xl bg-[rgba(19,45,40,0.6)] border border-[rgba(138,216,184,0.12)]">
              <span className="text-[10px] text-[#8AD8B8]/70 block font-mono">Date</span>
              <span className="font-semibold text-[#FFF4E2] text-[11px]">12 May 2026</span>
            </div>
            <div className="p-2 rounded-xl bg-[rgba(19,45,40,0.6)] border border-[rgba(138,216,184,0.12)]">
              <span className="text-[10px] text-[#8AD8B8]/70 block font-mono">Status</span>
              <span className="font-semibold text-[#8AD8B8] text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8AD8B8]" />
                Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {/* RESULT PIPELINE CARD */}
      {type === "pipeline" && (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[rgba(64,133,118,0.3)] flex items-center justify-center text-[#8AD8B8]">
                <BarChart3 size={14} />
              </div>
              <span className="font-mono text-[11px] font-bold text-[#FFF4E2] uppercase tracking-wider">
                RESULT PIPELINE
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(138,216,184,0.15)] text-[#8AD8B8] border border-[rgba(138,216,184,0.3)] font-mono text-[10px] font-semibold flex items-center gap-1">
              <ShieldCheck size={11} /> 100%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[#8AD8B8]/70">Submissions</span>
                <span className="font-mono font-bold text-[#FFF4E2]">1,248 / 1,248</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[rgba(19,45,40,0.8)] overflow-hidden border border-[rgba(138,216,184,0.2)]">
                <div className="w-full h-full bg-[#8AD8B8] rounded-full shadow-[0_0_10px_rgba(138,216,184,0.8)]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[#8AD8B8]/70">Evaluation</span>
                <span className="font-mono font-bold text-[#8AD8B8]">94%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[rgba(19,45,40,0.8)] overflow-hidden border border-[rgba(138,216,184,0.2)]">
                <div
                  className="h-full bg-gradient-to-r from-[#408576] to-[#8AD8B8] rounded-full shadow-[0_0_8px_rgba(138,216,184,0.6)]"
                  style={{ width: "94%" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-[rgba(138,216,184,0.1)]">
              <span className="text-[#8AD8B8]/70">Scorecard Ledger</span>
              <span className="font-semibold text-[#8AD8B8] flex items-center gap-1 text-[11px]">
                Ready <CheckCircle2 size={12} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
