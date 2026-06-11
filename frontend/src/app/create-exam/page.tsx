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
    // Simulate database seeding & router redirect
    setTimeout(() => {
      setLoading(false);
      // Route directly to our fully seeded demo control room for EXM-001
      router.push("/exams/EXM-001/control-room");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Exam Setup Wizard</span>
            <span className="text-[9px] px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded uppercase font-mono font-bold tracking-widest">
              Step {step} / 3
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure integrity levels, set mode templates, and launch secure service pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-lg transition"
          >
            🏢 Cancel Setup
          </button>
        </div>
      </div>

      {/* Stepper Navigation Tracker */}
      <div className="flex gap-4 border-b border-slate-900 pb-4 font-mono text-[10px] font-bold uppercase tracking-wider">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-400" : "text-slate-600"}`}>
          <span className="w-5 h-5 rounded-full bg-slate-850 flex items-center justify-center border border-slate-800">1</span>
          <span>Exam Type</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-800 self-center" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-400" : "text-slate-600"}`}>
          <span className="w-5 h-5 rounded-full bg-slate-850 flex items-center justify-center border border-slate-800">2</span>
          <span>Integrity Level</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-800 self-center" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-blue-400" : "text-slate-600"}`}>
          <span className="w-5 h-5 rounded-full bg-slate-850 flex items-center justify-center border border-slate-800">3</span>
          <span>Exam Scale & Review</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Wizard Screen (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 p-6 rounded-2xl border border-slate-850 shadow-lg min-h-[360px] flex flex-col justify-between">
          
          <div>
            {/* Step 1: Exam Type Selection */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Step 1 — What exam are you conducting?
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select a format template category. ExamForge pre-configures OMR/written upload scopes.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EXAM_TYPES.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setExamType(type.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-3.5 items-start ${
                        examType === type.id 
                          ? "border-blue-500 bg-slate-950/40 shadow-md shadow-black/35"
                          : "border-slate-850 hover:bg-slate-950/10 hover:border-slate-800"
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{type.icon}</span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs font-mono">{type.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{type.desc}</span>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
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
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select a pre-configured trust policy package depending on exam security stakes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INTEGRITY_PACKAGES.map(pkg => (
                    <div
                      key={pkg.id}
                      onClick={() => setIntegrityPackage(pkg.id)}
                      className={`p-4.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between min-h-[140px] ${
                        integrityPackage === pkg.id 
                          ? "border-blue-500 bg-slate-950/40 shadow-md shadow-black/35"
                          : "border-slate-850 hover:bg-slate-950/10 hover:border-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-white text-xs font-mono">{pkg.name}</h4>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border font-mono ${pkg.color}`}>
                            {pkg.desc.split("/")[0]}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                          {pkg.details}
                        </p>
                      </div>
                      <div className="border-t border-slate-950/50 mt-3 pt-2 text-[9px] text-slate-500 font-mono flex justify-between">
                        <span>Threshold: {pkg.rules.threshold}%</span>
                        <span>Key: {pkg.rules.release.split(" ")[0]}</span>
                      </div>
                    </div>
                  ))}
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
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Input candidate registrations, centers online, and evaluate question blueprint sets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase text-[9px] font-bold">Exam Name</label>
                      <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-850 rounded focus:border-blue-500 focus:outline-none text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase text-[9px] font-bold">Paper Sets (Sets)</label>
                      <input
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(Number(e.target.value))}
                        className="w-full p-2 bg-slate-950 border border-slate-850 rounded focus:border-blue-500 focus:outline-none text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase text-[9px] font-bold">Total Candidates</label>
                      <input
                        type="number"
                        value={candidates}
                        onChange={(e) => setCandidates(Number(e.target.value))}
                        className="w-full p-2 bg-slate-950 border border-slate-850 rounded focus:border-blue-500 focus:outline-none text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 uppercase text-[9px] font-bold">Total Center Nodes</label>
                      <input
                        type="number"
                        value={centers}
                        onChange={(e) => setCenters(Number(e.target.value))}
                        className="w-full p-2 bg-slate-950 border border-slate-850 rounded focus:border-blue-500 focus:outline-none text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* estimated complexity preview block */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2 font-mono text-[11px] text-slate-400">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Estimated Workflow Complexity</span>
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
                      <span className="text-emerald-400 font-bold">~{Math.round(candidates / 250)} recommended</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Stepper buttons */}
          <div className="flex justify-between items-center border-t border-slate-850 pt-4 mt-6">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`px-4 py-2 border border-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 uppercase font-mono ${
                step === 1 ? "text-slate-600 border-slate-900 cursor-not-allowed" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 uppercase font-mono tracking-wider cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition flex items-center gap-1.5 uppercase font-mono tracking-wider shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {loading ? (
                  <span>Deploying Service...</span>
                ) : (
                  <>
                    <span>Deploy Integrity Service</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Right: What ExamForge is Doing panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Integrity configuration display card */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Active Trust Settings</span>
            </h3>
            
            <div className="space-y-2.5 font-mono text-xs text-slate-400">
              <div className="flex justify-between pb-1 border-b border-slate-950/60">
                <span>Trust Threshold:</span>
                <span className="text-white font-bold">{activePackage.rules.threshold}%</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-950/60">
                <span>Double Grading:</span>
                <span className="text-white font-bold truncate max-w-[120px]" title={activePackage.rules.doubleEval}>{activePackage.rules.doubleEval}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-950/60">
                <span>Verification Check:</span>
                <span className="text-white font-bold">{activePackage.rules.verify.split(" ")[0]} Match</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-950/60">
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
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              ExamForge Integrity Guard
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              By locking these parameters, ExamForge will automatically defend your exam lifecycle by:
            </p>
            
            <ul className="space-y-3 text-[11px] text-slate-300 font-mono">
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-emerald-400 shrink-0">🔒</span>
                <span>Encrypting question papers before release windows open</span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-emerald-400 shrink-0">🔑</span>
                <span>Sealing packages specific to center server node keys</span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-emerald-400 shrink-0">🧾</span>
                <span>Issuing cryptographically signed candidate receipts</span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-emerald-400 shrink-0">🪑</span>
                <span>Locking seat-maps to prevent seating layout changes</span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-emerald-400 shrink-0">📷</span>
                <span>Hashing scanned OMR and booklet copy uploads</span>
              </li>
              <li className="flex gap-2 items-start leading-relaxed">
                <span className="text-emerald-400 shrink-0">🚦</span>
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
