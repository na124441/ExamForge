"use client";

import React from "react";
import { ArrowRight, HelpCircle, Sparkles } from "lucide-react";

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
    <div className="p-5 bg-white border border-indigo-100 hover:border-indigo-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 group-hover:w-2 transition-all" />
      <div className="flex gap-4 items-start relative z-10 pl-1">
        <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Recommended Workflow Step</span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-900 tracking-tight mt-0.5">
            {title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onClick}
        className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs active-press"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
