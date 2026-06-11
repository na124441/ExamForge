"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
        if (!res.ok) throw new Error("Could not retrieve center metadata.");
        const data = await res.json();
        setCenter(data);

        const histRes = await fetch(`${BACKEND_URL}/api/centers/${center_id}/history`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchCenterData();
  }, [center_id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📍</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                {center ? center.name : "Center Detailed Profile"}
              </h1>
              <p className="text-xs text-text-muted mt-0.5 font-mono">ID: {center_id}</p>
            </div>
          </div>
          <Link href="/centers" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            ← Return to Registry
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Retrieving center profile...
          </div>
        ) : center ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metadata Summary */}
            <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 text-xs h-fit shadow-md">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">Technical Profile</h3>
              
              <div className="flex flex-col gap-3 font-mono">
                <div>
                  <span className="text-text-muted block text-[10px]">Location</span>
                  <span className="text-white text-xs">{center.city}, {center.state}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Total Capacity</span>
                  <span className="text-white text-xs font-bold">{center.capacity} Candidates</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Devices & Rooms</span>
                  <span className="text-white text-xs">{center.device_count} Clients / {center.rooms} Rooms</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Network Mode</span>
                  <span className="text-white text-xs">{center.network_mode}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Security Status</span>
                  <span className="text-white text-xs font-bold">{center.status}</span>
                </div>
              </div>
            </div>

            {/* History Panel */}
            <div className="md:col-span-2 bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 shadow-md">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">Hosting History & Logs</h3>
              
              {history && history.total_exams_hosted === 0 ? (
                <div className="text-center py-12 text-xs text-text-muted">
                  This center has not hosted any examinations yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-xs">
                  {history?.history?.map((h: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-background/50 border border-border-color rounded-lg font-mono">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white">Exam: {h.exam_id}</span>
                        <span className="text-text-muted text-[10px]">Assigned capacity: {h.assigned_capacity} candidates</span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-bold text-[9px] bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald uppercase">
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
