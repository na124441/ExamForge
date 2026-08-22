"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { ForgeFormattedText } from "./ForgeFormattedText";

export interface ForgeAnswerOptionProps {
  optionKey: string;
  text: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
}

export function ForgeAnswerOption({
  optionKey,
  text,
  isSelected,
  onSelect,
  disabled = false,
  className,
}: ForgeAnswerOptionProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onSelect()}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer outline-none transition-all font-sans",
        isSelected
          ? "border-blue-600 bg-blue-50/50 shadow-2xs"
          : "border-slate-200 hover:border-slate-300 bg-white",
        disabled && "opacity-50 cursor-not-allowed",
        "focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center w-6 h-6 rounded-full border-2 mt-0.5 transition-colors",
          isSelected
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 bg-white"
        )}
      >
        {isSelected && (
          <div className="w-2.5 h-2.5 rounded-full bg-white" />
        )}
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
          Option {optionKey}
        </span>
        <div className="text-base text-slate-900 leading-normal">
          <ForgeFormattedText content={text} />
        </div>
      </div>
    </div>
  );
}
