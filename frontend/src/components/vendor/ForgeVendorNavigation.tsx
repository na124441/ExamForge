"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  Building2, 
  CreditCard, 
  Users, 
  Award, 
  ShieldCheck, 
  Plus,
  CheckCircle2,
  X
} from "lucide-react";

export type VendorTab = 
  | "READINESS"
  | "EXAMS_BLUEPRINTS"
  | "AI_QUESTION_BANK"
  | "CENTRE_NETWORK"
  | "INTEGRATIONS_PAYMENT"
  | "EVALUATOR_POOL"
  | "RESULT_GATE"
  | "AUDIT_SETTINGS";

interface ForgeVendorNavigationProps {
  activeTab: VendorTab;
  onTabChange: (tab: VendorTab) => void;
  orgName: string;
}

export function ForgeVendorNavigation({ activeTab, onTabChange, orgName }: ForgeVendorNavigationProps) {
  const [showRegModal, setShowRegModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newRegNo, setNewRegNo] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const tabs: { key: VendorTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { key: "READINESS", label: "Operations Control & Readiness", icon: LayoutDashboard, badge: "96% Ready" },
    { key: "EXAMS_BLUEPRINTS", label: "Exam Blueprint Wizard", icon: FileText },
    { key: "AI_QUESTION_BANK", label: "AI Question Generator & Sets", icon: Sparkles, badge: "AI Copilot" },
    { key: "CENTRE_NETWORK", label: "Centres & Network Request", icon: Building2 },
    { key: "INTEGRATIONS_PAYMENT", label: "Integrations & Payment Config", icon: CreditCard },
    { key: "EVALUATOR_POOL", label: "Evaluator Onboarding & Pool", icon: Users },
    { key: "RESULT_GATE", label: "Result Gate & Certificates", icon: Award },
    { key: "AUDIT_SETTINGS", label: "Organization & Audit Logs", icon: ShieldCheck },
  ];

  const handleRegisterVendor = (e: React.FormEvent) => {
    e.preventDefault();
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setShowRegModal(false);
    }, 1500);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-4 font-sans relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">{orgName}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200">
                Verified Vendor EaaS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">ExamForge Examination-as-a-Service Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register New Vendor Org
          </button>

          <div className="hidden md:flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Tenant ID:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              VND-ORC-2026-892A
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;

          return (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer",
                isActive
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
              <span>{t.label}</span>
              {t.badge && (
                <span className={cn(
                  "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-white text-blue-600" : "bg-slate-200 text-slate-700"
                )}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vendor Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Register Vendor Organization (EaaS)
              </h2>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {regSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Vendor Organization Verified & Provisioned
                </div>
                <div>Tenant ID: VND-ORC-2026-99A1</div>
              </div>
            ) : (
              <form onSubmit={handleRegisterVendor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Organization Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Testing Services India"
                    value={newVendorName}
                    onChange={e => setNewVendorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Registration / Tax Reference Number</label>
                  <input
                    type="text"
                    required
                    placeholder="REG-2026-9812-IN"
                    value={newRegNo}
                    onChange={e => setNewRegNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
                  >
                    Provision Vendor Tenant
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
