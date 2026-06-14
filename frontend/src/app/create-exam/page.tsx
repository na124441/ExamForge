"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  HelpCircle,
  Lock,
  ShieldAlert,
  Users,
  Database,
  Radio,
  FileCheck,
  Cpu,
  Layers,
  Sparkles,
  Server
} from "lucide-react";

const EXAM_TYPES = [
  {
    id: "cbt",
    name: "CBT Exam",
    desc: "JEE-style computer-based MCQ",
    details: "Best for online centres. Supports time-locked delivery, candidate logins, and live activity streams.",
    icon: "💻"
  },
  {
    id: "omr",
    name: "OMR Exam",
    desc: "NEET-style paper OMR",
    details: "Best for large offline MCQ exams. ExamForge generates QR-coded bubble sheets, flags scanning conflicts, and locks responses.",
    icon: "🔵"
  },
  {
    id: "written",
    name: "Written Exam",
    desc: "Board/UPSC-style descriptive",
    details: "Best for handwritten answers. Scan and upload booklets to an anonymous evaluation queue with double rubric grading.",
    icon: "✍️"
  },
  {
    id: "hybrid",
    name: "Hybrid Exam",
    desc: "OMR + Written descriptive workflow",
    details: "Supports combined paper testing: OMR sheets auto-parsed plus handwritten booklets anonymously graded by evaluator teams.",
    icon: "🚀"
  }
];

const INTEGRITY_PACKAGES = [
  {
    id: "basic",
    name: "Basic Trust",
    desc: "College/internal exams",
    details: "Configures basic auditing. Generates paper hashes, candidate receipt codes, and basic ledger blocks.",
    rules: { threshold: 90, doubleEval: "Optional", verify: "Simple Check-in", release: "Single key", gate: "Standard" },
    color: "border-slate-800 text-slate-400"
  },
  {
    id: "secure",
    name: "Secure Exam",
    desc: "School boards, recruitment",
    details: "Configures active security. Adds encrypted papers, biometric card checking, and center release keys.",
    rules: { threshold: 95, doubleEval: "Optional", verify: "Biometric Card Match", release: "Center time-lock key", gate: "Strict" },
    color: "border-blue-500/35 text-blue-400"
  },
  {
    id: "stakes",
    name: "High-Stakes",
    desc: "State-level scholarship exams",
    details: "Configures comprehensive auditing. Adds seat mapping anomalies, OMR reviews, and mandatory double evaluations.",
    rules: { threshold: 97, doubleEval: "Mandatory (Discrepancy flag)", verify: "Biometric Seating Match", release: "Dual custody release", gate: "Audit check" },
    color: "border-amber-500/35 text-amber-400"
  },
  {
    id: "authority",
    name: "Authority Grade",
    desc: "Central/government exams",
    details: "Configures military/banking-grade security. Multi-party signing key release, strict safety gate blocks, and compliance reports.",
    rules: { threshold: 98, doubleEval: "Mandatory (Senior review)", verify: "Biometric + Token Match", release: "Multi-party key sharing", gate: "Strict P0 blocks" },
    color: "border-violet-500/35 text-violet-400 font-bold"
  }
];

function CreateExamPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [examType, setExamType] = useState("hybrid");
  const [integrityPackage, setIntegrityPackage] = useState("authority");
  
  // Step 3 settings
  const [examName, setExamName] = useState("National Scholarship Test 2026");
  const [candidates, setCandidates] = useState(40000);
  const [centers, setCenters] = useState(80);
  const [sets, setSets] = useState(4);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  // Sync with search parameters on load
  useEffect(() => {
    const tpl = searchParams.get("template");
    const pkg = searchParams.get("package");
    if (tpl && EXAM_TYPES.some(t => t.id === tpl)) setExamType(tpl);
    if (pkg && INTEGRITY_PACKAGES.some(p => p.id === pkg)) setIntegrityPackage(pkg);
  }, [searchParams]);

  const activePackage = INTEGRITY_PACKAGES.find(p => p.id === integrityPackage) || INTEGRITY_PACKAGES[3];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleLaunch = async () => {
    setLoading(true);
    setLoadingStage(1);
    
    setTimeout(() => setLoadingStage(2), 500);
    setTimeout(() => setLoadingStage(3), 1000);
    setTimeout(() => setLoadingStage(4), 1500);
    setTimeout(() => setLoadingStage(5), 2000);
    
    setTimeout(() => {
      setLoading(false);
      router.push("/exams/EXM-001/control-room");
    }, 2600);
  };

  if (loading) {
    const logMessages = [
      "",
      "Establishing dual-custody HSM key vaults...",
      "Seeding center database configurations...",
      "Sealing 80 exam center envelopes with node-keys...",
      "Signing 40,000 candidate biometric identity tokens...",
      "Locking final security policies & publication gates..."
    ];
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-xs font-mono select-none">
        <div className="max-w-md w-full bg-glass border border-slate-800 p-6 rounded-2xl shadow-glow-blue/10 space-y-6 relative overflow-hidden terminal-scanline">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
            <span className="text-cyan-400 font-bold tracking-widest text-[10px] animate-pulse">VAULT_SEPARATION_ENGINE</span>
            <span className="text-[9px] text-slate-500">SYSTEM_DEPLOY</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="animate-spin text-cyan-400 text-lg">⚙️</span>
              <span className="text-white font-bold font-outfit text-sm">Deploying Zero-Trust Exam Pipelines</span>
            </div>
            
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5 text-[10px] text-slate-400 leading-normal min-h-[160px]">
              {loadingStage >= 1 && <div className="text-slate-400 font-bold">[1/5] {logMessages[1]}</div>}
              {loadingStage >= 2 && <div className="text-cyan-400">[2/5] {logMessages[2]}</div>}
              {loadingStage >= 3 && <div className="text-cyan-400">[3/5] {logMessages[3]}</div>}
              {loadingStage >= 4 && <div className="text-cyan-400">[4/5] {logMessages[4]}</div>}
              {loadingStage >= 5 && <div className="text-emerald-400 font-bold animate-pulse">[5/5] {logMessages[5]}</div>}
            </div>
            
            <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-2 overflow-hidden p-0.5">
              <div 
                className="bg-cyan-500 h-full rounded-full transition-all duration-300 shadow-glow-cyan" 
                style={{ width: `${(loadingStage / 5) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-[9px] text-slate-500 text-center font-bold uppercase tracking-wider pt-2">
            Do not close this window. Operations are cryptographically binding.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-cyber-grid bg-[#070A14] pb-12 animate-in fade-in duration-300">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900 border border-white/[0.06] p-5 rounded-2xl backdrop-blur-xl shadow-glow-blue/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.04] border border-white/[0.08] text-violet-400 rounded-xl">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-2 font-mono uppercase">
              <span>Exam Setup Wizard</span>
              <span className="text-[9px] px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded uppercase font-mono font-bold tracking-widest animate-pulse">
                Step {step} / 3
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
              Configure integrity levels, set mode templates, and launch secure service pipelines.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-4 py-2 border border-white/[0.1] text-slate-350 hover:bg-white/[0.05] hover:border-white/[0.15] hover:text-white rounded-xl transition font-mono cursor-pointer active-press flex items-center gap-1.5"
          >
            🏢 Cancel Setup
          </button>
        </div>
      </div>

      {/* Stepper Navigation Tracker */}
      <div className="flex gap-4 items-center border-b border-white/[0.06] pb-4 font-mono text-[10px] font-bold uppercase tracking-wider px-1">
        <div className={`flex items-center gap-2.5 ${step >= 1 ? "text-violet-300 font-extrabold" : "text-slate-500"}`}>
          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all ${step > 1 ? "bg-violet-700 border-violet-650 text-white" : step === 1 ? "ring-2 ring-violet-500 bg-violet-500/20 border-violet-500 text-violet-300" : "bg-white/[0.04] border-white/[0.06] text-slate-500"}`}>1</span>
          <span>Exam Type</span>
        </div>
        <div className="h-px flex-1 max-w-[40px] bg-white/[0.1]" />
        <div className={`flex items-center gap-2.5 ${step >= 2 ? "text-violet-300 font-extrabold" : "text-slate-500"}`}>
          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all ${step > 2 ? "bg-violet-700 border-violet-650 text-white" : step === 2 ? "ring-2 ring-violet-500 bg-violet-500/20 border-violet-500 text-violet-300" : "bg-white/[0.04] border-white/[0.06] text-slate-500"}`}>2</span>
          <span>Integrity Level</span>
        </div>
        <div className="h-px flex-1 max-w-[40px] bg-white/[0.1]" />
        <div className={`flex items-center gap-2.5 ${step >= 3 ? "text-violet-300 font-extrabold" : "text-slate-500"}`}>
          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all ${step === 3 ? "ring-2 ring-violet-500 bg-violet-500/20 border-violet-500 text-violet-300" : "bg-white/[0.04] border-white/[0.06] text-slate-500"}`}>3</span>
          <span>Exam Scale & Review</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Wizard Screen (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-white/[0.06] p-6 rounded-2xl shadow-lg min-h-[380px] flex flex-col justify-between backdrop-blur-xl">
          
          <div>
            {/* Step 1: Exam Type Selection */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider">
                    Step 1 — What exam are you conducting?
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    Select a format template category. ExamForge pre-configures OMR/written upload scopes.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXAM_TYPES.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setExamType(type.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex gap-4 items-start bg-white/[0.02] ${
                        examType === type.id 
                          ? "border-violet-500 bg-violet-500/[0.06] shadow-[0_0_0_1px_rgba(124,58,237,0.2)] text-violet-300"
                          : "border-white/[0.06] hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
                      }`}
                    >
                      <span className="text-2xl mt-0.5 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)]">{type.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-100 text-xs font-mono">{type.name}</h4>
                          <span className={`text-[9px] tracking-widest rounded px-1.5 py-0.5 ${
                            type.id === "cbt" ? "bg-sky-500/10 text-sky-400" :
                            type.id === "omr" ? "bg-emerald-500/10 text-emerald-450" :
                            type.id === "written" ? "bg-violet-500/10 text-violet-400" :
                            "bg-amber-500/10 text-amber-400"
                          }`}>
                            {type.id.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5 font-bold uppercase">{type.desc}</span>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-sans">
                          {type.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Integrity Level Selection */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider">
                    Step 2 — Choose Integrity Level Package
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    Select a pre-configured trust policy package depending on exam security stakes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INTEGRITY_PACKAGES.map(pkg => {
                    const isSelected = integrityPackage === pkg.id;
                    const isFeatured = pkg.id === "authority";
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setIntegrityPackage(pkg.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[145px] bg-white/[0.02] ${
                          isSelected 
                            ? "border-violet-500 bg-violet-500/[0.06] shadow-[0_0_0_1px_rgba(124,58,237,0.2)] text-violet-300"
                            : "border-white/[0.06] hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-100 text-xs font-mono">{pkg.name}</h4>
                            {isFeatured ? (
                              <span className="text-[9px] tracking-widest rounded px-1.5 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                TIER 4 • FEATURED
                              </span>
                            ) : (
                              <span className={`text-[9px] tracking-widest rounded px-1.5 py-0.5 bg-white/[0.04] text-slate-400`}>
                                TIER {pkg.id === "basic" ? "1" : pkg.id === "secure" ? "2" : "3"}
                              </span>
                            )}
                          </div>
                          
                          {/* Dot Lock Icons graduated fill based on tier */}
                          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-mono">
                            <Lock className="w-3 h-3 text-current" />
                            <span>
                              {pkg.id === "basic" ? "● ○ ○ ○" :
                               pkg.id === "secure" ? "● ● ○ ○" :
                               pkg.id === "stakes" ? "● ● ● ○" :
                               "● ● ● ●"}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-450 mt-2.5 leading-relaxed font-sans">
                            {pkg.details}
                          </p>
                        </div>
                        <div className="border-t border-white/[0.04] mt-3 pt-2 text-[10px] text-slate-500 font-mono flex justify-between font-semibold">
                          <span>Threshold: {pkg.rules.threshold}%</span>
                          <span>Keys: {pkg.rules.release.split(" ")[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Exam Scale Configurations */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider">
                    Step 3 — Exam Scale & Review Settings
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Input candidate registrations, centers online, and evaluate question blueprint sets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1">Exam Name</label>
                      <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full bg-[#0F1524]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1">Paper Sets (Sets)</label>
                      <input
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(Number(e.target.value))}
                        className="w-full bg-[#0F1524]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1">Total Candidates</label>
                      <input
                        type="number"
                        value={candidates}
                        onChange={(e) => setCandidates(Number(e.target.value))}
                        className="w-full bg-[#0F1524]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] text-slate-500 mb-1">Total Center Nodes</label>
                      <input
                        type="number"
                        value={centers}
                        onChange={(e) => setCenters(Number(e.target.value))}
                        className="w-full bg-[#0F1524]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* estimated complexity preview block */}
                <div className="p-4 bg-[#0F1524]/80 rounded-xl border border-white/[0.06] space-y-3.5 font-mono text-[11px] text-slate-400">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Estimated Workflow Complexity</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border-r border-white/[0.04] pr-2">
                      <span className="text-slate-100 font-mono text-[16px] font-bold block">{centers}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1">SEALED PKGS</span>
                    </div>
                    <div className="border-r border-white/[0.04] pr-2">
                      <span className="text-slate-100 font-mono text-[16px] font-bold block">{candidates.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1">ADMIT CARDS</span>
                    </div>
                    <div className="border-r border-white/[0.04] pr-2">
                      <span className="text-slate-100 font-mono text-[16px] font-bold block">{candidates.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1">OMR SHEETS</span>
                    </div>
                    <div>
                      <span className="text-emerald-450 font-mono text-[16px] font-bold block">~{Math.round(candidates / 250)}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1">EVALUATORS</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Stepper buttons */}
          <div className="flex justify-between items-center border-t border-white/[0.06] pt-4 mt-6">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`px-4 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 uppercase font-mono ${
                step === 1 ? "text-slate-650 border-white/[0.04] cursor-not-allowed" : "border-white/[0.1] text-slate-300 hover:bg-white/[0.05] hover:border-white/[0.15] cursor-pointer active-press"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,58,237,0.35)] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer active-press"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,58,237,0.35)] text-white rounded-xl text-xs font-bold transition flex items-center gap-2.5 uppercase font-mono tracking-wider cursor-pointer active-press"
              >
                <span>Deploy Integrity Service</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Right: What ExamForge is Doing panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Integrity configuration display card */}
          <div className="bg-[#0F1424]/60 backdrop-blur-xl border border-white/[0.06] p-5 rounded-2xl space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-slate-105 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Active Trust Settings</span>
            </h3>
            
            <div className="space-y-2.5 font-mono text-xs text-slate-400">
              <div className="flex justify-between pb-1 border-b border-white/[0.04]">
                <span>Trust Threshold:</span>
                <span className="text-slate-200 font-bold">{activePackage.rules.threshold}%</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/[0.04]">
                <span>Double Grading:</span>
                <span className="text-slate-200 font-bold truncate max-w-[120px]" title={activePackage.rules.doubleEval}>{activePackage.rules.doubleEval}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/[0.04]">
                <span>Verification Check:</span>
                <span className="text-slate-200 font-bold">{activePackage.rules.verify.split(" ")[0]} Match</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-white/[0.04]">
                <span>Package Keys:</span>
                <span className="text-slate-200 font-bold truncate max-w-[120px]" title={activePackage.rules.release}>{activePackage.rules.release}</span>
              </div>
              <div className="flex justify-between">
                <span>Safety Release:</span>
                <span className="text-slate-200 font-bold">{activePackage.rules.gate}</span>
              </div>
            </div>
          </div>

          {/* Value explainer panel */}
          <div className="bg-[#0F1424]/60 border border-white/[0.06] p-5 rounded-2xl space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
              ExamForge Integrity Guard
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              By locking these parameters, ExamForge will automatically defend your exam lifecycle by:
            </p>
            
            <ul className="space-y-3 text-[11px] text-slate-350 font-mono">
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-amber-400 shrink-0">🔒</span>
                <span>Encrypting question papers before release windows open</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-violet-400 shrink-0">🔑</span>
                <span>Sealing packages specific to center server node keys</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-sky-400 shrink-0">🧾</span>
                <span>Issuing cryptographically signed candidate receipts</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-emerald-400 shrink-0">🪑</span>
                <span>Locking seat-maps to prevent seating layout changes</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-violet-400 shrink-0">📷</span>
                <span>Hashing scanned OMR and booklet copy uploads</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-rose-400 shrink-0">🚦</span>
                <span>Blocking result releases if safety gate check policies fail</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚙️</span>
        <span>LOADING CONFIGURATION WIZARD...</span>
      </div>
    }>
      <CreateExamPageInner />
    </Suspense>
  );
}
