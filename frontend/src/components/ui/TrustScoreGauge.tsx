"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Shield, Activity, Lock, Cpu } from "lucide-react";

interface TrustScoreGaugeProps {
  score: number;
  required?: number;
  size?: number;
  strokeWidth?: number;
  showBreakdown?: boolean;
}

export function TrustScoreGauge({ 
  score = 97, 
  required = 95, 
  size = 140, 
  strokeWidth = 10,
  showBreakdown = true
}: TrustScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = "#059669";
  let textColor = "text-emerald-700";
  let bgBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let ShieldIcon = ShieldCheck;
  let verdictText = "High Integrity Verified";

  if (clampedScore < 90) {
    strokeColor = "#DC2626";
    textColor = "text-red-700";
    bgBadgeColor = "bg-red-50 text-red-700 border-red-200";
    ShieldIcon = ShieldAlert;
    verdictText = "Integrity Compromise Alert";
  } else if (clampedScore < required) {
    strokeColor = "#D97706";
    textColor = "text-amber-700";
    bgBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    ShieldIcon = Shield;
    verdictText = "Policy Threshold Warning";
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all duration-200">
      
      {/* SVG Radial Gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90">
          {/* Subtle Outer Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-100 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Active Meter Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            className="fill-none transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Central Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <ShieldIcon className={`w-5 h-5 mb-0.5 ${textColor}`} />
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {clampedScore}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Trust Index
          </span>
        </div>
      </div>

      {/* Verdict & Policy Threshold */}
      <div className="mt-4 text-center space-y-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${bgBadgeColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${clampedScore >= required ? "bg-emerald-500 beacon-emerald" : "bg-amber-500 beacon-amber"}`} />
          {verdictText}
        </span>
        <p className="text-[11px] text-slate-500 font-medium">
          Target standard: <span className="font-bold text-slate-800">{required}%</span> policy threshold
        </p>
      </div>

      {/* Breakdown Metrics */}
      {showBreakdown && (
        <div className="w-full mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Ledger Audit</span>
            <span className="font-bold text-emerald-700 font-mono">100%</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 font-medium">HSM Keys</span>
            <span className="font-bold text-emerald-700 font-mono">100%</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Cheat Anomaly</span>
            <span className="font-bold text-slate-700 font-mono">0.0%</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 font-medium">Grading Delta</span>
            <span className="font-bold text-slate-700 font-mono">1.2%</span>
          </div>
        </div>
      )}
    </div>
  );
}
