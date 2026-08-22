"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Search,
  CheckCircle2,
  Building2,
  Layers,
  Sparkles,
  Shield,
  Clock,
  Menu,
  ScanEye,
  BarChart3,
  Flame,
  Key,
  GraduationCap,
  Plus
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface ForgeBottomNavProps {
  onToggleDrawer?: () => void;
}

interface BottomNavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isAction?: boolean;
}

export function ForgeBottomNav({ onToggleDrawer }: ForgeBottomNavProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("CANDIDATE");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedRole = localStorage.getItem("user_role");
    if (storedRole) {
      setRole(storedRole.toUpperCase());
    } else {
      // Auto-detect role from pathname
      if (pathname.startsWith("/vendor")) setRole("VENDOR");
      else if (pathname.startsWith("/authority") || pathname.startsWith("/war-room") || pathname.startsWith("/controller")) setRole("CONTROLLER");
      else if (pathname.startsWith("/evaluator") || pathname.startsWith("/omr")) setRole("EVALUATOR");
      else if (pathname.startsWith("/auditor") || pathname.startsWith("/security") || pathname.startsWith("/audit")) setRole("AUDITOR");
      else setRole("CANDIDATE");
    }
  }, [pathname]);

  // If in active examination mode (/student-exam), hide bottom nav to avoid distraction
  if (pathname.startsWith("/student-exam")) {
    return null;
  }

  const currentRole = mounted ? role : "CANDIDATE";

  const getNavItems = (): BottomNavItem[] => {
    switch (currentRole) {
      case "VENDOR":
        return [
          { label: "Dashboard", href: "/vendor", icon: Building2 },
          { label: "Exams", href: "/examinations", icon: FileText },
          { label: "Publish", href: "/create-exam", icon: Plus },
          { label: "SafeBatch", href: "/safebatch", icon: Sparkles },
          { label: "More", isAction: true, icon: Menu },
        ];

      case "CONTROLLER":
      case "AUTHORITY":
        return [
          { label: "Control", href: "/authority", icon: Building2 },
          { label: "War Room", href: "/war-room", icon: Flame },
          { label: "SafeBatch", href: "/safebatch", icon: Sparkles },
          { label: "Security", href: "/security", icon: Shield },
          { label: "More", isAction: true, icon: Menu },
        ];

      case "EVALUATOR":
        return [
          { label: "Queue", href: "/evaluator/queue", icon: ScanEye },
          { label: "Evaluator", href: "/evaluator", icon: FileText },
          { label: "Analytics", href: "/evaluator-analytics", icon: BarChart3 },
          { label: "OMR Scan", href: "/omr-scanner", icon: Layers },
          { label: "More", isAction: true, icon: Menu },
        ];

      case "AUDITOR":
      case "SECURITY":
        return [
          { label: "Security", href: "/security", icon: Shield },
          { label: "Audit Ledger", href: "/audit-timeline", icon: Clock },
          { label: "Pentest", href: "/security-pentest", icon: Flame },
          { label: "Hardening", href: "/security-hardening", icon: Key },
          { label: "More", isAction: true, icon: Menu },
        ];

      case "CANDIDATE":
      default:
        return [
          { label: "Home", href: "/", icon: Home },
          { label: "Exams", href: "/examinations", icon: FileText },
          { label: "Results", href: "/result-portal", icon: Search },
          { label: "Admit Card", href: "/candidate", icon: GraduationCap },
          { label: "Verify", href: "/verify-result", icon: CheckCircle2 },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface-raised)]/95 border-t border-[var(--color-border)] backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none print:hidden"
      style={{
        paddingBottom: "max(6px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.href ? (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) : false;

          if (item.isAction) {
            return (
              <button
                key={`action-${idx}`}
                onClick={onToggleDrawer}
                className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] transition-colors active:scale-95 cursor-pointer min-h-[44px]"
                aria-label="Open full menu"
              >
                <Icon size={20} className="mb-0.5" />
                <span className="text-[10px] font-medium tracking-tight font-sans truncate">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href || idx}
              href={item.href || "/"}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 min-h-[44px]",
                isActive
                  ? "text-[var(--color-accent)] font-bold"
                  : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] font-medium"
              )}
            >
              <div className="relative">
                <Icon size={20} className={cn("mb-0.5 transition-transform", isActive && "scale-110")} />
                {isActive && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight font-sans truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
