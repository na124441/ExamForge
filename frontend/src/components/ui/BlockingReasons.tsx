"use client";

import React from "react";
import { AlertOctagon, CornerDownRight, ShieldAlert } from "lucide-react";

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
    <div className="p-6 bg-red-50/80 border border-red-200 rounded-2xl flex gap-4 items-start shadow-xs">
      <div className="p-2.5 bg-red-100 border border-red-200 text-red-600 rounded-xl shrink-0">
        <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-extrabold text-red-950 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-red-700 mt-1 font-medium">
          The following security policies or unresolved operational integrity checks are preventing publication:
        </p>
        
        <ul className="mt-3.5 space-y-2 text-xs text-slate-800">
          {reasons.map((reason, index) => (
            <li key={index} className="flex gap-2.5 items-start leading-relaxed bg-white p-3 rounded-xl border border-red-200 shadow-2xs">
              <CornerDownRight className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-slate-900">{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
