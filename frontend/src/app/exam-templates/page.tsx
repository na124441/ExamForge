"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function ExamTemplatesDashboard() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();

      const res = await fetch(`${BACKEND_URL}/api/templates?institution_id=${me.institution_id || "INS-GENESIS"}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not retrieve exam templates.");
      const data = await res.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Exam blueprint Templates</h1>
              <p className="text-xs text-text-muted mt-0.5">Reusable CBSE theory, OMR NEET, or CBT JEE configurations.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/exam-templates/create" className="px-4 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider">
              Create Template
            </Link>
            <Link href="/platform-admin" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
              Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Template Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Connecting to blueprints registry...
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-card-bg p-12 rounded-2xl border border-border-color text-center flex flex-col items-center gap-4">
            <span className="text-5xl opacity-40">📝</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">No templates configured</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              Create reusable template blueprints to easily instantiate exams without rebuild of distribution sections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 shadow-md">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] text-text-muted">{t.id}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald uppercase">
                    {t.exam_type}
                  </span>
                </div>

                <h3 className="text-white font-bold text-base tracking-wide">{t.name}</h3>
                
                <div className="text-xs text-text-muted flex flex-col gap-1.5 font-mono">
                  <div>Duration: <span className="text-white">{t.default_duration_minutes} Minutes</span></div>
                  <div className="flex gap-1 items-center">
                    <span>Sections:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.default_sections.map((sec: string) => (
                        <span key={sec} className="px-1.5 py-0.5 bg-background border border-border-color/60 text-white rounded text-[9px]">{sec}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
