"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Shield, 
  Terminal, 
  Settings, 
  Users, 
  TrendingUp, 
  FileSignature, 
  Network, 
  History, 
  Lock, 
  Gauge, 
  Radio, 
  FileCheck, 
  Search, 
  Scale, 
  Briefcase, 
  AlertTriangle,
  LogOut,
  RefreshCw,
  Compass,
  FilePlus,
  Info,
  Layers,
  Database,
  Key
} from "lucide-react";

interface SidebarLink {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

const ROLES = [
  { value: "CONTROLLER", label: "Exam Controller" },
  { value: "OFFICER", label: "Center Officer" },
  { value: "INVIGILATOR", label: "Invigilator" },
  { value: "EVALUATOR", label: "Evaluator" },
  { value: "AUDITOR", label: "System Auditor" },
  { value: "CANDIDATE", label: "Candidate" }
];

export function RoleAwareSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("CONTROLLER");
  const [name, setName] = useState("Exam Controller");
  const [expertMode, setExpertMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("user_role") || "CONTROLLER";
      const storedName = localStorage.getItem("user_name") || "Exam Controller";
      const storedMode = localStorage.getItem("expert_mode") === "true";
      setRole(storedRole);
      setName(storedName);
      setExpertMode(storedMode);
    }
  }, []);

  const handleRoleChange = (newRole: string) => {
    localStorage.setItem("user_role", newRole);
    const roleLabel = ROLES.find(r => r.value === newRole)?.label || newRole;
    localStorage.setItem("user_name", roleLabel);
    setRole(newRole);
    setName(roleLabel);
    
    // Redirect based on selected role
    if (newRole === "CONTROLLER") router.push("/authority");
    else if (newRole === "OFFICER") router.push("/center-console");
    else if (newRole === "INVIGILATOR") router.push("/center-console");
    else if (newRole === "EVALUATOR") router.push("/evaluator");
    else if (newRole === "AUDITOR") router.push("/audit-timeline");
    else if (newRole === "CANDIDATE") router.push("/result-portal");
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleToggleMode = () => {
    const nextMode = !expertMode;
    setExpertMode(nextMode);
    localStorage.setItem("expert_mode", String(nextMode));
  };

  // Define simplified vs expert links
  const getNavigation = (): SidebarSection[] => {
    if (role === "CANDIDATE") {
      return [
        {
          title: "Verification Space",
          links: [
            { label: "Verifiable Results", path: "/result-portal", icon: Search }
          ]
        }
      ];
    }

    if (role === "EVALUATOR") {
      return [
        {
          title: "Grading",
          links: [
            { label: "My Evaluation Queue", path: "/evaluator", icon: Scale }
          ]
        }
      ];
    }

    // Default Organizer/Controller/Officer view
    if (!expertMode) {
      // Simple Mode (Organizer Focus)
      return [
        {
          title: "Main Flow",
          links: [
            { label: "Home", path: "/authority", icon: Compass },
            { label: "v0.2 War Room Console", path: "/war-room", icon: Terminal },
            { label: "Create Exam", path: "/create-exam", icon: FilePlus },
            { label: "Exam Control Room", path: "/exams/EXM-001/control-room", icon: Radio },
            { label: "Evidence Timeline", path: "/audit-timeline", icon: History }
          ]
        },
        {
          title: "Verification",
          links: [
            { label: "Verify Result", path: "/result-portal", icon: Search }
          ]
        }
      ];
    } else {
      // Expert Mode (Raw Modules with Friendly Renames)
      return [
        {
          title: "Main Operations",
          links: [
            { label: "Home Launcher", path: "/authority", icon: Compass },
            { label: "v0.2 War Room Console", path: "/war-room", icon: Terminal },
            { label: "Create Exam Wizard", path: "/create-exam", icon: FilePlus },
            { label: "Exam Control Room", path: "/exams/EXM-001/control-room", icon: Radio },
            { label: "Pilot Guided run", path: "/pilot-run", icon: Terminal }
          ]
        },
        {
          title: "Administration",
          links: [
            { label: "Question Bank Builder", path: "/controller", icon: FileSignature },
            { label: "Centers Seating Map", path: "/seat-map", icon: Network },
            { label: "Candidate Verification", path: "/candidate-verification", icon: Users }
          ]
        },
        {
          title: "Processing & Evaluation",
          links: [
            { label: "OMR Correction Portal", path: "/omr-review", icon: Layers },
            { label: "Evaluation Control", path: "/evaluation-ops", icon: Scale },
            { label: "Dispute Center", path: "/dispute-ops", icon: Briefcase }
          ]
        },
        {
          title: "Audit & Safety Gates",
          links: [
            { label: "Result Safety Check", path: "/publication-gate", icon: Lock },
            { label: "Evidence Timeline", path: "/audit-timeline", icon: History },
            { label: "Security Readiness", path: "/security", icon: Shield },
            { label: "System Diagnostics", path: "/ops", icon: Network }
          ]
        }
      ];
    }
  };

  const sections = getNavigation();

  return (
    <aside className="w-[200px] bg-[#070A14] border-r border-white/[0.06] flex flex-col h-full shrink-0 select-none shadow-lg">
      {/* Brand logo header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-white/[0.04] border border-white/[0.08] text-slate-100 rounded-lg">
            <Shield className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wider font-mono">
              EXAMFORGE
            </h2>
            <span className="text-[9px] tracking-[0.2em] text-violet-400 font-mono block uppercase font-bold">
              ZERO-TRUST COMMAND
            </span>
          </div>
        </div>
      </div>

      {/* Simple/Expert Toggle for Organizer role */}
      {role !== "CANDIDATE" && role !== "EVALUATOR" && (
        <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] flex justify-between items-center text-[10px] font-mono font-bold">
          <span className="text-slate-500">Expert mode</span>
          <button
            onClick={handleToggleMode}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 focus:outline-none cursor-pointer ${
              expertMode ? "bg-violet-650 shadow-glow-violet/20" : "bg-slate-800"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-350 transition-transform duration-250 ${
                expertMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      {/* Navigation Areas */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-slate-650 px-3 mb-1 font-mono">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.path || (link.path.includes("control-room") && pathname.includes("control-room"));
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 relative overflow-hidden group ${
                      isActive
                        ? "text-slate-100 bg-white/[0.06] border-l-2 border-violet-500 font-medium"
                        : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-current transition-colors duration-150" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role Switcher Drawer Widget */}
      <div className="p-3 border-t border-white/[0.06] bg-white/[0.01] font-mono">
        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: "6s" }} />
          <span>Role Switcher</span>
        </div>
        
        <div className="relative">
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full p-2 bg-[#070A14] border border-white/[0.06] rounded-lg text-[11px] text-slate-350 focus:outline-none focus:border-violet-500 appearance-none font-bold pr-8 cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        <button 
          onClick={() => {
            localStorage.clear();
            router.push("/");
          }}
          className="mt-2.5 w-full flex items-center justify-center gap-2 py-1.5 border border-white/[0.06] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-slate-500 transition rounded-lg text-[10px] cursor-pointer font-bold active-press"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit System</span>
        </button>
      </div>
    </aside>
  );
}
