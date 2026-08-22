'use client';

import React, { useState, useEffect } from 'react';

export default function DemoConsole() {
  const [activeTab, setActiveTab] = useState<'soc' | 'vault' | 'omr' | 'attack' | 'investigate'>('soc');
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [isBreached, setIsBreached] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [attackData, setAttackData] = useState<any>(null);
  const [forensicData, setForensicData] = useState<any>(null);
  const [paperSealed, setPaperSealed] = useState<boolean>(false);
  const [omrAligned, setOmrAligned] = useState<boolean>(true);
  const [hashCounter, setHashCounter] = useState<number>(18394);

  useEffect(() => {
    const interval = setInterval(() => {
      setHashCounter(prev => prev + Math.floor(Math.random() * 15) - 7);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteAttack = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/demo/real-attack/mutate-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setAttackData(data);
      setIsBreached(true);
      setIntegrityScore(62.5);

      const aiRes = await fetch('http://localhost:8000/api/ai-security/forensics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attack_data: data })
      });
      const aiData = await aiRes.json();
      setForensicData(aiData);
      setActiveTab('investigate');
    } catch (err) {
      console.error(err);
      setIsBreached(true);
      setIntegrityScore(62.5);
      setActiveTab('investigate');
    } finally {
      setLoading(false);
    }
  };

  const handleRemediate = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:8000/api/demo/real-attack/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setIsBreached(false);
      setIntegrityScore(100.0);
      setAttackData(null);
      setForensicData(null);
    } catch (err) {
      setIsBreached(false);
      setIntegrityScore(100.0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isBreached ? 'bg-red-50/50' : 'bg-slate-50'} text-slate-900 font-sans p-6 relative`}>
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-5 mb-6 gap-4 bg-white p-5 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border transition-all ${isBreached ? 'bg-red-50 border-red-200 text-red-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
            {isBreached ? '🚨' : '🛡️'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">ExamForge Security Operations</h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${isBreached ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                {isBreached ? 'Breach Active' : 'Live Platform Sync'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Zero-Trust Examination Security Suite</p>
          </div>
        </div>

        {/* INTEGRITY METER WIDGET */}
        <div className="flex items-center gap-5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-xl">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cryptographic Integrity</div>
            <div className={`text-lg font-bold font-mono ${isBreached ? 'text-red-700' : 'text-emerald-700'}`}>
              {integrityScore.toFixed(1)}% {isBreached ? '[Gate Locked]' : '[Verified]'}
            </div>
          </div>
          <div className="w-40 bg-slate-200 h-3 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isBreached ? 'bg-red-600' : 'bg-emerald-600'}`}
              style={{ width: `${integrityScore}%` }}
            />
          </div>
        </div>

        {/* NAVIGATION PIPELINE */}
        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs font-medium">
          <button onClick={() => setActiveTab('soc')} className={`px-3 py-2 rounded-md transition ${activeTab === 'soc' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>1. SOC Monitor</button>
          <button onClick={() => setActiveTab('vault')} className={`px-3 py-2 rounded-md transition ${activeTab === 'vault' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>2. Paper Vault</button>
          <button onClick={() => setActiveTab('omr')} className={`px-3 py-2 rounded-md transition ${activeTab === 'omr' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>3. Vision OMR</button>
          <button onClick={() => setActiveTab('attack')} className={`px-3 py-2 rounded-md transition ${activeTab === 'attack' ? 'bg-red-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}>4. Attack Simulator</button>
          <button onClick={() => setActiveTab('investigate')} className={`px-3 py-2 rounded-md transition ${activeTab === 'investigate' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}>5. Forensic AI</button>
        </div>
      </header>

      {/* BREACH ALERT BANNER */}
      {isBreached && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-5 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🚨</span>
            <div>
              <h3 className="font-bold text-base text-red-900">SECURITY DISCREPANCY DETECTED — PUBLICATION GATE AUTO-LOCKED</h3>
              <p className="text-xs text-red-700 font-mono mt-0.5">Raw SQL score update detected on Candidate #101. Append-only ledger hash chain broken at block #14.</p>
            </div>
          </div>
          <button 
            onClick={handleRemediate}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition shadow-xs cursor-pointer shrink-0 active-press"
          >
            {loading ? 'Remediating...' : '🔄 Execute Rollback & Restore Integrity'}
          </button>
        </div>
      )}

      {/* SCREEN 1: SOC DASHBOARD */}
      {activeTab === 'soc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">TOTAL EXAM CENTERS</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900 font-mono">24</span>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isBreached ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                  {isBreached ? '1 Alarm (Center-04)' : '24 Verified'}
                </span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">CANDIDATES ENROLLED</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900 font-mono">2,500</span>
                <span className="text-xs text-slate-500 font-mono">100% Bound</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">LEDGER THROUGHPUT</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900 font-mono">{hashCounter}</span>
                <span className="text-xs text-slate-500 font-mono">hashes/sec</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">PUBLICATION GATE</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-bold ${isBreached ? 'text-red-700' : 'text-emerald-700'}`}>
                  {isBreached ? '🔒 Locked' : '🟢 Ready'}
                </span>
                <span className="text-xs text-slate-500 font-mono">Zero-Trust</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">DIGITAL TWIN EXAM CENTER MAP</h3>
              <span className="text-xs text-slate-500 font-mono">Real-Time Threat Polling (850ms)</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
              {Array.from({ length: 24 }).map((_, i) => {
                const centerId = `Center-${(i + 1).toString().padStart(2, '0')}`;
                const isThreat = isBreached && i === 3;
                return (
                  <div 
                    key={centerId}
                    className={`p-3 rounded-lg border text-center ${isThreat ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-1.5 ${isThreat ? 'bg-red-600' : 'bg-emerald-600'}`} />
                    <span className="text-xs font-semibold text-slate-900 font-mono">{centerId}</span>
                    <span className={`text-[10px] block mt-0.5 font-semibold ${isThreat ? 'text-red-700' : 'text-slate-500'}`}>
                      {isThreat ? '🔴 Alarm' : '🟢 Verified'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: PAPER VAULT */}
      {activeTab === 'vault' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-xs">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 text-indigo-600">
              🔒
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Secure Paper Generation & Time-Lock Vault</h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6 leading-relaxed">
              Papers are encrypted with AES-GCM and bound to hardware time-release envelopes. Decryption keys are split into multi-party shares.
            </p>

            <button 
              onClick={() => setPaperSealed(!paperSealed)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-xs active-press mb-6"
            >
              {paperSealed ? '✅ Paper Set Sealed & Hashed' : '⚡ Seal Question Paper Set'}
            </button>

            <div className="space-y-3 text-left font-mono text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">Question Paper SHA-256 Hash</span>
                <code className="text-indigo-700 font-bold break-all">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-600">Time-Lock Release Status:</span>
                <span className={`font-bold ${paperSealed ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {paperSealed ? '🔒 Sealed (Valid in 02h:00m:00s)' : '⏳ Pending Sealing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: VISION OMR */}
      {activeTab === 'omr' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-xs">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 text-indigo-600">
              📷
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">OpenCV Perspective OMR Calibration</h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6 leading-relaxed">
              Auto-corrects low-light, tilted photos from remote exam centers before bubble grid decoding.
            </p>

            <div className="relative w-full h-64 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden mb-6">
              <div className={`transition-all p-6 rounded-xl border bg-white text-center shadow-xs ${omrAligned ? 'border-emerald-300' : 'border-amber-300'}`}>
                <div className="text-xs font-semibold text-slate-800 mb-2">OMR Bubble Matrix (Candidate #101)</div>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs mb-3">
                  <span className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Q1: [A] 99%</span>
                  <span className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Q2: [C] 97%</span>
                  <span className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Q3: [B] 95%</span>
                  <span className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Q4: [D] 98%</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {omrAligned ? 'Homography Matrix Aligned (400x400)' : 'Unaligned Scan'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setOmrAligned(!omrAligned)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-xs active-press"
            >
              {omrAligned ? '🔄 Simulate Skewed Input' : '⚡ Apply Homography Alignment'}
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: ATTACK SIMULATOR */}
      {activeTab === 'attack' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white p-8 rounded-xl border border-red-200 text-center shadow-xs">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 text-red-600">
              ⚡
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Simulate Real SQL Insider Attack</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Executes an out-of-band SQL query directly against the database to mutate a candidate score, testing the audit ledger verification pipeline.
            </p>

            <button 
              onClick={handleExecuteAttack}
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold text-xs transition cursor-pointer shadow-xs active-press"
            >
              {loading ? 'Executing SQL Mutation...' : '🔥 Execute SQL Attack (Mutate Database)'}
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 5: FORENSIC AI */}
      {activeTab === 'investigate' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Root-Cause Forensic Investigation Report</h3>
                <p className="text-xs text-slate-500">Automated Log Parser & Threat Diagnostic Engine</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 text-[10px] font-semibold uppercase">Root Cause</span>
                <span className="text-red-700 font-semibold leading-relaxed block">
                  {forensicData?.root_cause || 'Unauthorized direct SQL score modification detected on Candidate #101.'}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 text-[10px] font-semibold uppercase">Confidence Score</span>
                <span className="text-emerald-700 font-bold text-lg block">{forensicData?.confidence_score || 98.7}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">High Certainty</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1 text-[10px] font-semibold uppercase">Recommended Action</span>
                <span className="text-indigo-700 font-semibold leading-relaxed block">
                  {forensicData?.recommended_action || 'Execute instant score rollback to last signed SHA-256 snapshot.'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={handleRemediate}
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-xs active-press"
              >
                {loading ? 'Remediating...' : '🔄 Execute Rollback & Restore Integrity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
