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
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--surface-overlay)] backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4",
        "bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] p-6 shadow-[var(--md-sys-elevation-3)]",
        "rounded-[28px] font-sans duration-[var(--duration-normal)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
      <Dialog.Close className="absolute right-5 top-5 rounded-full p-1 text-[var(--md-sys-color-on-surface-variant)] opacity-70 transition-opacity hover:opacity-100 hover:bg-[var(--md-sys-color-surface-container-highest)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] disabled:pointer-events-none cursor-pointer">
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
    className={cn("text-lg font-semibold text-[var(--md-sys-color-on-surface)] leading-snug tracking-tight m3-headline-sm", className)}
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
    className={cn("text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed m3-body-md", className)}
    {...props}
  />
));
ForgeDialogDescription.displayName = Dialog.Description.displayName;

export const ForgeDialogClose = Dialog.Close;
