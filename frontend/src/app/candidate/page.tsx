"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

interface Question {
  id: string;
  subject: string;
  marks: number;
  content: {
    text: string;
    options?: { [key: string]: string };
  };
}

export default function CandidatePage() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState("");
  const [centerId, setCenterId] = useState("CTR-22");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Exam state
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [q_id: string]: string }>({});
  
  // Statuses
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string>("");
  const [error, setError] = useState("");
  const [receiptHash, setReceiptHash] = useState("");
  
  // Timer mock
  const [timeRemaining, setTimeRemaining] = useState(180 * 60);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");
    const email = localStorage.getItem("user_email");
    const candId = localStorage.getItem("user_id");

    if (!storedToken || role !== "CANDIDATE") {
      router.push("/");
      return;
    }
    setUserName(name || "Candidate");
    setUserEmail(email || "");
    if (candId) setCandidateId(candId);
  }, []);

  // Timer loop
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          center_id: centerId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Verification failed.");
      }

      const data = await res.json();
      setSession(data);
      setQuestions(data.questions);
      // Initialize empty answers
      const initialAnswers: any = {};
      data.questions.forEach((q: Question) => {
        initialAnswers[q.id] = "";
      });
      setSelectedAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || "Failed to start exam. Check time-lock and verification status.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = async (q_id: string, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [q_id]: option }));
    setSavingStatus("Chaining answer block hash...");

    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          candidate_id: candidateId,
          question_id: q_id,
          selected_answer: option
        })
      });

      if (!res.ok) throw new Error("Could not log answer event");
      const data = await res.json();
      setSavingStatus(`Synced! Chain Block Hash: ${data.current_hash.slice(0, 16)}...`);
    } catch (err) {
      setSavingStatus("Offline - Retrying sync...");
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          candidate_id: candidateId
        })
      });

      if (!res.ok) throw new Error("Failed to submit exam paper");
      const data = await res.json();
      setReceiptHash(data.submission_receipt_hash);
    } catch (err: any) {
      alert(`Error during submission: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top bar */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ExamForge <span className="text-accent-amber text-sm px-2 py-0.5 bg-accent-amber/10 border border-accent-amber/20 rounded">Candidate</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted">Registered: <span className="text-white">{userName}</span></span>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-border-color/80 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Entry Panel (Pre-exam start) */}
      {!session && (
        <main className="flex-1 flex flex-col justify-center items-center p-6">
          <div className="max-w-md w-full bg-card-bg p-6 rounded-xl border border-border-color shadow-lg">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 text-center">
              Enter Exam Room
            </h2>
            <form onSubmit={handleStartExam} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-text-muted mb-1">Candidate Anonymous ID</label>
                <input
                  type="text"
                  disabled
                  value={candidateId}
                  className="w-full p-2 bg-background/50 border border-border-color rounded font-mono text-white/70"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Center ID Location</label>
                <input
                  type="text"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded focus:border-accent-amber focus:outline-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-center">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition cursor-pointer text-sm"
              >
                {loading ? "Authenticating at Center..." : "Release Exam Package"}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* Active Exam session */}
      {session && !receiptHash && (
        <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-6 gap-6">
          {/* Left panel: timing and questions status */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6">
            <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm text-center">
              <h3 className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Time Remaining</h3>
              <div className="text-3xl font-extrabold text-white font-mono">{formatTime(timeRemaining)}</div>
            </section>

            <section className="bg-card-bg p-5 rounded-xl border border-border-color shadow-sm">
              <h3 className="text-xs text-text-muted uppercase font-bold tracking-wider mb-3">Sync Ledger Status</h3>
              <div className="text-[11px] font-mono text-accent-emerald bg-accent-emerald/5 p-2.5 rounded border border-accent-emerald/15 leading-relaxed break-all">
                {savingStatus || "Exam session connected. Pending events."}
              </div>
            </section>
          </div>

          {/* Right panel: Question worksheet */}
          <div className="flex-1 flex flex-col gap-6">
            {questions.map((q, idx) => (
              <section key={q.id} className="bg-card-bg p-6 rounded-xl border border-border-color shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-color/30">
                  <span className="text-sm font-bold text-white">Question {idx + 1} ({q.subject})</span>
                  <span className="text-xs text-text-muted">Weight: <span className="text-white font-semibold font-mono">{q.marks} Marks</span></span>
                </div>
                <p className="text-sm text-white mb-6 leading-relaxed">{q.content.text}</p>
                
                {/* Options list */}
                {q.content.options && (
                  <div className="flex flex-col gap-2">
                    {Object.entries(q.content.options).map(([key, val]) => (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                          selectedAnswers[q.id] === key
                            ? "bg-accent-amber/5 border-accent-amber text-white"
                            : "border-border-color/50 hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={key}
                          checked={selectedAnswers[q.id] === key}
                          onChange={() => handleOptionChange(q.id, key)}
                          className="accent-accent-amber"
                        />
                        <span className="font-bold">{key}.</span> {val}
                      </label>
                    ))}
                  </div>
                )}
              </section>
            ))}

            <button
              onClick={handleSubmitExam}
              disabled={loading}
              className="py-3 bg-accent-amber text-background font-extrabold rounded-xl hover:bg-accent-amber/90 transition cursor-pointer text-sm mb-10"
            >
              {loading ? "Locking submission chain..." : "Submit Completed Paper"}
            </button>
          </div>
        </main>
      )}

      {/* Submission Receipt (Post-exam completion) */}
      {receiptHash && (
        <main className="flex-1 flex flex-col justify-center items-center p-6">
          <div className="max-w-md w-full bg-card-bg p-6 rounded-xl border border-accent-emerald/30 shadow-lg text-center animate-in fade-in duration-300">
            <span className="text-4xl block mb-2">🎉</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2">
              Submission Successful
            </h2>
            <p className="text-xs text-text-muted mb-6 leading-normal">
              Your exam sheet has been locked. The cryptographic proof receipt below has been logged into the append-only audit ledger.
            </p>
            
            <div className="bg-background/80 p-4 rounded-lg border border-border-color text-xs text-left mb-6 font-mono">
              <div className="mb-3">
                <span className="text-text-muted block text-[10px] uppercase">Candidate Anonymous ID</span>
                <span className="text-white font-bold">{userName}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px] uppercase">Submission Receipt SHA-256</span>
                <span className="text-accent-emerald text-[11px] break-all select-all">{receiptHash}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-xs"
            >
              Return to Login Portal
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
