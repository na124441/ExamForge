"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function EvaluatorPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  
  // Grading form
  const [examId, setExamId] = useState("EXM-001");
  const [anonId, setAnonId] = useState("ANON-DB233633");
  const [questionId, setQuestionId] = useState(""); // Populate dynamically or type in
  const [marks, setMarks] = useState(8.0);
  const [maxMarks] = useState(10.0);
  const [rubricNotes, setRubricNotes] = useState(
    "Cathode hydrogen ratio matches perfectly. 2 marks deducted for anode detail."
  );

  // States
  const [submitting, setSubmitting] = useState(false);
  const [gradeResponse, setGradeResponse] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);

  const handleFetchAIInsight = async () => {
    if (!questionId) {
      alert("Please enter the target Question ID to grade.");
      return;
    }
    setAiLoading(true);
    setAiInsight(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluations/ai-insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: examId,
          anonymous_id: anonId,
          question_id: questionId,
          text_content: "Water electrolysis is the decomposition of water (H2O) into oxygen (O2) and hydrogen gas (H2) by passing an electric current through it. At the anode (positive electrode), oxidation happens: 2H2O -> O2 + 4H+ + 4e-. So oxygen gas is produced at anode. At the cathode (negative electrode), reduction happens: 4H2O + 4e- -> 2H2 + 4OH-. Hydrogen gas is produced at cathode. The volumetric ratio of hydrogen to oxygen is 2:1 since two molecules of hydrogen are produced for every molecule of oxygen.",
          rubric_guidelines: "Marks distribution: Anode oxidation details (2.5), Cathode reduction details (2.5), Volumetric ratio description (3.0), Electricity definition (2.0)"
        })
      });
      if (!res.ok) throw new Error("AI evaluation service failed");
      const data = await res.json();
      setAiInsight(data);
    } catch (err: any) {
      alert(err.message || "Failed to load AI insights.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");

    if (!storedToken || role !== "EVALUATOR") {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setUserName(name || "Evaluator");
  }, []);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionId) {
      alert("Please enter the Question ID to grade.");
      return;
    }

    setSubmitting(true);
    setGradeResponse(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluations/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_id: examId,
          anonymous_id: anonId,
          question_id: questionId,
          marks_awarded: marks,
          max_marks: maxMarks,
          rubric_notes: rubricNotes
        })
      });

      if (!res.ok) throw new Error("Failed to submit descriptive evaluation score");
      const data = await res.json();
      setGradeResponse(data);
      alert("Marks locked and signed cryptographically!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ExamForge <span className="text-indigo-400 text-sm px-2 py-0.5 bg-indigo-400/10 border border-indigo-400/20 rounded">Evaluator</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted">Active: <span className="text-white">{userName}</span></span>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-border-color/80 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Splitscreen Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-6">
        
        {/* Left Side: Descriptive Written Script Viewer */}
        <div className="flex-1 bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 shadow-sm min-h-[400px]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-border-color/30 flex justify-between items-center">
            <span>📖 Booklet Scan Ingestion</span>
            <span className="text-[10px] text-accent-emerald font-mono bg-accent-emerald/10 border border-accent-emerald/20 px-2 py-0.5 rounded">Verified Booklet ID: WBK-37603C85</span>
          </h2>
          
          {/* Simulated Handwritten script layout */}
          <div className="flex-1 bg-background p-5 rounded-lg border border-border-color/40 flex flex-col justify-between font-mono text-xs leading-relaxed overflow-y-auto">
            <div className="flex justify-between text-[10px] text-text-muted pb-2 border-b border-border-color/20 mb-4">
              <span>Page: 1 / 3</span>
              <span>Page Hash SHA-256: 05d69e161c0e4071...</span>
            </div>
            
            <div className="flex-1 text-white/95 whitespace-pre-line italic font-serif text-sm px-3 select-none">
              {"Water electrolysis is the decomposition of water (H2O) into oxygen (O2) and hydrogen gas (H2) by passing an electric current through it.\n\nAt the anode (positive electrode), oxidation happens: 2H2O -> O2 + 4H+ + 4e-. So oxygen gas is produced at anode.\n\nAt the cathode (negative electrode), reduction happens: 4H2O + 4e- -> 2H2 + 4OH-. Hydrogen gas is produced at cathode.\n\nThe volumetric ratio of hydrogen to oxygen is 2:1 since two molecules of hydrogen are produced for every molecule of oxygen."}
            </div>

            <div className="mt-6 p-2 bg-card-bg rounded text-[10px] text-text-muted text-center border border-border-color/20">
              Identity Anonymization Active. Real candidate ID masked from Evaluator.
            </div>
          </div>
        </div>

        {/* Right Side: Evaluation Marks Form */}
        <div className="w-full md:w-2/5 bg-card-bg p-6 rounded-xl border border-border-color shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-border-color/30">
            📝 Double-Blind Rubric Checking
          </h2>
          
          <form onSubmit={handleGradeSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="block text-text-muted mb-1">Exam ID</label>
              <input
                type="text"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-text-muted mb-1">Candidate Anonymous ID</label>
              <input
                type="text"
                value={anonId}
                onChange={(e) => setAnonId(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-text-muted mb-1">Question ID (Copy from Pool or tests)</label>
              <input
                type="text"
                placeholder="Enter target descriptive Question ID"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded focus:border-indigo-400 focus:outline-none font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted mb-1">Marks Awarded</label>
                <input
                  type="number"
                  step="0.5"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full p-2 bg-background border border-border-color rounded"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Max Marks Possible</label>
                <input
                  type="number"
                  disabled
                  value={maxMarks}
                  className="w-full p-2 bg-background/50 border border-border-color rounded text-white/70"
                />
              </div>
            </div>
            <div>
              <label className="block text-text-muted mb-1">Rubric Grading Notes</label>
              <textarea
                rows={3}
                value={rubricNotes}
                onChange={(e) => setRubricNotes(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded focus:border-indigo-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={handleFetchAIInsight}
                disabled={aiLoading}
                className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-xs"
              >
                {aiLoading ? "Gemini evaluating script..." : "Ask ExamForge AI Assistant"}
              </button>
              
              {aiInsight && (
                <div className="p-4 bg-accent-emerald/5 rounded border border-accent-emerald/20 text-xs flex flex-col gap-2 animate-in fade-in duration-300">
                  <div className="font-bold text-accent-emerald">Gemini Vision Insights:</div>
                  <div>Suggested Marks: <span className="font-mono font-bold text-white">{aiInsight.suggested_marks} / 10.0</span></div>
                  <div>Plagiarism Score: <span className="font-mono text-white">{Math.round(aiInsight.plagiarism_score * 100)}% Match</span></div>
                  {aiInsight.rubric_mismatch_flags.length > 0 && (
                    <div>
                      <span className="text-accent-amber font-semibold block mb-1">Missing Rubric Details:</span>
                      <div className="divide-y divide-border-color/20 pl-2 text-[10px] text-text-muted">
                        {aiInsight.rubric_mismatch_flags.map((flag: string, idx: number) => (
                          <div key={idx} className="py-0.5">• {flag}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMarks(aiInsight.suggested_marks);
                      if (aiInsight.rubric_mismatch_flags.length > 0) {
                        setRubricNotes(`AI suggested corrections: ${aiInsight.rubric_mismatch_flags.join("; ")}`);
                      } else {
                        setRubricNotes("AI verified: full rubric constraints satisfied.");
                      }
                    }}
                    className="mt-2 py-1.5 bg-accent-amber text-background font-bold rounded hover:bg-accent-amber/90 transition cursor-pointer text-[10px]"
                  >
                    Apply AI Score & Notes
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-400 text-background font-bold rounded hover:bg-indigo-400/90 transition cursor-pointer text-sm"
            >
              {submitting ? "Signing marks lock..." : "Lock Marks & Sign Score"}
            </button>
          </form>

          {/* Locked Response output */}
          {gradeResponse && (
            <div className="p-4 bg-background/50 border border-border-color rounded text-xs flex flex-col gap-2 font-mono mt-2 animate-in fade-in duration-300">
              <div>
                <span className="text-text-muted">Status:</span>
                <span className="text-accent-emerald font-bold ml-2">{gradeResponse.status}</span>
              </div>
              <div>
                <span className="text-text-muted">Locked Evaluation Hash SHA-256:</span>
                <div className="text-white/80 text-[10px] break-all mt-1">{gradeResponse.evaluation_hash}</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
