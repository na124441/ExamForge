"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Compass,
  History,
  Scale,
  Users,
  Building,
  Radio,
  Briefcase,
  Lock,
  LogOut,
  RefreshCw
} from "lucide-react";
import { ROLE_METADATA_LIST, CanonicalRole } from "@/lib/auth/roles";

interface Workspace {
  role: string;
  title: string;
  description: string;
  path: string;
}

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [activeRole, setActiveRole] = useState<string>("CONTROLLER");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_name") || "Authenticated User";
      const storedRole = localStorage.getItem("user_role") || "CONTROLLER";
      const storedWs = localStorage.getItem("workspaces");

      setUserName(storedName);
      setActiveRole(storedRole);

      if (storedWs) {
        try {
          setWorkspaces(JSON.parse(storedWs));
        } catch (e) {
          // Fallback
        }
      }

      // If no stored workspaces, fallback to default roles list
      if (!storedWs || workspaces.length === 0) {
        const availableRolesStr = localStorage.getItem("available_roles");
        if (availableRolesStr) {
          try {
            const roles: string[] = JSON.parse(availableRolesStr);
            const generated = roles.map((r) => {
              const meta = ROLE_METADATA_LIST[r as CanonicalRole];
              return {
                role: r,
                title: meta?.label || r,
                description: meta?.description || "Authorized operational domain",
                path: meta?.defaultRoute || "/authority"
              };
            });
            setWorkspaces(generated);
          } catch (e) {}
        }
      }
    }
  }, []);

  const handleSelectWorkspace = async (ws: Workspace) => {
    setSwitching(ws.role);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${backendUrl}/api/auth/switch-workspace`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ target_role: ws.role })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
        }
        localStorage.setItem("user_role", ws.role);
        document.cookie = `user_role=${ws.role}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        localStorage.setItem("user_role", ws.role);
        document.cookie = `user_role=${ws.role}; path=/; max-age=86400; SameSite=Lax`;
      }

      router.push(ws.path);
    } catch (err) {
      localStorage.setItem("user_role", ws.role);
      document.cookie = `user_role=${ws.role}; path=/; max-age=86400; SameSite=Lax`;
      router.push(ws.path);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";
    router.push("/portals");
  };

  return (
    <div className="min-h-screen bg-[#081310] text-[#FFF4E2] font-sans relative overflow-hidden flex flex-col justify-between p-6 sm:p-12">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(138,216,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(138,216,184,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.3)] flex items-center justify-center p-1 overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
            <img
              src="/logo-icon.png"
              alt="ExamForge Logo"
              className="w-full h-full object-contain mix-blend-screen"
            />
          </div>
          <div>
            <span className="font-bold text-sm text-[#FFF4E2] tracking-tight">EXAM<span className="text-[#8AD8B8]">FORGE</span></span>
            <span className="text-[10px] text-[#8AD8B8]/80 block font-mono">Workspace Switcher</span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* Center Content */}
      <div className="max-w-3xl mx-auto w-full py-12 relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs uppercase tracking-wider">
            <Sparkles size={12} className="text-indigo-400" />
            Multi-Role Account Verified
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Your account holds multiple operational authorities. Select the workspace you would like to enter for this active session:
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspaces.map((ws, idx) => {
            const isCurrent = activeRole === ws.role;
            const isSwitchingThis = switching === ws.role;

            return (
              <div
                key={idx}
                onClick={() => handleSelectWorkspace(ws)}
                className={`p-6 rounded-3xl bg-[rgba(19,45,40,0.7)] hover:bg-[rgba(19,45,40,0.9)] border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group shadow-xl backdrop-blur-xl ${
                  isCurrent
                    ? "border-[#8AD8B8] ring-1 ring-[#8AD8B8]/50 bg-[rgba(19,45,40,0.9)]"
                    : "border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] border border-[rgba(138,216,184,0.25)] uppercase tracking-wider">
                      {ws.role}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-[#8AD8B8] flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Active Context
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#FFF4E2] group-hover:text-[#8AD8B8] transition-colors">
                      {ws.title}
                    </h3>
                    <p className="text-xs text-[#8AD8B8]/70 mt-1 leading-relaxed">
                      {ws.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[rgba(138,216,184,0.15)] flex items-center justify-between text-xs font-semibold text-[#8AD8B8] group-hover:text-[#FFF4E2] transition-colors">
                  <span>{isSwitchingThis ? "Loading Workspace..." : "Enter Workspace"}</span>
                  {isSwitchingThis ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-md mx-auto text-center text-xs font-mono text-[#8AD8B8]/70 flex items-center justify-center gap-2 relative z-10">
        <Lock size={12} />
        Zero-Trust Session Active &middot; Switch Workspaces Anytime
      </div>
    </div>
  );
}
