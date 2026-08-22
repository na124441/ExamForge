"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const ForgeDialog = Dialog.Root;
export const ForgeDialogTrigger = Dialog.Trigger;

export const ForgeDialogContent = React.forwardRef<
  HTMLDivElement,
  Dialog.DialogContentProps
>(({ className, children, ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content
      ref={ref}
      className={cn(
        // Mobile: Slide-up Bottom Sheet (bottom-0, full width, rounded top)
        "fixed z-50 grid w-full gap-4 p-6 shadow-2xl font-sans duration-[var(--duration-normal)] select-none",
        "bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)]",
        "bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-3xl rounded-b-none max-h-[90vh] overflow-y-auto",
        // Desktop & Tablet: Centered Modal Dialog
        "sm:bottom-auto sm:top-[50%] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-lg sm:rounded-2xl sm:max-h-[85vh]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {/* Mobile Drag Indicator Handle */}
      <div className="sm:hidden w-12 h-1.5 rounded-full bg-[var(--color-border-strong)] mx-auto -mt-2 mb-1 shrink-0" />

      {children}

      <Dialog.Close className="absolute right-5 top-5 rounded-full p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:pointer-events-none cursor-pointer transition-colors">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
));
ForgeDialogContent.displayName = Dialog.Content.displayName;

export const ForgeDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  Dialog.DialogTitleProps
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn("text-base sm:text-lg font-bold text-[var(--color-ink)] leading-snug tracking-tight", className)}
    {...props}
  />
));
ForgeDialogTitle.displayName = Dialog.Title.displayName;

export const ForgeDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  Dialog.DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn("text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed", className)}
    {...props}
  />
));
ForgeDialogDescription.displayName = Dialog.Description.displayName;

export const ForgeDialogClose = Dialog.Close;
