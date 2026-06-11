"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Unlock,
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle,
  FileCheck,
  RefreshCw,
  Cpu,
  Key
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { BlockingReasons } from "../../components/ui/BlockingReasons";

const BACKEND_URL = "http://localhost:8000";
const EXAM_ID = "EXM-001";

interface ChecklistItem {
  name: string;
  passed: boolean;
  critical: boolean;
  details: string;
}

interface GateStatus {
  exam_id: string;
  allowed: boolean;
  trust_score: number;
  checklist: ChecklistItem[];
  blocking_reasons: string[];
  critical_issues: { code: string; message: string; details: string }[];
  warnings: { code: string; message: string; details: string }[];
}

export default function PublicationGatePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<GateStatus | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [publishError, setPublishError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) setToken(storedToken);
    fetchGateStatus();
    const interval = setInterval(fetchGateStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchGateStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${EXAM_ID}/gate-status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to load publication gate status", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = async () => {
    if (!status?.allowed) return;
    setPublishing(true);
    setPublishResult(null);
    setPublishError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${EXAM_ID}/publish-results`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ? JSON.stringify(err.detail) : "Results release failed");
      }

      const data = await res.json();
      setPublishResult(data);
      alert("Results verified and published successfully!");
    } catch (err: any) {
      try {
        setPublishError(JSON.parse(err.message));
      } catch {
        setPublishError({ message: err.message || "Could not publish results." });
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-mono text-xs gap-3">
        <span className="animate-spin text-xl">⚙️</span>
        <span>VERIFYING CRYPTOGRAPHIC GATES...</span>
      </div>
    );
  }

  const isAllowed = status?.allowed ?? false;
  const score = status?.trust_score ?? 100;

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Result Publication Gate</span>
            <span className="text-[9px] px-2 py-0.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded uppercase font-mono font-bold tracking-widest">
              Release Gate
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Audit release gate checklist enforcing security thresholds before grading publication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-lg transition"
          >
            🏢 Authority Console
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Final Gate Verdict (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850 flex flex-col justify-between items-center text-center min-h-[340px] shadow-lg">
            <div className="flex flex-col items-center">
              <div className={`p-4 rounded-full border mb-4 ${
                isAllowed 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                  : "bg-red-500/10 border-red-500/25 text-red-400 animate-pulse"
              }`}>
                {isAllowed ? <Unlock className="w-8 h-8 stroke-[2.5]" /> : <Lock className="w-8 h-8 stroke-[2.5]" />}
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                {isAllowed ? "Gate Unlocked" : "Gate Locked"}
              </h3>
              <span className="block text-[10px] text-slate-500 font-mono mt-1 uppercase font-bold">
                Status: {isAllowed ? "Release Allowed" : "Lockout Enforced"}
              </span>
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed max-w-[180px]">
                {isAllowed
                  ? "All cryptographic verification passes check and integrity score satisfies policy. Release authorized."
                  : "Release is BLOCKED because the exam configuration fails security checks."}
              </p>
            </div>

            <div className="w-full space-y-3 mt-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Integrity Index</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-black text-white">{score} / 100</span>
                  <span className={`w-2 h-2 rounded-full ${score >= 90 ? "bg-emerald-400" : "bg-red-400 animate-ping"}`} />
                </div>
              </div>

              <button
                onClick={handlePublishResults}
                disabled={!isAllowed || publishing}
                className={`w-full py-2.5 rounded-lg font-black text-xs transition-all duration-200 uppercase font-mono tracking-wider cursor-pointer ${
                  isAllowed
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850"
                }`}
              >
                {publishing ? "Decrypting..." : isAllowed ? "Release Results" : "Blocked"}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Checklist (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between shadow-lg">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Cryptographic Check Checklist</span>
            </h2>
            
            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {status?.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 ${
                    item.passed
                      ? "border-emerald-500/10 bg-emerald-500/2"
                      : item.critical
                      ? "border-red-500/10 bg-red-500/2"
                      : "border-amber-500/10 bg-amber-500/2"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.passed ? "bg-emerald-400" : item.critical ? "bg-red-400" : "bg-amber-400"
                      }`} />
                      <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                      {item.critical && (
                        <span className="px-1.5 py-0.2 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-mono font-bold rounded uppercase tracking-wider">
                          P0 Rule
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal pr-2">
                      {item.details}
                    </p>
                  </div>
                  
                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 ${
                    item.passed ? "text-emerald-400" : item.critical ? "text-red-400" : "text-amber-400"
                  }`}>
                    {item.passed ? "✓ Passed" : "❌ Blocked"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Blocking Reasons Explainer (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Blocking Reasons card */}
          {!isAllowed && (
            <div className="bg-slate-900 p-5 rounded-2xl border border-red-500/10 shadow-lg flex-1">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 font-mono flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-500" />
                <span>Blocked Explainer</span>
              </h3>
              
              <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
                {status?.critical_issues.map((issue, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono leading-normal">
                    <div className="text-red-400 font-bold text-[9px] mb-1">{issue.code}</div>
                    <div className="text-slate-300 font-medium text-[11px]">{issue.message}</div>
                    {issue.details && (
                      <div className="mt-2 text-[9px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-900 break-all max-w-full">
                        {issue.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAllowed && (
            <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/15 shadow-lg flex-1 flex flex-col justify-between font-mono text-xs">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Safety Check Cleared</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  The system has checked the ledger integrity blocks, OMR scanners, and evaluators. No anomalies detected.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 mt-4">
                <span className="text-[8px] text-slate-500 uppercase block font-bold">Release Decryption Signature</span>
                <span className="text-cyan-400 break-all text-[9px] block mt-1 leading-normal">
                  sha256:881ad3f9429188e001ba7e44...
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Release details/report output */}
      {publishResult && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/20 shadow-md animate-in fade-in duration-200 font-mono text-xs">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Publishing Success Report</span>
          </h3>
          <p className="text-slate-300 leading-relaxed mb-3">
            {publishResult.message}
          </p>
          <div className="bg-slate-950 rounded p-3 border border-slate-850 max-h-[160px] overflow-y-auto space-y-1">
            {publishResult.results.map((r: any, idx: number) => (
              <div key={idx} className="flex justify-between py-1 border-b border-slate-900 last:border-0 text-[11px]">
                <span className="text-slate-400">{r.candidate_anonymous_id}</span>
                <span className="text-emerald-400 font-bold">{r.score} marks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {publishError && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-red-500/20 shadow-md animate-in fade-in duration-200 font-mono text-xs">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 font-mono">
            Publishing Failure Report
          </h3>
          <p className="text-red-400 leading-normal mb-2">
            {publishError.message}
          </p>
          {publishError.failures && (
            <div className="bg-slate-950 rounded p-3 border border-slate-850 text-slate-500 leading-relaxed">
              {publishError.failures.map((f: string, idx: number) => (
                <div key={idx}>- {f}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
