"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface ForgeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "filled" | "outlined" | "dark" | "black";
}

export const ForgeCard = React.forwardRef<HTMLDivElement, ForgeCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl transition-all duration-[var(--duration-normal)] font-sans",
        (variant === "default" || variant === "elevated") &&
          "bg-[rgba(19,45,40,0.75)] border border-[rgba(138,216,184,0.22)] shadow-xl backdrop-blur-xl text-[#FFF4E2]",
        variant === "filled" &&
          "bg-[rgba(19,45,40,0.9)] border border-[rgba(138,216,184,0.25)] text-[#FFF4E2]",
        variant === "outlined" &&
          "bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] text-[#FFF4E2]",
        (variant === "dark" || variant === "black") &&
          "bg-[#081310] border border-[rgba(138,216,184,0.2)] text-[#FFF4E2] shadow-2xl",
        className
      )}
      {...props}
    />
  )
);
ForgeCard.displayName = "ForgeCard";

export interface ForgeCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ForgeCardHeader = React.forwardRef<HTMLDivElement, ForgeCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-5 pb-3", className)}
      {...props}
    />
  )
);
ForgeCardHeader.displayName = "ForgeCardHeader";

export interface ForgeCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const ForgeCardTitle = React.forwardRef<HTMLHeadingElement, ForgeCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base font-semibold text-[var(--md-sys-color-on-surface)] leading-snug tracking-tight m3-title-md", className)}
      {...props}
    />
  )
);
ForgeCardTitle.displayName = "ForgeCardTitle";

export interface ForgeCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ForgeCardContent = React.forwardRef<HTMLDivElement, ForgeCardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-5 pt-0 text-[var(--md-sys-color-on-surface-variant)]", className)}
      {...props}
    />
  )
);
ForgeCardContent.displayName = "ForgeCardContent";

export interface ForgeCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ForgeCardFooter = React.forwardRef<HTMLDivElement, ForgeCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-3 p-5 pt-3 border-t border-[var(--md-sys-color-outline-variant)]", className)}
      {...props}
    />
  )
);
ForgeCardFooter.displayName = "ForgeCardFooter";
