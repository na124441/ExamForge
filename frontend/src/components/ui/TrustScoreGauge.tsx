"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

interface TrustScoreGaugeProps {
  score: number;
  required?: number;
  size?: number;
  strokeWidth?: number;
}

export function TrustScoreGauge({ 
  score = 100, 
  required = 95, 
  size = 120, 
  strokeWidth = 10 
}: TrustScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = "stroke-red-500";
  let textColor = "text-red-400";
  let bgFill = "bg-red-500/5";
  let ShieldIcon = ShieldAlert;

  if (clampedScore >= required) {
    color = "stroke-emerald-500";
    textColor = "text-emerald-400";
    bgFill = "bg-emerald-500/5";
    ShieldIcon = ShieldCheck;
  } else if (clampedScore >= 90) {
    color = "stroke-amber-500";
    textColor = "text-amber-400";
    bgFill = "bg-amber-500/5";
    ShieldIcon = Shield;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background track */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`fill-none transition-all duration-1000 ease-out ${color}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <ShieldIcon className={`w-5 h-5 mb-0.5 ${textColor}`} />
          <span className="text-2xl font-mono font-black text-white leading-none">
            {clampedScore}
          </span>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Trust Index
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className={`text-[10px] font-mono font-bold uppercase ${textColor}`}>
          {clampedScore >= required ? "High Integrity" : clampedScore >= 90 ? "Policy Warning" : "Integrity Compromise"}
        </span>
        <span className="block text-[9px] text-slate-500 font-medium mt-0.5">
          Policy threshold: {required}%
        </span>
      </div>
    </div>
  );
}
