"use client";

import React, { useState } from "react";
import { 
  Mail, 
  Smartphone, 
  ShieldCheck, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  ExternalLink,
  Lock,
  Globe
} from "lucide-react";
import { getVendorMessagingConfig, saveVendorMessagingConfig, testSendVendorMessage } from "@/lib/api";

export function ForgeVendorMessagingConfig({ vendorId = "VND-2026-DELHI-TECH" }: { vendorId?: string }) {
  // Provider Selection
  const [emailProvider, setEmailProvider] = useState("EXAMFORGE_MANAGED");
  const [resendApiKey, setResendApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("noreply@examforge.org");
  const [fromName, setFromName] = useState("ExamForge Assessment System");

  const [smsProvider, setSmsProvider] = useState("MSG91");
  const [msg91AuthKey, setMsg91AuthKey] = useState("");
  const [dltEntityId, setDltEntityId] = useState("1701159812736412");
  const [dltSenderHeader, setDltSenderHeader] = useState("EXAMFG");
  const [dltTemplateId, setDltTemplateId] = useState("1407168912736412");

  // State & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDltGuide, setShowDltGuide] = useState(false);

  // Test Dispatch State
  const [testChannel, setTestChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [testRecipient, setTestRecipient] = useState("admin@example.com");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveVendorMessagingConfig({
        vendorId,
        emailProvider,
        resendApiKey,
        fromEmail,
        fromName,
        smsProvider,
        msg91AuthKey,
        dltEntityId,
        dltSenderHeader,
        dltTemplateId
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to save vendor messaging configuration: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTestDispatch = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await testSendVendorMessage({
        channel: testChannel,
        recipient: testRecipient
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        status: "FAILED",
        errorMessage: err.message || "Test delivery request failed."
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <Mail className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Vendor Messaging & OTP Infrastructure
            </h1>
            <p className="text-xs text-slate-500">
              Configure Email & TRAI DLT India SMS Gateways • Managed or Enterprise BYOP
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDltGuide(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
          TRAI / DLT Setup Guide
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Vendor messaging credentials and DLT header ID saved securely to server-side secrets vault.
        </div>
      )}

      {/* Main Configuration Form */}
      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Provider Configuration */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              1. Email Delivery Infrastructure
            </h2>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ● READY
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Email Provider</label>
              <select
                value={emailProvider}
                onChange={e => setEmailProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:border-blue-600"
              >
                <option value="EXAMFORGE_MANAGED">ExamForge Managed Email (Recommended)</option>
                <option value="RESEND">Resend Transactional API</option>
                <option value="AWS_SES">Amazon SES v2 (ap-south-1)</option>
                <option value="SMTP">Custom Enterprise SMTP Server</option>
              </select>
            </div>

            {emailProvider === "RESEND" && (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Resend API Key</label>
                <input
                  type="password"
                  placeholder="re_••••••••••••••••••••"
                  value={resendApiKey}
                  onChange={e => setResendApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">From Email</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">From Sender Name</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={e => setFromName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* India DLT SMS Provider Configuration */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              2. India DLT Telecom SMS Gateway
            </h2>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              TRAI COMPLIANT
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">SMS Provider</label>
              <select
                value={smsProvider}
                onChange={e => setSmsProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:border-blue-600"
              >
                <option value="MSG91">MSG91 OTP API (India DLT Default)</option>
                <option value="EXAMFORGE_MANAGED">ExamForge Managed SMS</option>
                <option value="TWILIO">Twilio Programmable SMS</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">MSG91 Auth Key / Provider Secret</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••"
                value={msg91AuthKey}
                onChange={e => setMsg91AuthKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">DLT Entity ID</label>
                <input
                  type="text"
                  value={dltEntityId}
                  onChange={e => setDltEntityId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-[11px] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Header (Sender ID)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={dltSenderHeader}
                  onChange={e => setDltSenderHeader(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-[11px] uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">OTP Template ID</label>
                <input
                  type="text"
                  value={dltTemplateId}
                  onChange={e => setDltTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-[11px] focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Credentials */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Save Messaging Credentials & DLT Headers
          </button>
        </div>
      </form>

      {/* Live Test Message Tool */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            Live Real-Time OTP Test Dispatch
          </h2>
          <span className="text-slate-500 text-[11px]">Validates Provider & DLT Connectivity</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Channel</label>
            <select
              value={testChannel}
              onChange={e => {
                const ch = e.target.value as "EMAIL" | "SMS";
                setTestChannel(ch);
                setTestRecipient(ch === "EMAIL" ? "admin@example.com" : "+919876543210");
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans focus:outline-none focus:border-blue-600"
            >
              <option value="EMAIL">Email OTP Dispatch</option>
              <option value="SMS">India DLT SMS OTP Dispatch</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Recipient Destination</label>
            <input
              type="text"
              value={testRecipient}
              onChange={e => setTestRecipient(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            onClick={handleRunTestDispatch}
            disabled={isSendingTest}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Live Test Message
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl border font-mono space-y-1 text-[11px] ${
            testResult.status === "SUCCESS" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            <div className="flex justify-between border-b pb-1">
              <span>Status: <strong>{testResult.status}</strong></span>
              <span>Provider: {testResult.provider}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Message ID: {testResult.messageId || "N/A"}</span>
              <span>Latency: {testResult.latencyMs} ms</span>
            </div>
            {testResult.errorMessage && (
              <div className="text-rose-700 font-sans mt-1">Error: {testResult.errorMessage}</div>
            )}
          </div>
        )}
      </div>

      {/* DLT Setup Guide Modal */}
      {showDltGuide && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                TRAI / DLT India SMS Setup Guide
              </h3>
              <button onClick={() => setShowDltGuide(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">
                ×
              </button>
            </div>

            <div className="space-y-3 leading-relaxed text-slate-600">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 font-medium">
                <strong>Why is DLT required?</strong> Under TRAI regulations, all transactional and OTP SMS messages sent within India must use an approved DLT Principal Entity ID, registered 6-character Header (Sender ID), and approved content template.
              </div>

              <ol className="list-decimal list-inside space-y-2 font-sans font-medium text-slate-800">
                <li><strong>Entity Registration</strong>: Register your institution on any approved Indian telecom portal (BSNL, Jio DLT, Airtel, Vodafone Idea).</li>
                <li><strong>Header Registration</strong>: Request a 6-letter Header ID (e.g., <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-700">EXAMFG</code>).</li>
                <li><strong>Content Template Approval</strong>: Create an Service Implicit / OTP template with variable: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-700">Your ExamForge code is &#123;#var#&#125;. Valid for 5 min.</code></li>
                <li><strong>PE-TM Binding</strong>: Bind your DLT Principal Entity to your SMS Telemarketer/Provider (e.g. MSG91 or Twilio).</li>
                <li><strong>Enter Credentials</strong>: Copy your DLT Entity ID, Header, and Template ID into the ExamForge Vendor Console fields above.</li>
              </ol>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button onClick={() => setShowDltGuide(false)} className="bg-blue-600 text-white font-bold px-5 py-2 rounded-xl text-xs">
                Got it, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
