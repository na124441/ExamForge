"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { ForgeNavRail } from "./ForgeNavRail";
import { ForgeHeaderLight } from "./ForgeHeaderLight";
import { ForgeMobileNav } from "./ForgeMobileNav";
import { CommandPalette } from "./CommandPalette";

interface ForgeAdminLayoutProps {
  children: React.ReactNode;
  isCommandPaletteOpen?: boolean;
  onOpenCommandPalette?: () => void;
  onCloseCommandPalette?: () => void;
}

export function ForgeAdminLayout({
  children,
  isCommandPaletteOpen,
  onOpenCommandPalette,
  onCloseCommandPalette,
}: ForgeAdminLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex flex-row font-sans text-[var(--md-sys-color-on-surface)]">
      {/* M3 Navigation Rail (Desktop) */}
      <div className="hidden md:block h-screen sticky top-0 z-30">
        <ForgeNavRail />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[var(--md-sys-color-surface)]">
        {/* M3 Top App Bar */}
        <ForgeHeaderLight 
          onOpenCommandPalette={onOpenCommandPalette}
          onToggleMobileNav={() => setIsMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-[var(--md-sys-color-surface)] relative">
          {children}
        </main>
      </div>

      {/* M3 Mobile Navigation Drawer */}
      <ForgeMobileNav 
        open={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
      />

      {/* M3 Search Dialog / Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen ?? false}
        onClose={onCloseCommandPalette || (() => {})}
      />
    </div>
  );
}
