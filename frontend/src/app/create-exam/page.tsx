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
            <span className="text-cyan-405 font-bold tracking-widest text-[10px] animate-pulse">VAULT_SEPARATION_ENGINE</span>
            <span className="text-[9px] text-slate-500">SYSTEM_DEPLOY</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="animate-spin text-cyan-405 text-lg">⚙️</span>
              <span className="text-white font-bold font-outfit text-sm">Deploying Zero-Trust Exam Pipelines</span>
            </div>
            
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5 text-[10px] text-slate-400 leading-normal min-h-[160px]">
              {loadingStage >= 1 && <div className="text-slate-400 font-bold">[1/5] {logMessages[1]}</div>}
              {loadingStage >= 2 && <div className="text-cyan-405">[2/5] {logMessages[2]}</div>}
              {loadingStage >= 3 && <div className="text-cyan-405">[3/5] {logMessages[3]}</div>}
              {loadingStage >= 4 && <div className="text-cyan-405">[4/5] {logMessages[4]}</div>}
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
    <div className="space-y-6 min-h-screen bg-cyber-grid bg-slate-950 pb-12 animate-in fade-in duration-300">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-glass border border-slate-900/60 p-5 rounded-2xl backdrop-blur-md shadow-glow-blue/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-450 rounded-xl shadow-glow-blue/5">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2 font-outfit">
              <span>Exam Setup Wizard</span>
              <span className="text-[9px] px-2.5 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-405 rounded uppercase font-mono font-bold tracking-widest animate-pulse">
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
            className="text-xs px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white rounded-xl transition font-mono cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            🏢 Cancel Setup
          </button>
        </div>
      </div>

      {/* Stepper Navigation Tracker */}
      <div className="flex gap-4 border-b border-slate-900 pb-4 font-mono text-[10px] font-bold uppercase tracking-wider px-1">
        <div className={`flex items-center gap-2.5 ${step >= 1 ? "text-cyan-400 font-extrabold" : "text-slate-600"}`}>
          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all ${step >= 1 ? "bg-cyan-950/20 border-cyan-500 text-cyan-400 shadow-glow-cyan/5" : "bg-slate-950 border-slate-850 text-slate-650"}`}>1</span>
          <span>Exam Type</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-800 self-center" />
        <div className={`flex items-center gap-2.5 ${step >= 2 ? "text-cyan-400 font-extrabold" : "text-slate-600"}`}>
          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all ${step >= 2 ? "bg-cyan-950/20 border-cyan-500 text-cyan-400 shadow-glow-cyan/5" : "bg-slate-950 border-slate-850 text-slate-650"}`}>2</span>
          <span>Integrity Level</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-800 self-center" />
        <div className={`flex items-center gap-2.5 ${step >= 3 ? "text-cyan-400 font-extrabold" : "text-slate-600"}`}>
          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all ${step >= 3 ? "bg-cyan-950/20 border-cyan-500 text-cyan-400 shadow-glow-cyan/5" : "bg-slate-950 border-slate-850 text-slate-650"}`}>3</span>
          <span>Exam Scale & Review</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Wizard Screen (8 cols) */}
        <div className="lg:col-span-8 bg-glass p-6 rounded-2xl border border-slate-900/60 shadow-lg min-h-[380px] flex flex-col justify-between">
          
          <div>
            {/* Step 1: Exam Type Selection */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Step 1 — What exam are you conducting?
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select a format template category. ExamForge pre-configures OMR/written upload scopes.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EXAM_TYPES.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setExamType(type.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex gap-4 items-start bg-glass-card hover:-translate-y-0.5 ${
                        examType === type.id 
                          ? "border-cyan-500 bg-cyan-950/10 shadow-glow-cyan/5 text-cyan-400"
                          : "border-slate-900 hover:bg-slate-900/10 hover:border-slate-800"
                      }`}
                    >
                      <span className="text-2xl mt-0.5 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)]">{type.icon}</span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs font-outfit">{type.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5 font-bold uppercase">{type.desc}</span>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-sans">
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
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Step 2 — Choose Integrity Level Package
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select a pre-configured trust policy package depending on exam security stakes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INTEGRITY_PACKAGES.map(pkg => {
                    const isSelected = integrityPackage === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setIntegrityPackage(pkg.id)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[145px] bg-glass-card hover:-translate-y-0.5 ${
                          isSelected 
                            ? "border-cyan-500 bg-cyan-950/10 shadow-glow-cyan/5 text-cyan-450"
                            : "border-slate-900 hover:bg-slate-900/10 hover:border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-white text-xs font-outfit">{pkg.name}</h4>
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border font-mono ${pkg.color}`}>
                              {pkg.desc.split("/")[0]}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-2.5 leading-relaxed font-sans">
                            {pkg.details}
                          </p>
                        </div>
                        <div className="border-t border-slate-950/40 mt-3 pt-2 text-[9px] text-slate-500 font-mono flex justify-between font-semibold">
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
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Step 3 — Exam Scale & Review Settings
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Input candidate registrations, centers online, and evaluate question blueprint sets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-500 mb-1.5 uppercase text-[9px] font-bold tracking-wider">Exam Name</label>
                      <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full p-2.5 bg-slate-950/80 border border-slate-850 hover:border-slate-700 focus:border-cyan-500 rounded-xl focus:outline-none text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1.5 uppercase text-[9px] font-bold tracking-wider">Paper Sets (Sets)</label>
                      <input
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-950/80 border border-slate-850 hover:border-slate-700 focus:border-cyan-500 rounded-xl focus:outline-none text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-500 mb-1.5 uppercase text-[9px] font-bold tracking-wider">Total Candidates</label>
                      <input
                        type="number"
                        value={candidates}
                        onChange={(e) => setCandidates(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-950/80 border border-slate-850 hover:border-slate-700 focus:border-cyan-500 rounded-xl focus:outline-none text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1.5 uppercase text-[9px] font-bold tracking-wider">Total Center Nodes</label>
                      <input
                        type="number"
                        value={centers}
                        onChange={(e) => setCenters(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-950/80 border border-slate-850 hover:border-slate-700 focus:border-cyan-500 rounded-xl focus:outline-none text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* estimated complexity preview block */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 space-y-3.5 font-mono text-[11px] text-slate-405">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block animate-pulse">Estimated Workflow Complexity</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Packages</span>
                      <span className="text-white font-bold">{centers} sealed pkgs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Admit Cards</span>
                      <span className="text-white font-bold">{candidates.toLocaleString()} cards</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">OMR Bound</span>
                      <span className="text-white font-bold">{candidates.toLocaleString()} sheets</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Evaluators</span>
                      <span className="text-emerald-450 font-bold">~{Math.round(candidates / 250)} rec.</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Stepper buttons */}
          <div className="flex justify-between items-center border-t border-slate-900/60 pt-4 mt-6">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`px-4 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 uppercase font-mono ${
                step === 1 ? "text-slate-650 border-slate-905 cursor-not-allowed" : "border-slate-800 text-slate-350 hover:bg-slate-900 cursor-pointer active:scale-95"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer active:scale-95"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-400 hover:to-teal-550 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2.5 uppercase font-mono tracking-wider shadow-md shadow-emerald-500/10 cursor-pointer active:scale-95"
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
          <div className="bg-glass p-5 rounded-2xl border border-slate-900/60 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-405 animate-pulse" />
              <span>Active Trust Settings</span>
            </h3>
            
            <div className="space-y-2.5 font-mono text-xs text-slate-405">
              <div className="flex justify-between pb-1 border-b border-slate-950/40">
                <span>Trust Threshold:</span>
                <span className="text-white font-bold">{activePackage.rules.threshold}%</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-950/40">
                <span>Double Grading:</span>
                <span className="text-white font-bold truncate max-w-[120px]" title={activePackage.rules.doubleEval}>{activePackage.rules.doubleEval}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-950/40">
                <span>Verification Check:</span>
                <span className="text-white font-bold">{activePackage.rules.verify.split(" ")[0]} Match</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-950/40">
                <span>Package Keys:</span>
                <span className="text-white font-bold truncate max-w-[120px]" title={activePackage.rules.release}>{activePackage.rules.release}</span>
              </div>
              <div className="flex justify-between">
                <span>Safety Release:</span>
                <span className="text-white font-bold">{activePackage.rules.gate}</span>
              </div>
            </div>
          </div>

          {/* Value explainer panel */}
          <div className="bg-glass p-5 rounded-2xl border border-slate-900/60 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              ExamForge Integrity Guard
            </h3>
            <p className="text-[11px] text-slate-405 leading-relaxed font-sans">
              By locking these parameters, ExamForge will automatically defend your exam lifecycle by:
            </p>
            
            <ul className="space-y-3 text-[11px] text-slate-300 font-mono">
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-emerald-450 shrink-0">🔒</span>
                <span>Encrypting question papers before release windows open</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-emerald-450 shrink-0">🔑</span>
                <span>Sealing packages specific to center server node keys</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-emerald-450 shrink-0">🧾</span>
                <span>Issuing cryptographically signed candidate receipts</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-emerald-450 shrink-0">🪑</span>
                <span>Locking seat-maps to prevent seating layout changes</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-emerald-450 shrink-0">📷</span>
                <span>Hashing scanned OMR and booklet copy uploads</span>
              </li>
              <li className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-emerald-450 shrink-0">🚦</span>
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
