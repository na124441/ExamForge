"use client";

import { useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function InstitutionAuditReport() {
  const [examId, setExamId] = useState("EXM-006");
  const [reportIdInput, setReportIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  
  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) {
      setError("Please specify an Exam ID.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    setVerification(null);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/reports/exam/${examId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to generate report. Only Controllers can execute this action.");
      }

      const reportData = await res.json();
      
      // Now fetch details of the generated report (since create returns db instance which may not have sections inline, or let's load it)
      const detailsRes = await fetch(`${BACKEND_URL}/api/reports/${reportData.id}`);
      if (!detailsRes.ok) throw new Error("Could not load report details.");
      const detailsJson = await detailsRes.json();
      setReport(detailsJson);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportIdInput) {
      setError("Please specify a Report ID.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    setVerification(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${reportIdInput}`);
      if (!res.ok) {
        throw new Error("Report not found. Verify the Report ID.");
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!report) return;
    setVerifying(true);
    setVerification(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${report.id}/verify`);
      if (!res.ok) throw new Error("Verification failed.");
      const data = await res.json();
      setVerification(data);
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(report, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `audit_report_${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const stats = report?.sections?.stats;
  const overview = report?.sections?.overview;
  const auditChain = report?.sections?.audit_chain;
  const verdict = report?.sections?.integrity_verdict;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Institution Audit Report Console</h1>
              <p className="text-xs text-text-muted mt-0.5">Generate, audit, and mathematically prove the transparency of an examination cycle.</p>
            </div>
          </div>
          <Link href="/role-admin" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            ← Controller Ops
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Report Form */}
          <form onSubmit={handleGenerate} className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs">Generate Official Exam Report</h3>
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Exam Identification ID</label>
              <input
                type="text"
                placeholder="e.g. EXM-006"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono text-white text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent-emerald text-background font-extrabold rounded-lg hover:bg-accent-emerald/90 transition uppercase tracking-wider text-xs cursor-pointer"
            >
              {loading ? "Compiling Audit Data..." : "Seal & Generate Report"}
            </button>
          </form>

          {/* Load Existing Report Form */}
          <form onSubmit={handleLoadExisting} className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs">Lookup Sealed Report</h3>
            <div>
              <label className="block text-text-muted mb-1 font-semibold">Report Unique ID</label>
              <input
                type="text"
                placeholder="e.g. 582d921b-4f51-4bc9..."
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value)}
                className="w-full p-2.5 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none font-mono text-white text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-card-bg border border-border-color text-white font-extrabold rounded-lg hover:bg-border-color transition uppercase tracking-wider text-xs cursor-pointer"
            >
              Lookup Report
            </button>
          </form>
        </div>

        {loading && (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Connecting with cryptographic audit ledgers...
          </div>
        )}

        {/* Report Display */}
        {report && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Top Status and Integrity Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Verdict Shield */}
              <div className={`p-6 rounded-xl border flex items-center gap-4 ${
                verdict?.verdict === "VERIFIED"
                  ? "bg-accent-emerald/5 border-accent-emerald/20 text-white"
                  : "bg-accent-red/5 border-accent-red/20 text-white"
              }`}>
                <span className="text-4xl">{verdict?.verdict === "VERIFIED" ? "🛡️" : "⚠️"}</span>
                <div>
                  <h4 className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Integrity Verdict</h4>
                  <p className={`text-base font-extrabold ${verdict?.verdict === "VERIFIED" ? "text-accent-emerald" : "text-accent-red"}`}>
                    {verdict?.verdict === "VERIFIED" ? "EXAM TRUST VERIFIED" : "AUDIT FAILURE DETECTED"}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    {verdict?.verdict === "VERIFIED" 
                      ? "All cryptographic signature chains, OMR checks, and evaluations are fully verified intact."
                      : "Warning: Discrepancies detected in the ledger history. Results are compromised."}
                  </p>
                </div>
              </div>

              {/* Chain Status */}
              <div className={`p-6 rounded-xl border flex items-center gap-4 ${
                auditChain?.intact
                  ? "bg-accent-emerald/5 border-accent-emerald/20 text-white"
                  : "bg-accent-red/5 border-accent-red/20 text-white"
              }`}>
                <span className="text-4xl">{auditChain?.intact ? "⛓️" : "💔"}</span>
                <div>
                  <h4 className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Sealed Audit Chain</h4>
                  <p className={`text-base font-extrabold ${auditChain?.intact ? "text-accent-emerald" : "text-accent-red"}`}>
                    {auditChain?.intact ? "LEDGER CHAIN INTACT" : "TAMPERING SIGNATURES DETECTED"}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    {auditChain?.intact
                      ? "The secure block hashes confirm no unauthorized direct database edits occurred."
                      : "Critical Alert: Break in audit trail links detected. Database has been altered directly."}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Dashboard */}
            {stats && (
              <div className="flex flex-col gap-3">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Examination Process Metrics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-card-bg p-4 rounded-xl border border-border-color text-center shadow-md">
                    <span className="text-xl block mb-1">👥</span>
                    <span className="text-text-muted text-[10px] block font-semibold uppercase tracking-wider">Candidates</span>
                    <span className="text-white font-mono font-bold text-lg mt-1 block">{stats.total_candidates}</span>
                  </div>

                  <div className="bg-card-bg p-4 rounded-xl border border-border-color text-center shadow-md">
                    <span className="text-xl block mb-1">📦</span>
                    <span className="text-text-muted text-[10px] block font-semibold uppercase tracking-wider">Papers Sealed</span>
                    <span className="text-white font-mono font-bold text-lg mt-1 block">{stats.total_packages}</span>
                  </div>

                  <div className="bg-card-bg p-4 rounded-xl border border-border-color text-center shadow-md">
                    <span className="text-xl block mb-1">🚨</span>
                    <span className="text-text-muted text-[10px] block font-semibold uppercase tracking-wider">Incidents</span>
                    <span className="text-white font-mono font-bold text-lg mt-1 block">{stats.total_incidents}</span>
                  </div>

                  <div className="bg-card-bg p-4 rounded-xl border border-border-color text-center shadow-md">
                    <span className="text-xl block mb-1">🔘</span>
                    <span className="text-text-muted text-[10px] block font-semibold uppercase tracking-wider">OMR Reviews</span>
                    <span className="text-white font-mono font-bold text-lg mt-1 block">{stats.total_omr_reviews}</span>
                  </div>

                  <div className="bg-card-bg p-4 rounded-xl border border-border-color text-center shadow-md">
                    <span className="text-xl block mb-1">✍️</span>
                    <span className="text-text-muted text-[10px] block font-semibold uppercase tracking-wider">Evaluations</span>
                    <span className="text-white font-mono font-bold text-lg mt-1 block">{stats.total_evaluations}</span>
                  </div>

                  <div className="bg-card-bg p-4 rounded-xl border border-border-color text-center shadow-md">
                    <span className="text-xl block mb-1">⚠️</span>
                    <span className="text-text-muted text-[10px] block font-semibold uppercase tracking-wider">Disputes</span>
                    <span className="text-white font-mono font-bold text-lg mt-1 block">{stats.total_disputes}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verification and Cryptography Panel */}
            <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs shadow-lg">
              <div className="flex-1 flex flex-col gap-2 font-mono text-[10px]">
                <div>
                  <span className="text-text-muted">Report Identifier:</span>
                  <span className="text-white ml-2">{report.id}</span>
                </div>
                <div>
                  <span className="text-text-muted">Signature Hash:</span>
                  <span className="text-white ml-2 break-all">{report.report_hash}</span>
                </div>
                <div>
                  <span className="text-text-muted">Authority Signature:</span>
                  <span className="text-white ml-2 break-all">{report.signature}</span>
                </div>
                {overview && (
                  <div>
                    <span className="text-text-muted">Controller generated:</span>
                    <span className="text-white ml-2">{overview.generated_by} at {new Date(overview.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-2.5 bg-accent-emerald text-background font-extrabold rounded hover:bg-accent-emerald/95 transition uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  {verifying ? "Executing Verification..." : "🛡️ Verify Signature"}
                </button>
                
                <button
                  onClick={handleDownload}
                  className="w-full py-2.5 bg-background border border-border-color text-white font-bold rounded hover:bg-card-bg transition text-[10px]"
                >
                  📥 Export Report Package
                </button>
              </div>
            </div>

            {/* Verification result output */}
            {verification && (
              <div className={`p-5 rounded-xl border flex flex-col gap-3 text-xs animate-in fade-in duration-300 ${
                verification.is_valid
                  ? "bg-accent-emerald/5 border-accent-emerald/20 text-foreground"
                  : "bg-accent-red/5 border-accent-red/20 text-foreground"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{verification.is_valid ? "✅" : "❌"}</span>
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${verification.is_valid ? "text-accent-emerald" : "text-accent-red"}`}>
                    {verification.is_valid ? "Report Cryptographically Verified Intact" : "Report Cryptographic Verification Failed"}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-background/50 p-4 rounded border border-border-color font-mono text-[10px]">
                  <div>
                    <span className="text-text-muted block">Signature Match Status:</span>
                    <span className={`font-bold ${verification.signature_valid ? "text-accent-emerald" : "text-accent-red"}`}>
                      {verification.signature_valid ? "MATCHED" : "MISMATCHED"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Hash Match Status:</span>
                    <span className={`font-bold ${verification.hash_valid ? "text-accent-emerald" : "text-accent-red"}`}>
                      {verification.hash_valid ? "MATCHED" : "MISMATCHED"}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted leading-relaxed">
                  {verification.is_valid
                    ? "The digital signature matches the public key of the certifying Controller and the recalculated hash of report sections matches perfectly. This document is certified as authentic."
                    : "Warning: Either the signature does not match the certifying authority's public key, or the report's content hash has been altered post-signature."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
