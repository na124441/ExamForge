"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { ForgeNavRail } from "./ForgeNavRail";
import { ForgeHeaderLight } from "./ForgeHeaderLight";
import { ForgeMobileNav } from "./ForgeMobileNav";
import { ForgeBottomNav } from "./ForgeBottomNav";
import { CommandPalette } from "./CommandPalette";

interface ForgeAdminLayoutProps {
  children: React.ReactNode;
  isCommandPaletteOpen?: boolean;
  onOpenCommandPalette?: () => void;
  onCloseCommandPalette?: () => void;
  workspace?: string;
}

export function ForgeAdminLayout({
  children,
  isCommandPaletteOpen,
  onOpenCommandPalette,
  onCloseCommandPalette,
  workspace = "vendor",
}: ForgeAdminLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div
      data-workspace={workspace}
      className="min-h-screen bg-[var(--color-surface)] flex flex-row font-sans text-[var(--color-ink)]"
    >
      {/* Navigation Rail (Desktop) */}
      <div className="hidden md:block h-screen sticky top-0 z-30">
        <ForgeNavRail />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <ForgeHeaderLight 
          onOpenCommandPalette={onOpenCommandPalette}
          onToggleMobileNav={() => setIsMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto relative pb-safe-bottom-nav md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Role-Aware Bottom Navigation */}
      <ForgeBottomNav onToggleDrawer={() => setIsMobileNavOpen(true)} />

      {/* Mobile Navigation Drawer */}
      <ForgeMobileNav 
        open={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen ?? false}
        onClose={onCloseCommandPalette || (() => {})}
      />
    </div>
  );
}
