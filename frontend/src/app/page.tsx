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
  Radio
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

const DEMO_ROLES = [
  {
    role: "CONTROLLER",
    name: "Exam Controller",
    email: "controller@example.com",
    desc: "Create exams, lock blueprints, generate secure papers, and verify the publication gate.",
    icon: "🔐",
    color: "border-blue-500/25 text-blue-400 bg-blue-950/25 hover:bg-blue-950/40 hover:border-blue-500/40",
    redirect: "/authority"
  },
  {
    role: "OFFICER",
    name: "Center Officer",
    email: "officer@example.com",
    desc: "Verify candidates, assign seat layouts, release time-locked packages, and scan OMR sheets.",
    icon: "🏢",
    color: "border-amber-500/25 text-amber-400 bg-amber-950/25 hover:bg-amber-950/40 hover:border-amber-500/40",
    redirect: "/center-console"
  },
  {
    role: "INVIGILATOR",
    name: "Exam Invigilator",
    email: "invigilator@example.com",
    desc: "Confirm candidate check-ins, log suspect behaviors, and verify seat maps.",
    icon: "🛡️",
    color: "border-violet-500/25 text-violet-400 bg-violet-950/25 hover:bg-violet-950/40 hover:border-violet-500/40",
    redirect: "/center-console"
  },
  {
    role: "CANDIDATE",
    name: "Candidate Portal",
    email: "candidate@example.com",
    desc: "Lookup candidate grades, view receipt verification details, and review result audit states.",
    icon: "🎓",
    color: "border-cyan-500/25 text-cyan-400 bg-cyan-950/25 hover:bg-cyan-950/40 hover:border-cyan-500/40",
    redirect: "/result-portal"
  },
  {
    role: "EVALUATOR",
    name: "Evaluator Panel",
    email: "evaluator@example.com",
    desc: "Evaluate written booklet copies anonymously against strict rubrics in locked sessions.",
    icon: "⚖️",
    color: "border-fuchsia-500/25 text-fuchsia-400 bg-fuchsia-950/25 hover:bg-fuchsia-950/40 hover:border-fuchsia-500/40",
    redirect: "/evaluator"
  },
  {
    role: "AUDITOR",
    name: "System Auditor",
    email: "auditor@example.com",
    desc: "Verify append-only hash chains, audit timelines, and retrieve compliance evidence binders.",
    icon: "🔬",
    color: "border-emerald-500/25 text-emerald-400 bg-emerald-950/25 hover:bg-emerald-950/40 hover:border-emerald-500/40",
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
        <div className="flex justify-between items-center bg-slate-900/40 p-5 rounded-2xl border border-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight font-sans">
                Welcome, Examination Authority
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure and deploy high-integrity examination service workflows instantly.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/create-exam")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 uppercase font-mono tracking-wider"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Exam</span>
          </button>
        </div>

        {/* Section 1: Choose exam category */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            What exam type do you want to conduct?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div 
              onClick={() => router.push("/create-exam?template=cbt")}
              className="bg-slate-900/50 hover:bg-slate-900 p-5 rounded-2xl border border-slate-850 hover:border-blue-500/30 transition duration-150 cursor-pointer flex flex-col justify-between min-h-[130px] group"
            >
              <div>
                <span className="text-2xl">💻</span>
                <h4 className="font-bold text-white mt-2 font-mono group-hover:text-blue-400 transition-colors">CBT MCQ Exam</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                  Best for computer-based testing. Timing-locked questions, local biometric login, and dynamic package releases.
                </p>
              </div>
              <span className="text-[9px] text-blue-400 font-mono mt-3 block font-bold">Use Template →</span>
            </div>

            <div 
              onClick={() => router.push("/create-exam?template=omr")}
              className="bg-slate-900/50 hover:bg-slate-900 p-5 rounded-2xl border border-slate-850 hover:border-blue-500/30 transition duration-150 cursor-pointer flex flex-col justify-between min-h-[130px] group"
            >
              <div>
                <span className="text-2xl">🔵</span>
                <h4 className="font-bold text-white mt-2 font-mono group-hover:text-blue-400 transition-colors">Offline OMR Exam</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                  Best for bubble sheet evaluation. Auto QR generation, scanner ingestion pipelines, and ambiguous bubble correction flows.
                </p>
              </div>
              <span className="text-[9px] text-blue-400 font-mono mt-3 block font-bold">Use Template →</span>
            </div>

            <div 
              onClick={() => router.push("/create-exam?template=hybrid")}
              className="bg-slate-900/50 hover:bg-slate-900 p-5 rounded-2xl border border-slate-850 hover:border-blue-500/30 transition duration-150 cursor-pointer flex flex-col justify-between min-h-[130px] group"
            >
              <div>
                <span className="text-2xl">🚀</span>
                <h4 className="font-bold text-white mt-2 font-mono group-hover:text-blue-400 transition-colors">Hybrid Scholarship Exam</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                  OMR + Descriptive Written sheets. Integrates scanning, anonymized grading panels, and double evaluation checklists.
                </p>
              </div>
              <span className="text-[9px] text-blue-400 font-mono mt-3 block font-bold">Use Template →</span>
            </div>

          </div>
        </div>

        {/* Section 2: Choose Integrity package */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Or select a preconfigured integrity level
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div 
              onClick={() => router.push("/create-exam?package=basic")}
              className="bg-slate-900/30 hover:bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-slate-700 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">Package 1</span>
              <h4 className="font-bold text-white text-xs mt-1 font-mono">Basic Trust</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Paper hashes, candidate receipt codes, and simple logs. Best for semester exams.
              </p>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=secure")}
              className="bg-slate-900/30 hover:bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-slate-700 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-blue-400 font-mono uppercase">Package 2</span>
              <h4 className="font-bold text-white text-xs mt-1 font-mono">Secure Exam</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Encrypted papers, local release, and biometric admit card verification.
              </p>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=stakes")}
              className="bg-slate-900/30 hover:bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-slate-700 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-amber-400 font-mono uppercase">Package 3</span>
              <h4 className="font-bold text-white text-xs mt-1 font-mono">High-Stakes</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Center mapping, seat maps, OMR scanning checks, and double evaluations.
              </p>
            </div>

            <div 
              onClick={() => router.push("/create-exam?package=authority")}
              className="bg-slate-900/30 hover:bg-slate-900/60 p-4 rounded-xl border border-slate-850 hover:border-slate-700 transition cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold text-violet-400 font-mono uppercase font-black">Package 4</span>
              <h4 className="font-bold text-white text-xs mt-1 font-mono">Authority Grade</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Multi-party key releases, strict safety checks, compliance reports, and legal logs.
              </p>
            </div>

          </div>
        </div>

        {/* Section 3: Track existing exams */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-lg">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Track Existing Exams</span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500">
                  <th className="py-2.5 px-3">Exam ID</th>
                  <th className="py-2.5 px-3">Exam Name</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Security Level</th>
                  <th className="py-2.5 px-3">Operational Status</th>
                  <th className="py-2.5 px-3 text-right">Console</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                <tr className="hover:bg-slate-950/20 cursor-pointer" onClick={() => router.push("/exams/EXM-001/control-room")}>
                  <td className="py-3 px-3 text-white font-bold">EXM-001</td>
                  <td className="py-3 px-3 font-sans text-slate-200 font-semibold">National Scholarship Test 2026</td>
                  <td className="py-3 px-3">HYBRID (OMR+Descriptive)</td>
                  <td className="py-3 px-3 text-violet-400 font-bold">Authority Grade</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                      Ready for Exam Day
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="text-[10px] px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg hover:border-slate-700 transition">
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
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100 font-sans selection:bg-blue-600/30">
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* Top badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/30 border border-blue-900/30 rounded-full text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase mb-4">
          <Lock className="w-3 h-3 text-blue-500" />
          <span>Multi-Tenant Vault Authentication</span>
        </div>

        {/* Brand header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
            EXAM<span className="text-blue-500">FORGE</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Zero-trust examination command & verification engine. Enforcing cryptographic chain of custody from question to publication.
          </p>
        </div>

        {/* Roles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-8">
          {DEMO_ROLES.map((role) => (
            <div
              key={role.role}
              onClick={() => handleDemoSelect(role.email)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${role.color} ${
                selectedEmail === role.email
                  ? "ring-2 ring-blue-500 border-transparent bg-slate-900 shadow-xl shadow-black/40 scale-[1.02]"
                  : "border-slate-800 shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xl">{role.icon}</span>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    {role.name}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {role.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900/40 text-[9px] font-mono text-slate-500 flex justify-between items-center">
                <span>ID: {role.email}</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Decryption box */}
        {selectedEmail && (
          <form
            onSubmit={handleLogin}
            className="w-full max-w-md bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Key className="w-3.5 h-3.5 text-blue-500" />
              <span>Establish Secure Session</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                  Identity Token
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedEmail}
                  className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-400 font-mono focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">
                  Decryption Passphrase
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter vault passphrase"
                  className="w-full p-2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none font-mono tracking-widest"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/15 border border-red-900/20 text-red-400 rounded-lg text-[10px] font-mono leading-normal flex gap-2 items-start">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white font-mono font-black text-xs uppercase rounded-lg hover:bg-blue-500 transition-colors cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
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
