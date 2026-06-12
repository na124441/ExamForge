"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  ShieldAlert, 
  Activity, 
  Lock, 
  Unlock, 
  Terminal, 
  Layers, 
  Database, 
  History, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Cpu, 
  Zap, 
  Sliders, 
  Check, 
  Play, 
  Pause,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  Eye,
  Settings,
  HelpCircle,
  FileSignature,
  FileCheck,
  RefreshCw,
  TrendingUp,
  Skull
} from "lucide-react";

// Types
interface Paper {
  id: string;
  name: string;
  hash: string;
  progress: number;
  status: "IDLE" | "ENCRYPTING" | "SECURED";
}

interface OMRQuestion {
  id: number;
  ans: string;
  density: number;
  conf: number;
  status: "VERIFIED" | "AMBIGUOUS" | "RESOLVED";
  isDouble?: boolean;
}

interface LedgerEvent {
  id: number;
  type: string;
  label: string;
  desc: string;
  timestamp: string;
  actor: string;
  status: "SECURED" | "FRACTURED";
  prevHash: string;
  currHash: string;
}

export default function WarRoomPage() {
  const router = useRouter();
  
  // Switcher state (1 = Central Controller, 2 = OpenCV OMR, 3 = Descriptive Eval, 4 = Audit Ledger)
  const [activeTab, setActiveTab] = useState<number>(1);
  const [systemLatency, setSystemLatency] = useState<number>(12);
  
  // Tamper Sandbox state
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>(
    "UPDATE grades SET total_score = 98 WHERE candidate_id = 'ANON-8891';"
  );
  const [sqlInjected, setSqlInjected] = useState<boolean>(false);

  // Tab 1: Central Exam Controller Deck State
  const [mathWeight, setMathWeight] = useState<number>(40);
  const [physWeight, setPhysWeight] = useState<number>(30);
  const [chemWeight, setChemWeight] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<number>(65); // Hard percentage
  const [penaltyMode, setPenaltyMode] = useState<string>("-0.25");
  
  const [papers, setPapers] = useState<Paper[]>([
    { id: "SET_A", name: "Paper Set A (General)", hash: "-------------------------", progress: 0, status: "IDLE" },
    { id: "SET_B", name: "Paper Set B (Advanced)", hash: "-------------------------", progress: 0, status: "IDLE" },
    { id: "SET_C", name: "Paper Set C (Reserves)", hash: "-------------------------", progress: 0, status: "IDLE" }
  ]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [timeLeft, setTimeLeft] = useState<number>(294); // Decryption countdown
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [centerNodes, setCenterNodes] = useState([
    { id: "MUM_01", name: "West Node (Mumbai)", status: "VERIFIED" },
    { id: "DEL_02", name: "North Node (Delhi)", status: "VERIFIED" },
    { id: "BLR_03", name: "South Node (Bangalore)", status: "VERIFIED" },
    { id: "MAA_04", name: "East Node (Chennai)", status: "VERIFIED" },
    { id: "KOL_05", name: "Reserve Node (Kolkata)", status: "PENDING" }
  ]);

  // Tab 2: OpenCV OMR Workbench State
  const [omrList, setOmrList] = useState<OMRQuestion[]>([
    { id: 11, ans: "A", density: 98, conf: 99.4, status: "VERIFIED" },
    { id: 12, ans: "C", density: 95, conf: 98.9, status: "VERIFIED" },
    { id: 13, ans: "B", density: 91, conf: 97.6, status: "VERIFIED" },
    { id: 14, ans: "C / D", density: 88, conf: 41.2, status: "AMBIGUOUS", isDouble: true },
    { id: 15, ans: "A", density: 96, conf: 99.1, status: "VERIFIED" },
    { id: 16, ans: "D", density: 94, conf: 98.5, status: "VERIFIED" },
    { id: 17, ans: "A / B", density: 79, conf: 38.5, status: "AMBIGUOUS", isDouble: true },
    { id: 18, ans: "C", density: 97, conf: 99.3, status: "VERIFIED" },
  ]);
  
  // Tab 3: Descriptive Booklet Grading State
  const [activePage, setActivePage] = useState<number>(1);
  const [baseLayer, setBaseLayer] = useState<boolean>(true);
  const [aiOverlay, setAiOverlay] = useState<boolean>(true);
  const [rubricHighlights, setRubricHighlights] = useState<boolean>(true);
  
  const [rubrics, setRubrics] = useState([
    { id: "R1", label: "Core Hypothesis Formulation", score: 10, max: 10, checked: true },
    { id: "R2", label: "Mathematical Proof Completeness", score: 10, max: 10, checked: true },
    { id: "R3", label: "Error Boundary Bounds Analysis", score: 0, max: 10, checked: false, issue: "MISSING THESIS ARGUMENT" },
    { id: "R4", label: "Algorithmic Flow Schematic", score: 10, max: 10, checked: true }
  ]);
  
  const [gradeLocked, setGradeLocked] = useState<boolean>(false);
  const [evalLogAdded, setEvalLogAdded] = useState<boolean>(false);
  const [scorePenalty, setScorePenalty] = useState<number>(2.5);

  // Tab 4: Immutable Audit Trail Logs
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([
    { 
      id: 1, 
      type: "GEN_PAPERS", 
      label: "PAPER CRYPTO KEYRING GENERATION", 
      desc: "Generated paper sets (SET A, B, C) with cryptographic key wraps.",
      timestamp: "12:05:14", 
      actor: "SYSTEM // AUTH", 
      status: "SECURED", 
      prevHash: "0000000000000000",
      currHash: "7b4c8d9e2a10b4f8"
    },
    { 
      id: 2, 
      type: "KEY_LOCK", 
      label: "ON-CHAIN KEYLOCK REGISTERED", 
      desc: "Anchored time-locked decryption key contract to consensus layer.",
      timestamp: "12:08:22", 
      actor: "VAULT COMMAND", 
      status: "SECURED", 
      prevHash: "7b4c8d9e2a10b4f8",
      currHash: "f3c9e5b2a0c4f8d1"
    },
    { 
      id: 3, 
      type: "CENTER_VERIFY", 
      label: "CENTER IDENTITY HANDSHAKE", 
      desc: "ECDSA key signatures received from all 5 operational testing nodes.",
      timestamp: "12:12:45", 
      actor: "GATE KEEPER", 
      status: "SECURED", 
      prevHash: "f3c9e5b2a0c4f8d1",
      currHash: "a4b8c9d0e1f2a3b4"
    },
    { 
      id: 4, 
      type: "OMR_INGEST", 
      label: "OMR BUBBLE EXTRACTED", 
      desc: "Scanned bubble sheet input processed by OpenCV ingestion workbench.",
      timestamp: "12:15:30", 
      actor: "OFFICER-04", 
      status: "SECURED", 
      prevHash: "a4b8c9d0e1f2a3b4",
      currHash: "c5d6e7f8a9b0c1d2"
    },
    { 
      id: 5, 
      type: "AI_GRADE_LOCK", 
      label: "AI EVALUATION REGISTERED", 
      desc: "Anonymized grading results signature appended by Evaluator EV-09.",
      timestamp: "12:17:11", 
      actor: "EVAL PANEL", 
      status: "SECURED", 
      prevHash: "c5d6e7f8a9b0c1d2",
      currHash: "e3f4a5b6c7d8e9f0"
    }
  ]);

  // Timers and Keyboard Shortcuts
  useEffect(() => {
    // Latency fluctuation simulator
    const latencyInt = setInterval(() => {
      setSystemLatency(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next < 8 ? 8 : next > 25 ? 25 : next;
      });
    }, 3000);

    // Decryption countdown timer
    let countdownInt: NodeJS.Timeout;
    if (timerRunning) {
      countdownInt = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    // Keyboard Hotkeys Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["1", "2", "3", "4"].includes(e.key)) {
        setActiveTab(parseInt(e.key));
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(latencyInt);
      if (countdownInt) clearInterval(countdownInt);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [timerRunning]);

  // Timer format helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Tab 1: Generate Paper Encryption Set simulator
  const handleGeneratePapers = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    // Clear old papers
    setPapers(prev => prev.map(p => ({ ...p, progress: 0, status: "ENCRYPTING", hash: "GENERATING..." })));

    let currentPaperIdx = 0;
    const progressInterval = setInterval(() => {
      setPapers(prev => {
        const next = [...prev];
        const paper = next[currentPaperIdx];
        if (paper.progress < 100) {
          paper.progress += 20;
        } else {
          paper.status = "SECURED";
          paper.hash = Math.random().toString(16).substring(2, 10).toUpperCase() + 
                       Math.random().toString(16).substring(2, 10).toUpperCase() + 
                       Math.random().toString(16).substring(2, 10).toUpperCase() + 
                       "8A6E";
          
          if (currentPaperIdx < prev.length - 1) {
            currentPaperIdx++;
          } else {
            clearInterval(progressInterval);
            setIsGenerating(false);
          }
        }
        return next;
      });
    }, 250);
  };

  // Tab 1: Toggle Test Center nodes PENDING/VERIFIED
  const toggleCenterNode = (id: string) => {
    setCenterNodes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, status: n.status === "VERIFIED" ? "PENDING" : "VERIFIED" };
      }
      return n;
    }));
  };

  // Tab 2: Resolve ambiguous OMR Bubble
  const resolveOMRQuestion = (id: number, forcedAns: string) => {
    setOmrList(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          ans: forcedAns,
          conf: 99.8,
          density: 96,
          status: "RESOLVED"
        };
      }
      return q;
    }));
  };

  // Tab 3: Lock Descriptive booklet Grade
  const handleLockGrade = () => {
    if (gradeLocked) return;
    setGradeLocked(true);
    
    // Auto-update event list to include the signature locked record
    if (!evalLogAdded) {
      setEvalLogAdded(true);
      const newEvent: LedgerEvent = {
        id: 6,
        type: "GRADE_CHAIN_LOCK",
        label: "ECDSA SIGNATURE ATTACHED",
        desc: "Anonymized grading results signature appended by Evaluator EV-09 for Script #8891.",
        timestamp: new Date().toTimeString().split(" ")[0],
        actor: "SECURE LOG REGISTRY",
        status: "SECURED",
        prevHash: "e3f4a5b6c7d8e9f0",
        currHash: "7b4c8d9e2a10b4f8e3f4a5b6c7d8e9f0"
      };
      setLedgerEvents(prev => [...prev, newEvent]);
    }
  };

  // Tab 4: SQL Backdoor Mutation Injected
  const handleInjectMutation = () => {
    setSqlInjected(true);
    setIsTampered(true);
  };

  // Tab 4: Heal/Re-Sync Database
  const handleHealDatabase = () => {
    setSqlInjected(false);
    setIsTampered(false);
  };

  // Active difficulty ratios
  const diffEasy = Math.max(10, Math.floor((100 - difficulty) * 0.6));
  const diffMedium = 100 - difficulty - diffEasy;
  const diffHard = difficulty;

  return (
    <div className="w-screen h-screen bg-[#02040a] flex items-center justify-center overflow-hidden p-2">
      
      {/* 16:9 LOCKED CINEMATIC CONTAINER */}
      <div className="w-full aspect-[16/9] max-h-screen max-w-[177.78vh] bg-[#060913] text-slate-100 flex flex-col overflow-hidden relative border border-slate-800/60 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl select-none">
        
        {/* TAMPER / FRACTURED BREACH WATERMARK PANEL overlay */}
        {isTampered && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse z-40" />
        )}

        {/* 1. SECURE COMMAND HEADER */}
        <header className="h-[9.5%] border-b border-slate-800/40 bg-[#0c1122]/60 px-5 flex items-center justify-between shrink-0 z-30 relative backdrop-blur-md">
          {/* Brand/Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${isTampered ? "bg-rose-500/20" : "bg-emerald-500/20"}`}>
                <span className={`animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full ${isTampered ? "bg-rose-400" : "bg-emerald-400"} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isTampered ? "bg-rose-500" : "bg-emerald-500"}`}></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">NODE: CONSOLE_DESK_PRIMARY</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isTampered ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"}`}>
                  {isTampered ? "TAMPER DETECTED" : "CHAIN SECURE"}
                </span>
              </div>
              <h1 className="text-sm font-black text-white tracking-tight font-outfit uppercase mt-0.5 flex items-center gap-1.5">
                EXAMFORGE v0.2 <span className="text-slate-500 font-mono font-medium text-xs">// SYSTEM WAR ROOM CONSOLE</span>
              </h1>
            </div>
          </div>

          {/* Center: Live Telemetry ticker */}
          <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono">
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded border border-slate-800/30">
              <span className="text-slate-500 uppercase font-bold tracking-wider">LATENCY:</span>
              <span className={`font-bold transition-colors ${systemLatency > 18 ? "text-amber-400" : "text-emerald-400"}`}>{systemLatency}ms</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded border border-slate-800/30">
              <span className="text-slate-500 uppercase font-bold tracking-wider">LEDGER POOL:</span>
              <span className="font-bold text-white">5 NODES</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded border border-slate-800/30">
              <span className="text-slate-500 uppercase font-bold tracking-wider">VERDICT ENGINE:</span>
              <span className={`font-bold ${isTampered ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                {isTampered ? "FRACTURED" : "INTEGRITY ACTIVE"}
              </span>
            </div>
          </div>

          {/* Right: Escape hatch button */}
          <button 
            onClick={() => router.push("/authority")}
            className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Standard Console</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </header>

        {/* 2. SLEEK WORKSPACE SWITCHER */}
        <section className="h-[8%] bg-[#080d1a] px-4 flex items-center justify-between shrink-0 border-b border-slate-900 z-30">
          <div className="flex items-center gap-1.5 h-full py-1.5">
            
            <button
              onClick={() => setActiveTab(1)}
              className={`h-full px-4 rounded-lg flex items-center gap-2 transition duration-200 text-xs font-mono font-bold cursor-pointer relative ${
                activeTab === 1 
                  ? "bg-[#131a31] border border-blue-500/45 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>[1] EXAM CONTROLLER</span>
              {activeTab === 1 && <span className="absolute bottom-0 inset-x-4 h-0.5 bg-blue-500" />}
            </button>

            <button
              onClick={() => setActiveTab(2)}
              className={`h-full px-4 rounded-lg flex items-center gap-2 transition duration-200 text-xs font-mono font-bold cursor-pointer relative ${
                activeTab === 2 
                  ? "bg-[#131a31] border border-blue-500/45 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>[2] OMR PIPELINE</span>
              {omrList.some(q => q.status === "AMBIGUOUS") && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
              {activeTab === 2 && <span className="absolute bottom-0 inset-x-4 h-0.5 bg-blue-500" />}
            </button>

            <button
              onClick={() => setActiveTab(3)}
              className={`h-full px-4 rounded-lg flex items-center gap-2 transition duration-200 text-xs font-mono font-bold cursor-pointer relative ${
                activeTab === 3 
                  ? "bg-[#131a31] border border-blue-500/45 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 text-blue-400" />
              <span>[3] DESCRIPTIVE EVAL</span>
              {activeTab === 3 && <span className="absolute bottom-0 inset-x-4 h-0.5 bg-blue-500" />}
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className={`h-full px-4 rounded-lg flex items-center gap-2 transition duration-200 text-xs font-mono font-bold cursor-pointer relative ${
                activeTab === 4 
                  ? "bg-[#131a31] border border-blue-500/45 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>[4] INTEGRITY LEDGER</span>
              {isTampered && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse absolute -top-0.5 -right-0.5" />
              )}
              {activeTab === 4 && <span className="absolute bottom-0 inset-x-4 h-0.5 bg-blue-500" />}
            </button>

          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500">HOTKEYS: [1] - [4] ON KEYBOARD</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          </div>
        </section>

        {/* 3. MULTI-WORKSPACE MAIN SCREEN VIEWPORT */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* TAB 1: THE CENTRAL EXAM CONTROLLER DECK */}
          {activeTab === 1 && (
            <div className="w-full h-full p-4 grid grid-cols-3 gap-4 bg-cyber-grid">
              
              {/* Left Column: Blueprint Engine */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">BLUEPRINT CONFIG ENGINE</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">ACTIVE</span>
                  </div>
                  
                  {/* Subject weight indicators */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs font-mono mb-1">
                        <span className="text-slate-400">MATHS WEIGHT</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setMathWeight(prev => Math.max(10, prev - 5))} className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[10px] rounded cursor-pointer">-</button>
                          <span className="font-bold text-white w-8 text-center">{mathWeight}%</span>
                          <button onClick={() => setMathWeight(prev => Math.min(60, prev + 5))} className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[10px] rounded cursor-pointer">+</button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${mathWeight}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-mono mb-1">
                        <span className="text-slate-400">PHYSICS WEIGHT</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPhysWeight(prev => Math.max(10, prev - 5))} className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[10px] rounded cursor-pointer">-</button>
                          <span className="font-bold text-white w-8 text-center">{physWeight}%</span>
                          <button onClick={() => setPhysWeight(prev => Math.min(60, prev + 5))} className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[10px] rounded cursor-pointer">+</button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: `${physWeight}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-mono mb-1">
                        <span className="text-slate-400">CHEMISTRY WEIGHT</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setChemWeight(prev => Math.max(10, prev - 5))} className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[10px] rounded cursor-pointer">-</button>
                          <span className="font-bold text-white w-8 text-center">{chemWeight}%</span>
                          <button onClick={() => setChemWeight(prev => Math.min(60, prev + 5))} className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[10px] rounded cursor-pointer">+</button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all duration-200" style={{ width: `${chemWeight}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Difficulty controls */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center text-xs font-mono mb-2">
                      <span className="text-slate-400">DIFFICULTY INDEX:</span>
                      <span className="font-bold text-amber-400">{difficulty}% HARD MODE</span>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="90" 
                      value={difficulty}
                      onChange={(e) => setDifficulty(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4"
                    />
                    
                    {/* Ratio meters */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                      <div className="bg-slate-950/60 p-2 border border-slate-900 rounded">
                        <span className="text-slate-500 block">EASY</span>
                        <span className="text-emerald-450 font-bold block mt-1">{diffEasy}%</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 border border-slate-900 rounded">
                        <span className="text-slate-500 block">MEDIUM</span>
                        <span className="text-blue-450 font-bold block mt-1">{diffMedium}%</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 border border-slate-900 rounded">
                        <span className="text-slate-500 block">HARD</span>
                        <span className="text-rose-450 font-bold block mt-1">{diffHard}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Negative marking limits */}
                <div className="border-t border-slate-800/40 pt-3">
                  <span className="text-[10px] font-bold font-mono text-slate-500 block mb-2">NEGATIVE MARKING THRESHOLD</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                    {["0.00", "-0.25", "-0.50"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPenaltyMode(mode)}
                        className={`py-1.5 border rounded cursor-pointer transition text-center font-bold ${
                          penaltyMode === mode
                            ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                            : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350"
                        }`}
                      >
                        {mode === "0.00" ? "NONE" : `${mode}M`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Column: Generation Cockpit */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">DYNAMIC ENCRYPTION COCKPIT</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/25">AES-256</span>
                  </div>

                  <button
                    onClick={handleGeneratePapers}
                    disabled={isGenerating}
                    className="w-full py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-900/40 disabled:to-indigo-900/40 text-white rounded-xl text-xs font-bold font-mono tracking-widest uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 active:scale-98"
                  >
                    <Key className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                    <span>Generate Cryptographic Paper Set</span>
                  </button>

                  {/* Generated Paper Cards */}
                  <div className="mt-5.5 space-y-3">
                    {papers.map((paper) => (
                      <div 
                        key={paper.id}
                        className="bg-slate-950/60 p-3.5 border border-slate-900 rounded-xl flex flex-col gap-2 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white font-mono">{paper.name}</span>
                          
                          {paper.status === "IDLE" && (
                            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">IDLE</span>
                          )}
                          {paper.status === "ENCRYPTING" && (
                            <span className="text-[9px] text-amber-400 font-mono font-bold uppercase animate-pulse">ENCRYPTING...</span>
                          )}
                          {paper.status === "SECURED" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)] flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>AES-256-GCM LOCKED</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Bar / Hash output */}
                        {paper.status === "ENCRYPTING" ? (
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 animate-pulse" style={{ width: `${paper.progress}%` }} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-[#080c16] px-2 py-1.5 rounded border border-slate-900">
                            <span className="text-[9px] text-slate-500 font-mono font-bold">SHA-256:</span>
                            <span className="text-[10px] text-blue-450 font-mono font-bold tracking-wider">{paper.hash}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/40 p-2.5 border border-slate-900 rounded-lg text-[9px] font-mono text-slate-450 leading-relaxed">
                  * Dynamic generation triggers distributed node key shards. Verification triggers upon all test center nodes handshake matching.
                </div>
              </div>

              {/* Right Column: Time-Lock Release Node */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">TIME-LOCK RELEASE KEY</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">TIME-LOCKED</span>
                  </div>

                  {/* Countdown Timer */}
                  <div className="text-center py-4 bg-slate-950/60 border border-slate-900 rounded-2xl mb-4 relative overflow-hidden">
                    <div className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase mb-1">DECRYPTION UNLOCK TIMEOUT</div>
                    <div className="text-4xl font-black text-amber-400 font-mono tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.06)]">
                      {formatTime(timeLeft)}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex justify-center gap-3 mt-3">
                      <button 
                        onClick={() => setTimerRunning(!timerRunning)}
                        className="p-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white rounded cursor-pointer transition"
                      >
                        {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                      <button 
                        onClick={() => setTimeLeft(294)}
                        className="p-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white rounded cursor-pointer transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Test Center Validation node list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 font-mono block">NODE ENVELOPE CONSENSUS CHECKS</span>
                    
                    <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                      {centerNodes.map((node) => (
                        <div 
                          key={node.id}
                          onClick={() => toggleCenterNode(node.id)}
                          className="bg-slate-950/40 px-3 py-2 border border-slate-900 rounded-lg flex items-center justify-between cursor-pointer hover:border-slate-800 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold text-slate-500">{node.id}</span>
                            <span className="text-[11px] font-medium text-slate-200">{node.name}</span>
                          </div>
                          
                          {node.status === "VERIFIED" ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold uppercase shadow-[0_0_10px_rgba(16,185,129,0.08)]">VERIFIED</span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold uppercase animate-pulse">PENDING</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Consensus status badge */}
                <div className="border-t border-slate-850 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">CONSENSUS VERIFICATION</span>
                  {centerNodes.every(n => n.status === "VERIFIED") ? (
                    <span className="text-[9px] font-mono font-black text-emerald-450 uppercase animate-pulse">ALL SETS VALIDATED</span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-amber-450 uppercase">4/5 NODES SIGNED</span>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: THE OpenCV OMR INGESTION WORKBENCH */}
          {activeTab === 2 && (
            <div className="w-full h-full p-4 grid grid-cols-2 gap-4 bg-cyber-grid">
              
              {/* Left Panel: Image Calibration View */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5 shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">OPENCV OMR IMAGE CALIBRATION</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">OPENCV LATEST</span>
                  </div>

                  {/* Calibration Canvas */}
                  <div className="flex-1 bg-slate-950/80 border border-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center terminal-scanline">
                    
                    {/* Targeting Crosshairs at corners */}
                    <div className="absolute top-3 left-3 text-red-500 font-mono text-xs font-bold leading-none">[+] CAL_TL</div>
                    <div className="absolute top-3 right-3 text-red-500 font-mono text-xs font-bold leading-none">CAL_TR [+]</div>
                    <div className="absolute bottom-3 left-3 text-red-500 font-mono text-xs font-bold leading-none">[+] CAL_BL</div>
                    <div className="absolute bottom-3 right-3 text-red-500 font-mono text-xs font-bold leading-none">CAL_BR [+]</div>
                    
                    {/* Centered grid and graphic bubbles sheet */}
                    <div className="w-[85%] h-[80%] border border-slate-850 p-4 flex flex-col justify-between relative bg-[#070b14]/50 rounded">
                      
                      {/* Sweep scan line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_#3b82f6] animate-pulse" style={{
                        animation: "scanline 4s linear infinite",
                        top: "30%"
                      }} />

                      {/* Header metrics on sheets */}
                      <div className="flex justify-between border-b border-slate-900 pb-2 text-[9px] font-mono text-slate-500">
                        <span>TEMPLATE: OMR_STANDARD_X8</span>
                        <span>UID: #OMR-489C</span>
                      </div>

                      {/* Bubbles visualization */}
                      <div className="flex-1 flex flex-col justify-center gap-3 py-3">
                        {[11, 12, 13, 14, 15, 16, 17, 18].map((qNum, idx) => {
                          const omrMatch = omrList.find(q => q.id === qNum);
                          return (
                            <div key={qNum} className="flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-500 w-8">Q{qNum}:</span>
                              <div className="flex-1 flex justify-around px-8 max-w-[280px]">
                                {["A", "B", "C", "D"].map((opt) => {
                                  const isSelected = omrMatch?.ans.includes(opt);
                                  const isAmbiguous = omrMatch?.status === "AMBIGUOUS";
                                  return (
                                    <div 
                                      key={opt}
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all ${
                                        isSelected
                                          ? isAmbiguous
                                            ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                                            : "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                          : "border-slate-800 bg-slate-950 text-slate-650"
                                      }`}
                                    >
                                      {opt}
                                    </div>
                                  );
                                })}
                              </div>
                              <span className={`text-[9px] w-16 text-right font-bold ${omrMatch?.status === "AMBIGUOUS" ? "text-rose-400 animate-pulse" : "text-emerald-450"}`}>
                                {omrMatch?.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Ingestion pipeline & warnings */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden">
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5 shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">DENSITY EXTRACTION PIPELINE</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">MOCK SCANNER</span>
                  </div>

                  {/* Active choices & metrics table */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    <div className="grid grid-cols-12 text-[9px] font-bold tracking-wider text-slate-500 font-mono px-2 py-1 border-b border-slate-900 shrink-0">
                      <div className="col-span-2">QN</div>
                      <div className="col-span-2 text-center">ANS</div>
                      <div className="col-span-5">FILL DENSITY</div>
                      <div className="col-span-3 text-right">CONFIDENCE</div>
                    </div>

                    <div className="space-y-1">
                      {omrList.map((q) => (
                        <div 
                          key={q.id}
                          className={`grid grid-cols-12 items-center text-xs font-mono px-2 py-1.5 rounded border ${
                            q.status === "AMBIGUOUS" 
                              ? "bg-rose-500/5 border-rose-500/20 text-rose-350" 
                              : q.status === "RESOLVED"
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-350"
                                : "bg-slate-950/40 border-slate-900 text-slate-300"
                          }`}
                        >
                          <div className="col-span-2 font-bold text-slate-400">Q{q.id}</div>
                          <div className={`col-span-2 text-center font-bold ${q.status === "AMBIGUOUS" ? "text-rose-400" : "text-white"}`}>{q.ans}</div>
                          
                          <div className="col-span-5 pr-4">
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${q.status === "AMBIGUOUS" ? "bg-rose-500" : "bg-blue-500"}`} 
                                style={{ width: `${q.density}%` }} 
                              />
                            </div>
                          </div>
                          
                          <div className={`col-span-3 text-right font-bold ${q.status === "AMBIGUOUS" ? "text-rose-400" : "text-slate-450"}`}>
                            {q.conf}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ambiguous questions review overlay panel */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/40 shrink-0">
                    <span className="text-[10px] font-bold font-mono text-slate-500 block mb-2">AMBIGUOUS DOUBLE-MARK HUMAN OVERRIDES</span>
                    
                    <div className="space-y-2">
                      {omrList.filter(q => q.status === "AMBIGUOUS").length === 0 ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/25 p-3 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>ALL QUESTIONS CALIBRATED AND RESOLVED. NO DISCREPANCIES OUTSTANDING.</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[125px] overflow-y-auto pr-1">
                          {omrList.filter(q => q.status === "AMBIGUOUS").map(q => (
                            <div 
                              key={q.id}
                              className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs font-mono"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                                <div>
                                  <span className="font-bold text-white block">Q{q.id} Ambiguous Mark</span>
                                  <span className="text-[9px] text-rose-300 block mt-0.5">Found high fills in multiple circles.</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-1.5">
                                {q.id === 14 ? (
                                  <>
                                    <button 
                                      onClick={() => resolveOMRQuestion(14, "C")}
                                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Force C
                                    </button>
                                    <button 
                                      onClick={() => resolveOMRQuestion(14, "D")}
                                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Force D
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => resolveOMRQuestion(17, "A")}
                                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Force A
                                    </button>
                                    <button 
                                      onClick={() => resolveOMRQuestion(17, "B")}
                                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Force B
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => resolveOMRQuestion(q.id, "VOID")}
                                  className="px-2 py-1 bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-red-400 rounded text-[10px] font-bold cursor-pointer transition"
                                >
                                  Invalidate
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 3: THE GRADED DESCRIPTIVE BOOKLET FEED (AI-Assistant View) */}
          {activeTab === 3 && (
            <div className="w-full h-full p-4 grid grid-cols-2 gap-4 bg-cyber-grid">
              
              {/* Left Panel: Anonymized Script Hub */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden">
                <div className="h-full flex flex-col overflow-hidden">
                  
                  {/* Header page details */}
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5 shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">ANONYMIZED CANDIDATE BOOKLET (#ANON-8891)</span>
                    
                    {/* Layer selection controls */}
                    <div className="flex gap-2 text-[9px] font-mono font-bold">
                      <button 
                        onClick={() => setBaseLayer(!baseLayer)}
                        className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${baseLayer ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-slate-900 border-slate-850 text-slate-500"}`}
                      >
                        BASE
                      </button>
                      <button 
                        onClick={() => setAiOverlay(!aiOverlay)}
                        className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${aiOverlay ? "bg-violet-500/10 border-violet-500 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]" : "bg-slate-900 border-slate-850 text-slate-500"}`}
                      >
                        AI MARK
                      </button>
                      <button 
                        onClick={() => setRubricHighlights(!rubricHighlights)}
                        className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${rubricHighlights ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-slate-900 border-slate-850 text-slate-500"}`}
                      >
                        RUBRICS
                      </button>
                    </div>
                  </div>

                  {/* Booklet image viewer */}
                  <div className="flex-1 bg-slate-950/80 border border-slate-900 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
                    
                    {/* Unique page immutable hash pin */}
                    <div className="absolute top-2 left-2 text-[8px] bg-slate-900 px-1.5 py-0.5 border border-slate-850 text-slate-500 font-mono rounded">
                      PAGE HASH: 8A4C2E09B4F817A38D4F...
                    </div>

                    {/* Image visual layers */}
                    <div className="flex-1 flex flex-col justify-center items-center relative py-6">
                      
                      {baseLayer && (
                        <div className="w-[85%] bg-slate-900/30 border border-slate-850 rounded p-4 font-mono text-[10px] text-slate-350 space-y-3 shadow-md">
                          <div className="border-b border-slate-900 pb-1 font-bold text-slate-400 uppercase text-[9px] flex justify-between">
                            <span>SUBJECT: THEORETICAL COMPUTER SCIENCE</span>
                            <span>PAGE: {activePage} / 3</span>
                          </div>
                          
                          {activePage === 1 && (
                            <div className="space-y-2.5">
                              <p className="italic text-slate-200">"Let L be a language recognizable by a Turing Machine M. We define the configuration sequence C_1, C_2, ... C_k to be a valid trace of computations..."</p>
                              <div className="h-0.5 w-full bg-slate-900 my-2" />
                              <p className="italic text-slate-200">"By applying Rice's Theorem, any non-trivial semantic property of the partial function calculated by M is undecidable. Therefore, verification bounds must be established via zero-knowledge interactive proofs..."</p>
                            </div>
                          )}

                          {activePage === 2 && (
                            <div className="space-y-2.5">
                              <p className="italic text-slate-200">"We prove the error bounds by setting delta as the completeness parameter. Given the witness string w, the verifier checks if the polynomial equation holds modulo q..."</p>
                              <div className="p-2.5 bg-slate-950 border border-slate-900 text-center font-bold text-slate-400 rounded">
                                V(x) = C(x) * H(x) + E(x)
                              </div>
                              <p className="italic text-slate-500 border-l-2 border-red-500 pl-2 text-[9px] bg-red-950/5 p-1 rounded">
                                [AI Alert: Missing margin definition for E(x) completeness bounds here]
                              </p>
                            </div>
                          )}

                          {activePage === 3 && (
                            <div className="space-y-2.5">
                              <p className="italic text-slate-200">"Consequently, the security parameter lambda holds for all adversary algorithms running in polynomial time. Hence, the transaction integrity remains intact."</p>
                              <div className="border border-slate-850 p-2 rounded bg-slate-950/40 text-[8px] text-slate-500">
                                SIGNATURE_CHAIN: e8a4f9b2d01e...
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Highlighter marks */}
                      {aiOverlay && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          {activePage === 2 && (
                            <div className="border border-rose-500/40 bg-rose-500/5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-rose-400 font-bold max-w-[200px] shadow-lg absolute right-16 top-24 animate-pulse">
                              ▲ CRITICAL GAP: NO ERROR MARGIN SPECIFIED FOR CO-DOMAIN TRANSIT
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rubric highlight box */}
                      {rubricHighlights && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-14 bottom-14 border border-emerald-500/40 bg-emerald-500/5 px-2 py-1 rounded text-[8px] font-mono text-emerald-400 font-bold">
                            ✔ Checked against Rubric #R1 // #R2
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Page Switcher Row */}
                    <div className="flex justify-center gap-1.5 shrink-0">
                      {[1, 2, 3].map((pNum) => (
                        <button
                          key={pNum}
                          onClick={() => setActivePage(pNum)}
                          className={`w-7 h-7 rounded border font-mono text-[11px] font-bold cursor-pointer transition ${
                            activePage === pNum
                              ? "bg-blue-500/10 border-blue-500 text-blue-400"
                              : "bg-slate-900 border-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {pNum}
                        </button>
                      ))}
                    </div>

                  </div>
                </div>
              </div>

              {/* Right Panel: AI Analytics Checklist */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden">
                <div className="h-full flex flex-col overflow-hidden justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5 shrink-0">
                      <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">GEMINI AI ASSISTANT EVALUATOR</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-violet-500/15 text-violet-400 border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.1)] animate-pulse">
                        GEMINI 1.5 FLASH
                      </span>
                    </div>

                    {/* Rubric verification checklist */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold font-mono text-slate-500 block uppercase">RUBRICS EVALUATION CHECKLIST</span>
                      <div className="space-y-1.5">
                        {rubrics.map((r) => (
                          <div 
                            key={r.id}
                            className={`px-3 py-2 border rounded-xl flex items-center justify-between text-xs font-mono transition ${
                              r.issue 
                                ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                                : "bg-slate-950/40 border-slate-900 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {r.issue ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                              )}
                              <span>{r.label}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {r.issue ? (
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/15 rounded text-amber-400 font-bold uppercase">{r.issue}</span>
                              ) : (
                                <span className="font-bold text-white">{r.score}/{r.max}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Glowing AI suggestion box */}
                    <div className="mt-4 bg-violet-500/5 border border-violet-500/15 p-3.5 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.04)] font-mono text-xs relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                        <span className="text-[10px] font-bold text-violet-400 tracking-wider">GEMINI RESPONSE PACKET</span>
                      </div>
                      
                      <p className="text-slate-300 leading-normal text-[11px]">
                        "The candidate failed to describe the completeness error margin parameter for the Witness equation on Page 2. A penalty of <span className="text-amber-400 font-bold">{scorePenalty} marks</span> is suggested based on the evaluation schema. Proposed total score: <span className="text-white font-bold">30 / 40</span>."
                      </p>

                      {/* Interactive adjust penalty button */}
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => setScorePenalty(1.0)} 
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${scorePenalty === 1.0 ? "bg-violet-600 border border-violet-500 text-white" : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200"}`}
                        >
                          Set -1.0
                        </button>
                        <button 
                          onClick={() => setScorePenalty(2.5)} 
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${scorePenalty === 2.5 ? "bg-violet-600 border border-violet-500 text-white shadow-[0_0_8px_rgba(139,92,246,0.2)]" : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200"}`}
                        >
                          Set -2.5 (Rec)
                        </button>
                        <button 
                          onClick={() => setScorePenalty(0.0)} 
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${scorePenalty === 0.0 ? "bg-violet-600 border border-violet-500 text-white" : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200"}`}
                        >
                          Waive Penalty
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lock Signature to Ledger button */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/40 shrink-0">
                    <button
                      onClick={handleLockGrade}
                      disabled={gradeLocked}
                      className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                        gradeLocked
                          ? "bg-slate-900 border border-slate-850 text-slate-500"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/10 active:scale-98"
                      }`}
                    >
                      {gradeLocked ? (
                        <>
                          <Lock className="w-4 h-4 text-slate-550" />
                          <span>ECDSA GRADE SECURED ON-CHAIN // LOCKED</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4 text-emerald-350" />
                          <span>Lock Signature to Ledger</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: THE IMMUTABLE AUDIT TIMELINE & TAMPER SIMULATOR */}
          {activeTab === 4 && (
            <div className="w-full h-full p-4 grid grid-cols-2 gap-4 bg-cyber-grid relative">
              
              {/* Left Pane: Append-Only Ledger Trail */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden relative">
                
                {/* TAMPER BANNER OVERLAY inside list */}
                {isTampered && (
                  <div className="absolute inset-0 bg-red-950/15 border border-red-500/30 backdrop-blur-sm z-30 p-5 flex flex-col justify-between animate-in fade-in duration-300">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 text-rose-500">
                        <Skull className="w-8 h-8 text-rose-500 animate-bounce" />
                        <div>
                          <h3 className="text-sm font-black font-mono tracking-wider uppercase text-white">CRITICAL INTEGRITY BREACH FLAG</h3>
                          <span className="text-[10px] font-mono text-rose-400 block font-bold">SEQ_CODE: #ERR-LEDGER-HASH-MISMATCH</span>
                        </div>
                      </div>
                      
                      <div className="bg-slate-950/90 border border-red-900/40 p-4 rounded-xl space-y-2.5 font-mono text-[10px] text-rose-300">
                        <p className="text-white font-bold border-b border-red-950/50 pb-1.5">TAMPER TELEMETRY ANOMALY DETECTED:</p>
                        <div>
                          <span className="text-slate-500 font-bold block">MUTATION:</span>
                          <span className="text-rose-400 font-bold break-all font-mono">{sqlQuery}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <span className="text-slate-500 block">EXPECTED PREV HASH:</span>
                            <span className="text-slate-300 block">c5d6e7f8a9b0c1d2</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">ACTUAL PREV HASH:</span>
                            <span className="text-rose-400 font-bold block">FRACTURED_00x00A</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleHealDatabase}
                      className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold tracking-widest uppercase shadow-md shadow-red-500/20 transition cursor-pointer active:scale-98"
                    >
                      Activate System Re-Sync & Heal Chain
                    </button>
                  </div>
                )}

                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5 shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">APPEND-ONLY SECURE LEDGER TRACK</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">HASH-CHAINED</span>
                  </div>

                  {/* Vertical sequence with laser tracking lines */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 pl-3 relative">
                    
                    {/* Visual Laser Line connector track */}
                    <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-emerald-500/30 z-0" />
                    
                    <div className="space-y-4 z-10 relative">
                      {ledgerEvents.map((evt) => (
                        <div key={evt.id} className="flex gap-3.5 relative">
                          
                          {/* Anchor Node Dot indicator */}
                          <div className="w-5.5 h-5.5 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center shrink-0 z-10 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <Check className="w-3.5 h-3.5 text-emerald-450 font-bold" />
                          </div>

                          {/* Event info card */}
                          <div className="flex-1 bg-slate-950/60 p-3 border border-slate-900 rounded-xl space-y-1.5 text-[10px] font-mono">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white text-xs">{evt.label}</span>
                              <span className="text-[8px] text-slate-500">{evt.timestamp} // {evt.actor}</span>
                            </div>
                            <p className="text-slate-450 leading-relaxed">{evt.desc}</p>
                            
                            {/* Hash chain telemetry */}
                            <div className="grid grid-cols-2 gap-2 text-[8px] border-t border-slate-900/60 pt-1.5 text-slate-500">
                              <span>PREV: {evt.prevHash}</span>
                              <span className="text-right">CURR: {evt.currHash}</span>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: SQL Backdoor Sandbox */}
              <div className="bg-[#0F1424]/60 border border-slate-800/40 rounded-xl p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden">
                <div className="h-full flex flex-col justify-between overflow-hidden">
                  
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-3.5 shrink-0">
                      <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">SQL BACKDOOR INJECTION SANDBOX</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">MUTATION MODULE</span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest block">CHOOSE MALICIOUS PAYLOAD</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSqlQuery("UPDATE grades SET total_score = 98 WHERE candidate_id = 'ANON-8891';")}
                            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded text-[9px] font-mono font-bold text-slate-300 text-left transition cursor-pointer"
                          >
                            Query #1: Mutate Grade Score
                          </button>
                          <button
                            onClick={() => setSqlQuery("UPDATE nodes SET verification = 'BYPASSED' WHERE center_id = 'KOL_05';")}
                            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded text-[9px] font-mono font-bold text-slate-300 text-left transition cursor-pointer"
                          >
                            Query #2: Bypass Node Identity
                          </button>
                        </div>
                      </div>

                      {/* SQL Code Input text area */}
                      <div>
                        <span className="text-[10px] font-bold font-mono text-slate-500 block mb-1.5">MUTABLE SQL QUERY DATA</span>
                        <textarea
                          rows={4}
                          value={sqlQuery}
                          onChange={(e) => setSqlQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-red-500/50 rounded-xl p-3 text-xs font-mono text-rose-350 focus:outline-none resize-none leading-relaxed"
                          placeholder="INPUT MALICIOUS DATA MUTATION QUERY STATEMENT..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inject button */}
                  <div className="pt-3.5 border-t border-slate-800/40 shrink-0">
                    <button
                      onClick={handleInjectMutation}
                      className="w-full py-4.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-mono font-bold tracking-widest uppercase shadow-md shadow-rose-500/15 transition cursor-pointer active:scale-98"
                    >
                      Inject Malicious SQL Mutation // Bypass Firewall
                    </button>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
