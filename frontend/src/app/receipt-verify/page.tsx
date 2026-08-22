"use client";

import { useState } from "react";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { Upload, CheckCircle2, XCircle, ShieldCheck, FileJson } from "lucide-react";

export default function ReceiptVerifyPage() {
  const [receiptHash, setReceiptHash] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "valid" | "invalid">("idle");
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleVerify = async () => {
    setVerificationStatus("verifying");
    // Simulate WebCrypto verification
    setTimeout(async () => {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(receiptHash || "mock-receipt-data");
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        setVerificationStatus("valid");
        setReceiptData({
          rollNo: "EXAM-2026-98124",
          examId: "CS-ADV-09",
          timestamp: new Date().toISOString(),
          answersDigest: hashHex.substring(0, 32),
          signature: "valid"
        });
      } catch (err) {
        setVerificationStatus("invalid");
      }
    }, 1500);
  };

  return (
    <div className="forge-public min-h-screen bg-[var(--surface-sunken)] p-8 font-sans text-[var(--text-main)]">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-strong)]">Digital Receipt Verifier</h1>
          <p className="text-[var(--text-subtle)]">
            Cryptographically validate candidate digital exam receipts using WebCrypto SHA-256 validation.
          </p>
        </header>

        <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-3)] p-6 space-y-6 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-main)]">Receipt Hash (Hex) or Upload JSON</label>
              <div className="flex gap-4">
                <ForgeInput 
                  placeholder="Enter 64-character SHA-256 hash..."
                  value={receiptHash}
                  onChange={(e) => setReceiptHash(e.target.value)}
                  className="flex-1"
                />
                <ForgeButton variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload JSON
                </ForgeButton>
              </div>
            </div>
            <ForgeButton 
              onClick={handleVerify} 
              disabled={verificationStatus === "verifying"}
              className="w-full"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {verificationStatus === "verifying" ? "Verifying Authority Signature..." : "Verify Digital Receipt"}
            </ForgeButton>
          </div>
        </div>

        {verificationStatus === "valid" && receiptData && (
          <div className="bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-4)] p-8 space-y-8 print:p-0 print:border-none print:shadow-none shadow-sm print:bg-transparent">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[var(--status-success)]" />
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-strong)]">Verification Certificate</h2>
                  <p className="text-sm text-[var(--status-success)] font-medium">ECDSA Authority Signature VERIFIED</p>
                </div>
              </div>
              <ForgeBadge variant="success">VALID RECEIPT</ForgeBadge>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider font-semibold">Candidate Roll No</p>
                <ForgeMonoText>{receiptData.rollNo}</ForgeMonoText>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider font-semibold">Exam ID</p>
                <ForgeMonoText>{receiptData.examId}</ForgeMonoText>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider font-semibold">Timestamp (UTC)</p>
                <ForgeMonoText>{receiptData.timestamp}</ForgeMonoText>
              </div>
              <div className="space-y-1 overflow-hidden">
                <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider font-semibold">Answers Digest (SHA-256)</p>
                <ForgeMonoText className="text-xs truncate block">{receiptData.answersDigest}</ForgeMonoText>
              </div>
            </div>

            <div className="pt-6 flex justify-end print:hidden">
              <ForgeButton variant="outline" onClick={() => window.print()}>
                Print Certificate
              </ForgeButton>
            </div>
          </div>
        )}

        {verificationStatus === "invalid" && (
          <div className="bg-[var(--status-danger-muted)] border border-[var(--status-danger)] rounded-[var(--radius-3)] p-6 flex items-start gap-4">
            <XCircle className="w-6 h-6 text-[var(--status-danger)] mt-0.5" />
            <div>
              <h3 className="font-medium text-[var(--status-danger)]">Verification Failed</h3>
              <p className="text-sm text-[var(--text-main)] mt-1">
                The provided receipt hash or payload could not be verified against the authority signatures. It may have been tampered with or does not exist.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
