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
        "rounded-xl transition-all duration-[var(--duration-normal)] font-sans",
        (variant === "default" || variant === "elevated") &&
          "bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs hover:shadow-sm text-[var(--color-ink)]",
        variant === "filled" &&
          "bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)]",
        variant === "outlined" &&
          "bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-ink)]",
        (variant === "dark" || variant === "black") &&
          "bg-[var(--color-surface-inset)] border border-[var(--color-border)] text-[var(--color-ink)] shadow-md",
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
      className={cn("text-sm font-bold text-[var(--color-ink)] leading-snug tracking-tight font-sans", className)}
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
      className={cn("p-5 pt-0 text-[var(--color-ink-secondary)] text-sm", className)}
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
      className={cn("flex items-center justify-end gap-3 p-5 pt-3 border-t border-[var(--color-border-subtle)]", className)}
      {...props}
    />
  )
);
ForgeCardFooter.displayName = "ForgeCardFooter";
