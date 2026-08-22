"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  Lock, 
  KeyRound,
  LogOut,
  Smartphone
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "../forge/ForgeCard";
import { ForgeButton } from "../forge/ForgeButton";
import { ForgeStatusPill } from "../forge/ForgeStatusPill";
import { 
  registerCandidateV1, 
  sendEmailOtpV1, 
  sendPhoneOtpV1, 
  verifyOtpV1, 
  getAuthUserV1, 
  logoutV1, 
  revokeAllSessionsV1 
} from "@/lib/api";

export function ForgeAuthV1Wizard() {
  const [step, setStep] = useState<"CREATE_ACCOUNT" | "EMAIL_OTP" | "PHONE_OTP" | "AUTHENTICATED">("CREATE_ACCOUNT");
  
  // Registration State
  const [name, setName] = useState("Rahul Kumar");
  const [email, setEmail] = useState("rahul.kumar@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [userId, setUserId] = useState("");
  
  // OTP Challenge State
  const [challengeId, setChallengeId] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Auth User & Session State
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0 && (step === "EMAIL_OTP" || step === "PHONE_OTP")) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown, step]);

  const maskEmail = (str: string) => {
    const parts = str.split("@");
    if (parts.length !== 2) return str;
    const namePart = parts[0];
    return `${namePart[0]}•••••@${parts[1]}`;
  };

  const maskPhone = (str: string) => {
    const digits = str.replace(/\D/g, "");
    if (digits.length < 4) return str;
    return `+91 ••••••${digits.slice(-4)}`;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMsg(null);
    try {
      const res = await registerCandidateV1({ name, email, phone });
      setUserId(res.userId || "USR-2026-01");
      
      // Auto-trigger Email OTP
      const emailRes = await sendEmailOtpV1(email, "REGISTRATION");
      setChallengeId(emailRes.challengeId || "CHL-MOCK-EMAIL");
      setStep("EMAIL_OTP");
      setCooldown(30);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance focus
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    try {
      const res = await verifyOtpV1(challengeId, otpCode);

      if (step === "EMAIL_OTP") {
        // Move to Phone OTP
        const phoneRes = await sendPhoneOtpV1(phone, "REGISTRATION");
        setChallengeId(phoneRes.challengeId || "CHL-MOCK-PHONE");
        setOtpDigits(["", "", "", "", "", ""]);
        setStep("PHONE_OTP");
        setCooldown(30);
      } else if (step === "PHONE_OTP") {
        // Fully Authenticated!
        setAuthUser(res.user || { name, email, phone, role: "CANDIDATE" });
        setStep("AUTHENTICATED");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Verification code failed.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsSending(true);
    setErrorMsg(null);
    try {
      if (step === "EMAIL_OTP") {
        const res = await sendEmailOtpV1(email, "REGISTRATION");
        setChallengeId(res.challengeId);
      } else {
        const res = await sendPhoneOtpV1(phone, "REGISTRATION");
        setChallengeId(res.challengeId);
      }
      setCooldown(30);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await logoutV1();
    setStep("CREATE_ACCOUNT");
    setAuthUser(null);
  };

  return (
    <div className="max-w-xl mx-auto p-4 font-sans">
      <ForgeCard className="border-indigo-900/40 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <ForgeCardHeader className="border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <ForgeCardTitle className="text-xl font-bold text-slate-100">
                  ExamForge Identity Authority
                </ForgeCardTitle>
                <p className="text-xs text-slate-400">Multi-Factor Candidate Authentication Service</p>
              </div>
            </div>
            <ForgeStatusPill 
              status={step === "AUTHENTICATED" ? "verified" : "live"} 
            />
          </div>
        </ForgeCardHeader>

        <ForgeCardContent className="pt-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CREATE ACCOUNT */}
          {step === "CREATE_ACCOUNT" && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 pl-10"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 pl-10"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Phone Number (India E.164)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 pl-10"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <ForgeButton 
                type="submit"
                disabled={isSending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Continue to Verification"}
                <ArrowRight className="w-4 h-4" />
              </ForgeButton>
            </form>
          )}

          {/* STEP 2: EMAIL OTP */}
          {step === "EMAIL_OTP" && (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 max-w-sm mx-auto">
                <Mail className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-100">Verify Email Address</h3>
                <p className="text-xs text-slate-400 mt-1">
                  6-digit verification code sent to <span className="font-mono text-indigo-300 font-semibold">{maskEmail(email)}</span>
                </p>
              </div>

              {/* 6-Digit OTP Boxes */}
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-bold bg-slate-950 border border-slate-700 rounded-lg text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-4">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || isSending}
                  className={`hover:underline ${cooldown > 0 ? "opacity-50 cursor-not-allowed" : "text-indigo-400 font-medium"}`}
                >
                  Resend code {cooldown > 0 && `in ${cooldown}s`}
                </button>

                <span className="text-slate-500 font-mono">5 min expiration</span>
              </div>

              <ForgeButton
                onClick={handleVerifyOtp}
                disabled={isSending || otpDigits.join("").length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg"
              >
                {isSending ? "Verifying Email OTP..." : "Verify & Proceed"}
              </ForgeButton>
            </div>
          )}

          {/* STEP 3: PHONE OTP */}
          {step === "PHONE_OTP" && (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 max-w-sm mx-auto">
                <Smartphone className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-100">Verify Mobile Phone</h3>
                <p className="text-xs text-slate-400 mt-1">
                  DLT SMS verification code sent to <span className="font-mono text-cyan-300 font-semibold">{maskPhone(phone)}</span>
                </p>
              </div>

              {/* 6-Digit OTP Boxes */}
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-bold bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-4">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || isSending}
                  className={`hover:underline ${cooldown > 0 ? "opacity-50 cursor-not-allowed" : "text-cyan-400 font-medium"}`}
                >
                  Resend SMS {cooldown > 0 && `in ${cooldown}s`}
                </button>

                <span className="text-slate-500 font-mono">5 min expiration</span>
              </div>

              <ForgeButton
                onClick={handleVerifyOtp}
                disabled={isSending || otpDigits.join("").length !== 6}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg"
              >
                {isSending ? "Verifying Phone OTP..." : "Complete Verification"}
              </ForgeButton>
            </div>
          )}

          {/* STEP 4: AUTHENTICATED */}
          {step === "AUTHENTICATED" && authUser && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Identity & Channels Fully Verified</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Candidate <span className="font-semibold text-slate-200">{authUser.name}</span> registered and authenticated.
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Email Status:</span>
                  <span className="text-emerald-400 font-semibold">VERIFIED ({maskEmail(authUser.email)})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-2">
                  <span className="text-slate-400">Phone Status:</span>
                  <span className="text-emerald-400 font-semibold">VERIFIED ({maskPhone(authUser.phone)})</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-400">Session Cookie:</span>
                  <span className="text-indigo-400">HttpOnly (SameSite=Lax)</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ForgeButton 
                  onClick={handleLogout}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Session
                </ForgeButton>

                <ForgeButton 
                  onClick={async () => {
                    await revokeAllSessionsV1();
                    handleLogout();
                  }}
                  className="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Revoke All Sessions
                </ForgeButton>
              </div>
            </div>
          )}
        </ForgeCardContent>
      </ForgeCard>
    </div>
  );
}
