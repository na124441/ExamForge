"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ForgeAdminLayout } from "./ForgeAdminLayout";
import { CommandPalette } from "./CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
}

const BACKEND_URL = "http://localhost:8000";

// Routes that bypass the admin shell entirely
const STANDALONE_ROUTES = [
  "/",
  "/portals",
  "/workspace/select",
  "/unauthorized",
  "/student-exam",
  "/result-portal",
  "/receipt-verify",
  "/verify-certificate",
  "/verify-result",
  "/candidate",
  "/result-certificate",
];

function isStandaloneRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.includes("/login")) return true;
  return STANDALONE_ROUTES.some(
    (route) => route !== "/" && pathname.startsWith(route)
  );
}

/**
 * Determine workspace type from pathname for theme scoping.
 */
function getWorkspace(pathname: string): string {
  if (pathname === "/") return "landing";
  if (pathname.startsWith("/candidate") || pathname.startsWith("/student-exam") || pathname.startsWith("/result-portal") || pathname.startsWith("/receipt-verify") || pathname.startsWith("/verify-certificate") || pathname.startsWith("/verify-result") || pathname.startsWith("/result-certificate")) return "candidate";
  if (pathname.startsWith("/vendor") || pathname.startsWith("/create-exam") || pathname.startsWith("/exam-templates") || pathname.startsWith("/question-bank") || pathname.startsWith("/rubrics") || pathname.startsWith("/institution")) return "vendor";
  if (pathname.startsWith("/war-room") || pathname.startsWith("/controller")) return "controller";
  if (pathname.startsWith("/evaluator") || pathname.startsWith("/evaluation") || pathname.startsWith("/omr")) return "evaluator";
  if (pathname.startsWith("/auditor") || pathname.startsWith("/audit") || pathname.startsWith("/tenant-audit")) return "auditor";
  if (pathname.startsWith("/center") || pathname.startsWith("/seat-map") || pathname.startsWith("/candidate-verification")) return "centre";
  if (pathname.startsWith("/portals")) return "landing";
  // Default: vendor-style (professional light)
  return "vendor";
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const workspace = getWorkspace(pathname);

  // Auto-authenticate default controller session if not logged in
  useEffect(() => {
    const ensureSession = async () => {
      if (typeof window === "undefined") return;

      const storedToken =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");
      if (!storedToken) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "controller@example.com",
              password: "password123",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const token = data.access_token || data.token;
            localStorage.setItem("access_token", token);
            localStorage.setItem("token", token);
            localStorage.setItem("user_role", "CONTROLLER");
            localStorage.setItem(
              "user_name",
              "Dr. Aditi (Exam Controller)"
            );
          } else {
            localStorage.setItem("access_token", "MOCK_CONTROLLER_TOKEN");
            localStorage.setItem("token", "MOCK_CONTROLLER_TOKEN");
            localStorage.setItem("user_role", "CONTROLLER");
            localStorage.setItem(
              "user_name",
              "Dr. Aditi (Exam Controller)"
            );
          }
        } catch {
          localStorage.setItem("access_token", "MOCK_CONTROLLER_TOKEN");
          localStorage.setItem("token", "MOCK_CONTROLLER_TOKEN");
          localStorage.setItem("user_role", "CONTROLLER");
          localStorage.setItem(
            "user_name",
            "Dr. Aditi (Exam Controller)"
          );
        }
      } else {
        if (
          !localStorage.getItem("token") &&
          localStorage.getItem("access_token")
        ) {
          localStorage.setItem(
            "token",
            localStorage.getItem("access_token")!
          );
        }
        if (
          !localStorage.getItem("access_token") &&
          localStorage.getItem("token")
        ) {
          localStorage.setItem(
            "access_token",
            localStorage.getItem("token")!
          );
        }
      }
    };

    ensureSession();
  }, []);

  // Global keyboard shortcut for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Standalone routes — workspace-themed full screen
  if (isStandaloneRoute(pathname)) {
    return (
      <div
        data-workspace={workspace}
        className="min-h-[100dvh] bg-[var(--color-surface)] text-[var(--color-ink)] font-sans"
      >
        {children}
      </div>
    );
  }

  // All admin routes — themed layout with nav
  return (
    <ForgeAdminLayout
      isCommandPaletteOpen={isCommandPaletteOpen}
      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      onCloseCommandPalette={() => setIsCommandPaletteOpen(false)}
      workspace={workspace}
    >
      <div
        data-workspace={workspace}
        className="w-full max-w-[var(--content-max-width)] mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in bg-[var(--color-surface)] text-[var(--color-ink)]"
      >
        {children}
      </div>
    </ForgeAdminLayout>
  );
}
