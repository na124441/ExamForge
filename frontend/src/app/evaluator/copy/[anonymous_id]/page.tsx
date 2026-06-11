"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

export default function EvaluatorCopyPage({ params }: { params: Promise<{ anonymous_id: string }> }) {
  const router = useRouter();
  const { anonymous_id } = use(params);
  const [token, setToken] = useState("");
  
  // Data States
  const [copy, setCopy] = useState<any>(null);
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  
  // Grading States
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [evaluationId, setEvaluationId] = useState("");
  const [gradingStatus, setGradingStatus] = useState("DRAFT");
  
  // Page uploads (mock simulation)
  const [uploadPageNum, setUploadPageNum] = useState(1);
  const [pageImageUrl, setPageImageUrl] = useState("");
  const [pageHash, setPageHash] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pagesList, setPagesList] = useState<any[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gradingError, setGradingError] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [lockingGrade, setLockingGrade] = useState(false);
  const [ecdsaSignature, setEcdsaSignature] = useState("ECDSA_SIG_EVAL_1_MARK_9901");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    fetchData(storedToken);
  }, [anonymous_id]);

  const fetchData = async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      // 1. Get Booklet Details
      const resCopy = await fetch(`${BACKEND_URL}/api/evaluation/copy/${anonymous_id}`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (!resCopy.ok) throw new Error("Failed to load anonymous booklet details");
      const copyData = await resCopy.json();
      setCopy(copyData);

      // 2. Get Rubrics for this exam
      const resRubrics = await fetch(`${BACKEND_URL}/api/rubrics/exam/${copyData.exam_id}`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (resRubrics.ok) {
        const rubricsData = await resRubrics.json();
        setRubrics(rubricsData);
      }

      // 3. Get Questions list
      const resQuestions = await fetch(`${BACKEND_URL}/api/questions`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (resQuestions.ok) {
        const questionsData = await resQuestions.json();
        setQuestions(questionsData);
      }

      // 4. Fetch pages list (if any pages have already been uploaded)
      // Since booklet_id is not directly exposed in anonymized copy (strip identity parameters),
      // we can search booklet info or check backend routes. Let's just retrieve booket details if controller
      // or we simulate booklet page uploads using a mock file path.
      
    } catch (err: any) {
      setError(err.message || "Failed to load evaluation portal");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (qId: string) => {
    const q = questions.find((item) => item.id === qId);
    setSelectedQuestion(q);
    const rub = rubrics.find((r) => r.question_id === qId);
    if (rub) {
      // Initialize scores to 0
      const initialScores: Record<string, number> = {};
      rub.criteria.forEach((c: any) => {
        initialScores[c.id] = 0;
      });
      setCriteriaScores(initialScores);
      setGradingError("");
    }
  };

  const handleScoreChange = (critId: string, val: number) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [critId]: val
    }));
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) {
      setGradingError("Please select a question to grade.");
      return;
    }
    setSubmittingGrade(true);
    setGradingError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluation/marks/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          anonymous_id: anonymous_id,
          question_id: selectedQuestion.id,
          criteria_scores: criteriaScores,
          notes: notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to submit marks entry draft.");
      }

      const data = await res.json();
      setEvaluationId(data.id);
      setGradingStatus(data.status);
      alert("Marks draft submitted successfully!");
    } catch (err: any) {
      setGradingError(err.message || "Marks submission failed");
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleGradeLock = async () => {
    if (!evaluationId) {
      setGradingError("No active evaluation draft to lock. Submit draft marks first.");
      return;
    }
    setLockingGrade(true);
    setGradingError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/evaluation/marks/${evaluationId}/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          signature: ecdsaSignature
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Locking evaluation failed.");
      }

      setGradingStatus("LOCKED");
      alert("Marks sealed and chained in MarksChain ledger successfully!");
    } catch (err: any) {
      setGradingError(err.message || "Locking failed");
    } finally {
      setLockingGrade(false);
    }
  };

  const handleSimulatePageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageImageUrl || !pageHash) {
      alert("Please provide the page image URL and SHA-256 hash.");
      return;
    }
    setUploading(true);
    try {
      // Find booklet id or fallback to direct create (mock page upload in backend)
      // For testing, we mock adding upload page parameters
      setPagesList((prev) => [
        ...prev,
        { page_number: uploadPageNum, image_url: pageImageUrl, page_hash: pageHash }
      ]);
      setUploadPageNum((n) => n + 1);
      setPageImageUrl("");
      setPageHash("");
      alert("Mock page scan registered!");
    } catch (err: any) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 font-mono">
              <Link href="/evaluation-ops" className="hover:text-accent-emerald transition-colors">EvaluationOps</Link>
              <span>/</span>
              <Link href="/evaluator/queue" className="hover:text-accent-emerald transition-colors">Queue</Link>
              <span>/</span>
              <span className="text-foreground">{anonymous_id}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              📖 Booklet Evaluation Portal
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Active Anonymous Booklet Copy ID: <span className="font-mono text-white font-bold">{anonymous_id}</span>
            </p>
          </div>
          <div>
            <Link 
              href="/evaluator/queue"
              className="px-4 py-2 bg-card-bg border border-border-color rounded text-sm hover:bg-background transition-colors text-white font-semibold"
            >
              ⬅ Back to Queue
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm">Decrypting anonymous booklet pages...</p>
          </div>
        ) : copy ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Booklet Pages Viewer */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Booklet Pages */}
              <div className="bg-card-bg rounded-xl border border-border-color p-6 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center justify-between">
                  <span>📄 Scanned Pages Ledger</span>
                  <span className="text-xs font-mono text-text-muted">Total pages: {copy.total_pages || 4}</span>
                </h3>
                
                {pagesList.length === 0 ? (
                  <div className="p-8 border border-dashed border-border-color rounded text-center text-text-muted text-sm">
                    No booklet pages uploaded to render. You can upload pages below to simulate scanner ingestion.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {pagesList.map((p, idx) => (
                      <div key={idx} className="bg-background/40 p-4 border border-border-color rounded relative">
                        <div className="text-xs font-bold text-white mb-2">Page #{p.page_number}</div>
                        <div className="text-[10px] text-text-muted truncate mb-1">Hash: {p.page_hash}</div>
                        <div className="text-[10px] text-accent-emerald font-mono bg-accent-emerald/5 border border-accent-emerald/20 px-1.5 py-0.5 rounded inline-block">
                          Image Loaded
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simulate Page Upload Form */}
                {gradingStatus !== "LOCKED" && (
                  <form onSubmit={handleSimulatePageUpload} className="p-4 bg-background/30 rounded border border-border-color space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Simulate Page Ingestion Upload</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase text-text-muted font-bold mb-1">Page Number</label>
                        <input 
                          type="number"
                          value={uploadPageNum}
                          onChange={(e) => setUploadPageNum(parseInt(e.target.value))}
                          className="w-full p-2 bg-background border border-border-color rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-text-muted font-bold mb-1">Image Storage URI</label>
                        <input 
                          type="text"
                          value={pageImageUrl}
                          onChange={(e) => setPageImageUrl(e.target.value)}
                          placeholder="storage/written/booklet-01/page-1.png"
                          className="w-full p-2 bg-background border border-border-color rounded text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-text-muted font-bold mb-1">Page SHA-256 Hash</label>
                      <input 
                        type="text"
                        value={pageHash}
                        onChange={(e) => setPageHash(e.target.value)}
                        placeholder="a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"
                        className="w-full p-2 bg-background border border-border-color rounded text-xs text-white font-mono"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="w-full py-1.5 bg-accent-emerald text-background font-bold text-xs rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
                    >
                      {uploading ? "Ingesting..." : "✓ Ingest & Hash Scanned Page"}
                    </button>
                  </form>
                )}

              </div>
              
            </div>

            {/* Right Column - Rubric Marking Form */}
            <div className="bg-card-bg rounded-xl border border-border-color p-6 space-y-6">
              
              <div>
                <h3 className="text-lg font-bold text-white">⚖️ Score Input</h3>
                <p className="text-xs text-text-muted mt-1">
                  Enforces criteria-wise marks limits defined by controllers.
                </p>
              </div>

              {/* Question selector */}
              {gradingStatus !== "LOCKED" && (
                <div>
                  <label className="block text-xs text-text-muted uppercase mb-1">Select Question</label>
                  <select 
                    onChange={(e) => handleSelectQuestion(e.target.value)}
                    className="w-full p-2 bg-background border border-border-color rounded text-sm text-white focus:outline-none focus:border-accent-emerald"
                  >
                    <option value="">-- Choose Question --</option>
                    {questions.map((q) => (
                      <option key={q.id} value={q.id}>{q.subject} - {q.topic} (Question ID: {q.id})</option>
                    ))}
                  </select>
                </div>
              )}

              {gradingError && (
                <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
                  ⚠️ {gradingError}
                </div>
              )}

              {/* Rubric Details */}
              {selectedQuestion && (
                <form onSubmit={handleGradeSubmit} className="space-y-6">
                  
                  {/* Criteria Inputs */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-bold text-text-muted tracking-wider border-b border-border-color/40 pb-2">
                      Rubric Scoring Details
                    </h4>
                    
                    {rubrics
                      .filter((r) => r.question_id === selectedQuestion.id)
                      .flatMap((r) => r.criteria)
                      .map((c: any) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/95 font-semibold">{c.title}</span>
                            <span className="text-text-muted">Max: {c.max_marks} marks</span>
                          </div>
                          <input 
                            type="number"
                            step="0.5"
                            min="0"
                            max={c.max_marks}
                            disabled={gradingStatus === "LOCKED"}
                            value={criteriaScores[c.id] || 0}
                            onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value))}
                            className="w-full p-2 bg-background border border-border-color rounded text-sm text-white focus:outline-none focus:border-accent-emerald font-mono"
                          />
                        </div>
                      ))}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs text-text-muted uppercase mb-1">Evaluation Notes</label>
                    <textarea 
                      rows={3}
                      disabled={gradingStatus === "LOCKED"}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes on marking criteria, errors found..."
                      className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald"
                    />
                  </div>

                  {/* Status Banner */}
                  <div className="flex items-center justify-between text-xs p-2 bg-background/50 border border-border-color rounded font-mono">
                    <span className="text-text-muted">MARKS STATUS:</span>
                    <span className="text-white font-bold">{gradingStatus}</span>
                  </div>

                  {/* Submit Button */}
                  {gradingStatus !== "LOCKED" && (
                    <button 
                      type="submit"
                      disabled={submittingGrade}
                      className="w-full py-2 bg-accent-emerald text-background font-bold text-sm rounded hover:bg-accent-emerald/90 transition-all cursor-pointer"
                    >
                      {submittingGrade ? "Saving Marks..." : "💾 Save Marks Draft"}
                    </button>
                  )}
                  
                </form>
              )}

              {/* Lock / Signature Section */}
              {gradingStatus !== "LOCKED" && evaluationId && (
                <div className="p-4 bg-background/40 border border-accent-amber/20 rounded-xl space-y-4 animate-in fade-in duration-300">
                  <div>
                    <h4 className="text-xs uppercase font-bold text-accent-amber">🔑 Seal and Lock Booklet Marks</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                      Sealing marks commits them to the MarksChain ledger with your public key identity. Locked marks cannot be mutated.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-text-muted font-bold mb-1">Evaluator ECDSA Lock Signature</label>
                    <input 
                      type="text"
                      value={ecdsaSignature}
                      onChange={(e) => setEcdsaSignature(e.target.value)}
                      className="w-full p-2 bg-background border border-border-color rounded text-xs text-white font-mono"
                    />
                  </div>
                  <button 
                    onClick={handleGradeLock}
                    disabled={lockingGrade}
                    className="w-full py-2 bg-accent-amber text-background font-bold text-xs rounded hover:bg-accent-amber/90 transition-all cursor-pointer"
                  >
                    {lockingGrade ? "Sealing ledger block..." : "🔒 Seal Marks & Sign Ledger"}
                  </button>
                </div>
              )}

            </div>
          </div>
        ) : null}

      </div>
    </main>
  );
}
