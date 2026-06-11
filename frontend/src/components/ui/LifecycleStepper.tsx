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
        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    }
    if (status === "FAILED" || status === "BLOCKED") {
      return (
        <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    }
    if (isActive || status === "IN_PROGRESS") {
      return (
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </div>
      );
    }
    if (status === "LOCKED") {
      return (
        <div className="w-5 h-5 rounded-full bg-violet-900/50 border border-violet-500/30 text-violet-400 flex items-center justify-center">
          <Lock className="w-2.5 h-2.5" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center font-mono text-[9px] font-bold">
        {stage.sequence}
      </div>
    );
  };

  const getStepStyles = (stage: StepInfo, isActive: boolean) => {
    const status = stage.status.toUpperCase();
    if (status === "COMPLETED") {
      return {
        bg: "bg-emerald-950/10 border-emerald-900/20 text-slate-300",
        label: "text-emerald-400",
        statusText: "Verified"
      };
    }
    if (status === "FAILED") {
      return {
        bg: "bg-red-950/15 border-red-900/30 text-red-200",
        label: "text-red-400 font-bold",
        statusText: "Blocked"
      };
    }
    if (isActive || status === "IN_PROGRESS") {
      return {
        bg: "bg-blue-950/20 border-blue-800/40 text-white ring-1 ring-blue-500/25",
        label: "text-blue-400 font-bold",
        statusText: "Active"
      };
    }
    return {
      bg: "bg-slate-900/40 border-slate-800/60 text-slate-400",
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
                <h4 className="text-[11px] font-bold truncate leading-tight text-slate-200">
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
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {stages.map((stage) => {
          const isActive = activeSequence !== undefined ? stage.sequence === activeSequence : stage.status === "IN_PROGRESS";
          const styles = getStepStyles(stage, isActive);
          return (
            <div 
              key={stage.sequence} 
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border shrink-0 text-xs font-mono transition-all duration-200 ${styles.bg}`}
            >
              {renderStepIcon(stage, isActive)}
              <div>
                <h4 className="font-bold text-slate-200 text-[11px] max-w-[120px] truncate leading-none">
                  {stage.name.replace(/_/g, " ")}
                </h4>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
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
    <div className="flex flex-col gap-2">
      {stages.map((stage) => {
        const isActive = activeSequence !== undefined ? stage.sequence === activeSequence : stage.status === "IN_PROGRESS";
        const styles = getStepStyles(stage, isActive);
        return (
          <div 
            key={stage.sequence}
            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all duration-300 ${styles.bg}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {renderStepIcon(stage, isActive)}
              <div className="min-w-0">
                <h4 className="font-bold text-slate-200 truncate pr-2">
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
              stage.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" :
              "bg-slate-800/40 text-slate-500"
            }`}>
              {stage.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
