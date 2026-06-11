"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = "http://localhost:8000";

const INCIDENT_TYPES = [
  { value: "CANDIDATE_ID_MISMATCH", label: "Candidate ID / photo mismatch" },
  { value: "LATE_ENTRY", label: "Late entry checkin attempt" },
  { value: "DEVICE_FAILURE", label: "Local hardware / terminal failure" },
  { value: "OMR_DAMAGE", label: "Bubble sheet OMR damage" },
  { value: "QUESTION_PAPER_ISSUE", label: "Encrypted package decryption issue" },
  { value: "SUSPICIOUS_BEHAVIOR", label: "Suspicious student behavior / proctor warning" },
  { value: "NETWORK_FAILURE", label: "Center network drop" },
  { value: "EMERGENCY_RELEASE", label: "Emergency release trigger override" }
];

const SEVERITY_LEVELS = [
  { value: "INFO", label: "Info (Advisory report)" },
  { value: "LOW", label: "Low risk" },
  { value: "MEDIUM", label: "Medium risk" },
  { value: "HIGH", label: "High risk" },
  { value: "P0_CRITICAL", label: "P0 Critical (Blocks publication)" }
];

function IncidentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centerId = searchParams.get("center") || "CTR-22";

  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  
  // Form Fields
  const [incType, setIncType] = useState("SUSPICIOUS_BEHAVIOR");
  const [severity, setSeverity] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role");
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    setRole(storedRole || "OFFICER");
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 4000);
    return () => clearInterval(interval);
  }, [centerId]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        // Filter by center if not Controller
        if (role !== "CONTROLLER") {
          setIncidents((data || []).filter((r: any) => r.center_id === centerId));
        } else {
          setIncidents(data || []);
        }
      }
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      alert("Please fill in incident description.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/incidents/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_id: "EXM-001",
          center_id: centerId,
          incident_type: incType,
          severity,
          description,
          evidence_text: evidenceText
        })
      });

      if (!res.ok) throw new Error("Incident submission failed.");
      
      alert("Incident reported successfully! Locked in system audit log.");
      setDescription("");
      setEvidenceText("");
      fetchIncidents();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">LOADING INCIDENT CHANNELS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-card-bg border-b border-border-color p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <h1 className="text-lg font-bold text-white tracking-wide">
            Center Incident Logger: <span className="text-accent-amber font-mono">{centerId}</span>
          </h1>
        </div>
        <button
          onClick={() => router.push(role === "CONTROLLER" ? "/exam-ops" : `/center-console?center=${centerId}`)}
          className="text-xs px-3 py-1 bg-border-color text-white rounded hover:bg-white/5 transition cursor-pointer"
        >
          ⬅️ Back
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Submit Incident Form (2 cols) */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmitReport}
            className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex flex-col gap-4"
          >
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Report Center Irregularity</h2>
              <p className="text-xs text-text-muted mt-1">Submit invigilator observations. Critical reports update composite trust indices.</p>
            </div>

            <div>
              <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Incident Type</label>
              <select
                value={incType}
                onChange={(e) => setIncType(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white"
              >
                {INCIDENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Threat Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white"
              >
                {SEVERITY_LEVELS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Incident Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Observed details, seat numbers, or student ID details..."
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white font-sans"
              />
            </div>

            <div>
              <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Evidence Payload / Text</label>
              <textarea
                rows={3}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Raw logs, government card number details, or image files description..."
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white font-mono leading-normal"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-accent-red text-white font-bold rounded hover:bg-accent-red/90 transition cursor-pointer text-xs"
            >
              Commit Incident to Ledger
            </button>
          </form>
        </div>

        {/* Right Side: Incident Feeds Timeline (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <section className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Center incident log feed</h2>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 font-mono text-xs">
              {incidents.length === 0 ? (
                <div className="text-center py-20 text-text-muted">No incidents registered.</div>
              ) : (
                incidents.map(inc => (
                  <div
                    key={inc.incident_id}
                    className={`p-4 rounded-xl border flex flex-col gap-2 ${
                      inc.status === "RESOLVED" ? "border-border-color bg-background/25 opacity-75" :
                      inc.severity === "P0_CRITICAL" ? "border-accent-red/75 bg-accent-red/5 text-accent-red" : "border-accent-amber/70 bg-accent-amber/5 text-accent-amber"
                    }`}
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <span className="text-white font-bold">{inc.incident_type}</span>
                        <span className="text-text-muted text-[10px] ml-2">@ Center: {inc.center_id}</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-background border border-border-color/30 rounded text-[9px] font-bold">{inc.severity}</span>
                    </div>

                    <p className="text-xs text-white leading-relaxed mt-1 font-sans">{inc.description}</p>
                    
                    {inc.evidence_hash && (
                      <div className="text-[10px] text-text-muted break-all mt-1">Evidence Hash: {inc.evidence_hash}</div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-text-muted mt-2 border-t border-border-color/20 pt-2 flex-wrap gap-2">
                      <span>Status: <span className={inc.status === "RESOLVED" ? "text-accent-emerald font-bold" : "text-accent-red font-bold"}>{inc.status}</span></span>
                      <span>Reported: {new Date(inc.created_at).toLocaleString()}</span>
                    </div>

                    {inc.status === "RESOLVED" && (
                      <div className="bg-accent-emerald/5 border border-accent-emerald/20 p-2.5 rounded-lg text-xs mt-2 font-mono text-accent-emerald">
                        <div className="font-bold text-[10px] uppercase">Resolution Notes:</div>
                        <p className="mt-0.5 text-white font-sans">{inc.resolution_notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground font-mono">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <div className="text-sm">LOADING INCIDENT CHANNELS...</div>
      </div>
    }>
      <IncidentsContent />
    </Suspense>
  );
}
