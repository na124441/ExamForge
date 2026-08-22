"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExamForgeLogo } from "../brand/ExamForgeLogo";
import { Menu, X, ChevronDown, Sparkles, Shield, User, GraduationCap, Building2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface GlassNavbarProps {
  onOpenAuthModal?: () => void;
}

export function GlassNavbar({ onOpenAuthModal }: GlassNavbarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 transition-all duration-300 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div
          className={cn(
            "flex items-center justify-between px-4 sm:px-6 py-3 rounded-xl transition-all duration-300",
            scrolled
              ? "bg-[var(--color-surface-raised)]/90 border border-[var(--color-border)] shadow-lg backdrop-blur-xl"
              : "bg-[var(--color-surface-raised)]/70 border border-[var(--color-border-subtle)] shadow-md backdrop-blur-lg"
          )}
        >
          {/* Brand Logo */}
          <ExamForgeLogo variant="horizontal" size={34} />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <a
              href="#platform"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-all"
            >
              Platform
            </a>
            <a
              href="#solutions"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-all"
            >
              Solutions
            </a>
            <a
              href="#lifecycle"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-all"
            >
              How It Works
            </a>
            <Link
              href="/safebatch"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>SafeBatch Engine</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-400 text-slate-950 font-black uppercase">
                Challenge
              </span>
            </Link>
            <Link
              href="/security"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-all"
            >
              Security
            </Link>
            <Link
              href="/portals"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-ink)] hover:bg-[var(--color-accent-surface)] transition-all flex items-center gap-1"
            >
              <Sparkles size={12} />
              Identity Portals
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/candidate"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[var(--color-ink)] bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-inset)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <GraduationCap size={13} className="text-[var(--color-accent)]" />
              Student Login
            </Link>

            <Link
              href="/vendor"
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--color-ink-inverse)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] border border-white/20 transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 font-sans"
            >
              <Building2 size={13} />
              Vendor Login
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--color-accent)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] backdrop-blur-2xl shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-1">
              <a
                href="#platform"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
              >
                Platform
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
              >
                Solutions
              </a>
              <a
                href="#lifecycle"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
              >
                How It Works
              </a>
              <Link
                href="/safebatch"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
              >
                SafeBatch Operations
              </Link>
              <Link
                href="/security"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
              >
                Security & Hardening
              </Link>
              <Link
                href="/portals"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-surface)]"
              >
                ⚡ Identity Portals Hub
              </Link>
            </nav>

            <div className="pt-3 border-t border-[var(--color-border)] flex flex-col gap-2">
              <Link
                href="/candidate"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-center text-[var(--color-ink)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center gap-2"
              >
                <GraduationCap size={15} className="text-[var(--color-accent)]" />
                Student Portal Login
              </Link>
              <Link
                href="/vendor"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-center text-[var(--color-ink-inverse)] bg-[var(--color-accent)] border border-white/20 flex items-center justify-center gap-2"
              >
                <Building2 size={15} />
                Vendor & Authority Login
              </Link>
              {onOpenAuthModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-center text-[var(--color-accent)] bg-[var(--color-accent-surface)] border border-[var(--color-border)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User size={14} />
                  Switch Role / Persona
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
