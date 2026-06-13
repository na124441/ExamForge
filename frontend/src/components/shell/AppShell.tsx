"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RoleAwareSidebar } from "./RoleAwareSidebar";
import { TopSecurityStrip } from "./TopSecurityStrip";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trustScore, setTrustScore] = useState(97);
  const [auditStatus, setAuditStatus] = useState("VALID");
  const [gateStatus, setGateStatus] = useState("READY");
  const [opsStatus, setOpsStatus] = useState("HEALTHY");

  // Fetch telemetry/verdict logic
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("user_role");
      
      // Let root login page and candidate portals load without auth redirection
      const isPublicPath = pathname === "/" || pathname.startsWith("/result-portal") || pathname.startsWith("/verify-certificate") || pathname.startsWith("/candidate");
      
      if (token) {
        setIsAuthenticated(true);
      } else if (!isPublicPath) {
        // Redirect to login if not authenticated on secure routes
        router.push("/");
      }
    }
  }, [pathname, router]);

  // Periodic trust/health updates from dashboard (mocked or fetched if backend is up)
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/api/authority/dashboard", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setTrustScore(data.trust_ops.score);
          setAuditStatus(data.verdict.status === "BLOCKED" ? "TAMPERED" : "VALID");
          setGateStatus(data.trust_ops.gate_allowed ? "READY" : "LOCKED");
          setOpsStatus(data.deployment_ops.db_status === "OK" ? "HEALTHY" : "DEGRADED");
        }
      } catch (err) {
        // Fail silently or use default mock telemetry
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Check if we need to bypass layout for login screen, candidate result portal, or similar
  const isCandidatePage = 
    (pathname === "/" && !isAuthenticated) || 
    pathname.startsWith("/result-portal") || 
    pathname.startsWith("/candidate") || 
    pathname.startsWith("/disputes") ||
    pathname.startsWith("/war-room");

  if (isCandidatePage) {
    return <div className="min-h-screen bg-[#070A14] flex flex-col">{children}</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-[#070A14] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar - Navigation */}
      <RoleAwareSidebar />

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Security Strip */}
        <TopSecurityStrip 
          trustScore={trustScore} 
          auditStatus={auditStatus}
          gateStatus={gateStatus}
          opsStatus={opsStatus}
        />
        
        {/* Actual page content wrapper */}
        <main className="flex-1 overflow-y-auto bg-[#070A14] p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
