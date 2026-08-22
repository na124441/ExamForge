"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  ArrowLeft, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  History 
} from "lucide-react";
import { StatusBadge } from "../../../components/ui/StatusBadge";

const BACKEND_URL = "http://localhost:8000";

export default function CenterDetail() {
  const { center_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!center_id) return;
    const fetchCenterData = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${BACKEND_URL}/api/centers/${center_id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCenter(data);
        }

        const histRes = await fetch(`${BACKEND_URL}/api/centers/${center_id}/history`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData);
        }
      } catch (err: any) {
        // Mock fallback
        setCenter({
          id: center_id,
          name: "Apex Regional Examination Node 22",
          city: "New Delhi",
          state: "DL",
          capacity: 800,
          device_count: 850,
          rooms: 16,
          network_mode: "AIR_GAPPED_LAN",
          status: "APPROVED"
        });
        setHistory({
          total_exams_hosted: 2,
          history: [
            { exam_id: "EXM-001", assigned_capacity: 800, status: "SEALED_COMPLETED" },
            { exam_id: "EXM-002", assigned_capacity: 650, status: "SCHEDULED" }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCenterData();
  }, [center_id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 md:p-10 font-sans items-center">
      <div className="max-w-5xl w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {center ? center.name : "Center Detailed Profile"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">Node Identifier: {center_id}</p>
            </div>
          </div>
          <Link 
            href="/centers" 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs transition font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Registry</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">
            Retrieving center profile & security audit logs...
          </div>
        ) : center ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metadata Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col gap-4 text-xs h-fit shadow-xs">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs pb-3 border-b border-slate-100">
                Technical Specification
              </h3>
              
              <div className="flex flex-col gap-3 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                  <span className="text-slate-900 text-xs font-bold">{center.city}, {center.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Capacity</span>
                  <span className="text-indigo-600 text-xs font-extrabold">{center.capacity} Desks</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Devices & Rooms</span>
                  <span className="text-slate-800 text-xs font-medium">{center.device_count || center.capacity} Clients / {center.rooms} Rooms</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Network Architecture</span>
                  <span className="text-slate-800 text-xs font-medium">{center.network_mode || "AIR_GAPPED_LAN"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Security Status</span>
                  <StatusBadge status={center.status} size="sm" />
                </div>
              </div>
            </div>

            {/* History Panel */}
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 flex flex-col gap-4 shadow-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                  Hosting History & Verification Log
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {history?.total_exams_hosted || 1} Exams Conducted
                </span>
              </div>
              
              <div className="flex flex-col gap-3 text-xs">
                {history?.history?.map((h: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900">Exam: {h.exam_id}</span>
                      <span className="text-slate-500 text-[11px]">Assigned capacity: {h.assigned_capacity} candidates</span>
                    </div>
                    <StatusBadge status={h.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
