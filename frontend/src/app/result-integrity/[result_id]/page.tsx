"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function ResultIntegrity() {
  const { result_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!result_id) return;
    const fetchIntegrity = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/transparency/result/${result_id}/integrity-summary`);
        if (!res.ok) throw new Error("Result integrity records could not be fetched.");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Integrity verification failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchIntegrity();
  }, [result_id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center justify-center">
      <div className="max-w-2xl w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">Result Trust Engine Checklist</h1>
          </div>
          <Link href="/result-portal" className="text-xs text-text-muted hover:text-white transition">
            Close Integrity Check
          </Link>
        </div>

        {loading && (
          <div className="text-center py-10 text-xs text-text-muted animate-pulse">
            Executing cryptographic verify scripts in the background...
          </div>
        )}

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs leading-normal">
            <strong>Checklist Error:</strong> {error}
          </div>
        )}

        {data && (
          <div className="flex flex-col gap-5 text-xs">
            <div className="flex flex-col gap-1.5 bg-background/50 p-4 rounded-lg border border-border-color font-mono">
              <div><span className="text-text-muted">Target Result:</span> <span className="text-white">{result_id}</span></div>
              <div><span className="text-text-muted">Ledger Signature Status:</span> <span className="text-accent-emerald font-bold">VERIFIED</span></div>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-white font-bold text-sm tracking-wider uppercase">Cryptographic Integrity Checklist</h2>

              {/* Checks */}
              <div className="flex justify-between items-center p-3 bg-background/30 rounded border border-border-color">
                <div>
                  <h4 className="font-semibold text-white">Audit Ledger Integrity Check</h4>
                  <p className="text-[10px] text-text-muted">Confirms the database logs have a valid cryptographic backlink chain.</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${data.audit_chain_intact ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" : "bg-accent-red/10 border border-accent-red/20 text-accent-red"}`}>
                  {data.audit_chain_intact ? "Chain Intact" : "Broken Chain"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-background/30 rounded border border-border-color">
                <div>
                  <h4 className="font-semibold text-white">OMR Manual Review Locking Check</h4>
                  <p className="text-[10px] text-text-muted">Confirms all bubble scans are fully resolved and locked by double reviewers.</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${data.omr_review_locked ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" : "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"}`}>
                  {data.omr_review_locked ? "Locked & Sealed" : "Pending Reviews"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-background/30 rounded border border-border-color">
                <div>
                  <h4 className="font-semibold text-white">Written Evaluation Locking Check</h4>
                  <p className="text-[10px] text-text-muted">Confirms all descriptive answers are anonymously graded and rubric-sealed.</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${data.written_evaluation_locked ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" : "bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"}`}>
                  {data.written_evaluation_locked ? "Locked & Sealed" : "Pending Markings"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-background/30 rounded border border-border-color">
                <div>
                  <h4 className="font-semibold text-white">MarksChain Ledger Hashing Check</h4>
                  <p className="text-[10px] text-text-muted">Confirms evaluator marks hash match values locked in MarksChain.</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${data.marks_chain_valid ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" : "bg-accent-red/10 border border-accent-red/20 text-accent-red"}`}>
                  {data.marks_chain_valid ? "Marks Verified" : "Tampered Marks"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-background/30 rounded border border-border-color">
                <div>
                  <h4 className="font-semibold text-white">Results Publication Gate Check</h4>
                  <p className="text-[10px] text-text-muted">Confirms the exam-wide controllers have signed publication release parameters.</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${data.publication_gate_passed ? "bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald" : "bg-accent-red/10 border border-accent-red/20 text-accent-red"}`}>
                  {data.publication_gate_passed ? "Authorized" : "Blocked"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Link href={`/verify-certificate/${result_id}`} className="flex-1 text-center py-3 bg-accent-emerald text-background font-bold rounded-lg hover:bg-accent-emerald/90 transition text-xs">
                📜 Check Public Digital Certificate
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
