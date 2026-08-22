"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { Calculator, X, Delete, RotateCcw } from "lucide-react";

interface ForgeVirtualCalculatorProps {
  onInsertValue: (val: string) => void;
  onClose: () => void;
}

export function ForgeVirtualCalculator({ onInsertValue, onClose }: ForgeVirtualCalculatorProps) {
  const [display, setDisplay] = useState("0");

  const handleBtnClick = (val: string) => {
    if (val === "C") {
      setDisplay("0");
    } else if (val === "DEL") {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    } else if (val === "=") {
      try {
        // Safe evaluation of mathematical expression
        const cleanExpr = display.replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "Math.PI").replace(/e/g, "Math.E");
        const evalResult = Function(`"use strict"; return (${cleanExpr})`)();
        const resultStr = String(Number(evalResult).toFixed(4)).replace(/\.?0+$/, "");
        setDisplay(resultStr);
      } catch {
        setDisplay("Error");
      }
    } else if (val === "sin" || val === "cos" || val === "tan" || val === "sqrt" || val === "log") {
      try {
        const num = parseFloat(display);
        if (isNaN(num)) return;
        let res = 0;
        if (val === "sin") res = Math.sin((num * Math.PI) / 180);
        if (val === "cos") res = Math.cos((num * Math.PI) / 180);
        if (val === "tan") res = Math.tan((num * Math.PI) / 180);
        if (val === "sqrt") res = Math.sqrt(num);
        if (val === "log") res = Math.log10(num);
        setDisplay(String(Number(res.toFixed(4))).replace(/\.?0+$/, ""));
      } catch {
        setDisplay("Error");
      }
    } else {
      setDisplay(prev => prev === "0" || prev === "Error" ? val : prev + val);
    }
  };

  const keys = [
    ["sin", "cos", "tan", "sqrt", "C"],
    ["log", "(", ")", "^", "÷"],
    ["7", "8", "9", "×", "DEL"],
    ["4", "5", "6", "-", "π"],
    ["1", "2", "3", "+", "e"],
    ["0", ".", "="]
  ];

  return (
    <div className="fixed bottom-20 right-8 z-50 w-80 bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden font-sans animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-blue-400" />
          Proctored Scientific Calculator
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Screen */}
      <div className="p-3 bg-slate-100 border-b border-slate-200 text-right">
        <div className="text-xs text-slate-500 font-mono">Expression</div>
        <div className="text-xl font-bold font-mono text-slate-900 tracking-tight overflow-x-auto whitespace-nowrap">
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="p-3 space-y-2 bg-slate-50">
        {keys.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1.5 justify-between">
            {row.map(key => {
              const isOp = ["+", "-", "×", "÷", "="].includes(key);
              const isFunc = ["sin", "cos", "tan", "sqrt", "log", "^", "π", "e", "(", ")"].includes(key);
              const isAction = ["C", "DEL"].includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleBtnClick(key)}
                  className={cn(
                    "flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all active:scale-95 shadow-2xs",
                    isOp && "bg-blue-600 text-white hover:bg-blue-700",
                    isFunc && "bg-slate-200 text-slate-700 hover:bg-slate-300",
                    isAction && "bg-rose-100 text-rose-700 hover:bg-rose-200",
                    !isOp && !isFunc && !isAction && "bg-white border border-slate-200 text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}

        <button
          onClick={() => {
            onInsertValue(display);
            onClose();
          }}
          className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
        >
          Insert Output ({display}) Into Answer Box
        </button>
      </div>
    </div>
  );
}
