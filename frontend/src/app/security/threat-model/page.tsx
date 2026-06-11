"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface Threat {
  id: string;
  threat_id: string;
  category: string;
  asset: string;
  attack_vector: string;
  impact: string;
  likelihood: string;
  mitigation: string; // JSON string list
  status: string;
}

export default function ThreatModelPage() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [threatId, setThreatId] = useState("");
  const [category, setCategory] = useState("QUESTION_BANK_LEAKAGE");
  const [asset, setAsset] = useState("QuestionBank");
  const [attackVector, setAttackVector] = useState("");
  const [impact, setImpact] = useState("HIGH");
  const [likelihood, setLikelihood] = useState("MEDIUM");
  const [mitigationsStr, setMitigationsStr] = useState("");

  useEffect(() => {
    fetchThreats();
  }, []);

  const fetchThreats = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/security/threats`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setThreats(data);
      }
    } catch (err) {
      console.error("Failed to load threats", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThreat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const mitigations = mitigationsStr
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      const res = await fetch(`${BACKEND_URL}/api/security/threats/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          threat_id: threatId,
          category,
          asset,
          attack_vector: attackVector,
          impact,
          likelihood,
          mitigation: mitigations,
          status: "UNMITIGATED",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create threat model registry entry.");
      }

      setSuccess("Threat registered successfully!");
      setThreatId("");
      setAttackVector("");
      setMitigationsStr("");
      fetchThreats();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMitigate = async (id: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const nextStatus = currentStatus === "MITIGATED" ? "UNMITIGATED" : "MITIGATED";

      const res = await fetch(`${BACKEND_URL}/api/security/threats/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        fetchThreats();
      }
    } catch (err) {
      console.error("Failed to toggle mitigation", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2">⚙️</span>
        DECRYPTING THREAT MODEL REGISTRY...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Registered Threats List (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Threat Registry</h2>
          <p className="text-xs text-text-muted mt-1">Review vectors, assets at risk, and mitigation statuses.</p>
        </div>

        <div className="flex flex-col gap-4">
          {threats.length === 0 ? (
            <div className="p-8 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs">
              No threat registry entries documented yet.
            </div>
          ) : (
            threats.map((threat) => {
              let mitigationsList: string[] = [];
              try {
                mitigationsList = JSON.parse(threat.mitigation);
              } catch {
                mitigationsList = [threat.mitigation];
              }

              const isMitigated = threat.status === "MITIGATED";

              return (
                <div
                  key={threat.id}
                  className={`p-5 rounded-2xl border bg-card-bg shadow-sm transition ${
                    isMitigated ? "border-accent-emerald/20" : "border-accent-red/20"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isMitigated ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/25" : "bg-accent-red/10 text-accent-red border border-accent-red/25"
                        }`}>
                          {threat.threat_id}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{threat.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2">Asset at Risk: {threat.asset}</h4>
                      <p className="text-xs text-text-muted mt-1 leading-normal">{threat.attack_vector}</p>
                    </div>

                    <button
                      onClick={() => toggleMitigate(threat.threat_id, threat.status)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded transition cursor-pointer shrink-0 ${
                        isMitigated
                          ? "bg-accent-emerald text-background hover:bg-accent-emerald/90"
                          : "bg-accent-red/15 text-accent-red border border-accent-red/35 hover:bg-accent-red/25"
                      }`}
                    >
                      {isMitigated ? "✓ MITIGATED" : "⚠ MARK MITIGATED"}
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="text-[9px] px-2 py-0.5 bg-background border border-border-color rounded text-text-muted uppercase">
                      Impact: <span className="text-white font-bold">{threat.impact}</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 bg-background border border-border-color rounded text-text-muted uppercase">
                      Likelihood: <span className="text-white font-bold">{threat.likelihood}</span>
                    </span>
                  </div>

                  {/* Mitigations */}
                  <div className="mt-4 pt-3 border-t border-border-color/50">
                    <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Documented Mitigations</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {mitigationsList.map((m, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-2 py-0.5 bg-background/50 rounded text-white border border-border-color/30">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Register Threat Form */}
      <div className="flex flex-col gap-6">
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Register Threat Vector
          </h3>

          <form onSubmit={handleCreateThreat} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Threat ID</label>
              <input
                type="text"
                required
                value={threatId}
                onChange={(e) => setThreatId(e.target.value)}
                placeholder="e.g. THR-005"
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald"
              >
                <option value="QUESTION_BANK_LEAKAGE">QUESTION_BANK_LEAKAGE</option>
                <option value="PAPER_RELEASE_ABUSE">PAPER_RELEASE_ABUSE</option>
                <option value="KEY_COMPROMISE">KEY_COMPROMISE</option>
                <option value="CROSS_TENANT_DATA_LEAK">CROSS_TENANT_DATA_LEAK</option>
                <option value="EVALUATOR_IDENTITY_LEAK">EVALUATOR_IDENTITY_LEAK</option>
                <option value="RESULT_TAMPERING">RESULT_TAMPERING</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Target Asset</label>
              <input
                type="text"
                required
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="e.g. GeneratedPaper"
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Attack Vector Explainer</label>
              <textarea
                required
                value={attackVector}
                onChange={(e) => setAttackVector(e.target.value)}
                placeholder="How the attack could be executed..."
                rows={3}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Impact</label>
                <select
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Likelihood</label>
                <select
                  value={likelihood}
                  onChange={(e) => setLikelihood(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Mitigations (comma separated)</label>
              <input
                type="text"
                required
                value={mitigationsStr}
                onChange={(e) => setMitigationsStr(e.target.value)}
                placeholder="e.g. WAF, HMAC check, TLS only"
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald"
              />
            </div>

            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-[11px] leading-normal font-mono">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-[11px] leading-normal">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase mt-2"
            >
              {submitting ? "Documenting Threat..." : "Commit Registry Record"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
