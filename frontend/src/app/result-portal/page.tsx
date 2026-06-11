"use client";

import { useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function ResultPortal() {
  const [regNum, setRegNum] = useState("");
  const [examId, setExamId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNum || !examId || !pin) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/transparency/result/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_number: regNum, exam_id: examId, pin }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Lookup failed. Result not found or pin mismatch.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans p-6 justify-center items-center">
      <div className="max-w-md w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6 backdrop-blur-md">
        <div className="text-center">
          <span className="text-4xl">🎓</span>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-wide">Candidate Result Portal</h1>
          <p className="text-xs text-text-muted mt-1">Access your examination scores and verify cryptographic trust indicators.</p>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-text-muted mb-1 font-semibold">Registration Number</label>
            <input
              type="text"
              placeholder="e.g. REG-6000"
              value={regNum}
              onChange={(e) => setRegNum(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono text-white"
            />
          </div>

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
            <label className="block text-text-muted mb-1 font-semibold">DOB / PIN Code</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
            />
          </div>

          {error && (
            <div className="p-3.5 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs animate-pulse">
              <strong>Error:</strong> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition cursor-pointer text-sm tracking-wider uppercase"
          >
            {loading ? "Searching Cryptographic Records..." : "Lookup Result"}
          </button>
        </form>

        {result && (
          <div className="p-5 bg-accent-emerald/5 border border-accent-emerald/20 rounded-xl flex flex-col gap-4 text-xs animate-in fade-in duration-300">
            <h3 className="text-center font-bold text-accent-emerald text-sm uppercase tracking-wider">Result Located Successfully</h3>
            <div className="grid grid-cols-2 gap-3 bg-background/50 p-4 rounded-lg border border-border-color font-mono">
              <span className="text-text-muted">Anonymous ID:</span>
              <span className="text-white text-right">{result.candidate_anonymous_id}</span>

              <span className="text-text-muted">Marks Obtained:</span>
              <span className="text-white text-right font-bold">{result.marks_obtained} / {result.max_marks}</span>

              <span className="text-text-muted">Status:</span>
              <span className="text-white text-right">{result.status}</span>

              <span className="text-text-muted">Rank:</span>
              <span className="text-white text-right">#{result.rank}</span>

              <span className="text-text-muted">Verdict:</span>
              <span className="text-white text-right font-bold">{result.qualification_status}</span>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Link href={`/result-integrity/${result.result_id}`} className="w-full text-center py-2 bg-card-bg border border-border-color hover:border-accent-emerald text-white rounded font-semibold transition">
                🔍 Verify Result Integrity
              </Link>
              <Link href={`/result-versions/${result.result_id}`} className="w-full text-center py-2 bg-card-bg border border-border-color hover:border-accent-emerald text-white rounded font-semibold transition">
                📜 View Result Versions
              </Link>
              <Link href="/disputes/file" className="w-full text-center py-2 bg-accent-amber/10 border border-accent-amber/20 hover:bg-accent-amber/20 text-accent-amber rounded font-semibold transition">
                ⚠️ File a Recheck Dispute
              </Link>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="text-xs text-text-muted hover:text-white transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
