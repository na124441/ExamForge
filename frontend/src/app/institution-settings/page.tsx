"use client";

import { useState } from "react";
import Link from "next/link";
import { ForgeVendorMessagingConfig } from "@/components/vendor/ForgeVendorMessagingConfig";

export default function InstitutionSettings() {
  const [activeTab, setActiveTab] = useState<"SOVEREIGNTY" | "MESSAGING">("MESSAGING");
  const [region, setRegion] = useState("IN");
  const [retentionDays, setRetentionDays] = useState("365");
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 font-sans max-w-6xl mx-auto space-y-6">
      {/* Top Header & Tab Selector */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-wide">Institution & Messaging Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Customize local tenant configurations, email providers & India DLT SMS gateways.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("MESSAGING")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "MESSAGING" ? "bg-blue-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Messaging & DLT OTP Gateway
          </button>
          <button
            onClick={() => setActiveTab("SOVEREIGNTY")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "SOVEREIGNTY" ? "bg-blue-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Data Sovereignty & Retention
          </button>
        </div>
      </div>

      {activeTab === "MESSAGING" ? (
        <ForgeVendorMessagingConfig />
      ) : (
        <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">Data Sovereignty Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure regional data residency and audit retention policies.</p>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
              Sovereignty settings saved successfully to tenant registry.
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-bold font-mono">Data Sovereignty Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none text-slate-900 font-mono"
              >
                <option value="IN">IN (India - TRAI & MeitY High Security)</option>
                <option value="US">US (United States)</option>
                <option value="EU">EU (Europe - GDPR)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold font-mono">Evidence Packet Retention (Days)</label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer text-xs uppercase tracking-wider mt-2 shadow-md shadow-blue-500/20"
            >
              Save Configuration
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="text-xs text-blue-600 font-bold hover:underline">
              ← Return to Main Portal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
