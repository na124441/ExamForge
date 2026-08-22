"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogIn, Lock, ShieldCheck, Home } from "lucide-react";
import { ROLE_METADATA_LIST, CanonicalRole } from "@/lib/auth/roles";

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string>("CANDIDATE");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("user_role") || "CANDIDATE";
      setRole(storedRole);
    }
  }, []);

  const handleReturnToWorkspace = () => {
    const meta = ROLE_METADATA_LIST[role as CanonicalRole];
    if (meta && meta.defaultRoute) {
      router.push(meta.defaultRoute);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="max-w-md w-full p-8 rounded-3xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] backdrop-blur-2xl shadow-2xl relative z-10 text-center space-y-6 text-[#FFF4E2]">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] mx-auto flex items-center justify-center shadow-lg animate-pulse">
        <ShieldAlert size={32} />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.25)] text-[#8AD8B8] font-mono text-xs uppercase tracking-wider">
          <Lock size={12} />
          HTTP 403 &middot; Access Denied
        </div>
        <h1 className="text-2xl font-bold font-sans text-[#FFF4E2]">
          Permission Restricted
        </h1>
        <p className="text-sm text-[#8AD8B8]/80 leading-relaxed">
          Your authenticated role does not hold the cryptographic authority or permission scope required for this operational domain.
        </p>
      </div>

      {mounted && (
        <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.2)] text-left font-mono text-xs space-y-1">
          <div className="text-[#8AD8B8]/70">Active Identity Role:</div>
          <div className="text-[#8AD8B8] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8AD8B8]"></span>
            {role}
          </div>
        </div>
      )}

      <div className="pt-2 space-y-3">
        <button
          onClick={handleReturnToWorkspace}
          className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] border border-[#8AD8B8]/30 flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer shadow-lg transition-all"
        >
          <Home size={16} />
          Return to Authorized Workspace
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full py-2.5 px-4 rounded-2xl font-medium text-xs text-[#8AD8B8] hover:text-[#FFF4E2] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] border border-[rgba(138,216,184,0.2)] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogIn size={14} />
          Switch Account / Role
        </button>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="w-full min-h-[calc(100vh-10rem)] bg-[#081310] text-[#FFF4E2] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(138,216,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(138,216,184,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      <Suspense fallback={<div className="text-[#8AD8B8]/70 font-mono text-sm">Validating zero-trust credentials...</div>}>
        <UnauthorizedContent />
      </Suspense>

      <div className="mt-8 text-center text-xs font-mono text-[#8AD8B8]/70 flex items-center gap-2">
        <ShieldCheck size={14} />
        Zero-Trust Policy Enforced &middot; Event Logged
      </div>
    </div>
  );
}
