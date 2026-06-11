"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function CreateTemplate() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [examType, setExamType] = useState("OMR");
  const [duration, setDuration] = useState("180");
  const [sections, setSections] = useState("Physics, Chemistry, Biology");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Please specify a template name.");
      return;
    }
    setLoading(true);
    setError("");

    const sectionsList = sections.split(",").map((s) => s.trim()).filter((s) => s.length > 0);

    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();

      const res = await fetch(`${BACKEND_URL}/api/templates/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_id: me.institution_id || "INS-GENESIS",
          name,
          exam_type: examType,
          default_duration_minutes: parseInt(duration),
          default_sections: sectionsList,
          blueprint_schema: {
            total_questions: 100,
            difficulty_distribution: { easy: 30, medium: 50, hard: 20 }
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create template.");
      }

      router.push("/exam-templates");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-md w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Build Exam Template</h1>
          <p className="text-xs text-text-muted mt-0.5">Define reusable subject sections, durations, and blueprints.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Template Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-text-muted mb-1 font-semibold">Template Name</label>
            <input
              type="text"
              placeholder="e.g. OMR Board Biology Exam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-text-muted mb-1 font-semibold">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
            >
              <option value="OMR">NEET-style OMR</option>
              <option value="CBT">JEE-style CBT</option>
              <option value="WRITTEN">UPSC-style Descriptive Theory</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Duration (Minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Default Sections (Comma separated)</label>
              <input
                type="text"
                placeholder="Physics, Chemistry"
                value={sections}
                onChange={(e) => setSections(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition cursor-pointer text-xs uppercase tracking-wider mt-2"
          >
            {loading ? "Saving Template Blueprint..." : "Build Template"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/exam-templates" className="text-xs text-text-muted hover:text-white transition">
            ← Cancel and Return
          </Link>
        </div>
      </div>
    </div>
  );
}
