"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function FileDisputePage() {
  const router = useRouter();
  const [examId, setExamId] = useState("");
  const [candId, setCandId] = useState("");
  const [anonId, setAnonId] = useState("");
  const [resultId, setResultId] = useState("");
  const [type, setType] = useState("MARKS_TOTALING_ERROR");
  const [priority, setPriority] = useState("NORMAL");
  const [desc, setDesc] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId || !candId || !anonId || !resultId || !desc) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/disputes/file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_id: examId,
          candidate_id: candId,
          anonymous_id: anonId,
          result_id: resultId,
          dispute_type: type,
          priority: priority,
          description: desc
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Dispute submission failed.");
      }

      router.push("/disputes");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-lg w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div className="text-center">
          <span className="text-3xl">⚠️</span>
          <h1 className="text-xl font-extrabold text-white mt-2 tracking-wide">File Result Dispute</h1>
          <p className="text-xs text-text-muted mt-1">Submit re-evaluation request for review by center officers.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Exam ID</label>
              <input
                type="text"
                placeholder="e.g. EXM-006"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Result ID</label>
              <input
                type="text"
                placeholder="Result reference UUID"
                value={resultId}
                onChange={(e) => setResultId(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Candidate ID</label>
              <input
                type="text"
                placeholder="Database Candidate UUID"
                value={candId}
                onChange={(e) => setCandId(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Anonymous ID</label>
              <input
                type="text"
                placeholder="e.g. ANON-4310FF73"
                value={anonId}
                onChange={(e) => setAnonId(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Dispute Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white cursor-pointer"
              >
                <option value="MARKS_TOTALING_ERROR">Marks Totaling Error</option>
                <option value="WRITTEN_RECHECK">Written Recheck</option>
                <option value="OMR_ANSWER_REVIEW">OMR Answer Review</option>
                <option value="MISSING_PAGE_CLAIM">Missing Page Claim</option>
              </select>
            </div>
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white cursor-pointer"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-muted mb-1 font-semibold">Explanation / Ground for Dispute</label>
            <textarea
              rows={4}
              placeholder="State clear reasons why scores should be reviewed..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white resize-none"
            />
          </div>

          {error && (
            <div className="p-3.5 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-accent-amber text-background font-extrabold rounded-lg hover:bg-accent-amber/90 transition cursor-pointer text-sm tracking-wider uppercase"
            >
              {loading ? "Registering Dispute..." : "Submit Dispute Request"}
            </button>
            <Link href="/disputes" className="flex-1 text-center py-3 bg-card-bg border border-border-color hover:border-text-muted text-white font-bold rounded-lg transition text-xs flex items-center justify-center uppercase">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
