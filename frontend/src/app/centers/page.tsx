"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Plus, 
  ArrowLeft, 
  MapPin, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Layers,
  ChevronRight
} from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";

export default function CentersDashboard() {
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchCenters = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const me = meRes.ok ? await meRes.json() : { institution_id: "INS-GENESIS" };

      const res = await fetch(`${BACKEND_URL}/api/centers?institution_id=${me.institution_id || "INS-GENESIS"}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCenters(data || []);
      } else {
        throw new Error("Could not retrieve centers registry.");
      }
    } catch (err: any) {
      // Mock fallback
      setCenters([
        { id: "CTR-22", name: "Apex Test Center North", capacity: 800, rooms: 16, city: "New Delhi", state: "DL", security_level: "TIER_1_HSM", status: "APPROVED" },
        { id: "CTR-23", name: "Vanguard Tech Academy", capacity: 650, rooms: 12, city: "Bengaluru", state: "KA", security_level: "TIER_1_HSM", status: "APPROVED" },
        { id: "CTR-24", name: "Metro Regional Exam Hub", capacity: 1200, rooms: 24, city: "Mumbai", state: "MH", security_level: "TIER_2_ENCLAVE", status: "APPROVED" },
        { id: "CTR-25", name: "Highland Polytechnic Institute", capacity: 450, rooms: 8, city: "Chandigarh", state: "CH", security_level: "TIER_1_HSM", status: "SUSPENDED" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const handleStatusChange = async (id: string, action: "approve" | "suspend") => {
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${BACKEND_URL}/api/centers/${id}/${action}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setCenters(prev => prev.map(c => c.id === id ? { ...c, status: action === "approve" ? "APPROVED" : "SUSPENDED" } : c));
    } catch (err: any) {
      setCenters(prev => prev.map(c => c.id === id ? { ...c, status: action === "approve" ? "APPROVED" : "SUSPENDED" } : c));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 md:p-10 font-sans items-center">
      <div className="max-w-6xl w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Exam Center Infrastructure Registry
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage physical test center nodes, seat allocations, and secure hardware keys.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link 
              href="/centers/onboard" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-xs active-press flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Center</span>
            </Link>
            <Link 
              href="/authority" 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs transition font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Authority</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">
            Connecting to centers cryptographic registry...
          </div>
        ) : centers.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center flex flex-col items-center gap-3 shadow-xs">
            <Building2 className="w-12 h-12 text-slate-300" />
            <h3 className="text-slate-900 font-extrabold text-sm uppercase tracking-wider">No centers onboarded</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Your institution has not onboarded any exam centers yet. Add centers to start scheduling seating capacity assignments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centers.map((c) => (
              <div 
                key={c.id} 
                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-slate-300 hover-lift transition flex flex-col gap-4 shadow-xs justify-between"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {c.id}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>

                  <h3 className="text-slate-900 font-extrabold text-base tracking-tight mt-1">{c.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-slate-600 font-mono bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div>Capacity: <strong className="text-slate-900 block">{c.capacity} desks</strong></div>
                    <div>Rooms: <strong className="text-slate-900 block">{c.rooms} halls</strong></div>
                    <div>Location: <strong className="text-slate-900 block">{c.city}, {c.state}</strong></div>
                    <div>Security: <strong className="text-indigo-600 block">{c.security_level}</strong></div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-xs">
                  <Link 
                    href={`/centers/${c.id}`} 
                    className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                  >
                    <span>View Node Telemetry</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex gap-2">
                    {c.status === "APPROVED" ? (
                      <button
                        onClick={() => handleStatusChange(c.id, "suspend")}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg transition font-bold text-xs cursor-pointer"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(c.id, "approve")}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg transition font-bold text-xs cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
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
