"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, PlusCircle, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";

export default function DisputesDashboard() {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${BACKEND_URL}/api/disputes/my`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Could not fetch filed disputes.");
        const data = await res.json();
        setDisputes(data);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Disputes & Rechecks Portal</h1>
              <p className="text-xs text-slate-500 mt-0.5">Track, update, and manage candidate score recheck complaints.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/disputes/file" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md text-xs hover:bg-indigo-700 transition shadow-xs flex items-center gap-1.5 active-press">
              <PlusCircle className="w-4 h-4" />
              <span>File New Dispute</span>
            </Link>
            <Link href="/result-portal" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs hover:bg-slate-50 transition font-medium shadow-xs">
              Return to Portal
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Connecting to verification authority...</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {!loading && disputes.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center flex flex-col items-center gap-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-bold text-sm">No Active Disputes Filed</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              You haven&apos;t filed any recheck disputes yet. If you believe there is an error in your published score, you can file a claim.
            </p>
          </div>
        )}

        {disputes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disputes.map((d: any) => (
              <div key={d.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition flex flex-col gap-4 shadow-xs justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-slate-400">{d.id}</span>
                    <StatusBadge status={d.status} />
                  </div>

                  <h3 className="text-slate-900 font-bold text-sm tracking-tight mt-1">{d.dispute_type.replace(/_/g, " ")}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{d.description}</p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2 text-xs">
                  <span className="text-slate-500">Exam: <span className="font-semibold text-slate-700">{d.exam_id}</span></span>
                  <Link href={`/disputes/${d.id}`} className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    View Timeline →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
