"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { 
  Users, 
  UserPlus, 
  Upload, 
  CheckCircle2, 
  Scale, 
  Shuffle, 
  ShieldCheck, 
  Lock, 
  Search 
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "../forge/ForgeCard";
import { ForgeButton } from "../forge/ForgeButton";
import { ForgeStatusPill } from "../forge/ForgeStatusPill";

export function ForgeVendorEvaluatorManager() {
  const [evaluators, setEvaluators] = useState([
    {
      id: "EVL-001",
      name: "Dr. Ananya Sharma",
      email: "ananya.sharma@university.edu",
      subject: "Quantum Physics & Calculus",
      status: "ACTIVE",
      assignedCount: 450,
      completedCount: 380
    },
    {
      id: "EVL-002",
      name: "Prof. Rajesh Verma",
      email: "rajesh.verma@techinst.ac.in",
      subject: "Computer Architecture & AI",
      status: "ACTIVE",
      assignedCount: 500,
      completedCount: 420
    }
  ]);

  const [newEvaluatorName, setNewEvaluatorName] = useState("");
  const [newEvaluatorEmail, setNewEvaluatorEmail] = useState("");
  const [newEvaluatorSubject, setNewEvaluatorSubject] = useState("Quantum Physics");

  const handleAddEvaluator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvaluatorName || !newEvaluatorEmail) return;

    setEvaluators(prev => [
      ...prev,
      {
        id: "EVL-00" + (prev.length + 1),
        name: newEvaluatorName,
        email: newEvaluatorEmail,
        subject: newEvaluatorSubject,
        status: "ACTIVE",
        assignedCount: 0,
        completedCount: 0
      }
    ]);
    setNewEvaluatorName("");
    setNewEvaluatorEmail("");
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Evaluator Onboarding & DB Registration */}
      <ForgeCard>
        <ForgeCardHeader className="flex-row items-center justify-between">
          <ForgeCardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            1. Evaluator / Subject Checker Onboarding & DB Registration
          </ForgeCardTitle>

          <ForgeButton variant="secondary" size="compact">
            <Upload className="w-3.5 h-3.5 mr-1" /> Import Evaluators List (CSV)
          </ForgeButton>
        </ForgeCardHeader>

        <ForgeCardContent className="space-y-4">
          <form onSubmit={handleAddEvaluator} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase font-mono">Register New Subject Evaluator</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newEvaluatorName}
                onChange={e => setNewEvaluatorName(e.target.value)}
                placeholder="Evaluator Full Name"
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <input
                type="email"
                value={newEvaluatorEmail}
                onChange={e => setNewEvaluatorEmail(e.target.value)}
                placeholder="Institutional Email"
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <select
                value={newEvaluatorSubject}
                onChange={e => setNewEvaluatorSubject(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Quantum Physics">Quantum Physics & Calculus</option>
                <option value="Computer Architecture">Computer Architecture & AI</option>
                <option value="Cryptography">Cryptography & Networks</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Register Evaluator to DB
            </button>
          </form>

          {/* Active Evaluators List Table */}
          <div className="space-y-2">
            {evaluators.map(ev => (
              <div key={ev.id} className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{ev.name}</span>
                    <ForgeStatusPill status="verified" />
                  </div>
                  <div className="text-slate-500 font-mono">{ev.email} • {ev.subject}</div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono">
                  <div className="text-right">
                    <div className="text-slate-900 font-bold">{ev.completedCount} / {ev.assignedCount} Answers Checked</div>
                    <div className="text-[10px] text-blue-600 font-semibold">Random Pool Delivery Active</div>
                  </div>
                  <ForgeButton variant="secondary" size="compact" onClick={() => window.location.href = "/evaluator"}>
                    Launch Checker Feed
                  </ForgeButton>
                </div>
              </div>
            ))}
          </div>
        </ForgeCardContent>
      </ForgeCard>

    </div>
  );
}
