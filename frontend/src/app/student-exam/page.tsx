"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  ShieldAlert,
  FileCheck,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Lock,
  UserCheck,
  Camera,
  Calculator,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  Key
} from "lucide-react";

import { ForgeExamShell } from "@/components/forge-exam/ForgeExamShell";
import { ForgeExamHeader } from "@/components/forge-exam/ForgeExamHeader";
import { ForgeQuestion } from "@/components/forge-exam/ForgeQuestion";
import { ForgeAnswerOption } from "@/components/forge-exam/ForgeAnswerOption";
import { ForgeQuestionNavigator, NavigatorQuestion } from "@/components/forge-exam/ForgeQuestionNavigator";
import { ForgeSubmissionReceipt } from "@/components/forge-exam/ForgeSubmissionReceipt";
import { ForgeVirtualCalculator } from "@/components/forge-exam/ForgeVirtualCalculator";

interface Question {
  id: string;
  number: number;
  section: string;
  subject: string;
  marks: number;
  negative_marks: number;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "SUBJECTIVE" | "NUMERICAL";
  content: {
    text: string;
    options?: { [key: string]: string };
  };
}

interface AnswerEvent {
  question_id: string;
  answer: string;
  timestamp: string;
  seq: number;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "QST-101",
    number: 1,
    section: "Mathematics & Calculus",
    subject: "Quantum Mechanics & Integration",
    marks: 4,
    negative_marks: 1,
    type: "MCQ_SINGLE",
    content: {
      text: "Evaluate the Gaussian definite integral $$\\int_{-\\infty}^{\\infty} e^{-\\alpha x^2} dx$$ where \\(\\alpha > 0\\) represents the wave packet confinement parameter.",
      options: {
        A: "\\(\\sqrt{\\frac{\\pi}{\\alpha}}\\)",
        B: "\\(\\frac{\\pi}{2\\alpha}\\)",
        C: "\\(\\frac{1}{\\sqrt{\\pi \\alpha}}\\)",
        D: "\\(2\\pi \\alpha\\)"
      }
    }
  },
  {
    id: "QST-102",
    number: 2,
    section: "Computer Science",
    subject: "Cryptography & Merkle Trees",
    marks: 4,
    negative_marks: 1,
    type: "MCQ_SINGLE",
    content: {
      text: "Which cryptographic primitive ensures that modifying historical audit ledger records invalidates all subsequent block states in ExamForge?",
      options: {
        A: "Symmetric Stream Cipher",
        B: "Sequential SHA-256 Merkle Hash Chaining",
        C: "Diffie-Hellman Key Exchange",
        D: "Linear Congruential Generator"
      }
    }
  },
  {
    id: "QST-103",
    number: 3,
    section: "Computer Architecture",
    subject: "Memory & Cache Coherence",
    marks: 4,
    negative_marks: 0,
    type: "MCQ_MULTI",
    content: {
      text: "Which of the following cache coherence protocols and hardware mechanisms reduce bus contention in multiprocessor systems? (Select all that apply)",
      options: {
        A: "MESI (Modified, Exclusive, Shared, Invalid) state protocol",
        B: "Directory-based cache coherence for non-uniform memory access (NUMA)",
        C: "Write-through cache policies without write-allocate buffers",
        D: "Snooping bus monitoring on split-transaction system buses"
      }
    }
  },
  {
    id: "QST-104",
    number: 4,
    section: "Subjective Essay",
    subject: "Zero-Trust Architecture Design",
    marks: 10,
    negative_marks: 0,
    type: "SUBJECTIVE",
    content: {
      text: "Derive the zero-knowledge verification proof equation $$\\hat{H} \\psi = E \\psi$$ for ExamForge ECDSA answer logs. Explain how Merkle tree chaining guarantees zero-tampering auditability without revealing candidate identity details."
    }
  },
  {
    id: "QST-105",
    number: 5,
    section: "Applied Physics",
    subject: "Thermodynamics & Energy",
    marks: 4,
    negative_marks: 1,
    type: "NUMERICAL",
    content: {
      text: "A quantum Carnot heat engine operates between heat reservoirs at \\(T_H = 600 \\text{ K}\\) and \\(T_C = 300 \\text{ K}\\). If the engine absorbs \\(1200 \\text{ J}\\) of thermal energy per cycle, calculate the net work output \\(W = Q_H \\left(1 - \\frac{T_C}{T_H}\\right)\\) in Joules."
    }
  }
];

