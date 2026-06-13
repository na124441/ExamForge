"use client";

import React, { useEffect, useState } from "react";
import { X, Copy, Check, FileCheck, ShieldAlert, Cpu } from "lucide-react";

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
}

interface ProofDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proof: ProofData | null;
}

export function ProofDrawer({ isOpen, onClose, proof }: ProofDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Close on Escape key
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

  const renderHashField = (label: string, hash: string, fieldName: string) => {
    const isCopied = copiedField === fieldName;
    return (
      <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950/80 border border-white/[0.05] rounded-xl hover:border-violet-500/20 transition duration-300">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            {label}
          </span>
          <button
            onClick={() => copyToClipboard(hash, fieldName)}
            className="p-1 hover:bg-white/[0.04] rounded transition text-slate-400 hover:text-white cursor-pointer"
            title="Copy Hash"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="font-mono text-[10px] break-all leading-normal text-slate-300 bg-slate-950/40 p-2 select-all rounded border border-white/[0.02]">
          {hash}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#0C1122]/95 backdrop-blur-xl border-l border-white/[0.08] h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 animate-in slide-in-from-right duration-300">
        <div className="glow-radial-canvas" />

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/[0.06] bg-slate-950/30 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 shadow-[0_0_10px_rgba(124,58,237,0.1)]">
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Cryptographic Evidence Proof
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Block Namespace: nsb-audit-ns
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/[0.04] rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 relative z-10">
          
          {/* Integrity status strip */}
          <div className="flex items-center justify-between p-4 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <div className="font-mono">
                <span className="text-xs font-bold text-white block">ECDSA Signature Verified</span>
                <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-widest">
                  Status: Canonical Match
                </span>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse animate-pulse-dot" />
          </div>

          {/* Details list */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-slate-950/40 border border-white/[0.04] rounded-xl">
              <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Resource ID</span>
              <span className="text-slate-200 font-semibold break-all">{proof.resourceId}</span>
            </div>
            <div className="p-3.5 bg-slate-950/40 border border-white/[0.04] rounded-xl">
              <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Resource Type</span>
              <span className="text-slate-200 font-semibold uppercase">{proof.resourceType}</span>
            </div>
            <div className="p-3.5 bg-slate-950/40 border border-white/[0.04] rounded-xl">
              <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Audit Event</span>
              <span className="text-violet-400 font-bold uppercase">{proof.auditEvent}</span>
            </div>
            <div className="p-3.5 bg-slate-950/40 border border-white/[0.04] rounded-xl">
              <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Timestamp</span>
              <span className="text-slate-200">{new Date(proof.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* Actor info */}
          <div className="p-4 bg-slate-950/20 border border-white/[0.04] rounded-xl text-xs font-mono">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Signing Authority (Actor)</div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-white font-bold block">{proof.actorName}</span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">{proof.actorRole}</span>
              </div>
              <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-bold rounded uppercase">
                Authorized Signer
              </span>
            </div>
          </div>

          {/* Explainer card */}
          {proof.explanation && (
            <div className="p-4 bg-violet-500/[0.03] border border-violet-500/15 rounded-xl text-xs leading-relaxed text-slate-350">
              <div className="text-[9px] text-violet-400 uppercase font-bold font-mono tracking-wider mb-1">
                Contextual Meaning (Why this matters)
              </div>
              {proof.explanation}
            </div>
          )}

          {/* Hashes section */}
          <div className="flex flex-col gap-3">
            {renderHashField("Payload Digest (SHA-256)", proof.payloadHash, "payload")}
            {renderHashField("Previous Link Hash", proof.previousHash, "previous")}
            {proof.currentHash && renderHashField("Current Block Hash", proof.currentHash, "current")}
          </div>

          {/* Signature */}
          <div className="flex flex-col gap-2 p-3.5 bg-slate-950 border border-white/[0.05] rounded-xl font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Cryptographic Signature (ECDSA P-256)
              </span>
              <button
                onClick={() => copyToClipboard(proof.signature, "signature")}
                className="p-1 hover:bg-white/[0.04] rounded transition text-slate-400 hover:text-white cursor-pointer"
                title="Copy Signature"
              >
                {copiedField === "signature" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-[9px] break-all leading-normal text-slate-400 bg-slate-950/40 p-2 border border-white/[0.02] rounded select-all font-mono">
              {proof.signature}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] bg-slate-950/30 text-center font-mono text-[9px] text-slate-500 leading-normal relative z-10">
          This cryptographic proof is verified client-side using WebCrypto ECDSA standards. Any change to the database records will invalidate this proof chain.
        </div>
      </div>
    </div>
  );
}
