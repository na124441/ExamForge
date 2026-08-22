"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function ResultCertificatePage() {
  const { certificate_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!certificate_id) return;
    const fetchCert = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/certificates/result/${certificate_id}`);
        if (!res.ok) throw new Error("Certificate not found.");
        const data = await res.json();
        setCert(data);
      } catch (err: any) {
        setError(err.message || "Could not fetch certificate details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [certificate_id]);

  const downloadCertJson = () => {
    if (!cert) return;
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${cert.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      {loading && (
        <div className="text-center text-xs text-text-muted animate-pulse">
          Querying secure vault keys...
        </div>
      )}

      {error && (
        <div className="max-w-md w-full bg-card-bg p-6 rounded-xl border border-border-color shadow-lg text-center flex flex-col gap-4">
          <span className="text-3xl">⚠️</span>
          <p className="text-xs text-accent-red font-semibold">{error}</p>
          <Link href="/result-portal" className="text-xs text-accent-emerald hover:underline font-bold">
            Return to Portal
          </Link>
        </div>
      )}

      {cert && (
        <div className="max-w-3xl w-full flex flex-col gap-6 items-center animate-in fade-in duration-300">
          {/* Certificate Frame */}
          <div className="w-full bg-card-bg p-12 rounded-3xl border-4 border-double border-accent-amber/40 shadow-2xl relative overflow-hidden flex flex-col items-center gap-6">
            
            {/* Watermark/Background lines */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Top Seal */}
            <div className="text-center flex flex-col items-center gap-2 z-10">
              <img
                src="/logo-icon.png"
                alt="ExamForge"
                className="w-12 h-12 rounded-xl object-cover shadow-lg border border-accent-amber/40"
              />
              <h2 className="text-xs font-bold text-accent-amber uppercase tracking-[0.2em]">ExamForge Zero-Trust Authority</h2>
              <div className="h-[2px] w-20 bg-accent-amber/50 my-1"></div>
            </div>

            {/* Title */}
            <div className="text-center mt-2 z-10">
              <h1 className="text-3xl font-extrabold text-white tracking-wide uppercase">Certificate of Examination Result</h1>
              <p className="text-xs text-text-muted mt-2 italic font-serif">This certifies the cryptographically locked status of result records.</p>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3 w-full max-w-lg bg-background/40 p-6 rounded-xl border border-border-color/60 font-mono text-[11px] mt-4 z-10">
              <div className="flex justify-between border-b border-border-color pb-2">
                <span className="text-text-muted">Certificate ID:</span>
                <span className="text-white font-bold">{cert.id}</span>
              </div>
              <div className="flex justify-between border-b border-border-color pb-2">
                <span className="text-text-muted">Exam Reference:</span>
                <span className="text-white font-bold">{cert.exam_id}</span>
              </div>
              <div className="flex justify-between border-b border-border-color pb-2">
                <span className="text-text-muted">Candidate Anon ID:</span>
                <span className="text-white font-bold">{cert.candidate_anonymous_id}</span>
              </div>
              <div className="flex justify-between border-b border-border-color pb-2">
                <span className="text-text-muted">Result Digest:</span>
                <span className="text-white font-bold break-all">{cert.result_hash}</span>
              </div>
              <div className="flex justify-between border-b border-border-color pb-2">
                <span className="text-text-muted">Certificate Signature Hash:</span>
                <span className="text-white font-bold break-all">{cert.certificate_hash}</span>
              </div>
              <div className="flex justify-between border-b border-border-color pb-2">
                <span className="text-text-muted">Issued Timestamp:</span>
                <span className="text-white">{new Date(cert.issued_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Verification Status:</span>
                <span className={`font-bold ${cert.status === "VALID" ? "text-accent-emerald" : "text-accent-red"}`}>{cert.status}</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-center w-full max-w-lg mt-6 z-10">
              <div className="text-center flex flex-col items-center">
                <div className="font-serif italic text-accent-amber/90 text-sm mb-1">ECDSA Lock</div>
                <div className="h-[1px] w-28 bg-border-color"></div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">Authority Signature</div>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="font-mono text-[9px] text-white bg-background px-2.5 py-1.5 rounded border border-border-color/80 max-w-[180px] break-all leading-tight">
                  {cert.signature.slice(0, 16)}...
                </div>
                <div className="h-[1px] w-28 bg-border-color mt-1"></div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">Cryptographic Key</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 w-full max-w-lg">
            <button onClick={downloadCertJson} className="flex-1 py-3 bg-accent-amber text-background font-extrabold rounded-lg hover:bg-accent-amber/90 transition text-xs tracking-wider uppercase">
              💾 Download Signed JSON Package
            </button>
            <Link href={`/verify-certificate/${cert.id}`} className="flex-1 text-center py-3 bg-card-bg border border-border-color hover:border-accent-emerald text-white font-extrabold rounded-lg transition text-xs tracking-wider uppercase">
              🌐 Open Public Verification URL
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
