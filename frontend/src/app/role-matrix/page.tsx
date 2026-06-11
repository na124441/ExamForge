"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function RoleMatrix() {
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/access/permission-matrix`);
        if (!res.ok) throw new Error("Failed to load permission matrix.");
        const data = await res.json();
        setMatrix(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-2xl w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Permission & Scope Matrix</h1>
          <p className="text-xs text-text-muted mt-0.5">Explore institutional roles boundaries and permitted commands namespaces.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-text-muted animate-pulse">
            Connecting to security engine...
          </div>
        ) : matrix ? (
          <div className="flex flex-col gap-4 text-xs font-mono">
            {Object.entries(matrix.scopes).map(([role, scopes]: any) => (
              <div key={role} className="p-4 bg-background/50 border border-border-color rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <span className="font-bold text-accent-emerald text-sm uppercase">{role.replace(/_/g, " ")}</span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {scopes.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded text-[9px] font-bold bg-card-bg border border-border-color text-white">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="text-center">
          <Link href="/institution-users" className="text-xs text-text-muted hover:text-white transition">
            ← Return to Scoped Users
          </Link>
        </div>
      </div>
    </div>
  );
}
