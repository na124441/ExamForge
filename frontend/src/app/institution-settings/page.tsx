"use client";

import { useState } from "react";
import Link from "next/link";

export default function InstitutionSettings() {
  const [region, setRegion] = useState("IN");
  const [retentionDays, setRetentionDays] = useState("365");
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-md w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Institution Settings</h1>
          <p className="text-xs text-text-muted mt-0.5">Customize local tenant configurations.</p>
        </div>

        {success && (
          <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs">
            Settings saved successfully to isolated registry.
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-text-muted mb-1 font-semibold">Data Sovereignty Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white font-mono"
            >
              <option value="IN">IN (India - High Security)</option>
              <option value="US">US (United States)</option>
              <option value="EU">EU (Europe - GDPR)</option>
            </select>
          </div>

          <div>
            <label className="block text-text-muted mb-1 font-semibold">Evidence Packet Retention (Days)</label>
            <input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition cursor-pointer text-xs uppercase tracking-wider mt-2"
          >
            Save Configuration
          </button>
        </form>

        <div className="text-center">
          <Link href="/platform-admin" className="text-xs text-text-muted hover:text-white transition">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
