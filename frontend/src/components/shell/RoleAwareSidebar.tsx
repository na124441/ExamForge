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
  Key, 
  ChevronRight, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  Sparkles,
  Server,
  Building,
  KeyRound,
  FileCode2,
  HelpCircle,
  FileText
} from "lucide-react";
import { canAccessRoute } from "@/lib/auth/rbac";
import { ROLE_METADATA_LIST, CanonicalRole } from "@/lib/auth/roles";

interface SidebarLink {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

interface RoleAwareSidebarProps {
  auditStatus?: string;
  gateStatus?: string;
}

const ROLES = [
  { value: CanonicalRole.CONTROLLER, label: "Exam Controller", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { value: CanonicalRole.OFFICER, label: "Center Officer", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: CanonicalRole.INVIGILATOR, label: "Invigilator", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: CanonicalRole.EVALUATOR, label: "Evaluator", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: CanonicalRole.AUDITOR, label: "System Auditor", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: CanonicalRole.SECURITY_ADMIN, label: "Security Admin", color: "text-rose-600 bg-rose-50 border-rose-200" },
  { value: CanonicalRole.OPS_ENGINEER, label: "DevOps / Infra", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { value: CanonicalRole.PLATFORM_ADMIN, label: "Platform Admin", color: "text-violet-600 bg-violet-50 border-violet-200" },
  { value: CanonicalRole.VENDOR, label: "Vendor Partner", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: CanonicalRole.CANDIDATE, label: "Candidate", color: "text-emerald-600 bg-emerald-50 border-emerald-200" }
];

export function RoleAwareSidebar({ auditStatus, gateStatus }: RoleAwareSidebarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string>("CONTROLLER");
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
    const meta = ROLE_METADATA_LIST[newRole as CanonicalRole];
    const roleLabel = meta?.label || newRole;
    localStorage.setItem("user_name", roleLabel);
    setRole(newRole);
    setName(roleLabel);
    
    if (meta && meta.defaultRoute) {
      router.push(meta.defaultRoute);
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleToggleMode = () => {
    const nextMode = !expertMode;
    setExpertMode(nextMode);
    localStorage.setItem("expert_mode", String(nextMode));
  };

  // Master catalog of application sections
  const ALL_SECTIONS: SidebarSection[] = [
    {
      title: "Candidate Workspace",
      links: [
        { label: "CBT Examination", path: "/student-exam", icon: Radio, badge: "CBT" },
        { label: "Candidate Verification", path: "/candidate", icon: Users },
        { label: "Verifiable Results", path: "/result-portal", icon: Search },
        { label: "Verify Digital Receipt", path: "/receipt-verify", icon: Key },
        { label: "File Dispute", path: "/disputes/file", icon: Briefcase },
        { label: "My Disputes", path: "/disputes", icon: FileText }
      ]
    },
    {
      title: "Mission Control",
      links: [
        { label: "Executive Dashboard", path: "/authority", icon: Compass },
        { label: "Operations War Room", path: "/war-room", icon: Activity, badge: "Live" },
        { label: "Examinations Directory", path: "/examinations", icon: Layers },
        { label: "Create Examination", path: "/create-exam", icon: FilePlus },
        { label: "Exam Operations", path: "/exam-ops", icon: Radio },
        { label: "Guided Walkthrough", path: "/pilot-run", icon: Terminal, badge: "15-Stage" }
      ]
    },
    {
      title: "Examination Assets",
      links: [
        { label: "Question Bank Builder", path: "/question-bank", icon: FileSignature },
        { label: "Exam Templates", path: "/exam-templates", icon: FileCode2 },
        { label: "Grading Rubrics", path: "/rubrics", icon: FileCheck },
        { label: "Policies & Rules", path: "/policies", icon: Shield }
      ]
    },
    {
      title: "Center Operations",
      links: [
        { label: "Centers Registry", path: "/centers", icon: Building },
        { label: "Center Console", path: "/center-console", icon: Gauge, badge: "Live" },
        { label: "Center Readiness", path: "/center-onboarding", icon: CheckCircle2 },
        { label: "Candidate Check-in", path: "/candidate-verification", icon: Users },
        { label: "Seat & Desk Mapping", path: "/seat-map", icon: Network },
        { label: "OMR Edge Scanner", path: "/omr-scanner", icon: Layers },
        { label: "Center Risk Monitor", path: "/center-risk", icon: AlertTriangle }
      ]
    },
    {
      title: "Evaluation & Grading",
      links: [
        { label: "Evaluation Queue", path: "/evaluator", icon: Scale, badge: "Assigned" },
        { label: "Evaluation Operations", path: "/evaluation-ops", icon: Layers },
        { label: "Conflict Arbitration", path: "/evaluation-conflicts", icon: Scale },
        { label: "Evaluator Analytics", path: "/evaluator-analytics", icon: TrendingUp },
        { label: "OMR Anomaly Review", path: "/omr-review", icon: FileCheck },
        { label: "Immutable Marks Chain", path: "/marks-chain", icon: History }
      ]
    },
    {
      title: "Dispute Operations",
      links: [
        { label: "Dispute Console", path: "/dispute-ops", icon: Briefcase }
      ]
    },
    {
      title: "Forensic Audit & Ledger",
      links: [
        { label: "Audit Timeline", path: "/audit-timeline", icon: History },
        { label: "Auditor Console", path: "/auditor", icon: Shield },
        { label: "Institution Audit Card", path: "/institution-audit-report", icon: FileText },
        { label: "Tenant Boundary Audit", path: "/tenant-audit", icon: Building }
      ]
    },
    {
      title: "Security & Governance",
      links: [
        { label: "Security Command", path: "/security", icon: Shield },
        { label: "Emergency Lockdown", path: "/security/command", icon: Lock, badge: "P0" },
        { label: "Cryptographic Keys", path: "/security/keys", icon: KeyRound },
        { label: "Dual Approvals", path: "/security/approvals", icon: CheckCircle2 },
        { label: "Security Hardening", path: "/security/hardening", icon: Shield },
        { label: "Threat Modeling", path: "/security/threat-model", icon: Cpu },
        { label: "Security Incidents", path: "/security/incidents", icon: AlertTriangle },
        { label: "Access IAM Review", path: "/security/access-review", icon: Users },
        { label: "Compliance Reports", path: "/security/compliance-report", icon: FileCheck },
        { label: "Security Pentest Suite", path: "/security-pentest", icon: Terminal }
      ]
    },
    {
      title: "Platform Administration",
      links: [
        { label: "Platform Super Admin", path: "/platform-admin", icon: Server },
        { label: "Institutions Directory", path: "/institutions", icon: Building },
        { label: "Institution Staff", path: "/institution-users", icon: Users },
        { label: "Role Permissions Matrix", path: "/role-matrix", icon: Key },
        { label: "Emergency Broadcast", path: "/admin/communication", icon: Radio }
      ]
    },
    {
      title: "DevOps & Infrastructure",
      links: [
        { label: "Infrastructure Ops", path: "/ops", icon: Server },
        { label: "Subsystem Health", path: "/ops/health", icon: Activity },
        { label: "Telemetry Metrics", path: "/ops/metrics", icon: TrendingUp },
        { label: "Background Jobs", path: "/ops/jobs", icon: Cpu },
        { label: "Configuration Inspector", path: "/ops/config", icon: Settings },
        { label: "Storage Buckets", path: "/ops/storage", icon: Database },
        { label: "Rate Limit Rules", path: "/ops/rate-limits", icon: Shield },
        { label: "Database Backups", path: "/ops/backups", icon: Database },
        { label: "Maintenance Windows", path: "/ops/maintenance", icon: Lock }
      ]
    },
    {
      title: "Vendor Portal",
      links: [
        { label: "Vendor Management", path: "/vendor", icon: Building }
      ]
    },
    {
      title: "Publication & Trust Gates",
      links: [
        { label: "Publication Gate", path: "/publication-gate", icon: Lock },
        { label: "Risk & Collusion Engine", path: "/risk-dashboard", icon: Cpu },
        { label: "Verify Digital Receipt", path: "/receipt-verify", icon: Key }
      ]
    }
  ];

  // Dynamically filter sections and links by cryptographic authorization
  const filteredSections: SidebarSection[] = ALL_SECTIONS.map((section) => ({
    title: section.title,
    links: section.links.filter((link) => canAccessRoute(link.path, role))
  })).filter((section) => section.links.length > 0);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none shadow-xs">
      
      {/* Brand Logo Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo-icon.png"
            alt="ExamForge Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-200 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                ExamForge
              </h2>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 block">
              Zero-Trust RBAC & Authz
            </span>
          </div>
        </Link>
      </div>

      {/* Role Persona Switcher */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50">
        <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1.5">
          Active Persona (RBAC)
        </label>
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Links (Strictly Filtered by Permissions) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </h3>
            <div className="space-y-0.5 mt-1">
              {section.links.map((link, lIdx) => {
                const isActive = pathname === link.path || (link.path !== "/" && pathname.startsWith(link.path));
                const IconComponent = link.icon;
                return (
                  <Link
                    key={lIdx}
                    href={link.path}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className="truncate">{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100/80 text-indigo-700 uppercase tracking-wider">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Audit Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-700">Authoritative Gate</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase">FastAPI Active</span>
      </div>
    </aside>
  );
}
