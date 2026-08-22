"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/cn";

interface ForgeFormattedTextProps {
  content: string;
  className?: string;
}

export function ForgeFormattedText({ content, className }: ForgeFormattedTextProps) {
  if (!content) return null;

  // Safely renders LaTeX math to HTML via KaTeX
  const renderKaTeX = (math: string, displayMode: boolean) => {
    try {
      // Clean leading/trailing slash delimiters if present
      let cleanMath = math.trim();
      if (cleanMath.startsWith("\\(") && cleanMath.endsWith("\\)")) {
        cleanMath = cleanMath.slice(2, -2).trim();
      } else if (cleanMath.startsWith("$$") && cleanMath.endsWith("$$")) {
        cleanMath = cleanMath.slice(2, -2).trim();
      }

      const html = katex.renderToString(cleanMath, {
        displayMode,
        throwOnError: false,
      });

      return (
        <span
          dangerouslySetInnerHTML={{ __html: html }}
          className={cn(
            displayMode 
              ? "my-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-950 text-center shadow-2xs overflow-x-auto flex justify-center items-center font-sans" 
              : "inline-block px-1 py-0.5 mx-0.5 text-blue-900 font-sans"
          )}
        />
      );
    } catch {
      return <code className="text-xs font-mono text-amber-700">{math}</code>;
    }
  };

  const renderFormattedContent = (rawText: string) => {
    // Regex splits text into math blocks ($$...$$, \(...\)), inline code (`...`), and bold (**...**)
    const regex = /(\$\$[\s\S]*?\$\$|\\\(.*?\\\)|`[^`]+`|\*\*.*?\*\*)/g;
    const parts = rawText.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Block LaTeX math ($$...$$)
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return <React.Fragment key={index}>{renderKaTeX(part, true)}</React.Fragment>;
      }

      // Inline LaTeX math (\(... \))
      if (part.startsWith("\\(") && part.endsWith("\\)")) {
        return <React.Fragment key={index}>{renderKaTeX(part, false)}</React.Fragment>;
      }

      // Code snippets (`...`)
      if (part.startsWith("`") && part.endsWith("`")) {
        const codeText = part.slice(1, -1);
        return (
          <code 
            key={index} 
            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200"
          >
            {codeText}
          </code>
        );
      }

      // Bold text (**...**)
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-slate-900">
            {boldText}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={cn("text-slate-900 leading-relaxed text-base font-sans", className)}>
      {renderFormattedContent(content)}
    </div>
  );
}
