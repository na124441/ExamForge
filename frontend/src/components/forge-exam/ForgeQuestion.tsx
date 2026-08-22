"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { ForgeFormattedText } from "./ForgeFormattedText";

export interface ForgeQuestionProps {
  number: number;
  section: string;
  text: string;
  marks: number;
  negativeMarks: number;
  type?: "MCQ_SINGLE" | "MCQ_MULTI" | "SUBJECTIVE" | "NUMERICAL";
  className?: string;
}

export function ForgeQuestion({
  number,
  section,
  text,
  marks,
  negativeMarks,
  type = "MCQ_SINGLE",
  className,
}: ForgeQuestionProps) {
  return (
    <div className={cn("flex flex-col gap-4 font-sans", className)}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            {section}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {type === "MCQ_SINGLE" ? "Single Choice" :
             type === "MCQ_MULTI" ? "Multiple Select" :
             type === "SUBJECTIVE" ? "Subjective Essay" : "Numerical Input"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono font-semibold">
          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            +{marks} Marks
          </span>
          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            -{negativeMarks} Marks
          </span>
        </div>
      </div>
      
      <div className="flex items-start gap-3">
        <span className="text-xl font-bold text-slate-900 shrink-0 pt-0.5 font-mono">
          Q{number}.
        </span>
        <div className="flex-1">
          <ForgeFormattedText content={text} className="text-lg text-slate-900 leading-relaxed" />
        </div>
      </div>
    </div>
  );
}
