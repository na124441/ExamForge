"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  Key, 
  Lock, 
  ChevronRight, 
  Compass, 
  PlusCircle, 
  Activity, 
  Sparkles,
  User,
  Radio,
  Eye,
  EyeOff
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

const DEMO_ROLES = [
  {
    role: "CONTROLLER",
    name: "Exam Controller",
    email: "controller@example.com",
    desc: "Create exams, lock blueprints, generate secure papers, and verify the publication gate.",
    icon: "🔐",
    color: "border-blue-500/20 text-blue-450 bg-slate-900/30 hover:bg-slate-900/60 hover:border-blue-500/40 hover:shadow-glow-blue",
    redirect: "/authority"
  },
  {
    role: "OFFICER",
    name: "Center Officer",
    email: "officer@example.com",
    desc: "Verify candidates, assign seat layouts, release time-locked packages, and scan OMR sheets.",
    icon: "🏢",
    color: "border-amber-500/20 text-amber-450 bg-slate-900/30 hover:bg-slate-900/60 hover:border-amber-500/40 hover:shadow-glow-cyan",
    redirect: "/center-console"
  },
  {
    role: "INVIGILATOR",
    name: "Exam Invigilator",
    email: "invigilator@example.com",
    desc: "Confirm candidate check-ins, log suspect behaviors, and verify seat maps.",
    icon: "🛡️",
    color: "border-violet-500/20 text-violet-450 bg-slate-900/30 hover:bg-slate-900/60 hover:border-violet-500/40 hover:shadow-glow-violet",
    redirect: "/center-console"
  },
  {
    role: "CANDIDATE",
    name: "Candidate Portal",
    email: "candidate@example.com",
    desc: "Lookup candidate grades, view receipt verification details, and review result audit states.",
    icon: "🎓",
    color: "border-cyan-500/20 text-cyan-450 bg-slate-900/30 hover:bg-slate-900/60 hover:border-cyan-500/40 hover:shadow-glow-cyan",
    redirect: "/result-portal"
  },
  {
    role: "EVALUATOR",
    name: "Evaluator Panel",
    email: "evaluator@example.com",
    desc: "Evaluate written booklet copies anonymously against strict rubrics in locked sessions.",
    icon: "⚖️",
    color: "border-fuchsia-500/20 text-fuchsia-455 bg-slate-900/30 hover:bg-slate-900/60 hover:border-fuchsia-500/40 hover:shadow-glow-violet",
    redirect: "/evaluator"
  },
  {
    role: "AUDITOR",
    name: "System Auditor",
    email: "auditor@example.com",
    desc: "Verify append-only hash chains, audit timelines, and retrieve compliance evidence binders.",
    icon: "🔬",
    color: "border-emerald-500/20 text-emerald-455 bg-slate-900/30 hover:bg-slate-900/60 hover:border-emerald-500/40 hover:shadow-glow-emerald",
    redirect: "/audit-timeline"
  }
];

