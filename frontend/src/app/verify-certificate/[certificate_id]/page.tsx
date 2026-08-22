"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function VerifyCertificatePage() {
  const { certificate_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!certificate_id) return;
    const verify = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/certificates/result/${certificate_id}/verify`);
        if (!res.ok) throw new Error("Certificate verification failed.");
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || "Could not execute verification pipeline.");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificate_id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-md w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div className="text-center flex flex-col items-center">
          <img
            src="/logo-icon.png"
            alt="ExamForge"
            className="w-12 h-12 rounded-xl object-cover shadow-md border border-border-color mb-1"
          />
          <h1 className="text-xl font-extrabold text-white mt-2 tracking-wide">Public Certificate Validator</h1>
          <p className="text-xs text-text-muted mt-1">Real-time authentication of ExamForge credentials against secure nodes.</p>
        </div>

        {loading && (
          <div className="text-center py-6 text-xs text-text-muted animate-pulse">
            Verifying signatures against distributed ledger...
          </div>
        )}

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Verification Error:</strong> {error}
          </div>
        )}

        {report && (
          <div className="flex flex-col gap-5 text-xs">
            <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center ${report.is_valid ? "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald" : "bg-accent-red/10 border-accent-red/20 text-accent-red"}`}>
              <span className="text-2xl">{report.is_valid ? "🛡️" : "🚨"}</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">
                {report.is_valid ? "Certificate Authentic" : "Invalid Certificate"}
              </h3>
              <p className="text-[10px] opacity-90 leading-normal">
                {report.is_valid 
                  ? "This digital credential is fully active and maps directly to verified records."
                  : "This credential has been superseded, modified, or contains invalid signatures."
                }
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Verification Breakdown</h4>

              <div className="flex justify-between items-center p-2.5 bg-background/40 rounded border border-border-color">
                <span className="text-text-muted">ECDSA Signature Verified:</span>
                <span className={report.signature_valid ? "text-accent-emerald font-bold" : "text-accent-red font-bold"}>
                  {report.signature_valid ? "Valid" : "Invalid"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-background/40 rounded border border-border-color">
                <span className="text-text-muted">Metadata Hash Intact:</span>
                <span className={report.hash_valid ? "text-accent-emerald font-bold" : "text-accent-red font-bold"}>
                  {report.hash_valid ? "Matches" : "Mismatched"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-background/40 rounded border border-border-color">
                <span className="text-text-muted">Database Result State Current:</span>
                <span className={report.result_hash_current ? "text-accent-emerald font-bold" : "text-accent-amber font-bold"}>
                  {report.result_hash_current ? "Current" : "Superseded"}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-background/40 rounded border border-border-color">
                <span className="text-text-muted">Status:</span>
                <span className={`font-bold ${report.status === "VALID" ? "text-accent-emerald" : "text-accent-amber"}`}>
                  {report.status}
                </span>
              </div>
            </div>

            <div className="bg-background/80 p-4 rounded-lg border border-border-color font-mono text-[10px] flex flex-col gap-1.5">
              <div><span className="text-text-muted">Candidate Ref:</span> <span className="text-white">{report.details?.candidate_anonymous_id}</span></div>
              <div><span className="text-text-muted">Exam Ref:</span> <span className="text-white">{report.details?.exam_id}</span></div>
              <div><span className="text-text-muted">Issued Date:</span> <span className="text-white">{report.details?.issued_at ? new Date(report.details.issued_at).toLocaleDateString() : "N/A"}</span></div>
            </div>

            <div className="text-center mt-2">
              <Link href="/result-portal" className="text-xs text-accent-emerald hover:underline font-semibold">
                ← Return to Result Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
