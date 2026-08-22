"use client";

import React from "react";
import { Check, Lock, AlertCircle, Play, Loader2, ChevronRight, ShieldCheck } from "lucide-react";

export interface StepInfo {
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "LOCKED" | string;
  sequence: number;
  actor?: string;
  timestamp?: string;
}

interface LifecycleStepperProps {
  stages: StepInfo[];
  activeSequence?: number;
  layout?: "horizontal" | "vertical" | "grid";
  onSelectStep?: (stage: StepInfo) => void;
}

export function LifecycleStepper({ 
  stages = [], 
  activeSequence,
  layout = "vertical",
  onSelectStep
}: LifecycleStepperProps) {
  
  const renderStepIcon = (stage: StepInfo, isActive: boolean) => {
    const status = stage.status.toUpperCase();
    if (status === "COMPLETED") {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    }
    if (status === "FAILED" || status === "BLOCKED") {
      return (
        <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    }
    if (isActive || status === "IN_PROGRESS") {
      return (
        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-indigo-100 shadow-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </div>
      );
    }
    if (status === "LOCKED") {
      return (
        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
          <Lock className="w-2.5 h-2.5" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center text-[10px] font-bold">
        {stage.sequence}
      </div>
    );
  };

  const getStepStyles = (stage: StepInfo, isActive: boolean) => {
    const status = stage.status.toUpperCase();
    if (status === "COMPLETED") {
      return {
        bg: "bg-white border-emerald-200 text-slate-800 hover:border-emerald-300 shadow-xs",
        label: "text-emerald-950 font-bold",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        statusText: "Verified"
      };
    }
    if (status === "FAILED" || status === "BLOCKED") {
      return {
        bg: "bg-red-50/50 border-red-200 text-red-900 hover:border-red-300 shadow-xs",
        label: "text-red-950 font-bold",
        badge: "bg-red-50 text-red-700 border-red-200",
        statusText: "Blocked"
      };
    }
    if (isActive || status === "IN_PROGRESS") {
      return {
        bg: "bg-indigo-50/70 border-indigo-300 text-indigo-950 ring-1 ring-indigo-200 shadow-xs",
        label: "text-indigo-950 font-bold",
        badge: "bg-indigo-600 text-white border-indigo-600",
        statusText: "Active"
      };
    }
    return {
      bg: "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-xs",
      label: "text-slate-700 font-semibold",
      badge: "bg-slate-100 text-slate-500 border-slate-200",
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
              onClick={() => onSelectStep && onSelectStep(stage)}
              className={`p-3 rounded-xl border flex flex-col justify-between min-h-[82px] transition-all duration-200 cursor-pointer ${styles.bg}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold text-slate-400">#{stage.sequence}</span>
                {renderStepIcon(stage, isActive)}
              </div>
              <div className="mt-2 text-left">
                <h4 className={`text-xs truncate leading-tight ${styles.label}`}>
                  {stage.name.replace(/_/g, " ")}
                </h4>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border mt-1 inline-block ${styles.badge}`}>
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
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {stages.map((stage) => {
          const isActive = activeSequence !== undefined ? stage.sequence === activeSequence : stage.status === "IN_PROGRESS";
          const styles = getStepStyles(stage, isActive);
          return (
            <div 
              key={stage.sequence} 
              onClick={() => onSelectStep && onSelectStep(stage)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border shrink-0 text-xs transition-all duration-150 cursor-pointer ${styles.bg}`}
            >
              {renderStepIcon(stage, isActive)}
              <div>
                <h4 className={`text-xs max-w-[130px] truncate leading-none ${styles.label}`}>
                  {stage.name.replace(/_/g, " ")}
                </h4>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                  Step {stage.sequence} • {styles.statusText}
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
            onClick={() => onSelectStep && onSelectStep(stage)}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${styles.bg}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {renderStepIcon(stage, isActive)}
              <div className="min-w-0">
                <h4 className={`truncate pr-2 ${styles.label}`}>
                  {stage.name.replace(/_/g, " ")}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span className="font-mono font-medium">Stage #{stage.sequence}</span>
                  {stage.actor && (
                    <>
                      <span>•</span>
                      <span className="truncate">{stage.actor}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${styles.badge}`}>
              {stage.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
