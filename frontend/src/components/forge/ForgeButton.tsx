"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap font-sans font-semibold transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none overflow-hidden active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent)] text-[var(--color-ink-inverse)] shadow-xs hover:bg-[var(--color-accent-hover)] rounded-lg",
        filled:
          "bg-[var(--color-accent)] text-[var(--color-ink-inverse)] shadow-xs hover:bg-[var(--color-accent-hover)] rounded-lg",
        secondary:
          "bg-[var(--color-surface-sunken)] text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-surface-inset)] hover:border-[var(--color-border-strong)] rounded-lg",
        tonal:
          "bg-[var(--color-accent-surface)] text-[var(--color-accent)] hover:brightness-95 rounded-lg",
        elevated:
          "bg-[var(--color-surface-raised)] text-[var(--color-ink)] border border-[var(--color-border)] shadow-xs hover:shadow-sm hover:border-[var(--color-border-strong)] rounded-lg",
        outline:
          "bg-transparent border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] hover:border-[var(--color-border-strong)] rounded-lg",
        outlined:
          "bg-transparent border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] hover:border-[var(--color-border-strong)] rounded-lg",
        ghost:
          "bg-transparent text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] rounded-lg",
        text:
          "bg-transparent text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] rounded-lg",
        danger:
          "bg-[var(--color-danger)] text-white shadow-xs hover:bg-[var(--color-danger-hover)] rounded-lg",
        fab:
          "bg-[var(--color-accent)] text-[var(--color-ink-inverse)] shadow-md hover:shadow-lg rounded-xl",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5",
        md: "h-9 px-4 text-xs font-semibold rounded-lg gap-2",
        lg: "h-11 px-5 text-sm font-semibold rounded-lg gap-2.5",
        compact: "h-7 px-2.5 text-xs rounded-md gap-1",
        icon: "h-9 w-9 p-0 rounded-lg justify-center",
        fab: "h-12 min-w-12 px-4 text-sm font-semibold rounded-xl gap-2.5",
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
