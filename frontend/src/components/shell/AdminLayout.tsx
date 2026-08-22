"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { ForgeSidebar } from "./ForgeSidebar";
import { ForgeHeader } from "./ForgeHeader";
import { CommandPalette } from "./CommandPalette";

interface AdminLayoutProps {
  children: React.ReactNode;
  onOpenCommandPalette?: () => void;
  isCommandPaletteOpen?: boolean;
  onCloseCommandPalette?: () => void;
}

export function AdminLayout({
  children,
  onOpenCommandPalette,
  isCommandPaletteOpen = false,
  onCloseCommandPalette,
}: AdminLayoutProps) {
  return (
    <div
      className={cn(
        "h-[100dvh] flex flex-col",
        "bg-[var(--surface-app)] text-[var(--text-primary)]",
        "font-sans selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)]"
      )}
    >
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={onCloseCommandPalette || (() => {})}
      />

      <div className="flex-1 flex overflow-hidden">
        <ForgeSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <ForgeHeader onOpenCommandPalette={onOpenCommandPalette} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto px-6 py-5 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
