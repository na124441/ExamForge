"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

const NAVIGATION_ITEMS = [
  { path: "/security", name: "Overview", icon: "🛡️" },
  { path: "/security/threat-model", name: "Threat Model", icon: "👾" },
  { path: "/security/assets", name: "Asset Classification", icon: "🏷️" },
  { path: "/security/privacy", name: "PII & Privacy", icon: "👁️‍🗨️" },
  { path: "/security/approvals", name: "Dual Approvals", icon: "👥" },
  { path: "/security/hardening", name: "OWASP Hardening", icon: "🧱" },
  { path: "/security/keys", name: "Key Lifecycle", icon: "🔑" },
  { path: "/security/access-review", name: "Access Review", icon: "📋" },
  { path: "/security/retention", name: "Data Retention", icon: "📦" },
  { path: "/security/incidents", name: "Incident Ledger", icon: "🚨" },
  { path: "/security/compliance-report", name: "Compliance Report", icon: "📜" },
  { path: "/security/pentest", name: "Pentest Simulation", icon: "💥" },
];

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Banner */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <img
            src="/logo-icon.png"
            alt="ExamForge Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-sm border border-border-color"
          />
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              ExamForge <span className="text-accent-emerald text-xs px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded font-mono uppercase">Security & Compliance Ops</span>
            </h1>
            <p className="text-[10px] text-text-muted mt-0.5">Zero-Trust Hardening & Cryptographic Auditing Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/exam-ops")}
            className="text-xs px-3 py-1.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald rounded hover:bg-accent-emerald/20 transition cursor-pointer font-bold"
          >
            🏢 Operations Console
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="text-xs px-3 py-1.5 bg-border-color text-white/80 rounded hover:bg-white/5 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-card-bg/60 border-r border-border-color flex flex-col justify-between overflow-y-auto p-4 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-2">Security Modules</div>
            {NAVIGATION_ITEMS.map((item) => {
              const active = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald font-bold"
                      : "border border-transparent text-text-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs tracking-wide">{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-3 bg-background/50 border border-border-color rounded-xl">
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Compliance Mode</div>
            <div className="text-[10px] font-bold text-accent-emerald mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse"></span>
              SECURE_AUDIT_V0.9
            </div>
          </div>
        </aside>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
