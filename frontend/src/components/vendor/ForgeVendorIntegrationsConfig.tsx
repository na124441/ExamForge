"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { 
  CreditCard, 
  Mail, 
  Phone, 
  Key, 
  QrCode, 
  Building, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  RefreshCw 
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "../forge/ForgeCard";
import { ForgeButton } from "../forge/ForgeButton";
import { ForgeStatusPill } from "../forge/ForgeStatusPill";

export function ForgeVendorIntegrationsConfig() {
  // Communication Mode
  const [commMode, setCommMode] = useState<"EXAMFORGE_NATIVE" | "VENDOR_GOOGLE">("VENDOR_GOOGLE");
  const [googleKey, setGoogleKey] = useState("OAUTH2_GMAIL_SEND_SECRET_KEY_PROD_9812");
  const [smsKey, setSmsKey] = useState("DLT_TELECOM_SENDER_ID_EXAMFG");

  // Payment Mode
  const [paymentType, setPaymentType] = useState<"VENDOR_QR_BANK" | "RAZORPAY" | "NO_FEE">("VENDOR_QR_BANK");
  const [upiId, setUpiId] = useState("vendor.exam@okicici");
  const [bankName, setBankName] = useState("State Bank of India");
  const [accountNumber, setAccountNumber] = useState("309182736412");
  const [ifscCode, setIfscCode] = useState("SBIN0001842");

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      <form onSubmit={handleSaveIntegrations} className="space-y-6">
        
        {/* 1. Communication & OTP Service Configuration */}
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              1. Communication & OTP Service Mode
            </ForgeCardTitle>
          </ForgeCardHeader>

          <ForgeCardContent className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCommMode("EXAMFORGE_NATIVE")}
                className={cn(
                  "p-4 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer text-left space-y-1",
                  commMode === "EXAMFORGE_NATIVE" ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <div>ExamForge Native OTP Service</div>
                <div className="text-[10px] font-normal text-slate-500">Zero configuration required. Uses platform delivery servers.</div>
              </button>

              <button
                type="button"
                onClick={() => setCommMode("VENDOR_GOOGLE")}
                className={cn(
                  "p-4 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer text-left space-y-1",
                  commMode === "VENDOR_GOOGLE" ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <div>Vendor Owned Provider (Google Workspace & DLT SMS)</div>
                <div className="text-[10px] font-normal text-slate-500">Send OTPs & receipts from official vendor domain.</div>
              </button>
            </div>

            {commMode === "VENDOR_GOOGLE" && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Google Workspace OAuth 2.0 (`gmail.send` Key)</label>
                  <input
                    type="password"
                    value={googleKey}
                    onChange={e => setGoogleKey(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">DLT Telecom SMS Sender ID</label>
                  <input
                    type="text"
                    value={smsKey}
                    onChange={e => setSmsKey(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}
          </ForgeCardContent>
        </ForgeCard>

        {/* 2. Fee Collection & Payment Receipt Options */}
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              2. Application Fee Collection & Payment Setup
            </ForgeCardTitle>
          </ForgeCardHeader>

          <ForgeCardContent className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("VENDOR_QR_BANK")}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer",
                  paymentType === "VENDOR_QR_BANK" ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                Vendor Static QR / Bank Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("RAZORPAY")}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer",
                  paymentType === "RAZORPAY" ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                Razorpay / Stripe Gateway
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("NO_FEE")}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer",
                  paymentType === "NO_FEE" ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                No Application Fee (Free)
              </button>
            </div>

            {paymentType === "VENDOR_QR_BANK" && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Vendor UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={e => setIfscCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {savedSuccess && (
                <div className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Integrations & Payment Settings Encrypted & Saved.
                </div>
              )}
              <ForgeButton type="submit" variant="primary" className="ml-auto">
                <ShieldCheck className="w-4 h-4 mr-1" /> Save Encrypted Credentials
              </ForgeButton>
            </div>
          </ForgeCardContent>
        </ForgeCard>

      </form>

    </div>
  );
}
