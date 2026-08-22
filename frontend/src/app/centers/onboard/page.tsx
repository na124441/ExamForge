"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowLeft, Plus, ShieldCheck } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function OnboardCenter() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [capacity, setCapacity] = useState("500");
  const [rooms, setRooms] = useState("12");
  const [devices, setDevices] = useState("40");
  const [network, setNetwork] = useState("HYBRID");
  const [security, setSecurity] = useState("HIGH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !state) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const me = meRes.ok ? await meRes.json() : { institution_id: "INS-GENESIS" };

      const res = await fetch(`${BACKEND_URL}/api/centers/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_id: me.institution_id || "INS-GENESIS",
          name,
          city,
          state,
          capacity: parseInt(capacity),
          rooms: parseInt(rooms),
          device_count: parseInt(devices),
          network_mode: network,
          security_level: security
        })
      });

      router.push("/centers");
    } catch (err: any) {
      router.push("/centers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 md:p-10 font-sans items-center justify-center">
      <div className="max-w-lg w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Onboard Exam Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">Register a persistent physical facility node in the network.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Center Name *</label>
            <input
              type="text"
              placeholder="e.g. Apex Regional Center North"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">City *</label>
              <input
                type="text"
                placeholder="New Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">State / Province *</label>
              <input
                type="text"
                placeholder="Delhi"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Rooms</label>
              <input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Clients</label>
              <input
                type="number"
                value={devices}
                onChange={(e) => setDevices(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Network Topology</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="HYBRID">Hybrid Air-Gap</option>
                <option value="ONLINE">Dedicated Fiber (Encrypted)</option>
                <option value="AIR_GAPPED">Strict Air-Gapped LAN</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Hardware Security</label>
              <select
                value={security}
                onChange={(e) => setSecurity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="HIGH">Tier-1 HSM Enclave</option>
                <option value="MEDIUM">Standard Enclave</option>
                <option value="GOVERNMENT">FIPS 140-3 Level 4</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs active-press flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loading ? "Registering node..." : "Onboard Center"}</span>
            </button>
            <Link
              href="/centers"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl transition font-bold text-center flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
