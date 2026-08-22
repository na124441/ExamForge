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
            "flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl transition-all duration-300",
            scrolled
              ? "bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              : "bg-[rgba(19,45,40,0.6)] border border-[rgba(138,216,184,0.18)] shadow-[0_12px_36px_-8px_rgba(0,0,0,0.4)] backdrop-blur-lg"
          )}
          style={{
            boxShadow: scrolled
              ? "0 20px 50px -10px rgba(0,0,0,0.7), inset 0 1px 1px 0 rgba(255,255,255,0.15)"
              : "0 12px 36px -8px rgba(0,0,0,0.5), inset 0 1px 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {/* Brand Logo */}
          <ExamForgeLogo variant="horizontal" size={34} />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <a
              href="#platform"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FFF4E2]/80 hover:text-[#FFF4E2] hover:bg-[rgba(255,244,226,0.06)] transition-all"
            >
              Platform
            </a>
            <a
              href="#solutions"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FFF4E2]/80 hover:text-[#FFF4E2] hover:bg-[rgba(255,244,226,0.06)] transition-all"
            >
              Solutions
            </a>
            <a
              href="#lifecycle"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FFF4E2]/80 hover:text-[#FFF4E2] hover:bg-[rgba(255,244,226,0.06)] transition-all"
            >
              How It Works
            </a>
            <Link
              href="/safebatch"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FFF4E2]/80 hover:text-[#FFF4E2] hover:bg-[rgba(255,244,226,0.06)] transition-all"
            >
              SafeBatch
            </Link>
            <Link
              href="/security"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FFF4E2]/80 hover:text-[#FFF4E2] hover:bg-[rgba(255,244,226,0.06)] transition-all"
            >
              Security
            </Link>
            <Link
              href="/portals"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#8AD8B8] hover:text-[#FFF4E2] hover:bg-[rgba(138,216,184,0.12)] transition-all flex items-center gap-1"
            >
              <Sparkles size={12} />
              Identity Portals
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/candidate"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#FFF4E2] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] border border-[rgba(138,216,184,0.25)] hover:border-[rgba(138,216,184,0.4)] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <GraduationCap size={13} className="text-[#8AD8B8]" />
              Student Login
            </Link>

            <Link
              href="/vendor"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#132D28] bg-[#8AD8B8] hover:bg-[#a1e5c8] border border-[rgba(255,255,255,0.4)] transition-all flex items-center gap-1.5 shadow-[0_0_20px_-4px_rgba(138,216,184,0.5)] hover:shadow-[0_0_26px_-2px_rgba(138,216,184,0.7)] active:scale-95 font-sans"
            >
              <Building2 size={13} />
              Vendor Login
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#8AD8B8] hover:text-[#FFF4E2] hover:bg-[rgba(255,244,226,0.08)] border border-[rgba(138,216,184,0.2)] transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 rounded-2xl bg-[rgba(19,45,40,0.95)] border border-[rgba(138,216,184,0.3)] backdrop-blur-2xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-1">
              <a
                href="#platform"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-[#FFF4E2]/90 hover:bg-[rgba(255,244,226,0.08)]"
              >
                Platform
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-[#FFF4E2]/90 hover:bg-[rgba(255,244,226,0.08)]"
              >
                Solutions
              </a>
              <a
                href="#lifecycle"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-[#FFF4E2]/90 hover:bg-[rgba(255,244,226,0.08)]"
              >
                How It Works
              </a>
              <Link
                href="/safebatch"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-[#FFF4E2]/90 hover:bg-[rgba(255,244,226,0.08)]"
              >
                SafeBatch Operations
              </Link>
              <Link
                href="/security"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-[#FFF4E2]/90 hover:bg-[rgba(255,244,226,0.08)]"
              >
                Security & Hardening
              </Link>
              <Link
                href="/portals"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-[#8AD8B8] hover:bg-[rgba(138,216,184,0.15)]"
              >
                ⚡ Identity Portals Hub
              </Link>
            </nav>

            <div className="pt-3 border-t border-[rgba(138,216,184,0.2)] flex flex-col gap-2">
              <Link
                href="/candidate"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-[#FFF4E2] bg-[rgba(255,244,226,0.08)] border border-[rgba(138,216,184,0.25)] flex items-center justify-center gap-2"
              >
                <GraduationCap size={15} className="text-[#8AD8B8]" />
                Student Portal Login
              </Link>
              <Link
                href="/vendor"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-[#132D28] bg-[#8AD8B8] border border-white/40 flex items-center justify-center gap-2"
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
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-[#8AD8B8] bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.3)] flex items-center justify-center gap-2 cursor-pointer"
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
