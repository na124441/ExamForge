"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import { 
  Sparkles, 
  FileText, 
  Upload, 
  Layers, 
  CheckCircle2, 
  Shuffle, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  BookOpen, 
  Lock, 
  ShieldCheck, 
  Download 
} from "lucide-react";
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from "../forge/ForgeCard";
import { ForgeButton } from "../forge/ForgeButton";
import { ForgeStatusPill } from "../forge/ForgeStatusPill";

export function ForgeVendorExamStudio() {
  const [examName, setExamName] = useState("National Eligibility & Technical Aptitude Test 2026");
  const [examCode, setExamCode] = useState("NETAT-2026");
  const [subject, setSubject] = useState("Quantum Mechanics & Cryptography");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [numQuestions, setNumQuestions] = useState(50);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generatedQuestionsCount, setGeneratedQuestionsCount] = useState(50);
  const [setsGenerated, setSetsGenerated] = useState(false);

  const handleTriggerAiGeneration = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      setGeneratedQuestionsCount(prev => prev + 10);
    }, 1200);
  };

  const handleGenerateSets = () => {
    setSetsGenerated(true);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Exam Blueprint Config */}
      <ForgeCard>
        <ForgeCardHeader>
          <ForgeCardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            1. Examination Blueprint & Rules Configuration
          </ForgeCardTitle>
        </ForgeCardHeader>
        <ForgeCardContent className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Examination Title</label>
              <input
                type="text"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Examination Code</label>
              <input
                type="text"
                value={examCode}
                onChange={e => setExamCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Total Marks</label>
              <input
                type="number"
                defaultValue={200}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Duration (Mins)</label>
              <input
                type="number"
                defaultValue={180}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Negative Marking</label>
              <input
                type="text"
                defaultValue="-1.0 per wrong"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono"
              />
            </div>
          </div>
        </ForgeCardContent>
      </ForgeCard>

      {/* Question Bank Upload & ExamForge AI Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Upload Raw Question Bank */}
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Raw Question Bank (CSV/JSON/Docx)
            </ForgeCardTitle>
          </ForgeCardHeader>
          <ForgeCardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50 cursor-pointer">
              <FileText className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <div className="text-xs font-bold text-slate-900">Click to Upload Question Bank File</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Supports CSV, JSON, Docx, LaTeX & Markdown formats.</div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono flex items-center justify-between">
              <span>Uploaded Bank: <strong className="text-slate-900">question_bank_v2.json</strong></span>
              <span className="text-emerald-700 font-bold">50 Items Loaded</span>
            </div>
          </ForgeCardContent>
        </ForgeCard>

        {/* Right: ExamForge AI Generator Copilot */}
        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generate Questions with ExamForge AI Copilot
            </ForgeCardTitle>
          </ForgeCardHeader>
          <ForgeCardContent className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">Subject & Topic Prompt</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">AI Quality Score: <strong className="text-emerald-600">98.4%</strong></span>
              <span className="text-slate-600">Ambiguity Filter: <strong className="text-purple-600">Active</strong></span>
            </div>

            <button
              type="button"
              onClick={handleTriggerAiGeneration}
              disabled={isAiGenerating}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAiGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating DeepSeek-R1 Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Synthesize 10 New AI Questions & Solution Keys
                </>
              )}
            </button>
          </ForgeCardContent>
        </ForgeCard>

      </div>

      {/* Multi-Set Randomized Paper Compiler */}
      <ForgeCard>
        <ForgeCardHeader className="flex-row items-center justify-between">
          <ForgeCardTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-blue-600" />
            Randomized Question-Paper Set Compiler (Set A, B, C, D)
          </ForgeCardTitle>

          <ForgeButton variant="primary" size="compact" onClick={handleGenerateSets}>
            <Shuffle className="w-3.5 h-3.5 mr-1" /> Compile 4 Randomized Paper Sets
          </ForgeButton>
        </ForgeCardHeader>

        <ForgeCardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {["Set A (Primary)", "Set B (Interleaved)", "Set C (Scrambled)", "Set D (Backup)"].map((setName, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">{setName}</span>
                  <ForgeStatusPill status={setsGenerated ? "verified" : "draft"} />
                </div>
                <div className="text-xs text-slate-500 font-mono">Questions: {generatedQuestionsCount} Items</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">ECDSA Hash: 0x89A{idx + 1}...</div>
              </div>
            ))}
          </div>
        </ForgeCardContent>
      </ForgeCard>

    </div>
  );
}