export default function RootEntryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Login states
  const [selectedEmail, setSelectedEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("access_token"));
    }
  }, []);

  const handleDemoSelect = (email: string) => {
    setSelectedEmail(email);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) {
      setError("Please select a simulated role first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedEmail, password })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Authentication failed.");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("user_email", selectedEmail);
      localStorage.setItem("user_institution", "National Scholarship Board");

      setToken(data.access_token);
      
      // Navigate to Home Launcher view
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to establish secure session with FastAPI backend. Ensure server is online.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // Render Category Service Launcher if authenticated
  if (token) {
    return (
      <div className="space-y-8 p-1 select-none">
        
        {/* Launcher Header Banner */}
        <div className="flex justify-between items-center bg-glass border border-slate-900/60 p-5 rounded-2xl backdrop-blur-md shadow-glow-blue/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-450 rounded-xl shadow-glow-blue/5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight font-outfit">
                Welcome, Examination Authority
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Configure and deploy high-integrity examination service workflows instantly.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/war-room")}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/15 flex items-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer active:scale-95"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>v0.2 War Room</span>
            </button>
            <button
              onClick={() => router.push("/create-exam")}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Exam</span>
            </button>
          </div>
        </div>

        {/* Section 1: Choose exam category */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono px-1">
            What exam type do you want to conduct?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div 
              onClick={() => router.push("/create-exam?template=cbt")}
              className="bg-glass-card hover:bg-slate-900/60 p-5.5 rounded-2xl border border-slate-850 hover:border-blue-500/30 transition duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group shadow-sm hover:shadow-glow-blue/5"
            >
              <div>
                <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]">💻</span>
                <h4 className="font-outfit font-bold text-white mt-2.5 group-hover:text-blue-400 transition-colors">CBT MCQ Exam</h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                  Best for computer-based testing. Timing-locked questions, local biometric login, and dynamic package releases.
                </p>
              </div>
              <span className="text-[9px] text-blue-400 font-mono mt-3.5 block font-bold">Use Template →</span>
            </div>

            <div 
              onClick={() => router.push("/create-exam?template=omr")}
              className="bg-glass-card hover:bg-slate-900/60 p-5.5 rounded-2xl border border-slate-850 hover:border-blue-500/30 transition duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group shadow-sm hover:shadow-glow-blue/5"
            >
              <div>
                <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(5,150,105,0.2)]">🔵</span>
                <h4 className="font-outfit font-bold text-white mt-2.5 group-hover:text-blue-400 transition-colors">Offline OMR Exam</h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                  Best for bubble sheet evaluation. Auto QR generation, scanner ingestion pipelines, and ambiguous bubble correction flows.
                </p>
              </div>
              <span className="text-[9px] text-blue-400 font-mono mt-3.5 block font-bold">Use Template →</span>
            </div>

            <div 
              onClick={() => router.push("/create-exam?template=hybrid")}
              className="bg-glass-card hover:bg-slate-900/60 p-5.5 rounded-2xl border border-slate-850 hover:border-blue-500/30 transition duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group shadow-sm hover:shadow-glow-blue/5"
            >
              <div>
                <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(139,92,246,0.2)]">🚀</span>
                <h4 className="font-outfit font-bold text-white mt-2.5 group-hover:text-blue-400 transition-colors">Hybrid Scholarship Exam</h4>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                  OMR + Descriptive Written sheets. Integrates scanning, anonymized grading panels, and double evaluation checklists.
                </p>
              </div>
              <span className="text-[9px] text-blue-400 font-mono mt-3.5 block font-bold">Use Template →</span>
            </div>

          </div>
        </div>

        {/* Section 2: Choose Integrity package */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono px-1">
            Or select a preconfigured integrity level
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div 
              onClick={() => router.push("/create-exam?package=basic")}
              className="bg-glass-card hover:bg-slate-900/60 p-4.5 rounded-xl border border-slate-850 hover:border-slate-700/50 hover:shadow-glow-cyan/2 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">Package 1</span>
              <h4 className="font-outfit font-bold text-white text-xs mt-1">Basic Trust</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                Paper hashes, candidate receipt codes, and simple logs. Best for semester exams.
              </p>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=secure")}
              className="bg-glass-card hover:bg-slate-900/60 p-4.5 rounded-xl border border-slate-850 hover:border-slate-700/50 hover:shadow-glow-blue/5 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-blue-400 font-mono uppercase">Package 2</span>
              <h4 className="font-outfit font-bold text-white text-xs mt-1">Secure Exam</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                Encrypted papers, local release, and biometric admit card verification.
              </p>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=stakes")}
              className="bg-glass-card hover:bg-slate-900/60 p-4.5 rounded-xl border border-slate-850 hover:border-slate-700/50 hover:shadow-glow-cyan/5 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-amber-400 font-mono uppercase">Package 3</span>
              <h4 className="font-outfit font-bold text-white text-xs mt-1">High-Stakes</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                Center mapping, seat maps, OMR scanning checks, and double evaluations.
              </p>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=authority")}
              className="bg-glass-card hover:bg-slate-900/60 p-4.5 rounded-xl border border-slate-850 hover:border-slate-700/50 hover:shadow-glow-violet/5 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-violet-400 font-mono uppercase font-black">Package 4</span>
              <h4 className="font-outfit font-bold text-white text-xs mt-1">Authority Grade</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                Multi-party key releases, strict safety checks, compliance reports, and legal logs.
              </p>
            </div>

          </div>
        </div>

        {/* Section 3: Track existing exams */}
        <div className="bg-glass border border-slate-900/60 p-5.5 rounded-2xl shadow-lg">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5 px-1">
            <Activity className="w-4 h-4 text-emerald-450 animate-pulse" />
            <span>Track Existing Exams</span>
          </h2>
          
          <div className="overflow-x-auto rounded-xl border border-slate-900/80">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-900/80 bg-slate-950/40 text-slate-500">
                  <th className="py-3 px-4.5">Exam ID</th>
                  <th className="py-3 px-4.5">Exam Name</th>
                  <th className="py-3 px-4.5">Mode</th>
                  <th className="py-3 px-4.5">Security Level</th>
                  <th className="py-3 px-4.5">Operational Status</th>
                  <th className="py-3 px-4.5 text-right">Console</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50 text-slate-300">
                <tr className="hover:bg-slate-900/20 cursor-pointer transition" onClick={() => router.push("/exams/EXM-001/control-room")}>
                  <td className="py-3.5 px-4.5 text-white font-bold">EXM-001</td>
                  <td className="py-3.5 px-4.5 font-sans text-slate-200 font-semibold">National Scholarship Test 2026</td>
                  <td className="py-3.5 px-4.5">HYBRID (OMR+Descriptive)</td>
                  <td className="py-3.5 px-4.5 text-violet-400 font-bold">Authority Grade</td>
                  <td className="py-3.5 px-4.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                      Ready for Exam Day
                    </span>
                  </td>
                  <td className="py-3.5 px-4.5 text-right">
                    <button className="text-[10px] px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg hover:border-slate-700 transition cursor-pointer">
                      Control Room →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // Render Login screen if logged out
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-6 text-slate-100 font-sans selection:bg-blue-600/30">
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* War room banner */}
        <div 
          onClick={() => router.push("/war-room")}
          className="mb-6 px-4 py-2 bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40 rounded-full text-xs font-mono font-bold text-violet-400 cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition duration-200 active:scale-98"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          <span>LAUNCH SYSTEM v0.2 CYBER WAR ROOM CONSOLE (JUDGES VIEW) →</span>
        </div>

        {/* Top badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/20 border border-blue-900/20 rounded-full text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase mb-4 shadow-glow-blue/5 animate-pulse">
          <Lock className="w-3 h-3 text-blue-500" />
          <span>Multi-Tenant Vault Authentication</span>
        </div>

        {/* Brand header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none font-outfit">
            EXAM<span className="text-blue-500">FORGE</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2.5 leading-relaxed">
            Zero-trust examination command & verification engine. Enforcing cryptographic chain of custody from question to publication.
          </p>
        </div>

        {/* Roles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-8">
          {DEMO_ROLES.map((role) => (
            <div
              key={role.role}
              onClick={() => handleDemoSelect(role.email)}
              className={`p-4.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[145px] ${role.color} ${
                selectedEmail === role.email
                  ? "ring-2 ring-blue-500 border-transparent bg-slate-900/90 shadow-xl shadow-blue-500/10 scale-[1.03]"
                  : "border-slate-800/80 bg-glass-card shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.05)]">{role.icon}</span>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    {role.name}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {role.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900/40 text-[9px] font-mono text-slate-500 flex justify-between items-center">
                <span>ID: {role.email}</span>
                <ChevronRight className="w-3 h-3 text-slate-650" />
              </div>
            </div>
          ))}
        </div>

        {/* Decryption box */}
        {selectedEmail && (
          <form
            onSubmit={handleLogin}
            className="w-full max-w-md bg-glass border border-slate-900 p-6 rounded-2xl shadow-xl shadow-black/40 shadow-glow-blue/5 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4.5 flex items-center gap-1.5 border-b border-slate-900 pb-2.5">
              <Key className="w-3.5 h-3.5 text-blue-500" />
              <span>Establish Secure Session</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                  Identity Token
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedEmail}
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-900 rounded-xl text-xs text-slate-400 font-mono focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                  Decryption Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter vault passphrase"
                    className="w-full p-2.5 bg-slate-950/80 border border-slate-850 focus:border-blue-500/60 rounded-xl text-xs text-white focus:outline-none font-mono tracking-widest pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/15 border border-red-900/20 text-red-400 rounded-xl text-[10px] font-mono leading-normal flex gap-2 items-start">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <span>Decrypting Keyring...</span>
                ) : (
                  <>
                    <span>Decrypt Vault & Authenticate</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
