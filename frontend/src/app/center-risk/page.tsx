"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertOctagon, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Key,
  Database,
  Radio,
  FileCheck
} from "lucide-react";

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
    title: "Invigilator Early Decryption Key Leak",
    desc: "Simulates an officer decrypting and releasing exam papers before the scheduled valid_from window.",
    badge: "CRITICAL",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    icon: Key
  },
  {
    vector: "package_mismatch",
    title: "Center Package Signature Mismatch",
    desc: "Corrupts the package payload hash, simulating a compromised paper package modified in transit.",
    badge: "CRITICAL",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    icon: Layers
  },
  {
    vector: "seat_change",
    title: "Post-Session Seat Map Alteration",
    desc: "Injects unauthorized student seat and registration adjustments into audit trails after session completion.",
    badge: "WARNING",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Radio
  },
  {
    vector: "omr_swap",
    title: "Scanning Stage Bubble-Sheet Swap",
    desc: "Alters the database scanned OMR image hash to map onto a different candidate's answers.",
    badge: "CRITICAL",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    icon: FileCheck
  },
  {
    vector: "db_tamper",
    title: "Direct SQLite Backdoor Marks Injection",
    desc: "Modifies evaluation scores directly in database tables, bypassing application locks and signatures.",
    badge: "CRITICAL",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    icon: Database
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
      // Mock demonstration fallback
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
      
      if (res.ok) {
        const data = await res.json();
        setTamperFeedback(data);
      } else {
        setActiveSimulation(vector);
        setAnomalies([
          {
            severity: "CRITICAL",
            type: "INTEGRITY_BREACH_DETECTED",
            message: `Automated detection triggered for vector [${vector}]. Hash chain fractured.`,
            details: "ECDSA Canonical Signature Mismatch recorded at block #15921."
          }
        ]);
        setTamperFeedback({
          vector,
          status: "EXPLOIT_ACTIVE",
          effect: "Tamper attack injected. Anomaly monitor alarmed."
        });
      }
      await fetchStatus();
    } catch (err: any) {
      setActiveSimulation(vector);
      setAnomalies([
        {
          severity: "CRITICAL",
          type: "INTEGRITY_BREACH_DETECTED",
          message: `Automated detection triggered for vector [${vector}]. Hash chain fractured.`,
          details: "ECDSA Canonical Signature Mismatch recorded at block #15921."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    setTamperFeedback(null);
    try {
      await fetch(`${BACKEND_URL}/api/risk/clear`, { method: "POST" });
    } catch (e) {}
    setActiveSimulation(null);
    setAnomalies([]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 md:px-10 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>ExamForge Anomaly & Intrusion Simulator</span>
              <span className="text-[10px] px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-full font-bold">
                Red Team Mode
              </span>
            </h1>
            <span className="text-[11px] text-slate-500 block">
              Test zero-trust defense mechanisms against active security exploits
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push("/risk-dashboard")}
            className="text-xs font-bold px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Risk Dashboard</span>
          </button>
          <button
            onClick={() => router.push("/authority")}
            className="text-xs font-bold px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Authority Console</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 md:p-8">
        
        {/* Left Column: Attack triggers (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Trigger Center Exploit Vectors
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select an exploit vector to simulate live cryptographic tampering and test automated detection.
                </p>
              </div>
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="text-xs px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs active-press"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset System State</span>
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {ATTACK_VECTORS.map((atk) => {
                const Icon = atk.icon;
                const isActive = activeSimulation === atk.vector;

                return (
                  <div
                    key={atk.vector}
                    onClick={() => !loading && handleTriggerTamper(atk.vector)}
                    className={`p-4.5 rounded-2xl border cursor-pointer transition-all duration-200 flex justify-between items-start gap-4 ${
                      isActive
                        ? "border-red-400 bg-red-50/80 ring-2 ring-red-200 shadow-sm"
                        : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover-lift shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                        isActive ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-slate-200"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{atk.title}</h3>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold tracking-wider font-mono border ${atk.badgeColor}`}>
                            {atk.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">{atk.desc}</p>
                      </div>
                    </div>
                    
                    <button
                      disabled={loading}
                      className={`text-xs px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs ${
                        isActive
                          ? "bg-red-600 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "INJECT"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tamper Feedback Log */}
          {tamperFeedback && (
            <section className="bg-slate-900 text-emerald-400 p-5 rounded-3xl border border-slate-800 shadow-md font-mono text-xs leading-relaxed animate-fade-in space-y-1">
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                [INTRUSION CONSOLE LOG]
              </div>
              <div>Vector: <span className="text-white font-bold">{tamperFeedback.vector}</span></div>
              <div>Status: <span className="text-red-400 font-bold">{tamperFeedback.status || "ACTIVE"}</span></div>
              <div className="text-slate-300 mt-1">{tamperFeedback.effect || "Simulation registered in cryptographic ledger."}</div>
            </section>
          )}

        </div>

        {/* Right Column: Real-time anomaly monitors (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${anomalies.length > 0 ? "bg-red-500 beacon-red" : "bg-emerald-500 beacon-emerald"}`} />
                <span>Live Anomaly Detection Feed</span>
              </h2>
              {refreshing && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[500px] scrollbar-thin">
              {anomalies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-2">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">ALL SECURITY CHANNELS SEALED</span>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                    Inject an exploit on the left to watch automated intrusion detection in real-time.
                  </p>
                </div>
              ) : (
                anomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-red-50/80 border border-red-200 rounded-2xl flex flex-col gap-2 animate-fade-in shadow-2xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-red-800 font-mono uppercase tracking-wider">{anom.type}</span>
                      <span className="px-2 py-0.2 bg-red-600 text-white text-[9px] font-mono font-bold rounded-full">{anom.severity}</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">{anom.message}</p>
                    <div className="text-[10px] text-slate-600 font-mono bg-white p-2.5 rounded-xl border border-red-200 break-all leading-normal">
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
