"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "⚡ Dashboard", path: "/ops" },
    { name: "🩺 Deep Health", path: "/ops/health" },
    { name: "⚙️ Background Jobs", path: "/ops/jobs" },
    { name: "📦 Object Storage", path: "/ops/storage" },
    { name: "💾 Backups & Restore", path: "/ops/backups" },
    { name: "📊 Live Metrics", path: "/ops/metrics" },
    { name: "🛡️ Rate Limits", path: "/ops/rate-limits" },
    { name: "🔧 System Config", path: "/ops/config" },
    { name: "🚨 Maintenance", path: "/ops/maintenance" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-card-bg border-r border-border-color flex flex-col justify-between shrink-0">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-icon.png"
              alt="ExamForge Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm border border-border-color"
            />
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">ExamForge Ops</h2>
              <span className="text-[9px] text-accent-emerald font-bold tracking-widest font-mono uppercase">RELIABILITY DECK</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1.5 mt-4">
            {menuItems.map((item) => {
              const active = pathname === item.path || (item.path !== "/ops" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-4 py-2.5 rounded text-xs transition font-semibold flex items-center gap-2 ${
                    active
                      ? "bg-accent-emerald text-background font-extrabold shadow"
                      : "text-text-muted hover:text-white hover:bg-background/40"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-6 border-t border-border-color/60 text-[10px] text-text-muted flex flex-col gap-2">
          <div>Environment: <span className="text-white font-mono">PRODUCTION</span></div>
          <div>Stack Status: <span className="text-accent-emerald font-bold font-mono">ONLINE</span></div>
          <Link href="/platform-admin" className="text-accent-emerald hover:underline font-bold mt-2 inline-block">
            ← Platform Admin
          </Link>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          {children}
        </div>
      </main>

    </div>
  );
}
