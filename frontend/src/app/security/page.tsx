"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  AlertTriangle,
  ChevronRight,
  Database,
  Lock,
  EyeOff,
  UserCheck,
  CheckCircle,
  Key,
  RefreshCw
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

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

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 text-xs gap-3 font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Auditing Security Posture & Hardening...</span>
      </div>
    );
  }

  const score = stats.readiness_score ?? 100;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Security Operations & Hardening</span>
            <span className="text-xs px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-medium">
              Security Hub
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time verification of keyspaces, threat mitigation status, and compliance posture.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/authority")}
            className="text-xs px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-md transition font-medium shadow-xs cursor-pointer"
          >
            Authority Console
          </button>
        </div>
      </div>

      {/* Row 1: High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance Readiness Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Readiness</span>
            <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">{score}%</div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`w-2.5 h-2.5 rounded-full ${score >= 90 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500"}`}></span>
            <span className="text-xs font-semibold text-slate-700">
              Posture: {stats.status || "EXCELLENT"}
            </span>
          </div>
        </div>

        {/* Threat Mitigation Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mitigated Threat Nodes</span>
            <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">
              {stats.threats.total - stats.threats.unmitigated} <span className="text-xs font-sans text-slate-500 font-medium">/ {stats.threats.total} mitigated</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`w-2.5 h-2.5 rounded-full ${stats.threats.unmitigated === 0 ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            <span className="text-xs font-semibold text-slate-700">
              {stats.threats.unmitigated === 0 ? "All mitigations active" : `${stats.threats.unmitigated} open vulnerabilities`}
            </span>
          </div>
        </div>

        {/* Open Incidents Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unmitigated Breaches</span>
            <div className={`text-3xl font-bold mt-1 font-mono ${stats.incidents.open === 0 ? "text-slate-900" : "text-red-600"}`}>
              {stats.incidents.open} <span className="text-xs font-sans text-slate-500 font-medium">/ {stats.incidents.total} logged</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`w-2.5 h-2.5 rounded-full ${stats.incidents.open === 0 ? "bg-emerald-500" : "bg-red-500"}`}></span>
            <span className="text-xs font-semibold text-slate-700">
              {stats.incidents.open === 0 ? "Platform status: secure" : "Active Incident response"}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Sub-Console Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Security Control Modules
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Threat Modeling Matrix", desc: "Audit and classification of attack surface risks", path: "/security/threat-model", icon: Shield },
            { name: "Resource Classifications", desc: "Configure confidentiality scopes and credentials", path: "/security/assets", icon: Database },
            { name: "PII & Access Masking", desc: "Audit and redact Candidate PII fields before export", path: "/security/privacy", icon: EyeOff },
            { name: "Dual-Custodian Signoffs", desc: "Configure dual controller approval key requirements", path: "/security/approvals", icon: UserCheck },
            { name: "OWASP Hardening Checklist", desc: "Platform vulnerability compliance and audit checklists", path: "/security/hardening", icon: CheckCircle },
            { name: "Secrets & Keyspace Vault", desc: "ECDSA signing keys generation and rotation history", path: "/security/keys", icon: Key },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => router.push(item.path)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition duration-150 cursor-pointer flex gap-4 items-start group"
              >
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-100 shrink-0 transition">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center justify-between group-hover:text-indigo-600 transition-colors">
                    <span>{item.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
