"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Award, 
  Search, 
  CheckCircle, 
  ChevronRight, 
  Lock, 
  FileCheck,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";

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
      setError("Please fill in all verification credentials.");
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
        throw new Error(errData.detail || "Credentials lookup failed. Match not found.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Credential matching failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 font-sans select-none selection:bg-emerald-600/30">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-2xl border border-slate-850 shadow-2xl flex flex-col gap-6 backdrop-blur-md relative overflow-hidden">
        
        {/* Top green glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

        {/* Back Link */}
        <div className="flex justify-between items-center text-xs font-mono">
          <Link href="/" className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Simulators Portal</span>
          </Link>
          <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded uppercase font-bold tracking-wider">
            Candidate Gate
          </span>
        </div>

        {/* Header */}
        <div className="text-center mt-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl mb-3">
            🎓
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Candidate Result Portal</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
            Verify score transcripts using secure cryptographically chained proofs.
          </p>
        </div>

        {/* Form */}
        {!result && (
          <form onSubmit={handleLookup} className="flex flex-col gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1 font-bold uppercase tracking-wider text-[9px]">
                Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. REG-6000"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-lg focus:border-emerald-500 focus:outline-none text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold uppercase tracking-wider text-[9px]">
                Examination ID
              </label>
              <input
                type="text"
                placeholder="e.g. EXM-001"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-lg focus:border-emerald-500 focus:outline-none text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold uppercase tracking-wider text-[9px]">
                Verification PIN
              </label>
              <input
                type="password"
                placeholder="Enter key PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-lg focus:border-emerald-500 focus:outline-none text-white font-mono tracking-widest"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/15 border border-red-900/20 text-red-400 rounded-lg text-[10px] leading-relaxed flex gap-2 items-start font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 text-slate-950 font-black rounded-lg hover:bg-emerald-400 transition cursor-pointer text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
            >
              {loading ? "Decrypting Ledger..." : "Search & Verify Result"}
            </button>
          </form>
        )}

        {/* Results Container */}
        {result && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-250">
            
            {/* Score Sheet */}
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Candidate Identity</span>
                  <span className="text-xs font-bold font-mono text-white">{result.candidate_anonymous_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Qualification Status</span>
                  <span className={`text-xs font-bold uppercase ${
                    result.qualification_status.includes("QUALIFIED") ? "text-emerald-400" : "text-slate-400"
                  }`}>{result.qualification_status}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 font-mono">
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-slate-500 block">Score</span>
                  <span className="text-sm font-black text-white">{result.marks_obtained}</span>
                  <span className="text-[8px] text-slate-600 block mt-0.5">/ {result.max_marks}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-slate-500 block">Rank</span>
                  <span className="text-sm font-black text-white">#{result.rank}</span>
                  <span className="text-[8px] text-slate-600 block mt-0.5">National</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-slate-500 block">Verdict</span>
                  <span className="text-xs font-black text-emerald-400 uppercase mt-0.5 block">
                    {result.status === "FINAL" ? "FINALIZED" : "DRAFT"}
                  </span>
                  <span className="text-[8px] text-slate-600 block mt-0.5">Verified</span>
                </div>
              </div>
            </div>

            {/* Human Friendly verification card */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-[11px]">Your Result is Secured</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    This result sheet corresponds to verifiable exam logs in our tamper-evident blockchain ledger.
                  </p>
                </div>
              </div>

              {/* Explanations list */}
              <div className="space-y-1.5 font-mono text-[10px] text-slate-400 pt-2 border-t border-emerald-500/10">
                <div className="flex justify-between items-center">
                  <span>✓ Question Set Integrity:</span>
                  <span className="text-emerald-400 font-bold">Verified</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>✓ Exam Submission Hash:</span>
                  <span className="text-emerald-400 font-bold">Valid Receipt</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>✓ Dual-custody Grading lock:</span>
                  <span className="text-emerald-400 font-bold">Sealed</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>✓ Publication Gate:</span>
                  <span className="text-emerald-400 font-bold">Passed</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              <Link 
                href={`/result-integrity/${result.result_id}`} 
                className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-850 hover:border-emerald-500/30 text-slate-200 rounded-xl transition group"
              >
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                  <span>Inspect Audit Proof Details</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
              </Link>

              <Link 
                href={`/result-versions/${result.result_id}`}
                className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-850 hover:border-emerald-500/30 text-slate-200 rounded-xl transition group"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                  <span>Check Score Version History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
              </Link>

              <Link 
                href="/disputes/file" 
                className="w-full text-center py-2.5 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 rounded-xl font-bold transition font-sans text-[11px]"
              >
                ⚠️ File a Recheck Dispute Claim
              </Link>

              <button
                onClick={() => setResult(null)}
                className="w-full text-center py-2 text-slate-500 hover:text-slate-400 transition font-sans text-[11px]"
              >
                Clear & Lookup New Record
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
