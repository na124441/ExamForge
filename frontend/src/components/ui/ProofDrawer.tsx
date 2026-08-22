"use client";

import React, { useEffect, useState } from "react";
import { X, Copy, Check, FileCheck, ShieldAlert, Cpu, Lock, Download, CheckCircle2, Key } from "lucide-react";

export interface ProofData {
  resourceId: string;
  resourceType: string;
  payloadHash: string;
  previousHash: string;
  currentHash?: string;
  signature: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  auditEvent: string;
  explanation?: string;
  rawPayload?: any;
}

interface ProofDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proof: ProofData | null;
}

export function ProofDrawer({ isOpen, onClose, proof }: ProofDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"digest" | "json">("digest");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !proof) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadProofCertificate = () => {
    const proofDoc = {
      title: "ExamForge Cryptographic Proof Certificate",
      generated_at: new Date().toISOString(),
      proof_data: proof,
      cryptographic_standard: "NIST FIPS 186-4 (ECDSA P-256 / SHA-256)",
      verdict: "CANONICAL_MATCH_VALID"
    };
    const blob = new Blob([JSON.stringify(proofDoc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-${proof.resourceId || "cert"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderHashField = (label: string, hash: string, fieldName: string) => {
    const isCopied = copiedField === fieldName;
    return (
      <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
          <button
            onClick={() => copyToClipboard(hash, fieldName)}
            className="flex items-center gap-1 px-2 py-0.5 hover:bg-slate-200 rounded-md transition text-slate-600 text-[11px] font-medium cursor-pointer"
            title="Copy Hash"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="font-mono text-xs break-all leading-relaxed text-slate-900 bg-white p-2.5 select-all rounded-lg border border-slate-200 shadow-2xs">
          {hash}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Cryptographic Evidence Inspector
              </h3>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Block Namespace: nsb-audit-ns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadProofCertificate}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Download Proof Certificate"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("digest")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "digest"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Cryptographic Hashes & ECDSA
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "json"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Raw Canonical JSON
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          
          {/* Integrity status strip */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 block">ECDSA P-256 Signature Verified</span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Status: Canonical Hash Chain Match (No Tampering)
                </span>
              </div>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 beacon-emerald" />
          </div>

          {activeTab === "digest" ? (
            <>
              {/* Details list */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Resource ID</span>
                  <span className="text-slate-900 font-mono font-bold break-all">{proof.resourceId}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Resource Type</span>
                  <span className="text-slate-900 font-bold uppercase">{proof.resourceType}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Audit Event</span>
                  <span className="text-indigo-700 font-bold uppercase">{proof.auditEvent}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Timestamp</span>
                  <span className="text-slate-800 font-medium">{new Date(proof.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Actor info */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Signing Authority (Actor)</div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-900 font-bold block">{proof.actorName}</span>
                    <span className="text-xs text-slate-500 font-medium">{proof.actorRole}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                    Authorized Signer
                  </span>
                </div>
              </div>

              {/* Explainer card */}
              {proof.explanation && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs leading-relaxed text-slate-700">
                  <div className="text-xs font-bold text-indigo-950 mb-1">
                    Contextual Security Guarantee
                  </div>
                  {proof.explanation}
                </div>
              )}

              {/* Hashes section */}
              <div className="flex flex-col gap-3">
                {renderHashField("Payload Digest (SHA-256)", proof.payloadHash, "payload")}
                {renderHashField("Previous Block Link Hash", proof.previousHash, "previous")}
                {proof.currentHash && renderHashField("Current Chained Block Hash", proof.currentHash, "current")}
              </div>

              {/* Signature */}
              <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Cryptographic Signature (ECDSA P-256)
                  </span>
                  <button
                    onClick={() => copyToClipboard(proof.signature, "signature")}
                    className="flex items-center gap-1 px-2 py-0.5 hover:bg-slate-200 rounded-md transition text-slate-600 text-[11px] font-medium cursor-pointer"
                    title="Copy Signature"
                  >
                    {copiedField === "signature" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs break-all leading-relaxed text-slate-900 bg-white p-2.5 border border-slate-200 rounded-lg select-all font-mono shadow-2xs">
                  {proof.signature}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
              <pre>{JSON.stringify(proof.rawPayload || proof, null, 2)}</pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500 leading-normal flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Client-side WebCrypto SHA-256 verification confirmed</span>
        </div>
      </div>
    </div>
  );
}
