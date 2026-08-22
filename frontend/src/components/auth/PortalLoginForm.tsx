"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Building,
  ArrowLeft
} from "lucide-react";

export interface PortalConfig {
  portalKey: string;
  portalName: string;
  badgeText: string;
  badgeColor: string; // e.g. "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
  accentColor: string; // e.g. "from-emerald-600 to-teal-600"
  icon: React.ComponentType<any>;
  subtitle: string;
  securityNotice?: string;
  demoCredentials: { email: string; role: string; description: string }[];
  defaultRedirect: string;
}

export function PortalLoginForm({ config }: { config: PortalConfig }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA State Machine
  const [mfaRequired, setMfaRequired] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedDestination, setMaskedDestination] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email identity and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          portal_hint: config.portalKey
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      // Check if MFA is required
      if (data.status === "MFA_REQUIRED") {
        setMfaRequired(true);
        setChallengeId(data.challenge_id);
        setMaskedDestination(data.masked_destination);
        setLoading(false);
        return;
      }

      // Authentication successful
      handleAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !challengeId) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/auth/mfa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeId,
          otp_code: otpCode.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "MFA verification failed.");
      }

      handleAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || "Verification code rejected.");
      setLoading(false);
    }
  };

  const handleAuthSuccess = (data: any) => {
    if (typeof window !== "undefined") {
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token", data.access_token);
        document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }
      if (data.active_role) {
        localStorage.setItem("user_role", data.active_role);
        document.cookie = `user_role=${data.active_role}; path=/; max-age=86400; SameSite=Lax`;
      }
      if (data.name) {
        localStorage.setItem("user_name", data.name);
      }
      if (data.user_id) {
        localStorage.setItem("user_id", data.user_id);
      }
      if (data.available_roles) {
        localStorage.setItem("available_roles", JSON.stringify(data.available_roles));
      }
      if (data.workspaces) {
        localStorage.setItem("workspaces", JSON.stringify(data.workspaces));
      }
    }

    // Check if user has multiple assigned roles and should choose workspace
    if (data.available_roles && data.available_roles.length > 1) {
      router.push("/workspace/select");
    } else {
      const targetUrl = data.default_workspace || config.defaultRedirect;
      router.push(targetUrl);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-[#081310] text-[#FFF4E2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(138,216,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(138,216,184,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Nav Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-6 flex items-center justify-between relative z-10">
        <Link
          href="/portals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          All Portals Hub
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#8AD8B8] hover:text-[#FFF4E2] transition-colors"
        >
          <img src="/logo-icon.png" alt="ExamForge" className="w-4 h-4 object-contain mix-blend-screen" />
          ExamForge Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-[rgba(19,45,40,0.85)] backdrop-blur-2xl border border-[rgba(138,216,184,0.25)] rounded-3xl p-8 shadow-2xl space-y-6 text-[#FFF4E2]">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(8,19,16,0.85)] border border-[rgba(138,216,184,0.3)] mx-auto shadow-lg flex items-center justify-center text-[#8AD8B8]">
              <IconComponent size={26} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold border border-[rgba(138,216,184,0.25)] bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] uppercase tracking-wider mb-1.5">
                <Lock size={10} />
                {config.badgeText}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#FFF4E2]">
                {config.portalName}
              </h1>
              <p className="text-xs text-[#8AD8B8]/80 mt-1">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Security Notice */}
          {config.securityNotice && (
            <div className="p-3 rounded-2xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.2)] text-[11px] text-[#8AD8B8]/90 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#8AD8B8] shrink-0 mt-0.5" />
              <span>{config.securityNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-[rgba(180,60,60,0.2)] border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MFA STEP vs PRIMARY CREDENTIAL STEP */}
          {!mfaRequired ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#FFF4E2]/90 uppercase tracking-wider mb-1.5 font-mono">
                  Official Email / Identity ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[rgba(8,19,16,0.85)] border border-[rgba(138,216,184,0.25)] text-sm text-[#FFF4E2] placeholder-[#8AD8B8]/50 focus:outline-none focus:border-[#8AD8B8] transition-all font-mono"
                  />
                  <User className="w-4 h-4 text-[#8AD8B8]/60 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#FFF4E2]/90 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <span className="text-[11px] text-[#8AD8B8] hover:text-[#FFF4E2] cursor-pointer">
                    Demo: password123
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[rgba(8,19,16,0.85)] border border-[rgba(138,216,184,0.25)] text-sm text-[#FFF4E2] placeholder-[#8AD8B8]/50 focus:outline-none focus:border-[#8AD8B8] transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-[#8AD8B8]/60 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#8AD8B8]/60 hover:text-[#FFF4E2]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] border border-[#8AD8B8]/30 flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Validating Credentials...
                  </>
                ) : (
                  <>
                    Sign In Securely
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* MFA CHALLENGE STEP */
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.25)] text-xs text-[#8AD8B8]">
                <div className="font-semibold mb-1 flex items-center gap-1.5 text-[#FFF4E2]">
                  <KeyRound size={14} className="text-[#8AD8B8]" />
                  Multi-Factor Authentication Required
                </div>
                <div>A one-time verification code has been sent to {maskedDestination || "your registered device"}.</div>
                <div className="mt-1 font-mono text-[#8AD8B8] font-bold">Demo OTP: 884920</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFF4E2]/90 uppercase tracking-wider mb-1.5 font-mono">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="884920"
                  required
                  autoFocus
                  className="w-full text-center tracking-widest text-lg font-mono font-bold py-3 rounded-2xl bg-[rgba(8,19,16,0.85)] border border-[#8AD8B8] text-[#FFF4E2] focus:outline-none focus:ring-2 focus:ring-[#8AD8B8]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] border border-[#8AD8B8]/30 flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    Verify & Access Workspace
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setOtpCode("");
                }}
                className="w-full text-center text-xs text-[#8AD8B8] hover:text-[#FFF4E2]"
              >
                Cancel & Return
              </button>
            </form>
          )}

          {/* Quick Demo Persona Selectors */}
          {config.demoCredentials.length > 0 && (
            <div className="pt-3 border-t border-[rgba(138,216,184,0.15)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8AD8B8]/80 block font-mono">
                Quick 1-Click Demo Accounts
              </span>
              <div className="grid grid-cols-1 gap-2">
                {config.demoCredentials.map((cred, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickFill(cred.email)}
                    className="p-3 rounded-2xl bg-[rgba(8,19,16,0.8)] hover:bg-[rgba(19,45,40,0.9)] border border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8] text-left flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="font-semibold text-[#FFF4E2] group-hover:text-[#8AD8B8]">
                        {cred.role}
                      </div>
                      <div className="text-[10px] text-[#8AD8B8]/70 font-mono">
                        {cred.email}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#8AD8B8] px-2 py-0.5 rounded-lg bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.25)] font-semibold group-hover:bg-[#408576] group-hover:text-[#FFF4E2]">
                      Auto-fill
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Seal */}
        <div className="mt-8 text-center text-xs font-mono text-[#8AD8B8]/70 flex items-center justify-center gap-2">
          <ShieldCheck size={14} />
          ExamForge Zero-Trust Gateway &middot; FastAPI Authoritative
        </div>
      </div>
    </div>
  );
}
