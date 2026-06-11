"use client";

import React from "react";
import { AlertOctagon, CornerDownRight } from "lucide-react";

interface BlockingReasonsProps {
  title?: string;
  reasons: string[];
}

export function BlockingReasons({ 
  title = "Publication Gate Blocked", 
  reasons = [] 
}: BlockingReasonsProps) {
  if (reasons.length === 0) return null;

  return (
    <div className="p-5 bg-red-950/15 border border-red-900/30 rounded-2xl flex gap-4 items-start shadow-lg shadow-red-950/5">
      <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shrink-0">
        <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-extrabold text-red-200 tracking-tight font-mono uppercase">
          {title}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          The following security policies or unresolved operational logs are blocking execution:
        </p>
        
        <ul className="mt-3 space-y-2 text-xs font-mono text-slate-300">
          {reasons.map((reason, index) => (
            <li key={index} className="flex gap-2 items-start leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-red-900/10">
              <CornerDownRight className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
