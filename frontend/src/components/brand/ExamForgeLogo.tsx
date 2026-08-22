"use client";

import React from "react";
import { cn } from "@/lib/cn";
import Link from "next/link";

export interface ExamForgeLogoProps {
  variant?: "horizontal" | "mark" | "monochrome" | "light" | "dark" | "small";
  className?: string;
  href?: string;
  size?: number;
  showSubtitle?: boolean;
}

export function ExamForgeLogo({
  variant = "horizontal",
  className,
  href = "/",
  size,
  showSubtitle = true,
}: ExamForgeLogoProps) {
  const isMarkOnly = variant === "mark" || variant === "small";
  const iconDimension = size || (variant === "small" ? 24 : variant === "mark" ? 40 : 36);

  const LogoContent = (
    <div
      className={cn(
        "inline-flex items-center gap-3 select-none group cursor-pointer transition-all duration-300",
        className
      )}
    >
      {/* EF Emblem Mark */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105"
        style={{
          width: iconDimension,
          height: iconDimension,
        }}
      >
        {/* Subtle glass rim & glow */}
        <div className="absolute inset-0 rounded-xl border border-[rgba(138,216,184,0.35)] bg-[rgba(19,45,40,0.7)] backdrop-blur-md shadow-[0_0_20px_-4px_rgba(138,216,184,0.3)] group-hover:shadow-[0_0_28px_-2px_rgba(138,216,184,0.5)] transition-all" />
        <img
          src="/logo-icon.png"
          alt="EF"
          className="relative z-10 w-full h-full object-contain p-1 mix-blend-screen"
        />
      </div>

      {/* Typography Label */}
      {!isMarkOnly && (
        <div className="flex flex-col min-w-0 text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#FFF4E2] font-sans">
              EXAM<span className="text-[#8AD8B8]">FORGE</span>
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[10px] font-mono tracking-widest text-[#8AD8B8]/70 uppercase mt-0.5">
              EXAMINATION INFRASTRUCTURE
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block no-underline">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
