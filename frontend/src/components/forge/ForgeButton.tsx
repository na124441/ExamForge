"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap font-sans font-medium transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] disabled:pointer-events-none disabled:opacity-38 cursor-pointer select-none overflow-hidden active:scale-[0.98]",
  {
    variants: {
      variant: {
        // M3 Filled Button (High Emphasis)
        primary:
          "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] rounded-full hover:brightness-105 active:shadow-[var(--md-sys-elevation-1)]",
        filled:
          "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] rounded-full hover:brightness-105 active:shadow-[var(--md-sys-elevation-1)]",
        // M3 Filled Tonal Button (Medium Emphasis)
        secondary:
          "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:brightness-95 rounded-full",
        tonal:
          "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:brightness-95 rounded-full",
        // M3 Elevated Button
        elevated:
          "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] rounded-full",
        // M3 Outlined Button
        outline:
          "bg-transparent border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/20 rounded-full",
        outlined:
          "bg-transparent border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/20 rounded-full",
        // M3 Text Button
        ghost:
          "bg-transparent text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/20 rounded-full",
        text:
          "bg-transparent text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/20 rounded-full",
        // M3 Error / Danger Button
        danger:
          "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] shadow-[var(--md-sys-elevation-1)] hover:brightness-105 rounded-full",
        // M3 Floating Action Button (FAB)
        fab:
          "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-[var(--md-sys-elevation-3)] hover:shadow-[var(--md-sys-elevation-4)] active:shadow-[var(--md-sys-elevation-2)] rounded-2xl",
      },
      size: {
        sm: "h-8 px-3.5 text-xs rounded-full gap-1.5",
        md: "h-10 px-5 text-sm rounded-full gap-2",
        lg: "h-12 px-6 text-base rounded-full gap-2.5",
        compact: "h-8 px-3 text-xs rounded-full gap-1.5",
        icon: "h-10 w-10 p-0 rounded-full justify-center",
        fab: "h-14 min-w-14 px-4 text-sm font-semibold rounded-2xl gap-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ForgeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  iconPlacement?: "left" | "right";
  fullWidth?: boolean;
}

const ForgeButton = React.forwardRef<HTMLButtonElement, ForgeButtonProps>(
  ({ className, variant, size, icon, iconPlacement = "left", fullWidth, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), fullWidth ? "w-full" : "")}
        ref={ref}
        {...props}
      >
        {icon && iconPlacement === "left" && (
          <span className="inline-flex items-center shrink-0">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {icon && iconPlacement === "right" && (
          <span className="inline-flex items-center shrink-0">
            {icon}
          </span>
        )}
      </button>
    );
  }
);
ForgeButton.displayName = "ForgeButton";

export { ForgeButton, buttonVariants };
