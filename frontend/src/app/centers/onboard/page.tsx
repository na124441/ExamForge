"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      if (!meRes.ok) throw new Error("Authentication failed.");
      const me = await meRes.json();

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

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to onboard center.");
      }

      router.push("/centers");
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
          <h1 className="text-xl font-extrabold text-white tracking-wide">Onboard Exam Center</h1>
          <p className="text-xs text-text-muted mt-0.5">Register a persistent facility with network and capacity rules.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Onboarding Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-text-muted mb-1 font-semibold">Center Name *</label>
            <input
              type="text"
              placeholder="e.g. Lucknow Public Exam Center"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">City *</label>
              <input
                type="text"
                placeholder="Lucknow"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">State *</label>
              <input
                type="text"
                placeholder="Uttar Pradesh"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Rooms</label>
              <input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Devices</label>
              <input
                type="number"
                value={devices}
                onChange={(e) => setDevices(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Network Mode</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Security Level</label>
              <select
                value={security}
                onChange={(e) => setSecurity(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white"
              >
                <option value="STANDARD">STANDARD</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition cursor-pointer text-xs uppercase tracking-wider mt-2"
          >
            {loading ? "Registering center..." : "Onboard Center"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/centers" className="text-xs text-text-muted hover:text-white transition">
            ← Cancel and Return
          </Link>
        </div>
      </div>
    </div>
  );
}
