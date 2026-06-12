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

  let colorClass = "stroke-red-500";
  let textColor = "text-red-400";
  let glowClass = "shadow-glow-red/5";
  let gradientId = "trust-red";
  let shadowColor = "#ef4444";
  let ShieldIcon = ShieldAlert;

  if (clampedScore >= required) {
    colorClass = "stroke-emerald-500";
    textColor = "text-emerald-400";
    glowClass = "shadow-glow-emerald/10";
    gradientId = "trust-emerald";
    shadowColor = "#10b981";
    ShieldIcon = ShieldCheck;
  } else if (clampedScore >= 90) {
    colorClass = "stroke-amber-500";
    textColor = "text-amber-400";
    glowClass = "shadow-glow-cyan/10";
    gradientId = "trust-amber";
    shadowColor = "#f59e0b";
    ShieldIcon = Shield;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-5 bg-glass-card border border-slate-800/40 rounded-2xl ${glowClass} transition-all duration-300`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background track and gradient progress */}
        <svg className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="trust-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="trust-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="trust-red" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={shadowColor} floodOpacity="0.5" />
            </filter>
          </defs>
          
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800/60 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            filter="url(#gauge-glow)"
            className="fill-none transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <ShieldIcon className={`w-5 h-5 mb-0.5 ${textColor} filter drop-shadow-[0_0_4px_rgba(255,255,255,0.1)]`} />
          <span className="text-3xl font-outfit font-black text-white leading-none tracking-tight">
            {clampedScore}
          </span>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono">
            Trust Index
          </span>
        </div>
      </div>

      <div className="mt-4.5 text-center">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textColor}`}>
          {clampedScore >= required ? "High Integrity" : clampedScore >= 90 ? "Policy Warning" : "Integrity Compromise"}
        </span>
        <span className="block text-[9px] text-slate-400 font-medium mt-1 font-sans">
          Policy threshold: <span className="font-mono text-white font-bold">{required}%</span>
        </span>
      </div>
    </div>
  );
}
