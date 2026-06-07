"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

interface Question {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  question_type: string;
  marks: number;
  status: string;
  content_hash: string;
}

export default function ControllerPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  
  // Scaffolding forms
  const [examId, setExamId] = useState("EXM-001");
  const [totalMarks, setTotalMarks] = useState(8);
  const [totalQuestions, setTotalQuestions] = useState(2);
  const [duration, setDuration] = useState(180);
  const [subjectDist, setSubjectDist] = useState("{\"Science\": 2}");
  const [difficultyDist, setDifficultyDist] = useState("{\"EASY\": 50, \"MEDIUM\": 50}");
  
  // Actions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [blueprintConfigured, setBlueprintConfigured] = useState(false);
  const [paperDetails, setPaperDetails] = useState<any>(null);
  
  // Verification Checks
  const [checkingResults, setCheckingResults] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<any>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");

    if (!storedToken || storedRole !== "CONTROLLER") {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setUserName(name || "Controller");
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error("Failed to load questions", err);
    }
  };

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${examId}/blueprint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          total_marks: totalMarks,
          total_questions: totalQuestions,
          duration_minutes: duration,
          subject_distribution: JSON.parse(subjectDist),
          difficulty_distribution: JSON.parse(difficultyDist)
        })
      });

      if (!res.ok) throw new Error("Blueprint creation failed");
      setBlueprintConfigured(true);
      alert("Blueprint locked cryptographically inside SQLite!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleGeneratePaper = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${examId}/generate-paper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          set_id: "A",
          center_id: "CTR-22",
          release_delay_seconds: 0
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Paper generation failed");
      }
      
      const data = await res.json();
      setPaperDetails(data);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePublishResults = async () => {
    setCheckingResults(true);
    setVerificationResult(null);
    setVerificationError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${examId}/publish-results`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err.detail));
      }

      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setVerificationError(parsed);
      } catch {
        setVerificationError({ message: "Verification failed to complete.", failures: [err.message] });
      }
    } finally {
      setCheckingResults(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-card-bg border-b border-border-color p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ExamForge <span className="text-accent-emerald text-sm px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded">Controller</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/risk-dashboard")}
            className="text-xs px-3 py-1.5 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded hover:bg-accent-red/20 transition cursor-pointer font-bold"
          >
            📡 TrustOps Control
          </button>
          <button
            onClick={() => router.push("/publication-gate")}
            className="text-xs px-3 py-1.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald rounded hover:bg-accent-emerald/20 transition cursor-pointer font-bold"
          >
            🚧 Publication Gate
          </button>
          <span className="text-xs text-text-muted">Active: <span className="text-white">{userName}</span></span>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-border-color/80 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        
        {/* Left column: Question bank and blueprint creation */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Question Pool */}
          <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Question Bank Pool
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-color text-text-muted">
                    <th className="py-2">Subject</th>
                    <th className="py-2">Topic</th>
                    <th className="py-2">Difficulty</th>
                    <th className="py-2">Marks</th>
                    <th className="py-2">SHA-256 Hash Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-text-muted">
                        No questions in repository. Log in as Auditor and trigger E2E seeding logs.
                      </td>
                    </tr>
                  ) : (
                    questions.map((q) => (
                      <tr key={q.id} className="hover:bg-white/5">
                        <td className="py-3 font-semibold text-white">{q.subject}</td>
                        <td className="py-3">{q.topic}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            q.difficulty === "EASY" ? "bg-accent-emerald/10 text-accent-emerald" :
                            q.difficulty === "MEDIUM" ? "bg-accent-amber/10 text-accent-amber" :
                            "bg-accent-red/10 text-accent-red"
                          }`}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="py-3 text-white font-mono">{q.marks}</td>
                        <td className="py-3 font-mono text-white/60">{q.content_hash.slice(0, 16)}...</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Blueprint configure form */}
          <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-amber"></span> Cryptographic Exam Blueprint
            </h2>
            <form onSubmit={handleCreateBlueprint} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-text-muted mb-1">Exam ID</label>
                <input
                  type="text"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded focus:outline-none focus:border-accent-emerald"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Total Marks</label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full p-2 bg-background border border-border-color rounded"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Total Questions</label>
                <input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full p-2 bg-background border border-border-color rounded"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-2 bg-background border border-border-color rounded"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Subject Distribution (JSON)</label>
                <input
                  type="text"
                  value={subjectDist}
                  onChange={(e) => setSubjectDist(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Difficulty Distribution (JSON)</label>
                <input
                  type="text"
                  value={difficultyDist}
                  onChange={(e) => setDifficultyDist(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded font-mono"
                />
              </div>
              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition cursor-pointer"
                >
                  Verify & Lock Blueprint
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right column: Paper Gen & Verification */}
        <div className="flex flex-col gap-6">
          
          {/* Paper Generation card */}
          <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Secure Paper Generation
            </h2>
            <p className="text-xs text-text-muted mb-4 leading-normal">
              Dynamically generates exam sheets conforming to the active blueprint, generating locking SHA-256 hashes.
            </p>
            {!blueprintConfigured ? (
              <div className="p-3 bg-border-color/30 border border-border-color text-text-muted rounded text-xs text-center">
                Configure exam blueprint first
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGeneratePaper}
                  className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-xs"
                >
                  Construct AES-Locked Paper Set
                </button>

                {paperDetails && (
                  <div className="p-4 bg-background/50 rounded border border-border-color text-xs flex flex-col gap-2 font-mono">
                    <div>
                      <span className="text-text-muted">Paper ID:</span>
                      <div className="text-white text-[11px]">{paperDetails.paper_id}</div>
                    </div>
                    <div>
                      <span className="text-text-muted">Lock Status:</span>
                      <div className="text-accent-emerald font-bold">{paperDetails.status}</div>
                    </div>
                    <div>
                      <span className="text-text-muted">Paper Hash SHA-256:</span>
                      <div className="text-white/80 text-[10px] break-all">{paperDetails.paper_hash}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Secure Booklet QR Generator */}
          <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-amber"></span> Secure Booklet QR Generator
            </h2>
            <p className="text-xs text-text-muted mb-4 leading-normal">
              Stamps a candidate-specific, encrypted verification QR code on the physical exam booklet template.
            </p>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-text-muted mb-1">Target Candidate Database ID</label>
                <input
                  type="text"
                  placeholder="Enter candidate registration ID"
                  id="candCoverId"
                  className="w-full p-2 bg-background border border-border-color rounded text-white font-mono focus:outline-none focus:border-accent-amber"
                />
              </div>
              <button
                onClick={() => {
                  const input = document.getElementById("candCoverId") as HTMLInputElement;
                  if (input && input.value) {
                    window.open(`${BACKEND_URL}/api/candidates/${input.value}/booklet/cover`, "_blank");
                  } else {
                    alert("Please enter a Candidate ID first.");
                  }
                }}
                className="w-full py-2 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition cursor-pointer"
              >
                Download Encryption QR Stamp
              </button>
            </div>
          </section>

          {/* Results Verification & publishing */}
          <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-red"></span> Pre-Result Integrity Check
            </h2>
            <p className="text-xs text-text-muted mb-4 leading-normal">
              Verifies all cryptographic ledger linking hashes, descriptive evaluations, and answer logs before allowing result publication.
            </p>
            
            <button
              onClick={handlePublishResults}
              disabled={checkingResults}
              className="w-full py-2 bg-accent-red text-white font-bold rounded hover:bg-accent-red/90 transition cursor-pointer text-xs"
            >
              {checkingResults ? "Running Verification..." : "Run Cryptographic Checklist"}
            </button>

            {/* Happy Path Success */}
            {verificationResult && (
              <div className="mt-4 p-4 bg-accent-emerald/10 border border-accent-emerald/20 text-foreground rounded text-xs animate-in fade-in duration-300">
                <div className="text-accent-emerald font-bold mb-2 flex items-center gap-1">
                  ✅ Verification Passed Successfully
                </div>
                <div className="text-xs text-text-muted mb-2 font-semibold">Results generated and published:</div>
                <div className="divide-y divide-border-color/30 font-mono text-[11px]">
                  {verificationResult.results.map((res: any, idx: number) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <span className="text-white/80">{res.candidate_anonymous_id}</span>
                      <span className="text-accent-emerald">Score: {res.score} ({res.status})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tamper caught path */}
            {verificationError && (
              <div className="mt-4 p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs animate-in fade-in duration-300">
                <div className="font-bold mb-2 flex items-center gap-1 text-[13px]">
                  ⚠️ TAMPER DETECTED - CHAIN VOID
                </div>
                <p className="text-text-muted mb-3 leading-normal">{verificationError.message || "Integrity check failed. Mismatched hash link signatures caught in database records."}</p>
                <div className="bg-background/80 p-2.5 rounded border border-accent-red/10 font-mono text-[10px] text-white/95 leading-normal flex flex-col gap-1 text-left">
                  {verificationError.failures?.map((fail: string, idx: number) => (
                    <div key={idx} className="break-words">• {fail}</div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
