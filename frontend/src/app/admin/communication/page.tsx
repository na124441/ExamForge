"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  Key, 
  CheckCircle2, 
  Save, 
  Lock, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw,
  Server,
  Zap,
  Globe
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "@/components/forge/ForgeCard";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";

export default function AdminCommunicationPage() {
  const [emailProvider, setEmailProvider] = useState<"RESEND" | "SES" | "GMAIL_OAUTH">("RESEND");
  const [resendApiKey, setResendApiKey] = useState("••••••••••••••••••••••••••••");
  const [sesRegion, setSesRegion] = useState("ap-south-1");
  const [senderEmail, setSenderEmail] = useState("auth@examforge.org");

  const [smsProvider, setSmsProvider] = useState<"INDIA_DLT" | "TWILIO">("INDIA_DLT");
  const [dltSenderId, setDltSenderId] = useState("EXAMFG");
  const [dltEntityId, setDltEntityId] = useState("1701159812736412");
  const [dltTemplateId, setDltTemplateId] = useState("1407168912736412");
  
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400">
              <Mail className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Communication Provider Architecture</h1>
              <p className="text-sm text-slate-400">Configure transactional Email & SMS provider adapters with DLT template compliance</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ForgeStatusPill status="verified" />
          <ForgeButton onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
            <Save className="w-4 h-4" />
            {isSaved ? "Saved Successfully" : "Save Configurations"}
          </ForgeButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Provider Configuration */}
        <ForgeCard className="border-indigo-900/40 bg-slate-900/60 backdrop-blur-md">
          <ForgeCardHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
                <Mail className="w-5 h-5" />
                <span>Transactional Email Gateway</span>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono">
                SPF / DKIM / DMARC Ready
              </span>
            </div>
          </ForgeCardHeader>

          <ForgeCardContent className="space-y-6 pt-6">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">Select Active Provider Adapter</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setEmailProvider("RESEND")}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    emailProvider === "RESEND"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-950/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-slate-100 mb-1">Resend API</div>
                  <div>Primary High-Speed OTP</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailProvider("SES")}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    emailProvider === "SES"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-950/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-slate-100 mb-1">Amazon SES</div>
                  <div>AWS Cloud Fallback</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailProvider("GMAIL_OAUTH")}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    emailProvider === "GMAIL_OAUTH"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-950/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-slate-100 mb-1">Google Workspace</div>
                  <div>OAuth 2.0 Enterprise</div>
                </button>
              </div>
            </div>

            {emailProvider === "RESEND" && (
              <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Resend API Key (Encrypted at Rest)</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Sender Email Address</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            {emailProvider === "GMAIL_OAUTH" && (
              <div className="space-y-3 bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Google Workspace OAuth 2.0 Connected</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ExamForge uses standard Google OAuth 2.0 authorization flows to request `gmail.send` scope. Raw client secrets are never pasted in plain text.
                </p>
              </div>
            )}
          </ForgeCardContent>
        </ForgeCard>

        {/* SMS Provider Configuration */}
        <ForgeCard className="border-cyan-900/40 bg-slate-900/60 backdrop-blur-md">
          <ForgeCardHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-lg">
                <Phone className="w-5 h-5" />
                <span>Transactional SMS Gateway (India DLT)</span>
              </div>
              <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-mono">
                TRAI / DLT Compliant
              </span>
            </div>
          </ForgeCardHeader>

          <ForgeCardContent className="space-y-6 pt-6">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">Select Active Provider Adapter</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSmsProvider("INDIA_DLT")}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    smsProvider === "INDIA_DLT"
                      ? "bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-slate-100 mb-1">Indian DLT SMS Gateway</div>
                  <div>TRAI Telecom Routing</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSmsProvider("TWILIO")}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    smsProvider === "TWILIO"
                      ? "bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-slate-100 mb-1">Twilio Global SMS</div>
                  <div>International SMS</div>
                </button>
              </div>
            </div>

            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">DLT Sender Header ID</label>
                  <input
                    type="text"
                    value={dltSenderId}
                    onChange={(e) => setDltSenderId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">DLT Registered Entity ID</label>
                  <input
                    type="text"
                    value={dltEntityId}
                    onChange={(e) => setDltEntityId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">DLT Approved OTP Template ID</label>
                <input
                  type="text"
                  value={dltTemplateId}
                  onChange={(e) => setDltTemplateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </ForgeCardContent>
        </ForgeCard>
      </div>
    </div>
  );
}
