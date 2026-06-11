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
    <aside className="w-64 bg-glass border-r border-slate-900/50 flex flex-col h-full shrink-0 select-none shadow-lg">
      {/* Brand logo header */}
      <div className="p-5.5 border-b border-slate-900/60 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl shadow-glow-blue/5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-wider font-outfit">
              EXAM<span className="text-blue-500">FORGE</span>
            </h2>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest block uppercase font-bold">
              Zero-Trust Command
            </span>
          </div>
        </div>
      </div>

      {/* Simple/Expert Toggle for Organizer role */}
      {role !== "CANDIDATE" && role !== "EVALUATOR" && (
        <div className="px-5.5 py-3 border-b border-slate-900/60 bg-slate-950/20 flex justify-between items-center text-[10px] font-mono font-bold">
          <span className="text-slate-400">Expert mode</span>
          <button
            onClick={handleToggleMode}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 focus:outline-none cursor-pointer ${
              expertMode ? "bg-blue-600 shadow-glow-blue/20" : "bg-slate-800"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 ${
                expertMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      {/* Navigation Areas */}
      <nav className="flex-1 overflow-y-auto px-4.5 py-5 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="px-3.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.path || (link.path.includes("control-room") && pathname.includes("control-room"));
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative overflow-hidden group ${
                      isActive
                        ? "bg-blue-950/35 border border-blue-500/30 text-white font-bold shadow-glow-blue/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500"
                        : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors duration-150 ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role Switcher Drawer Widget */}
      <div className="p-4.5 border-t border-slate-900 bg-slate-950/40 font-mono">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: "6s" }} />
          <span>Role Switcher</span>
        </div>
        
        <div className="relative">
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full p-2 bg-slate-900/90 border border-slate-800/80 rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-blue-500 appearance-none font-bold pr-8 cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
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
          className="mt-3.5 w-full flex items-center justify-center gap-2 py-1.5 border border-slate-850 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-400 text-slate-500 transition rounded-xl text-[10px] cursor-pointer font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit System</span>
        </button>
      </div>
    </aside>
  );
}
