"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

interface CriterionInput {
  title: string;
  max_marks: number;
}

export default function CreateRubricPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  
  // Rubric Inputs
  const [criteria, setCriteria] = useState<CriterionInput[]>([
    { title: "Concept accuracy", max_marks: 4.0 },
    { title: "Reasoning steps", max_marks: 3.0 },
    { title: "Presentation clarity", max_marks: 3.0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    
    if (!storedToken || storedRole !== "CONTROLLER") {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole);
    fetchQuestions(storedToken);
  }, []);

  const fetchQuestions = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch questions database");
      const data = await res.json();
      
      // Filter descriptive/written questions only (that need rubrics)
      const descriptive = data.filter((q: any) => q.question_type === "WRITTEN");
      setQuestions(descriptive);
    } catch (err: any) {
      setError(err.message || "Failed to load questions list");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (qId: string) => {
    const q = questions.find((item) => item.id === qId);
    setSelectedQuestion(q);
    setError("");
  };

  const handleCriterionChange = (idx: number, field: keyof CriterionInput, val: any) => {
    const copy = [...criteria];
    if (field === "max_marks") {
      copy[idx].max_marks = parseFloat(val) || 0;
    } else {
      copy[idx].title = val;
    }
    setCriteria(copy);
    setError("");
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, { title: "", max_marks: 0 }]);
  };

  const handleRemoveCriterion = (idx: number) => {
    const copy = [...criteria];
    copy.splice(idx, 1);
    setCriteria(copy);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) {
      setError("Please select a target descriptive question.");
      return;
    }

    // Client-side criteria total validation
    const totalMarks = criteria.reduce((sum, item) => sum + item.max_marks, 0);
    if (totalMarks !== selectedQuestion.marks) {
      setError(`Criteria max marks total (${totalMarks}) must equal question max marks (${selectedQuestion.marks}) exactly.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/rubrics/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_id: "EXM-005",
          question_id: selectedQuestion.id,
          max_marks: selectedQuestion.marks,
          criteria: criteria
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create rubric.");
      }

      alert("Rubric draft created successfully!");
      router.push("/rubrics");
    } catch (err: any) {
      setError(err.message || "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 font-mono">
              <Link href="/evaluation-ops" className="hover:text-accent-emerald transition-colors">EvaluationOps</Link>
              <span>/</span>
              <Link href="/rubrics" className="hover:text-accent-emerald transition-colors">Rubrics</Link>
              <span>/</span>
              <span className="text-foreground">Create</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              📋 Rubric Builder & Criterion Modeler
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Model criteria-wise scoring distribution limits for descriptive exam questions.
            </p>
          </div>
          <div>
            <Link 
              href="/rubrics"
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold"
            >
              ⬅ Cancel
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm leading-normal">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm">Loading descriptive questions pool...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card-bg rounded-xl border border-border-color p-6 space-y-6 shadow-xl">
            
            {/* Question selection */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Target Written Question</label>
              <select 
                onChange={(e) => handleSelectQuestion(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-sm text-white focus:outline-none focus:border-accent-emerald"
              >
                <option value="">-- Choose Question --</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>{q.subject} - {q.topic} (Max Marks: {q.marks})</option>
                ))}
              </select>
            </div>

            {selectedQuestion && (
              <div className="p-4 bg-background/50 border border-border-color rounded-lg space-y-4">
                
                {/* Question Info banner */}
                <div className="flex justify-between items-center text-xs border-b border-border-color/30 pb-2">
                  <span className="text-text-muted">QUESTION WEIGHTAGE:</span>
                  <span className="text-accent-emerald font-bold font-mono text-sm">{selectedQuestion.marks} Marks</span>
                </div>

                {/* Criteria items builder */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase font-bold text-white tracking-wider">Criteria Breakdown</h3>
                    <button 
                      type="button"
                      onClick={handleAddCriterion}
                      className="px-2 py-1 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs font-semibold hover:bg-accent-emerald/20 transition-colors cursor-pointer"
                    >
                      ＋ Add Criterion
                    </button>
                  </div>

                  <div className="space-y-3">
                    {criteria.map((c, idx) => (
                      <div key={idx} className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="block text-[9px] uppercase text-text-muted font-bold mb-1">Criterion Title</label>
                          <input 
                            type="text"
                            required
                            value={c.title}
                            onChange={(e) => handleCriterionChange(idx, "title", e.target.value)}
                            placeholder="e.g. Concept accuracy"
                            className="w-full p-2 bg-background border border-border-color rounded text-xs text-white"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-[9px] uppercase text-text-muted font-bold mb-1">Max Marks</label>
                          <input 
                            type="number"
                            step="0.5"
                            min="0"
                            required
                            value={c.max_marks}
                            onChange={(e) => handleCriterionChange(idx, "max_marks", e.target.value)}
                            className="w-full p-2 bg-background border border-border-color rounded text-xs text-white font-mono text-center"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="p-2 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded hover:bg-accent-red/20 transition-colors text-xs font-bold font-mono cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-accent-emerald text-background font-bold text-sm rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
                >
                  {submitting ? "Deploying Rubric..." : "✓ Deploy and Lock Rubric Draft"}
                </button>

              </div>
            )}

          </form>
        )}

      </div>
    </main>
  );
}
