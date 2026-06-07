"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const interval = setInterval(fetchGateStatus, 4000);
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
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <div className="text-sm">CHECKING GATE VERIFICATION POLICIES...</div>
      </div>
    );
  }

  const isAllowed = status?.allowed ?? false;
  const score = status?.trust_score ?? 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚧</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ExamForge <span className="text-accent-emerald text-xs px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded font-mono">Result Publication Gate</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/risk-dashboard")}
            className="text-xs px-3 py-1 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald rounded hover:bg-accent-emerald/20 transition cursor-pointer"
          >
            🛡️ Risk Dashboard
          </button>
          <button
            onClick={() => router.push("/controller")}
            className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer"
          >
            ⬅️ Controller Panel
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Policy Checklist (2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald"></span> Cryptographic Custody Checklist
            </h2>
            <p className="text-xs text-text-muted mb-6">
              The publication gate explicitly blocks the release of grades if any P0 security rule fails or the Exam Integrity Score falls below 90.
            </p>

            <div className="flex flex-col gap-4">
              {status?.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex gap-3.5 items-start justify-between ${
                    item.passed
                      ? "border-accent-emerald/25 bg-accent-emerald/2"
                      : item.critical
                      ? "border-accent-red/35 bg-accent-red/5"
                      : "border-accent-amber/35 bg-accent-amber/2"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        item.passed ? "bg-accent-emerald" : item.critical ? "bg-accent-red" : "bg-accent-amber"
                      }`}></span>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      {item.critical && (
                        <span className="px-1.5 py-0.5 bg-accent-red/10 border border-accent-red/20 text-accent-red text-[8px] font-mono font-bold rounded uppercase">
                          P0 RULE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-2">{item.details}</p>
                  </div>
                  
                  <span className={`text-lg font-bold font-mono ${
                    item.passed ? "text-accent-emerald" : item.critical ? "text-accent-red" : "text-accent-amber"
                  }`}>
                    {item.passed ? "✓ PASSED" : "❌ FAILED"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Detailed blocking issues if failed */}
          {!isAllowed && (
            <section className="bg-card-bg p-5 rounded-2xl border border-accent-red/20 shadow-md">
              <h3 className="text-xs font-bold text-accent-red uppercase tracking-wider mb-3 font-mono">
                CRITICAL BLOCKED EXPLAINER
              </h3>
              <div className="flex flex-col gap-3">
                {status?.critical_issues.map((issue, idx) => (
                  <div key={idx} className="p-3 bg-background/50 rounded-xl border border-border-color text-xs font-mono leading-normal">
                    <div className="text-accent-red font-bold font-mono text-[10px] mb-1">{issue.code}</div>
                    <div className="text-white/95 font-medium">{issue.message}</div>
                    {issue.details && (
                      <div className="mt-2 text-[10px] text-text-muted bg-background/80 p-2 rounded border border-border-color/30 break-all">
                        {issue.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Side: Gate Actions (1 column) */}
        <div className="flex flex-col gap-6">
          
          {/* Release card */}
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col justify-between items-center text-center min-h-[300px]">
            <div>
              <span className="text-4xl">{isAllowed ? "🔓" : "🔒"}</span>
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider mt-3">
                {isAllowed ? "GATE UNLOCKED" : "GATE LOCKOUT"}
              </h3>
              <p className="text-xs text-text-muted mt-2 max-w-[200px] mx-auto leading-relaxed">
                {isAllowed
                  ? "All P0 cryptographic signatures and trust levels verify successfully. Results release is authorized."
                  : "Result release is BLOCKED because the exam fails to meet safety policies."}
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mt-6">
              {/* Trust Score Gauge in Gate */}
              <div className="p-4 bg-background/50 rounded-xl border border-border-color flex justify-between items-center text-left">
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Integrity Score</div>
                  <div className="text-sm font-bold text-white mt-0.5">{score}/100</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${score >= 90 ? "bg-accent-emerald" : "bg-accent-red animate-ping"}`}></div>
              </div>

              <button
                onClick={handlePublishResults}
                disabled={!isAllowed || publishing}
                className={`w-full py-2.5 rounded font-extrabold text-xs transition-colors cursor-pointer uppercase ${
                  isAllowed
                    ? "bg-accent-emerald text-background hover:bg-accent-emerald/90"
                    : "bg-border-color text-text-muted cursor-not-allowed"
                }`}
              >
                {publishing ? "Publishing results..." : isAllowed ? "Release Results" : "Publishing Blocked"}
              </button>
            </div>
          </section>

          {/* Publishing success output */}
          {publishResult && (
            <section className="bg-card-bg p-5 rounded-2xl border border-accent-emerald/20 shadow-md animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-accent-emerald uppercase tracking-wider mb-2 font-mono">
                PUBLISHING SUCCESS REPORT
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-3">
                {publishResult.message}
              </p>
              <div className="bg-background/80 rounded p-3 border border-border-color/30 font-mono text-[10px] text-white/95 max-h-[150px] overflow-y-auto">
                {publishResult.results.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-border-color/20 last:border-0">
                    <span>{r.candidate_anonymous_id}</span>
                    <span className="text-accent-emerald">{r.score} marks</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Publishing error output */}
          {publishError && (
            <section className="bg-card-bg p-5 rounded-2xl border border-accent-red/20 shadow-md animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-accent-red uppercase tracking-wider mb-2 font-mono">
                PUBLISHING FAILURE REPORT
              </h3>
              <p className="text-xs text-accent-red leading-normal font-mono mb-2">
                {publishError.message}
              </p>
              {publishError.failures && (
                <div className="bg-background/80 rounded p-3 border border-border-color/30 font-mono text-[10px] text-text-muted leading-relaxed">
                  {publishError.failures.map((f: string, idx: number) => (
                    <div key={idx}>- {f}</div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>

      </main>

    </div>
  );
}