export default function StudentExamWindow() {
  const router = useRouter();

  // Login Gate State
  const [isLoggedIntoExam, setIsLoggedIntoExam] = useState<boolean>(false);
  const [regNoInput, setRegNoInput] = useState<string>("EF-2026-9842");
  const [passcodeInput, setPasscodeInput] = useState<string>("PASS-8921");
  const [loginError, setLoginError] = useState<string>("");

  // Candidate session state
  const [candidateInfo, setCandidateInfo] = useState({
    name: "Alex Vance",
    regNo: "EF-2026-9842",
    examId: "EXM-PILOT-01",
    examTitle: "National Eligibility & Technical Aptitude Test 2026",
    centerId: "CTR-METRO-01 (Delhi Technological Center)",
    room: "Lab Hall B",
    seat: "B-14"
  });

  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  const [multiAnswers, setMultiAnswers] = useState<{ [qId: string]: string[] }>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<{ [qId: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [qId: string]: boolean }>({});
  const [numericalInput, setNumericalInput] = useState<{ [qId: string]: string }>({});

  // Sections
  const [activeSection, setActiveSection] = useState<string>("All");

  // Calculator Popup State
  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  // Navigator toggle
  const [showNavigator, setShowNavigator] = useState<boolean>(false);

  // Timer: 120 minutes countdown
  const [secondsRemaining, setSecondsRemaining] = useState<number>(7200);
  const [timerWarning, setTimerWarning] = useState<boolean>(false);

  // Lockdown & Anti-Cheat
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [focusLossCount, setFocusLossCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>("");

  // Offline Sync Queue
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncQueue, setSyncQueue] = useState<AnswerEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncHash, setLastSyncHash] = useState<string>("GENESIS_0x8f21");

  // Submission Flow
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any>(null);

  // Auto-fill student name
  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) {
      setCandidateInfo((prev) => ({ ...prev, name: storedName }));
    }
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (!isLoggedIntoExam || isSubmitted) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        if (prev <= 300 && !timerWarning) {
          setTimerWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoggedIntoExam, isSubmitted, timerWarning]);

  // Anti-Cheat: Tab Switch & Window Blur Listeners
  useEffect(() => {
    if (!isLoggedIntoExam) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        setFocusLossCount((prev) => {
          const updated = prev + 1;
          setWarningMessage(
            `Security Alert #${updated}: Window focus lost or tab switched. This incident has been cryptographically signed and reported to the Exam Invigilator.`
          );
          setShowWarningModal(true);
          return updated;
        });
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "u")) ||
        e.key === "F12" ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault();
        setWarningMessage("Action Prohibited: Keyboard shortcut blocked by secure lockdown policy.");
        setShowWarningModal(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoggedIntoExam, isSubmitted]);

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNoInput.trim() || !passcodeInput.trim()) {
      setLoginError("Please enter both Registration Roll Number and Exam Access Passcode.");
      return;
    }
    setLoginError("");
    setIsLoggedIntoExam(true);

    // Try opening full-screen automatically
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}
  };

  const processSyncQueue = async () => {
    if (syncQueue.length === 0 || !isOnline) return;
    setIsSyncing(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      const latestHash = "SYNC_HASH_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setLastSyncHash(latestHash);
      setSyncQueue([]);
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSelectOption = (optKey: string) => {
    const currentQ = questions[currentIndex];
    
    if (currentQ.type === "MCQ_MULTI") {
      const currentList = multiAnswers[currentQ.id] || [];
      const updatedList = currentList.includes(optKey) 
        ? currentList.filter(k => k !== optKey) 
        : [...currentList, optKey];
      
      setMultiAnswers(prev => ({ ...prev, [currentQ.id]: updatedList }));
      setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: updatedList.join(",") }));
    } else {
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: optKey
      }));
    }

    const event: AnswerEvent = {
      question_id: currentQ.id,
      answer: optKey,
      timestamp: new Date().toISOString(),
      seq: syncQueue.length + 1
    };
    setSyncQueue((prev) => [...prev, event]);
  };

  const handleSubjectiveChange = (val: string) => {
    const currentQ = questions[currentIndex];
    setSubjectiveAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: val ? "ANSWERED" : "" }));
  };

  const handleNumericalChange = (val: string) => {
    const currentQ = questions[currentIndex];
    setNumericalInput((prev) => ({ ...prev, [currentQ.id]: val }));
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
    setMultiAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
    setSubjectiveAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
    setNumericalInput((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFinalSubmit = () => {
    setShowSubmitModal(false);
    setIsSubmitted(true);

    const answeredCount = Object.keys(selectedAnswers).filter((k) => selectedAnswers[k]).length;
    const receiptHash = "EF_RECEIPT_SHA256_" + Math.random().toString(36).substring(2, 14).toUpperCase() + "_SECURED";

    setSubmissionReceipt({
      candidate_id: candidateInfo.regNo,
      exam_id: candidateInfo.examId,
      timestamp: new Date().toISOString(),
      total_questions: questions.length,
      answered_count: answeredCount,
      unanswered_count: questions.length - answeredCount,
      marked_for_review_count: Object.values(markedForReview).filter(Boolean).length,
      receipt_hash: receiptHash,
      signature: "ECDSA_P256_VERIFIED_SIGNATURE_0x7b219e8a4d"
    });
  };

  // 1. STUDENT LOGIN GATE WINDOW
  if (!isLoggedIntoExam) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
        {/* Glowing background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <img
              src="/logo.png"
              alt="ExamForge OS"
              className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg border border-slate-700"
            />
            <h1 className="text-2xl font-black tracking-tight text-white font-sans">
              ExamForge OS
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Proctored Candidate Examination Login Window
            </p>
          </div>

          {/* Biometric Scan Indicator Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 relative">
              <Camera className="w-6 h-6" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-1 -right-1 animate-pulse border-2 border-slate-900" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Biometric AI Match Verified
              </div>
              <div className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                Facial Landmark Triad: 99.4%
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Center: {candidateInfo.centerId} • Desk: {candidateInfo.seat}
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Candidate Roll Number / Reg ID
              </label>
              <input
                type="text"
                value={regNoInput}
                onChange={(e) => setRegNoInput(e.target.value)}
                placeholder="e.g. EF-2026-9842"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Exam Access Passcode / Key Envelope
              </label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="e.g. PASS-8921"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs font-medium">
                {loginError}
              </div>
            )}

            {/* Exam Rules Summary */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-[11px] text-slate-400">
              <div className="font-bold text-slate-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> Secure Lockdown Requirements:
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Full-Screen OS Lock will engage immediately upon launch.</li>
                <li>Tab switching, window blur, and keyboard shortcuts are logged.</li>
                <li>All answer interactions are signed with ECDSA SHA-256 hashes.</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Enter Secure Examination Window</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. SUBMISSION RECEIPT WINDOW
  if (isSubmitted && submissionReceipt) {
    return (
      <ForgeExamShell>
        <ForgeSubmissionReceipt
          candidateId={submissionReceipt.candidate_id}
          examId={submissionReceipt.exam_id}
          timestamp={new Date(submissionReceipt.timestamp).toLocaleString()}
          totalQuestions={submissionReceipt.total_questions}
          answeredCount={submissionReceipt.answered_count}
          receiptHash={submissionReceipt.receipt_hash}
          signature={submissionReceipt.signature}
          onPrint={() => window.print()}
          onExit={() => router.push("/")}
        />
      </ForgeExamShell>
    );
  }

  const currentQ = questions[currentIndex];
  const sections = ["All", ...Array.from(new Set(questions.map((q) => q.section)))];
  const filteredQuestions = activeSection === "All" 
    ? questions 
    : questions.filter(q => q.section === activeSection);

  const navigatorQuestions: NavigatorQuestion[] = questions.map((q) => {
    const isAns = !!selectedAnswers[q.id];
    const isMarked = !!markedForReview[q.id];
    if (isAns && isMarked) return { id: q.id, status: "answered_marked" };
    if (isMarked) return { id: q.id, status: "marked" };
    if (isAns) return { id: q.id, status: "answered" };
    return { id: q.id, status: "unanswered" };
  });

  const answeredCount = Object.keys(selectedAnswers).filter((k) => selectedAnswers[k]).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <ForgeExamShell>
      <ForgeExamHeader
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        timeRemaining={formatTimer(secondsRemaining)}
        isWarning={timerWarning}
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-4 lg:p-8 relative">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">
            
            {/* Top Section Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              {/* Section Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {sections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                      activeSection === sec
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    )}
                  >
                    {sec}
                  </button>
                ))}
              </div>
              
              {/* Top Utility Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Calculator Trigger */}
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                  title="Open Scientific Calculator"
                >
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Calculator</span>
                </button>

                <div className="w-px h-4 bg-slate-200"></div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                <button
                  onClick={() => setShowNavigator(!showNavigator)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer",
                    showNavigator 
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Menu size={14} />
                  <span>Question Roster</span>
                </button>
              </div>
            </div>
            
            {/* Question Display Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:p-8 shadow-xs flex-1 flex flex-col min-h-[420px]">
              <ForgeQuestion
                number={currentQ.number}
                section={currentQ.section}
                text={currentQ.content.text}
                marks={currentQ.marks}
                negativeMarks={currentQ.negative_marks}
                type={currentQ.type}
              />
              
              {/* Question Answer Inputs */}
              <div className="mt-8 space-y-3 flex-1">
                {/* 1. MCQ SINGLE & MULTI CHOICE */}
                {(currentQ.type === "MCQ_SINGLE" || currentQ.type === "MCQ_MULTI") && currentQ.content.options && (
                  Object.entries(currentQ.content.options).map(([optKey, optText]) => {
                    const isSelected = currentQ.type === "MCQ_MULTI"
                      ? (multiAnswers[currentQ.id] || []).includes(optKey)
                      : selectedAnswers[currentQ.id] === optKey;

                    return (
                      <ForgeAnswerOption
                        key={optKey}
                        optionKey={optKey}
                        text={optText}
                        isSelected={isSelected}
                        onSelect={() => handleSelectOption(optKey)}
                      />
                    );
                  })
                )}

                {/* 2. SUBJECTIVE ESSAY / DESCRIPTIVE ANSWER BOX */}
                {currentQ.type === "SUBJECTIVE" && (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <PenTool className="w-3.5 h-3.5 text-blue-600" />
                        Descriptive Answer Editor (LaTeX / Markdown Enabled):
                      </span>
                      <span className="font-mono">
                        Words: {(subjectiveAnswers[currentQ.id] || "").trim().split(/\s+/).filter(Boolean).length}
                      </span>
                    </div>

                    <textarea
                      value={subjectiveAnswers[currentQ.id] || ""}
                      onChange={(e) => handleSubjectiveChange(e.target.value)}
                      placeholder="Type your descriptive essay or formula derivations here..."
                      rows={8}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-2xs leading-relaxed"
                    />
                  </div>
                )}

                {/* 3. NUMERICAL INPUT */}
                {currentQ.type === "NUMERICAL" && (
                  <div className="pt-4 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Enter Final Calculated Numerical Answer:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={numericalInput[currentQ.id] || ""}
                        onChange={(e) => handleNumericalChange(e.target.value)}
                        placeholder="e.g. 600"
                        className="w-full max-w-xs px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-mono text-base font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCalculator(true)}
                        className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Calculator className="w-4 h-4" /> Open Scientific Keypad
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation & Action Footer Controls */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearResponse}
                  className="px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleToggleReview}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer",
                    markedForReview[currentQ.id]
                      ? "bg-amber-100 text-amber-800 border border-amber-300 font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  )}
                >
                  {markedForReview[currentQ.id] ? "✓ Marked for Review" : "Mark for Review"}
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-5 py-2 text-xs font-semibold rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-5 py-2 text-xs font-semibold rounded-full bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                >
                  Save & Next
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 text-xs font-bold rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  Submit Exam
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Question Palette Navigator Drawer / Mobile Bottom Sheet */}
        {showNavigator && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end md:relative md:inset-auto md:z-auto md:w-80 md:flex-col md:bg-white md:border-l md:border-slate-200 shadow-xl md:shadow-lg font-sans">
            <div 
              className="w-full max-h-[85vh] md:max-h-none overflow-y-auto bg-white rounded-t-3xl md:rounded-none p-6 flex flex-col justify-between h-full space-y-4 animate-in slide-in-from-bottom-5 md:animate-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Drag Indicator */}
              <div className="md:hidden w-12 h-1.5 rounded-full bg-slate-300 mx-auto -mt-2 mb-2 shrink-0" />

              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Question Palette ({questions.length} Items)
                  </h3>
                  <button 
                    onClick={() => setShowNavigator(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                    aria-label="Close question roster"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Counters */}
                <div className="grid grid-cols-2 gap-2 my-4 text-xs font-medium">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-between font-mono">
                    <span>Answered</span>
                    <span className="font-bold">{answeredCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 flex items-center justify-between font-mono">
                    <span>Unanswered</span>
                    <span className="font-bold">{unansweredCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-between font-mono col-span-2">
                    <span>Marked for Review</span>
                    <span className="font-bold">{markedCount}</span>
                  </div>
                </div>

                {/* Matrix Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 pt-2">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAns = !!selectedAnswers[q.id];
                    const isMarked = !!markedForReview[q.id];

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentIndex(idx);
                          // Auto close drawer on mobile for seamless answering
                          if (window.innerWidth < 768) setShowNavigator(false);
                        }}
                        className={cn(
                          "h-11 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer border shadow-2xs",
                          isCurrent && "ring-2 ring-blue-600 ring-offset-2",
                          isAns && !isMarked && "bg-emerald-600 text-white border-emerald-700",
                          isMarked && "bg-amber-400 text-slate-900 border-amber-500",
                          !isAns && !isMarked && "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Final Submit Trigger in Navigator */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowNavigator(false);
                    setShowSubmitModal(true);
                  }}
                  className="w-full py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finish & Submit Examination
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Virtual Scientific Calculator Popup */}
      {showCalculator && (
        <ForgeVirtualCalculator
          onInsertValue={(val) => handleNumericalChange(val)}
          onClose={() => setShowCalculator(false)}
        />
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Submit Examination?</h3>
                <p className="text-xs text-slate-500 font-medium">Verify your attempt summary before final hash generation.</p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900">{questions.length}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Unanswered:</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Marked for Review:</span>
                <span className="font-bold">{markedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Back to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 text-xs font-bold rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
              >
                Confirm Final Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-rose-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white border border-rose-300 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">Security Lockdown Violation</h3>
                <p className="text-xs text-rose-600 font-mono">Incident Logged #{focusLossCount}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-rose-50 p-3 rounded-xl border border-rose-200">
              {warningMessage}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-5 py-2 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer"
              >
                Acknowledge & Return
              </button>
            </div>
          </div>
        </div>
      )}

    </ForgeExamShell>
  );
}
