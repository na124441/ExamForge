"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

interface OverviewStats {
  readiness_score: number;
  status: string;
  threats: { total: number; unmitigated: number };
  incidents: { total: number; open: number };
  hardening: { total: number; passed: number };
}

export default function SecurityOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const [resScore, resThreats, resIncidents, resHardening] = await Promise.all([
        fetch(`${BACKEND_URL}/api/compliance/readiness-score`, { headers }),
        fetch(`${BACKEND_URL}/api/security/threats`, { headers }),
        fetch(`${BACKEND_URL}/api/security-incidents`, { headers }),
        fetch(`${BACKEND_URL}/api/security/hardening/status`, { headers }),
      ]);

      let readiness = 100;
      let scoreStatus = "EXCELLENT";
      if (resScore.ok) {
        const scoreData = await resScore.json();
        readiness = scoreData.readiness_score;
        scoreStatus = scoreData.status;
      }

      let threatsTotal = 0;
      let threatsUnmitigated = 0;
      if (resThreats.ok) {
        const threatsData = await resThreats.json();
        threatsTotal = threatsData.length;
        threatsUnmitigated = threatsData.filter((t: any) => t.status !== "MITIGATED").length;
      }

      let incidentsTotal = 0;
      let incidentsOpen = 0;
      if (resIncidents.ok) {
        const incidentsData = await resIncidents.json();
        incidentsTotal = incidentsData.length;
        incidentsOpen = incidentsData.filter((i: any) => i.status !== "RESOLVED").length;
      }

      let hardeningTotal = 0;
      let hardeningPassed = 0;
      if (resHardening.ok) {
        const hardeningData = await resHardening.json();
        hardeningTotal = hardeningData.length;
        hardeningPassed = hardeningData.filter((h: any) => h.status === "PASSED").length;
      }

      setStats({
        readiness_score: readiness,
        status: scoreStatus,
        threats: { total: threatsTotal, unmitigated: threatsUnmitigated },
        incidents: { total: incidentsTotal, open: incidentsOpen },
        hardening: { total: hardeningTotal, passed: hardeningPassed },
      });
    } catch (err) {
      console.error("Failed to load security overview", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-xl mb-3">⚙️</span>
        DECRYPTING THREAT & COMPLIANCE TELEMETRY...
      </div>
    );
  }

  const score = stats?.readiness_score ?? 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Security Overview</h2>
        <p className="text-xs text-text-muted mt-1">Real-time status of cryptographic keys, threat mitigations, and platform compliance checks.</p>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Readiness Score Card */}
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Compliance Readiness</div>
            <div className="text-4xl font-extrabold text-white mt-2 font-mono">{score}%</div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`w-2 h-2 rounded-full ${score >= 90 ? "bg-accent-emerald" : score >= 70 ? "bg-accent-amber" : "bg-accent-red animate-ping"}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-white">{stats?.status || "EXCELLENT"}</span>
          </div>
        </div>

        {/* Threat Registry Status */}
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Threats</div>
            <div className="text-4xl font-extrabold text-white mt-2 font-mono">
              {stats?.threats.unmitigated} <span className="text-xs text-text-muted font-sans font-normal">/ {stats?.threats.total} total</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`w-2 h-2 rounded-full ${stats?.threats.unmitigated === 0 ? "bg-accent-emerald" : "bg-accent-amber animate-pulse"}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-white">
              {stats?.threats.unmitigated === 0 ? "All threats mitigated" : "Mitigations required"}
            </span>
          </div>
        </div>

        {/* Incidents Ledger */}
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Open Incidents</div>
            <div className="text-4xl font-extrabold text-white mt-2 font-mono text-accent-red">
              {stats?.incidents.open} <span className="text-xs text-text-muted font-sans font-normal">/ {stats?.incidents.total} logged</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`w-2 h-2 rounded-full ${stats?.incidents.open === 0 ? "bg-accent-emerald" : "bg-accent-red animate-ping"}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-white">
              {stats?.incidents.open === 0 ? "Zero unresolved breaches" : "Active incident response"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="mt-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Core Control Dashboards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Threat Modeling", desc: "Define attack surfaces & document controls", path: "/security/threat-model", icon: "👾" },
            { name: "Asset Classification", desc: "Define confidentiality levels & PII fields", path: "/security/assets", icon: "🏷️" },
            { name: "PII & Privacy Controls", desc: "Audit access histories & redact safe exports", path: "/security/privacy", icon: "👁️‍🗨️" },
            { name: "Dual-Control Approvals", desc: "Dual authorizing threshold execution logs", path: "/security/approvals", icon: "👥" },
            { name: "OWASP Hardening", desc: "Run secure header & validation audits", path: "/security/hardening", icon: "🧱" },
            { name: "Secrets & Key Lifecycle", desc: "Cryptographic keys generation & rotations", path: "/security/keys", icon: "🔑" },
          ].map((item) => (
            <div
              key={item.path}
              onClick={() => router.push(item.path)}
              className="bg-card-bg/60 p-4 rounded-xl border border-border-color shadow-sm hover:border-accent-emerald/30 hover:bg-card-bg transition duration-200 cursor-pointer flex gap-4 items-start"
            >
              <span className="text-2xl mt-0.5">{item.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">{item.name}</h4>
                <p className="text-[11px] text-text-muted mt-1 leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
