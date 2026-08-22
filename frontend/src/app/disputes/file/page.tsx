"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ShieldAlert, Send } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function FileDisputePage() {
  const router = useRouter();
  const [examId, setExamId] = useState("EXM-001");
  const [candId, setCandId] = useState("CAND-001");
  const [anonId, setAnonId] = useState("ANON-8891");
  const [resultId, setResultId] = useState("RES-8891");
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
      await fetch(`${BACKEND_URL}/api/disputes/file`, {
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

      router.push("/disputes");
    } catch (err: any) {
      router.push("/disputes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 md:p-10 font-sans items-center justify-center">
      <div className="max-w-xl w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xs">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">File Result Dispute</h1>
            <p className="text-xs text-slate-500 mt-0.5">Submit re-evaluation request for review by center officers.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Exam Identifier</label>
              <input
                type="text"
                placeholder="e.g. EXM-001"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Result ID</label>
              <input
                type="text"
                placeholder="RES-8891"
                value={resultId}
                onChange={(e) => setResultId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Candidate Identifier</label>
              <input
                type="text"
                placeholder="CAND-001"
                value={candId}
                onChange={(e) => setCandId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Anonymous Identifier</label>
              <input
                type="text"
                placeholder="ANON-8891"
                value={anonId}
                onChange={(e) => setAnonId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Dispute Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-800"
              >
                <option value="MARKS_TOTALING_ERROR">Marks Totaling Error</option>
                <option value="WRITTEN_RECHECK">Written Descriptive Recheck</option>
                <option value="OMR_ANSWER_REVIEW">OMR Optical Bubble Review</option>
                <option value="MISSING_PAGE_CLAIM">Missing Booklet Page Claim</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-800"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Expedited</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Detailed Ground for Dispute</label>
            <textarea
              rows={4}
              placeholder="State clear reasons why scores should be reviewed..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-900 leading-relaxed resize-none"
            />
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-xs active-press flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Registering Dispute..." : "Submit Dispute Request"}</span>
            </button>
            <Link 
              href="/disputes" 
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl transition text-xs flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
