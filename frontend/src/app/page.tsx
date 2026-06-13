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
  EyeOff,
  Cpu,
  Layers
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

const DEMO_ROLES = [
  {
    role: "CONTROLLER",
    name: "Exam Controller",
    email: "controller@example.com",
    desc: "Create exams, lock blueprints, generate secure papers, and verify the publication gate.",
    icon: "🔐",
    color: "border-white/[0.06] text-violet-400 bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500/30 hover:shadow-glow-blue",
    redirect: "/authority"
  },
  {
    role: "OFFICER",
    name: "Center Officer",
    email: "officer@example.com",
    desc: "Verify candidates, assign seat layouts, release time-locked packages, and scan OMR sheets.",
    icon: "🏢",
    color: "border-white/[0.06] text-amber-400 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 hover:shadow-glow-cyan",
    redirect: "/center-console"
  },
  {
    role: "INVIGILATOR",
    name: "Exam Invigilator",
    email: "invigilator@example.com",
    desc: "Confirm candidate check-ins, log suspect behaviors, and verify seat maps.",
    icon: "🛡️",
    color: "border-white/[0.06] text-violet-400 bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500/30 hover:shadow-glow-violet",
    redirect: "/center-console"
  },
  {
    role: "CANDIDATE",
    name: "Candidate Portal",
    email: "candidate@example.com",
    desc: "Lookup candidate grades, view receipt verification details, and review result audit states.",
    icon: "🎓",
    color: "border-white/[0.06] text-sky-400 bg-white/[0.02] hover:bg-white/[0.05] hover:border-sky-500/30 hover:shadow-glow-cyan",
    redirect: "/result-portal"
  },
  {
    role: "EVALUATOR",
    name: "Evaluator Panel",
    email: "evaluator@example.com",
    desc: "Evaluate written booklet copies anonymously against strict rubrics in locked sessions.",
    icon: "⚖️",
    color: "border-white/[0.06] text-fuchsia-400 bg-white/[0.02] hover:bg-white/[0.05] hover:border-fuchsia-500/30 hover:shadow-glow-violet",
    redirect: "/evaluator"
  },
  {
    role: "AUDITOR",
    name: "System Auditor",
    email: "auditor@example.com",
    desc: "Verify append-only hash chains, audit timelines, and retrieve compliance evidence binders.",
    icon: "🔬",
    color: "border-white/[0.06] text-emerald-400 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 hover:shadow-glow-emerald",
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
      <div className="space-y-8 p-1 select-none animate-fade-in-up">
        
        {/* Launcher Header Banner */}
        <div className="flex justify-between items-center bg-[#0F1424]/60 backdrop-blur-xl border border-white/[0.06] p-5 rounded-2xl shadow-glow-blue/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                <span>Active Exam: <span className="text-slate-100 font-bold">National Scholarship Test 2026</span></span>
                <span className="text-slate-700">•</span>
                <span>Trust Score: <span className="text-emerald-450 font-bold">97% Integrity</span></span>
              </div>
              <h1 className="text-lg font-black text-slate-100 tracking-tight font-outfit mt-0.5">
                1 exam active · Authority Grade · Exam day in 3 days
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/war-room")}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer active-press"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>v0.2 War Room</span>
            </button>
            <button
              onClick={() => router.push("/create-exam")}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer active-press"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Exam</span>
            </button>
          </div>
        </div>

        {/* Section 1: Choose exam category */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            What exam type do you want to conduct?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div 
              onClick={() => router.push("/create-exam?template=cbt")}
              className="bg-[#0f1424]/60 backdrop-blur-md hover:bg-white/[0.02] p-5.5 rounded-2xl border border-white/[0.06] transition duration-200 cursor-pointer flex flex-col justify-between min-h-[160px] group shadow-sm hover:border-violet-500/40"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Cpu className="w-6 h-6 text-sky-400 filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]" />
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded uppercase">
                    Timing-Locked Questions
                  </span>
                </div>
                <h4 className="font-outfit font-bold text-slate-100 mt-3 group-hover:text-violet-400 transition-colors text-sm">CBT MCQ Exam</h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-sans font-medium">
                  Best for computer-based testing. Timing-locked questions, local biometric login, and dynamic package releases.
                </p>
              </div>
              <span className="text-[9px] text-violet-400 font-mono mt-3.5 block font-bold">Use Template →</span>
            </div>

            <div 
              onClick={() => router.push("/create-exam?template=omr")}
              className="bg-[#0f1424]/60 backdrop-blur-md hover:bg-white/[0.02] p-5.5 rounded-2xl border border-white/[0.06] transition duration-200 cursor-pointer flex flex-col justify-between min-h-[160px] group shadow-sm hover:border-violet-500/40"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Layers className="w-6 h-6 text-emerald-400 filter drop-shadow-[0_2px_8px_rgba(52,211,153,0.3)]" />
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded uppercase">
                    Auto-QR Geotag Ingest
                  </span>
                </div>
                <h4 className="font-outfit font-bold text-slate-100 mt-3 group-hover:text-emerald-400 transition-colors text-sm">Offline OMR Exam</h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-sans font-medium">
                  Best for bubble sheet evaluation. Auto QR generation, scanner ingestion pipelines, and ambiguous bubble correction flows.
                </p>
              </div>
              <span className="text-[9px] text-emerald-450 font-mono mt-3.5 block font-bold">Use Template →</span>
            </div>

            <div 
              onClick={() => router.push("/create-exam?template=hybrid")}
              className="bg-[#0f1424]/60 backdrop-blur-md hover:bg-white/[0.02] p-5.5 rounded-2xl border border-white/[0.06] transition duration-200 cursor-pointer flex flex-col justify-between min-h-[160px] group shadow-sm hover:border-violet-500/40"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Radio className="w-6 h-6 text-violet-400 filter drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]" />
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/25 rounded uppercase">
                    AI-Assisted Rubrics
                  </span>
                </div>
                <h4 className="font-outfit font-bold text-slate-100 mt-3 group-hover:text-violet-400 transition-colors text-sm">Hybrid Scholarship Exam</h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-sans font-medium">
                  OMR + Descriptive Written sheets. Integrates scanning, anonymized grading panels, and double evaluation checklists.
                </p>
              </div>
              <span className="text-[9px] text-violet-400 font-mono mt-3.5 block font-bold">Use Template →</span>
            </div>

          </div>
        </div>

        {/* Section 2: Choose Integrity package */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Or select a preconfigured integrity level
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div 
              onClick={() => router.push("/create-exam?package=basic")}
              className="bg-[#0f1424]/60 backdrop-blur-md hover:bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] transition cursor-pointer text-left font-mono"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Tier 1</span>
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                  <Lock className="w-3 h-3" />
                  <span>● ○ ○ ○</span>
                </div>
              </div>
              <h4 className="font-outfit font-bold text-slate-100 text-xs">Basic Trust</h4>
              <ul className="mt-3.5 space-y-1 text-[10px] text-slate-500 leading-normal">
                <li>• Paper cryptographic hashes</li>
                <li>• Candidate receipt codes</li>
                <li>• Simple audit log trail</li>
              </ul>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=secure")}
              className="bg-[#0f1424]/60 backdrop-blur-md hover:bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] transition cursor-pointer text-left font-mono"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Tier 2</span>
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                  <Lock className="w-3 h-3" />
                  <span>● ● ○ ○</span>
                </div>
              </div>
              <h4 className="font-outfit font-bold text-slate-100 text-xs">Secure Exam</h4>
              <ul className="mt-3.5 space-y-1 text-[10px] text-slate-500 leading-normal">
                <li>• Encrypted paper payloads</li>
                <li>• Local node release keys</li>
                <li>• Biometric check-in cards</li>
              </ul>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=stakes")}
              className="bg-[#0f1424]/60 backdrop-blur-md hover:bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] transition cursor-pointer text-left font-mono"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Tier 3</span>
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                  <Lock className="w-3 h-3" />
                  <span>● ● ● ○</span>
                </div>
              </div>
              <h4 className="font-outfit font-bold text-slate-100 text-xs">High-Stakes</h4>
              <ul className="mt-3.5 space-y-1 text-[10px] text-slate-500 leading-normal">
                <li>• Center seating mapping</li>
                <li>• OMR density validation</li>
                <li>• Evaluator double blind</li>
              </ul>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=authority")}
              className="bg-[#0f1424]/60 backdrop-blur-md hover:bg-white/[0.02] p-4 rounded-xl border-2 border-violet-500/40 transition cursor-pointer text-left font-mono shadow-[0_0_15px_rgba(124,58,237,0.15)]"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-violet-400 uppercase">Tier 4 (Featured)</span>
                <div className="flex items-center gap-1 text-[9px] text-violet-400">
                  <Lock className="w-3 h-3 text-violet-500 fill-violet-500/20" />
                  <span>● ● ● ●</span>
                </div>
              </div>
              <h4 className="font-outfit font-bold text-slate-100 text-xs">Authority Grade</h4>
              <ul className="mt-3.5 space-y-1 text-[10px] text-slate-500 leading-normal">
                <li>• Multi-party consensus key</li>
                <li>• Real-time ledger checks</li>
                <li>• Legal compliance binder</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Section 3: Track existing exams */}
        <div className="bg-[#0F1424]/60 backdrop-blur-xl border border-white/[0.06] p-5.5 rounded-2xl shadow-lg">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5 px-1">
            <Activity className="w-4 h-4 text-emerald-450 animate-pulse" />
            <span>Track Existing Exams</span>
          </h2>
          
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-500 text-[10px] uppercase tracking-[0.12em]">
                  <th className="py-3 px-4.5">Exam ID</th>
                  <th className="py-3 px-4.5">Exam Name</th>
                  <th className="py-3 px-4.5">Mode</th>
                  <th className="py-3 px-4.5">Security Level</th>
                  <th className="py-3 px-4.5">Operational Status</th>
                  <th className="py-3 px-4.5 text-right">Console</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                <tr className="hover:bg-white/[0.02] cursor-pointer transition" onClick={() => router.push("/exams/EXM-001/control-room")}>
                  <td className="py-3.5 px-4.5 text-slate-500 font-mono text-[11px]">EXM-001</td>
                  <td className="py-3.5 px-4.5 font-medium text-slate-100 text-[14px] font-sans">National Scholarship Test 2026</td>
                  <td className="py-3.5 px-4.5 text-slate-400">HYBRID (OMR+Descriptive)</td>
                  <td className="py-3.5 px-4.5 text-violet-400 font-bold">Authority Grade</td>
                  <td className="py-3.5 px-4.5">
                    {/* Operational phase as mini stepper */}
                    <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold">
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">POLICY</span>
                      <span className="text-slate-700">➔</span>
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">SEALED</span>
                      <span className="text-slate-700">➔</span>
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.12)]">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span>READY</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4.5 text-right">
                    <button className="text-[11px] px-3 py-1 bg-[#070A14] border border-white/[0.08] text-violet-400 hover:text-violet-300 rounded-lg hover:border-violet-500/30 transition cursor-pointer font-mono">
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
    <main className="min-h-screen bg-[#070A14] flex flex-col justify-center items-center p-6 text-slate-100 font-sans selection:bg-violet-600/30 animate-fade-in-up">
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* War room banner */}
        <div 
          onClick={() => router.push("/war-room")}
          className="mb-6 px-4 py-2 bg-violet-500/5 border border-violet-500/20 hover:border-violet-500/40 rounded-full text-xs font-mono font-bold text-violet-400 cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.1)] transition duration-200 active-press"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          <span>LAUNCH SYSTEM v0.2 CYBER WAR ROOM CONSOLE (JUDGES VIEW) →</span>
        </div>

        {/* Top badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-950/10 border border-violet-900/20 rounded-full text-[10px] font-mono font-bold tracking-widest text-violet-400 uppercase mb-4 shadow-glow-blue/5">
          <Lock className="w-3 h-3 text-violet-500" />
          <span>Multi-Tenant Vault Authentication</span>
        </div>

        {/* Brand header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none font-sans uppercase">
            EXAM<span className="text-violet-500">FORGE</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2.5 leading-relaxed font-sans">
            Zero-trust examination command & verification engine. Enforcing cryptographic chain of custody from question to publication.
          </p>
        </div>

        {/* Roles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-8">
          {DEMO_ROLES.map((role) => (
            <div
              key={role.role}
              onClick={() => handleDemoSelect(role.email)}
              className={`p-4.5 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[145px] ${role.color} ${
                selectedEmail === role.email
                  ? "border-violet-500/40 bg-violet-500/[0.04] shadow-[0_0_0_1px_rgba(124,58,237,0.15),0_8px_32px_rgba(0,0,0,0.4)] scale-[1.02]"
                  : "border-white/[0.06] bg-white/[0.02] shadow-sm hover:border-white/[0.12] hover:bg-white/[0.04]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.05)]">{role.icon}</span>
                  <h3 className="text-[13px] font-medium text-slate-100">
                    {role.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {role.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.04] text-[10px] font-mono text-slate-500 flex justify-between items-center">
                <span>ID: {role.email}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Decryption box */}
        {selectedEmail && (
          <form
            onSubmit={handleLogin}
            className="w-full max-w-md bg-[#0F1424]/60 backdrop-blur-xl border border-white/[0.06] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4.5 flex items-center gap-1.5 border-b border-white/[0.06] pb-2.5">
              <Key className="w-3.5 h-3.5 text-violet-500" />
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
                  className="w-full p-2.5 bg-slate-950/80 border border-white/[0.06] rounded-xl text-xs text-slate-500 font-mono focus:outline-none"
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
                    className="w-full p-2.5 bg-[#070A14] border border-white/[0.08] focus:border-violet-500/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-mono tracking-widest pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-350 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-mono leading-normal flex gap-2 items-start shadow-[0_0_15px_rgba(251,113,133,0.1)]">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(124,58,237,0.35)] flex items-center justify-center gap-2 active-press"
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

