"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

const DEMO_ROLES = [
  {
    role: "CONTROLLER",
    name: "Exam Controller",
    email: "controller@example.com",
    desc: "Create exams, define blueprints, generate secure papers, and verify final audit trails.",
    icon: "🔐",
    color: "border-accent-emerald text-accent-emerald bg-accent-emerald/5 hover:bg-accent-emerald/10",
    redirect: "/controller"
  },
  {
    role: "CANDIDATE",
    name: "Candidate Portal",
    email: "candidate@example.com",
    desc: "Register, verify identity, and attempt timing-locked exams with chained event hashing.",
    icon: "📝",
    color: "border-accent-amber text-accent-amber bg-accent-amber/5 hover:bg-accent-amber/10",
    redirect: "/candidate"
  },
  {
    role: "EVALUATOR",
    name: "Evaluator Panel",
    email: "evaluator@example.com",
    desc: "Grade descriptive written page uploads anonymously against rubrics.",
    icon: "⚖️",
    color: "border-indigo-400 text-indigo-400 bg-indigo-400/5 hover:bg-indigo-400/10",
    redirect: "/evaluator"
  },
  {
    role: "AUDITOR",
    name: "System Auditor",
    email: "auditor@example.com",
    desc: "Explore append-only hash chains and test tamper simulation controls.",
    icon: "🔬",
    color: "border-accent-red text-accent-red bg-accent-red/5 hover:bg-accent-red/10",
    redirect: "/auditor"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemoSelect = (email: string) => {
    setSelectedEmail(email);
    setPassword("password123");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) {
      setError("Please select a demo role first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedEmail, password })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Authentication failed.");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("user_email", selectedEmail);

      // Route based on role
      const roleConfig = DEMO_ROLES.find(r => r.email === selectedEmail);
      if (roleConfig) {
        router.push(roleConfig.redirect);
      }
    } catch (err: any) {
      setError(err.message || "Could not connect to the ExamForge authentication server. Make sure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-foreground">
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 bg-accent-emerald/10 text-accent-emerald rounded-full border border-accent-emerald/20 text-xs font-semibold tracking-wider uppercase mb-3">
            🔐 Tamper-Evident Infrastructure
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Exam<span className="text-accent-emerald">Forge</span> Portal
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-lg mx-auto">
            A zero-trust examination trust platform that enforces cryptographic chain of custody. Select a role below to explore.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          {DEMO_ROLES.map((role) => (
            <div
              key={role.email}
              onClick={() => handleDemoSelect(role.email)}
              className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${role.color} ${
                selectedEmail === role.email
                  ? "ring-2 ring-offset-2 ring-offset-background ring-accent-emerald border-transparent translate-y-[-2px] shadow-lg shadow-black/30"
                  : "border-border-color shadow-sm hover:translate-y-[-1px]"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{role.icon}</span>
                <h3 className="text-lg font-bold text-white">{role.name}</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{role.desc}</p>
              <div className="mt-3 text-xs opacity-60">
                Email: <span className="font-mono text-white/90">{role.email}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Login Form Box */}
        {selectedEmail && (
          <form
            onSubmit={handleLogin}
            className="w-full max-w-md bg-card-bg p-6 rounded-xl border border-border-color shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Email Address</label>
              <input
                type="text"
                disabled
                value={selectedEmail}
                className="w-full p-2 bg-background/50 border border-border-color rounded text-sm text-white/70 font-mono"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Passphrase</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passphrase"
                className="w-full p-2 bg-background border border-border-color rounded text-sm text-white focus:outline-none focus:border-accent-emerald font-mono"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition-colors cursor-pointer text-sm"
            >
              {loading ? "Decrypting Access Token..." : "Authenticate & Decrypt"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
