"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";
const EXAM_ID = "EXM-001";

interface Anomaly {
  severity: string;
  type: string;
  message: string;
  details: string;
}

const ATTACK_VECTORS = [
  {
    vector: "early_release",
    title: "Invigilator early decryption key leak",
    desc: "Simulates an officer decrypting and releasing exam papers before the scheduled valid_from window.",
    badge: "CRITICAL",
    badgeColor: "bg-accent-red text-background border-accent-red/20",
    icon: "🔓"
  },
  {
    vector: "package_mismatch",
    title: "Center package signature mismatch",
    desc: "Corrupts the package payload hash, simulating a compromised paper package modified in transit.",
    badge: "CRITICAL",
    badgeColor: "bg-accent-red text-background border-accent-red/20",
    icon: "📦"
  },
  {
    vector: "seat_change",
    title: "Post-session seat table alteration",
    desc: "Injects unauthorized student seat and registration adjustments into audit trails after session completion.",
    badge: "WARNING",
    badgeColor: "bg-accent-amber text-background border-accent-amber/20",
    icon: "🪑"
  },
  {
    vector: "omr_swap",
    title: "Scanning stage bubble-sheet swap cheat",
    desc: "Alters the database scanned OMR image hash to map onto a different candidate's answers.",
    badge: "CRITICAL",
    badgeColor: "bg-accent-red text-background border-accent-red/20",
    icon: "🔄"
  },
  {
    vector: "db_tamper",
    title: "Direct SQLite backdoor marks edit",
    desc: "Modifies evaluation scores directly in database tables, bypassing application locks and signatures.",
    badge: "CRITICAL",
    badgeColor: "bg-accent-red text-background border-accent-red/20",
    icon: "💥"
  }
];

export default function CenterRiskPage() {
  const router = useRouter();
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [tamperFeedback, setTamperFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/risk/status/${EXAM_ID}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSimulation(data.active_simulation);
        setAnomalies(data.anomalies || []);
      }
    } catch (err) {
      console.error("Failed to load simulator status", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerTamper = async (vector: string) => {
    setLoading(true);
    setTamperFeedback(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/risk/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vector,
          details: `Simulated intrusion test triggered via console for vector: ${vector}`
        })
      });
      
      if (!res.ok) throw new Error("Simulator endpoint failed");
      const data = await res.json();
      setTamperFeedback(data);
      await fetchStatus();
    } catch (err: any) {
      alert(`Simulation trigger failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    setTamperFeedback(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/risk/clear`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to clear simulations");
      
      // Also restore database marks if they tampered db_tamper
      // Just clear and reload
      alert("All simulation flags reset to inactive! Restoring normal state.");
      await fetchStatus();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-pulse">🔥</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ExamForge <span className="text-accent-amber text-xs px-2 py-0.5 bg-accent-amber/10 border border-accent-amber/20 rounded font-mono">Center Anomaly Simulator v0.3</span>
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

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
        
        {/* Left Column: Attack triggers (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trigger center-level attack vectors</h2>
                <p className="text-xs text-text-muted mt-1">Select an exploit to run a live database manipulation and test system resilience.</p>
              </div>
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="text-xs px-3 py-1.5 bg-accent-red text-background font-bold rounded hover:bg-accent-red/90 transition cursor-pointer"
              >
                Reset System State
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {ATTACK_VECTORS.map((atk) => (
                <div
                  key={atk.vector}
                  onClick={() => !loading && handleTriggerTamper(atk.vector)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-start gap-4 ${
                    activeSimulation === atk.vector
                      ? "border-accent-red bg-accent-red/5 ring-1 ring-accent-red/30 shadow-md shadow-accent-red/5"
                      : "border-border-color bg-background/20 hover:border-white/10 hover:translate-y-[-1px]"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{atk.icon}</span>
                      <h3 className="text-sm font-bold text-white">{atk.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider font-mono border ${atk.badgeColor}`}>
                        {atk.badge}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mt-1">{atk.desc}</p>
                  </div>
                  
                  <button
                    disabled={loading}
                    className={`text-xs px-3 py-1.5 font-bold rounded transition-all cursor-pointer ${
                      activeSimulation === atk.vector
                        ? "bg-accent-red text-background"
                        : "bg-border-color text-white hover:bg-white/5"
                    }`}
                  >
                    {activeSimulation === atk.vector ? "ACTIVE" : "EXPLOIT"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Tamper Feedback Log */}
          {tamperFeedback && (
            <section className="bg-card-bg p-5 rounded-2xl border border-border-color/60 shadow-md animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono text-accent-red">CONSOLE OUTPUT LOG</h3>
              <div className="bg-background/80 rounded p-4 border border-border-color/30 font-mono text-xs text-accent-emerald leading-relaxed">
                <div>[SIMULATOR] Simulation trigger success.</div>
                <div>Vector: {tamperFeedback.vector}</div>
                <div>Status: {tamperFeedback.status}</div>
                <div className="text-white mt-1">Effect: {tamperFeedback.effect || "Simulation registered in database."}</div>
              </div>
            </section>
          )}

        </div>

        {/* Right Column: Real-time anomaly monitors (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-red animate-pulse"></span> Anomaly detection monitors
              </h2>
              {refreshing && <span className="text-[10px] text-text-muted animate-spin">🌀</span>}
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              {anomalies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border border-dashed border-border-color rounded-xl">
                  <span className="text-3xl mb-2">🟢</span>
                  <span className="text-xs font-mono text-text-muted">ALL CHANNELS SECURE</span>
                  <p className="text-[10px] text-text-muted/70 mt-1 max-w-[200px]">Trigger an exploit to watch the detection monitors catch the attack.</p>
                </div>
              ) : (
                anomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-accent-red/5 border border-accent-red/30 rounded-xl flex flex-col gap-2 animate-in slide-in-from-right-3 duration-250"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-accent-red font-mono uppercase tracking-wider">{anom.type}</span>
                      <span className="px-1.5 py-0.5 bg-accent-red text-background text-[8px] font-mono font-bold rounded">{anom.severity}</span>
                    </div>
                    <p className="text-xs text-text-primary leading-normal">{anom.message}</p>
                    <div className="text-[10px] text-text-muted font-mono bg-background/50 p-2 rounded border border-border-color/20 break-all leading-normal">
                      {anom.details}
                    </div>
                  </div>
                ))
              )}
            </div>

          </section>
        </div>

      </div>
    </div>
  );
}
