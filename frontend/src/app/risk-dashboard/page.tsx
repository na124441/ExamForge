"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";
const EXAM_ID = "EXM-001";

interface PenaltyDetails {
  audit_ledger: number;
  candidate_chains: number;
  evaluator_conflicts: number;
  omr_confidence: number;
  system_anomalies: number;
}

interface Issue {
  code: string;
  message: string;
  details: string;
}

interface StatDetails {
  total_candidates: number;
  tampered_candidates: number;
  grading_conflicts: number;
  omr_review_required: number;
  system_anomalies_count: number;
}

interface TrustScoreReport {
  exam_id: string;
  trust_score: number;
  audit_chain_intact: boolean;
  penalties: PenaltyDetails;
  critical_issues: Issue[];
  warnings: Issue[];
  manual_reviews: { type: string; item_id: string; description: string }[];
  stats: StatDetails;
}

export default function RiskDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [report, setReport] = useState<TrustScoreReport | null>(null);
  const [omrQueue, setOmrQueue] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"ALERTS" | "OMR" | "CONFLICTS">("ALERTS");

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) setToken(storedToken);
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Autorefresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch trust score
      const resScore = await fetch(`${BACKEND_URL}/api/trust/score/${EXAM_ID}`);
      if (!resScore.ok) throw new Error("Failed to load trust score report");
      const scoreData = await resScore.json();
      setReport(scoreData);

      // 2. Fetch OMR queue
      const resOmr = await fetch(`${BACKEND_URL}/api/risk/omr-queue/${EXAM_ID}`);
      if (resOmr.ok) {
        const omrData = await resOmr.json();
        setOmrQueue(omrData);
      }

      // 3. Fetch Evaluator Conflicts
      const resConf = await fetch(`${BACKEND_URL}/api/risk/evaluator-conflicts/${EXAM_ID}`);
      if (resConf.ok) {
        const confData = await resConf.json();
        setConflicts(confData.conflicts || []);
      }
      
      setError("");
    } catch (err: any) {
      setError(err.message || "Could not retrieve risk metrics.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveOMR = async (scanId: string) => {
    alert(`OMR Scan ${scanId} manually reviewed and locked at 100% confidence.`);
    // In demo, we just trigger refresh
    fetchDashboardData();
  };

  const handleResolveConflict = async (candId: string, qId: string) => {
    alert(`Marks conflict resolved for candidate ${candId} on question ${qId}. Secondary grading locked.`);
    fetchDashboardData();
  };

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm tracking-wider">DECRYPTING SECURITY INTELLIGENCE FEED...</div>
      </div>
    );
  }

  const trustScore = report?.trust_score ?? 100.0;
  const isHealthy = trustScore >= 90.0;
  const isCompromised = trustScore < 70.0;
  const scoreColor = isCompromised
    ? "stroke-accent-red text-accent-red"
    : isHealthy
    ? "stroke-accent-emerald text-accent-emerald"
    : "stroke-accent-amber text-accent-amber";

  const scoreGlow = isCompromised
    ? "shadow-accent-red/20 border-accent-red/20"
    : isHealthy
    ? "shadow-accent-emerald/20 border-accent-emerald/20"
    : "shadow-accent-amber/20 border-accent-amber/20";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-card-bg border-b border-border-color p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse">📡</span>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              ExamForge TrustOps <span className="text-xs px-2 py-0.5 bg-accent-red/10 border border-accent-red/30 text-accent-red font-mono rounded">Control Center v0.3</span>
            </h1>
            <p className="text-xs text-text-muted">Real-time zero-trust cryptographic intrusion & grading auditor</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/center-risk")}
            className="text-xs px-3 py-1.5 bg-accent-amber/10 border border-accent-amber/30 text-accent-amber rounded hover:bg-accent-amber/20 transition cursor-pointer"
          >
            🔥 Attack Simulator
          </button>
          <button
            onClick={() => router.push("/publication-gate")}
            className="text-xs px-3 py-1.5 bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald rounded hover:bg-accent-emerald/20 transition cursor-pointer"
          >
            🚧 Publication Gate
          </button>
          <button
            onClick={() => router.push("/controller")}
            className="text-xs px-3 py-1.5 bg-border-color border border-border-color text-white rounded hover:bg-white/5 transition cursor-pointer"
          >
            ⬅️ Controller Panel
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {error && (
          <div className="p-4 bg-accent-red/15 border border-accent-red/30 text-accent-red rounded-xl text-xs flex items-center gap-2 font-mono">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Top Analytics Dashboard Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dial / Circular Gauge */}
          <div className={`bg-card-bg p-6 rounded-2xl border border-border-color shadow-xl flex flex-col items-center justify-center relative overflow-hidden`}>
            <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-text-muted">Exam Integrity Score</div>
            
            <div className="relative w-40 h-40 flex items-center justify-center mt-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  strokeWidth="8"
                  stroke="#1c2c4c"
                  fill="transparent"
                />
                {/* Glowing Score Bar */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  strokeWidth="8"
                  className={scoreColor}
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - trustScore / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Central Text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-white tracking-tight">{Math.round(trustScore)}</span>
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Score</span>
              </div>
            </div>
            
            <div className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold border ${
              isCompromised ? "bg-accent-red/10 border-accent-red/30 text-accent-red" :
              isHealthy ? "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald" :
              "bg-accent-amber/10 border-accent-amber/30 text-accent-amber"
            }`}>
              {isCompromised ? "🚨 CRITICAL RISK" : isHealthy ? "🛡️ SECURE STATE" : "⚠️ WARNING STATUS"}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="bg-card-bg p-4 rounded-xl border border-border-color flex flex-col justify-between hover:border-white/10 transition-colors">
              <span className="text-xs text-text-muted uppercase font-bold">Total Candidates</span>
              <span className="text-3xl font-extrabold text-white mt-2 font-mono">{report?.stats.total_candidates ?? 0}</span>
              <span className="text-[10px] text-accent-emerald mt-1">Verified Session Keys</span>
            </div>

            <div className={`bg-card-bg p-4 rounded-xl border flex flex-col justify-between transition-colors ${
              (report?.stats.tampered_candidates ?? 0) > 0 ? "border-accent-red/50 bg-accent-red/5" : "border-border-color"
            }`}>
              <span className="text-xs text-text-muted uppercase font-bold">Tampered Chains</span>
              <span className="text-3xl font-extrabold text-white mt-2 font-mono">{report?.stats.tampered_candidates ?? 0}</span>
              <span className="text-[10px] text-text-muted mt-1">
                {(report?.stats.tampered_candidates ?? 0) > 0 ? "⚠️ Hash Discrepancies!" : "Perfect Cryptographic Links"}
              </span>
            </div>

            <div className={`bg-card-bg p-4 rounded-xl border flex flex-col justify-between transition-colors ${
              (report?.stats.grading_conflicts ?? 0) > 0 ? "border-accent-amber/50 bg-accent-amber/5" : "border-border-color"
            }`}>
              <span className="text-xs text-text-muted uppercase font-bold">Grading Conflicts</span>
              <span className="text-3xl font-extrabold text-white mt-2 font-mono">{report?.stats.grading_conflicts ?? 0}</span>
              <span className="text-[10px] text-text-muted mt-1">
                {(report?.stats.grading_conflicts ?? 0) > 0 ? "⚠️ Multi-Evaluator Discrepancy" : "Grades Converge Perfectly"}
              </span>
            </div>

            <div className={`bg-card-bg p-4 rounded-xl border flex flex-col justify-between transition-colors ${
              (report?.stats.omr_review_required ?? 0) > 0 ? "border-accent-amber/40" : "border-border-color"
            }`}>
              <span className="text-xs text-text-muted uppercase font-bold">OMR Review Queue</span>
              <span className="text-3xl font-extrabold text-white mt-2 font-mono">{report?.stats.omr_review_required ?? 0}</span>
              <span className="text-[10px] text-text-muted mt-1">Bubble Confidence &lt; 85%</span>
            </div>

            <div className={`bg-card-bg p-4 rounded-xl border flex flex-col justify-between transition-colors ${
              (report?.stats.system_anomalies_count ?? 0) > 0 ? "border-accent-red/50 bg-accent-red/5" : "border-border-color"
            }`}>
              <span className="text-xs text-text-muted uppercase font-bold">System Anomalies</span>
              <span className="text-3xl font-extrabold text-white mt-2 font-mono">{report?.stats.system_anomalies_count ?? 0}</span>
              <span className="text-[10px] text-text-muted mt-1">Intrusion vectors detected</span>
            </div>

            <div className="bg-card-bg p-4 rounded-xl border border-border-color flex flex-col justify-between">
              <span className="text-xs text-text-muted uppercase font-bold">Audit Ledger Status</span>
              <span className="text-lg font-bold text-white mt-3 flex items-center gap-1.5">
                {report?.audit_chain_intact ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald animate-pulse"></span>
                    <span className="text-accent-emerald font-mono text-sm uppercase">Linked</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-red animate-ping"></span>
                    <span className="text-accent-red font-mono text-sm uppercase">BROKEN</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-text-muted mt-1">Cryptographic Ledger Chain</span>
            </div>
            
          </div>
        </div>

        {/* Tabs for detailed feeds */}
        <div className="flex border-b border-border-color">
          <button
            onClick={() => setActiveTab("ALERTS")}
            className={`px-4 py-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "ALERTS"
                ? "border-accent-emerald text-accent-emerald bg-white/2"
                : "border-transparent text-text-muted hover:text-white"
            }`}
          >
            🚨 Alerts & Warnings ({ (report?.critical_issues.length ?? 0) + (report?.warnings.length ?? 0) })
          </button>
          <button
            onClick={() => setActiveTab("OMR")}
            className={`px-4 py-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "OMR"
                ? "border-accent-emerald text-accent-emerald bg-white/2"
                : "border-transparent text-text-muted hover:text-white"
            }`}
          >
            📝 OMR Confidence bands ({ report?.stats.omr_review_required ?? 0 })
          </button>
          <button
            onClick={() => setActiveTab("CONFLICTS")}
            className={`px-4 py-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "CONFLICTS"
                ? "border-accent-emerald text-accent-emerald bg-white/2"
                : "border-transparent text-text-muted hover:text-white"
            }`}
          >
            ⚖️ Evaluator conflicts ({ report?.stats.grading_conflicts ?? 0 })
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-card-bg rounded-2xl border border-border-color p-6 min-h-[300px] shadow-sm">
          
          {/* TAB 1: ALERTS & WARNINGS FEED */}
          {activeTab === "ALERTS" && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Cryptographic Intrusion & Risk Feed</h3>
              
              {report?.critical_issues.length === 0 && report.warnings.length === 0 ? (
                <div className="text-center py-16 text-text-muted text-xs font-mono">
                  🟢 NO RISK SIGNATURES IDENTIFIED. SYSTEM HEALTHY.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Critical Issues */}
                  {report?.critical_issues.map((issue, idx) => (
                    <div
                      key={`crit-${idx}`}
                      className="p-4 bg-accent-red/10 border-l-4 border-accent-red border border-border-color rounded-r-xl flex flex-col md:flex-row gap-4 items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-accent-red text-background text-[9px] font-bold rounded uppercase">CRITICAL</span>
                          <span className="text-xs font-mono font-bold text-white">{issue.code}</span>
                        </div>
                        <p className="text-xs text-text-primary font-medium">{issue.message}</p>
                        <div className="mt-2 text-[10px] text-text-muted font-mono bg-background/50 p-2 rounded border border-border-color/30 break-all leading-normal">
                          {issue.details}
                        </div>
                      </div>
                      <span className="text-xl">🚨</span>
                    </div>
                  ))}
                  
                  {/* Warnings */}
                  {report?.warnings.map((issue, idx) => (
                    <div
                      key={`warn-${idx}`}
                      className="p-4 bg-accent-amber/5 border-l-4 border-accent-amber border border-border-color rounded-r-xl flex flex-col md:flex-row gap-4 items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-accent-amber text-background text-[9px] font-bold rounded uppercase">WARNING</span>
                          <span className="text-xs font-mono font-bold text-white">{issue.code}</span>
                        </div>
                        <p className="text-xs text-text-primary font-medium">{issue.message}</p>
                        <div className="mt-2 text-[10px] text-text-muted font-mono bg-background/50 p-2 rounded border border-border-color/30 break-all leading-normal">
                          {issue.details}
                        </div>
                      </div>
                      <span className="text-xl">⚠️</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OMR CONFIDENCE BANDS review queue */}
          {activeTab === "OMR" && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">OMR Scan Confidence review queue</h3>
                <span className="text-xs text-text-muted">Bands: Manual Review (&lt;70%) & Low Confidence (&lt;85%)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-color text-text-muted font-semibold">
                      <th className="py-2.5">Scan ID</th>
                      <th className="py-2.5">Candidate Anonymous ID</th>
                      <th className="py-2.5">Lowest Confidence</th>
                      <th className="py-2.5">Detected Answers</th>
                      <th className="py-2.5">Classification</th>
                      <th className="py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/40">
                    {!omrQueue || (omrQueue.MANUAL_REVIEW.length === 0 && omrQueue.LOW_CONFIDENCE.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-text-muted font-mono text-xs">
                          🟢 NO OMR SCANS REQUIRING MANUAL BUBBLE REVIEW.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {/* Manual Review Items */}
                        {omrQueue.MANUAL_REVIEW.map((item: any) => (
                          <tr key={item.scan_id} className="hover:bg-white/2 bg-accent-red/5">
                            <td className="py-3 font-mono text-white">{item.scan_id.slice(0, 8)}...</td>
                            <td className="py-3 font-mono text-white/95">{item.candidate_anonymous_id}</td>
                            <td className="py-3 font-mono text-accent-red font-bold">{Math.round(item.lowest_confidence * 100)}%</td>
                            <td className="py-3 font-mono text-text-primary">{JSON.stringify(item.detected_answers)}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 bg-accent-red text-background text-[9px] font-bold rounded">MANUAL REVIEW</span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => handleResolveOMR(item.scan_id)}
                                className="px-2 py-1 bg-accent-emerald text-background font-bold rounded text-[10px] hover:bg-accent-emerald/90 transition cursor-pointer"
                              >
                                Resolve
                              </button>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Low Confidence Items */}
                        {omrQueue.LOW_CONFIDENCE.map((item: any) => (
                          <tr key={item.scan_id} className="hover:bg-white/2">
                            <td className="py-3 font-mono">{item.scan_id.slice(0, 8)}...</td>
                            <td className="py-3 font-mono text-white/80">{item.candidate_anonymous_id}</td>
                            <td className="py-3 font-mono text-accent-amber font-semibold">{Math.round(item.lowest_confidence * 100)}%</td>
                            <td className="py-3 font-mono text-text-muted">{JSON.stringify(item.detected_answers)}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 bg-accent-amber text-background text-[9px] font-bold rounded">LOW CONFIDENCE</span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => handleResolveOMR(item.scan_id)}
                                className="px-2 py-1 bg-border-color text-white rounded text-[10px] hover:bg-white/5 transition cursor-pointer"
                              >
                                Audit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EVALUATOR CONFLICTS */}
          {activeTab === "CONFLICTS" && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Evaluator Grading Variance conflicts</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-color text-text-muted font-semibold">
                      <th className="py-2.5">Candidate Anonymous ID</th>
                      <th className="py-2.5">Question ID</th>
                      <th className="py-2.5">Evaluator 1</th>
                      <th className="py-2.5">Marks 1</th>
                      <th className="py-2.5">Evaluator 2</th>
                      <th className="py-2.5">Marks 2</th>
                      <th className="py-2.5">Variance</th>
                      <th className="py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/40">
                    {conflicts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-text-muted font-mono text-xs">
                          🟢 NO GRADING CONFLICTS DETECTED. ALL EVALUATIONS WITHIN THRESHOLD.
                        </td>
                      </tr>
                    ) : (
                      conflicts.map((c, idx) => (
                        <tr key={idx} className="hover:bg-white/2 bg-accent-amber/5">
                          <td className="py-3 font-mono text-white">{c.candidate_anonymous_id}</td>
                          <td className="py-3 font-mono text-white/95">{c.question_id}</td>
                          <td className="py-3 font-mono">{c.evaluator_1.slice(0, 8)}...</td>
                          <td className="py-3 font-mono font-semibold text-white">{c.marks_1}</td>
                          <td className="py-3 font-mono">{c.evaluator_2.slice(0, 8)}...</td>
                          <td className="py-3 font-mono font-semibold text-white">{c.marks_2}</td>
                          <td className="py-3 font-mono text-accent-red font-bold font-mono">+{c.difference.toFixed(1)}</td>
                          <td className="py-3">
                            <button
                              onClick={() => handleResolveConflict(c.candidate_anonymous_id, c.question_id)}
                              className="px-2 py-1 bg-accent-emerald text-background font-bold rounded text-[10px] hover:bg-accent-emerald/90 transition cursor-pointer"
                            >
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
