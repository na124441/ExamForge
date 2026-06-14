"use client";

import React from "react";
import { Check, Lock, AlertCircle, Play, Loader2 } from "lucide-react";

export interface StepInfo {
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | string;
  sequence: number;
}

interface LifecycleStepperProps {
  stages: StepInfo[];
  activeSequence?: number;
  layout?: "horizontal" | "vertical" | "grid";
}

export function LifecycleStepper({ 
  stages = [], 
  activeSequence,
  layout = "vertical" 
}: LifecycleStepperProps) {
  
  const renderStepIcon = (stage: StepInfo, isActive: boolean) => {
    const status = stage.status.toUpperCase();
    if (status === "COMPLETED") {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-glow-emerald/40">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    }
    if (status === "FAILED" || status === "BLOCKED") {
      return (
        <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse shadow-glow-red/40">
          <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    }
    if (isActive || status === "IN_PROGRESS") {
      return (
        <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center ring-2 ring-violet-500/50 ring-offset-1 ring-offset-slate-950 shadow-glow-violet/40">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </div>
      );
    }
    if (status === "LOCKED") {
      return (
        <div className="w-5 h-5 rounded-full bg-violet-950 border border-violet-500/20 text-violet-400 flex items-center justify-center">
          <Lock className="w-2.5 h-2.5" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-850 text-slate-500 flex items-center justify-center font-mono text-[9px] font-bold">
        {stage.sequence}
      </div>
    );
  };

  const getStepStyles = (stage: StepInfo, isActive: boolean) => {
    const status = stage.status.toUpperCase();
    if (status === "COMPLETED") {
      return {
        bg: "bg-glass border-emerald-500/15 text-slate-300 shadow-glow-emerald/2 hover:border-emerald-500/25",
        label: "text-emerald-400",
        statusText: "Verified"
      };
    }
    if (status === "FAILED") {
      return {
        bg: "bg-glass border-red-500/15 text-red-200 shadow-glow-red/5 hover:border-red-500/25",
        label: "text-red-400 font-bold",
        statusText: "Blocked"
      };
    }
    if (isActive || status === "IN_PROGRESS") {
      return {
        bg: "bg-slate-900/90 border-violet-500/30 text-white shadow-glow-violet/8 ring-1 ring-violet-500/15",
        label: "text-violet-400 font-bold",
        statusText: "Active"
      };
    }
    return {
      bg: "bg-glass-card border-slate-900 text-slate-400 hover:border-slate-800/40 hover:bg-slate-900/10",
      label: "text-slate-400",
      statusText: "Pending"
    };
  };

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const isActive = activeSequence !== undefined ? stage.sequence === activeSequence : stage.status === "IN_PROGRESS";
          const styles = getStepStyles(stage, isActive);
          return (
            <div 
              key={stage.sequence}
              className={`p-3 rounded-xl border flex flex-col justify-between min-h-[76px] transition-all duration-300 ${styles.bg}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-500">#{stage.sequence}</span>
                {renderStepIcon(stage, isActive)}
              </div>
              <div className="mt-2 text-left">
                <h4 className="text-[11px] font-outfit font-bold truncate leading-tight text-slate-200">
                  {stage.name.replace(/_/g, " ")}
                </h4>
                <span className="text-[8px] font-mono font-semibold opacity-60 uppercase tracking-widest mt-0.5 block">
                  {styles.statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === "horizontal") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-3.5 pt-1 scrollbar-thin">
        {stages.map((stage) => {
          const isActive = activeSequence !== undefined ? stage.sequence === activeSequence : stage.status === "IN_PROGRESS";
          const styles = getStepStyles(stage, isActive);
          return (
            <div 
              key={stage.sequence} 
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border shrink-0 text-xs font-mono transition-all duration-200 ${styles.bg}`}
            >
              {renderStepIcon(stage, isActive)}
              <div>
                <h4 className="font-outfit font-bold text-slate-200 text-[11px] max-w-[120px] truncate leading-none">
                  {stage.name.replace(/_/g, " ")}
                </h4>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mt-1.5">
                  Step {stage.sequence}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical Stepper (Default)
  return (
    <div className="flex flex-col gap-2.5">
      {stages.map((stage) => {
        const isActive = activeSequence !== undefined ? stage.sequence === activeSequence : stage.status === "IN_PROGRESS";
        const styles = getStepStyles(stage, isActive);
        return (
          <div 
            key={stage.sequence}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-mono transition-all duration-300 ${styles.bg}`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {renderStepIcon(stage, isActive)}
              <div className="min-w-0">
                <h4 className="font-outfit font-bold text-slate-200 truncate pr-2">
                  {stage.name.replace(/_/g, " ")}
                </h4>
                <span className="text-[9px] text-slate-500">
                  Sequence Block #{stage.sequence}
                </span>
              </div>
            </div>
            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
              stage.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" :
              stage.status === "FAILED" ? "bg-red-500/10 text-red-400" :
              stage.status === "IN_PROGRESS" ? "bg-violet-500/10 text-violet-400 animate-pulse" :
              "bg-slate-850 text-slate-500"
            }`}>
              {stage.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
