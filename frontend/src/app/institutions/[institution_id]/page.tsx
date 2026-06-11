"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function InstitutionDetail() {
  const { institution_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [inst, setInst] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!institution_id) return;
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${BACKEND_URL}/api/institutions/${institution_id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Could not retrieve institution details.");
        const data = await res.json();
        setInst(data);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [institution_id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                {inst ? inst.name : "Institution Control Center"}
              </h1>
              <p className="text-xs text-text-muted mt-0.5 font-mono">ID: {institution_id}</p>
            </div>
          </div>
          <Link href="/platform-admin" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            ← Return to SaaS
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Retrieving tenant metadata...
          </div>
        ) : inst ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metadata Summary */}
            <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 text-xs h-fit shadow-md">
              <h3 className="font-bold text-white uppercase tracking-wider">Tenant Profile</h3>
              
              <div className="flex flex-col gap-3 font-mono">
                <div>
                  <span className="text-text-muted block text-[10px]">Slug Namespace</span>
                  <span className="text-white text-xs">{inst.tenant_slug}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Status</span>
                  <span className="text-white text-xs font-bold">{inst.status}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Onboarded At</span>
                  <span className="text-white text-xs">{new Date(inst.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="md:col-span-2 bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 shadow-md">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">Institution Operations</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                As Controller or Platform Administrator, manage scoped parameters, key rings, policies, templates, and exam centers for this isolated tenant namespace.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <Link href="/institution-settings" className="p-4 bg-background border border-border-color hover:border-accent-emerald rounded-lg transition flex flex-col gap-1 text-xs">
                  <span className="font-bold text-white">⚙️ Settings & Settings Configuration</span>
                  <span className="text-text-muted text-[10px]">Adjust local tenant storage parameters.</span>
                </Link>

                <Link href="/institution-users" className="p-4 bg-background border border-border-color hover:border-accent-emerald rounded-lg transition flex flex-col gap-1 text-xs">
                  <span className="font-bold text-white">👥 User Invitations & Roles Scoping</span>
                  <span className="text-text-muted text-[10px]">Add team members and audit scoped access.</span>
                </Link>

                <Link href="/policies" className="p-4 bg-background border border-border-color hover:border-accent-emerald rounded-lg transition flex flex-col gap-1 text-xs">
                  <span className="font-bold text-white">🛡️ Policy Engine rules</span>
                  <span className="text-text-muted text-[10px]">Build locked exam publication gates.</span>
                </Link>

                <Link href="/exam-templates" className="p-4 bg-background border border-border-color hover:border-accent-emerald rounded-lg transition flex flex-col gap-1 text-xs">
                  <span className="font-bold text-white">📋 Exam blueprints Templates</span>
                  <span className="text-text-muted text-[10px]">Access CBSE, JEE, OMR template builders.</span>
                </Link>

                <Link href="/centers" className="p-4 bg-background border border-border-color hover:border-accent-emerald rounded-lg transition flex flex-col gap-1 text-xs">
                  <span className="font-bold text-white">📍 Exam Centers Onboarding</span>
                  <span className="text-text-muted text-[10px]">Register capacity-checked classrooms.</span>
                </Link>

                <Link href="/keyspace" className="p-4 bg-background border border-border-color hover:border-accent-emerald rounded-lg transition flex flex-col gap-1 text-xs">
                  <span className="font-bold text-white">🔑 Institution Keyspace Rotation</span>
                  <span className="text-text-muted text-[10px]">Manage ECDSA signing certificates keys.</span>
                </Link>

                <Link href="/tenant-audit" className="p-4 bg-background border border-border-color hover:border-accent-emerald rounded-lg transition flex flex-col gap-1 text-xs sm:col-span-2">
                  <span className="font-bold text-white">⛓️ Scoped Tenant Audit Namespace Ledger</span>
                  <span className="text-text-muted text-[10px]">Verify cryptographic backlink logs for this tenant only.</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
