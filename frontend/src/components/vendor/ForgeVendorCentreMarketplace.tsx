"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { 
  Building2, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  Upload, 
  Search, 
  Network, 
  ShieldCheck, 
  RefreshCw,
  Send,
  AlertTriangle
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "../forge/ForgeCard";
import { ForgeButton } from "../forge/ForgeButton";
import { ForgeStatusPill } from "../forge/ForgeStatusPill";

export function ForgeVendorCentreMarketplace() {
  const [vendorCentres, setVendorCentres] = useState([
    {
      id: "VND-CTR-01",
      name: "Delhi Technological Examination Center",
      city: "New Delhi",
      district: "South Delhi",
      capacity: 250,
      cctvVerified: true,
      powerBackup: true,
      status: "VERIFIED"
    },
    {
      id: "VND-CTR-02",
      name: "Gurugram Cyber City Assessment Hub",
      city: "Gurugram",
      district: "Gurugram",
      capacity: 180,
      cctvVerified: true,
      powerBackup: true,
      status: "VERIFIED"
    }
  ]);

  const [requestCity, setRequestCity] = useState("Mumbai");
  const [requestCapacity, setRequestCapacity] = useState(500);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleRequestExamForgeCentres = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitted(true);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Vendor Recognized Centres */}
      <ForgeCard>
        <ForgeCardHeader className="flex-row items-center justify-between">
          <ForgeCardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            1. Vendor Recognized Examination Centres
          </ForgeCardTitle>

          <div className="flex items-center gap-2">
            <ForgeButton variant="secondary" size="compact">
              <Upload className="w-3.5 h-3.5 mr-1" /> Import Centres CSV
            </ForgeButton>
            <ForgeButton variant="primary" size="compact">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add New Centre
            </ForgeButton>
          </div>
        </ForgeCardHeader>

        <ForgeCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorCentres.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{c.name}</span>
                  <ForgeStatusPill status="verified" />
                </div>
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> {c.city}, {c.district}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono">
                  <span className="text-slate-600">Computer Seat Capacity: <strong className="text-slate-900">{c.capacity} Seats</strong></span>
                  <span className="text-emerald-700 font-semibold">CCTV & Power Backup ✓</span>
                </div>
              </div>
            ))}
          </div>
        </ForgeCardContent>
      </ForgeCard>

      {/* Request ExamForge Managed Centres Network */}
      <ForgeCard>
        <ForgeCardHeader>
          <ForgeCardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            2. Request ExamForge Registered Centres Network (If Vendor Has No Centres)
          </ForgeCardTitle>
        </ForgeCardHeader>

        <ForgeCardContent className="space-y-4 max-w-2xl">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            If your organization lacks physical examination centers in specific cities or states, request ExamForge's certified network of 450+ proctored computer labs and test centers.
          </p>

          <form onSubmit={handleRequestExamForgeCentres} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Target City / District</label>
                <input
                  type="text"
                  value={requestCity}
                  onChange={e => setRequestCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Required Candidate Capacity</label>
                <input
                  type="number"
                  value={requestCapacity}
                  onChange={e => setRequestCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {requestSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Centre Allocation Request Dispatched
                </div>
                <div className="text-emerald-800">ExamForge Centre Operations team is matching 3 certified test hubs in {requestCity}.</div>
                <div className="text-emerald-800">Commercial contract proposal will be delivered within 2 hours.</div>
              </div>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Submit ExamForge Network Allocation Request
              </button>
            )}
          </form>

        </ForgeCardContent>
      </ForgeCard>

    </div>
  );
}
