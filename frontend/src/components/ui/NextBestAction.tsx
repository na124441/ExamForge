"use client";

import React from "react";
import { ArrowRight, HelpCircle } from "lucide-react";

interface NextBestActionProps {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  icon?: React.ComponentType<any>;
}

export function NextBestAction({
  title,
  description,
  actionLabel,
  onClick,
  icon: Icon = HelpCircle
}: NextBestActionProps) {
  return (
    <div className="p-4.5 bg-violet-500/[0.03] border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg shadow-violet-950/5 hover:border-violet-500/35 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500" />
      <div className="flex gap-3.5 items-start relative z-10">
        <div className="p-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl shrink-0 mt-0.5 shadow-[0_0_10px_rgba(124,58,237,0.1)]">
          <Icon className="w-5 h-5 stroke-[2] animate-pulse" />
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest font-mono">
            Recommended Next Step
          </span>
          <h4 className="text-sm font-extrabold text-white tracking-tight mt-0.5">
            {title}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onClick}
        className="w-full sm:w-auto px-4 py-2 bg-violet-600 hover:bg-violet-550 hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer shrink-0 active-press"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
