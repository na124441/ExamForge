"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function CreateInstitution() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("UNIVERSITY");
  const [slug, setSlug] = useState("");
  const [region, setRegion] = useState("IN");
  const [mode, setMode] = useState("SAAS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/institutions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          institution_type: type,
          tenant_slug: slug.toLowerCase(),
          deployment_mode: mode,
          data_region: region
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Onboarding failed. Verify authorization.");
      }

      router.push("/platform-admin");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-md w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div className="text-center">
          <span className="text-4xl">🏢</span>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-wide">Onboard SaaS Tenant</h1>
          <p className="text-xs text-text-muted mt-1">Initialize settings, database isolation, and keyspace settings.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Onboarding Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-text-muted mb-1 font-semibold">Institution Name *</label>
            <input
              type="text"
              placeholder="e.g. National Scholarship Board"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-text-muted mb-1 font-semibold">Tenant Slug * (Subdomain name)</label>
            <input
              type="text"
              placeholder="e.g. nsb"
              value={slug}
              onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-text-muted mb-1 font-semibold">Institution Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white font-mono"
            >
              <option value="UNIVERSITY">UNIVERSITY</option>
              <option value="GOVERNMENT_EXAM_BODY">GOVERNMENT_EXAM_BODY</option>
              <option value="SCHOOL_BOARD">SCHOOL_BOARD</option>
              <option value="RECRUITMENT_AGENCY">RECRUITMENT_AGENCY</option>
              <option value="DEFENSE_OR_HIGH_SECURITY_BODY">DEFENSE_OR_HIGH_SECURITY_BODY</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Data Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
              >
                <option value="IN">IN (India)</option>
                <option value="US">US (United States)</option>
                <option value="EU">EU (Europe)</option>
              </select>
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Deployment Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
              >
                <option value="SAAS">SAAS (Shared)</option>
                <option value="HYBRID">HYBRID (Dedicated)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition cursor-pointer text-sm tracking-wider uppercase mt-2"
          >
            {loading ? "Initializing tenant environment..." : "Onboard Tenant"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/platform-admin" className="text-xs text-text-muted hover:text-white transition">
            ← Cancel and Return
          </Link>
        </div>
      </div>
    </div>
  );
}
