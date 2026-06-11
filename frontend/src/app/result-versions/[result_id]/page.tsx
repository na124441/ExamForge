"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function ResultVersionsView() {
  const { result_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  // Selection for comparison
  const [versionA, setVersionA] = useState<number | "">("");
  const [versionB, setVersionB] = useState<number | "">("");
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffError, setDiffError] = useState("");

  const fetchVersions = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/results/${result_id}/versions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Could not fetch result version history.");
      }
      const data = await res.json();
      setVersions(data);
      if (data.length >= 2) {
        setVersionA(data[data.length - 2].version_number);
        setVersionB(data[data.length - 1].version_number);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result_id) {
      fetchVersions();
    }
  }, [result_id]);

  const handleCompare = async () => {
    if (!versionA || !versionB) {
      setDiffError("Please select both versions to compare.");
      return;
    }
    if (versionA === versionB) {
      setDiffError("Select different versions to compare.");
      return;
    }

    setDiffLoading(true);
    setDiffError("");
    setDiffResult(null);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/results/${result_id}/diff/${versionA}/${versionB}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Could not fetch version difference report.");
      }
      const data = await res.json();
      setDiffResult(data);
    } catch (err: any) {
      setDiffError(err.message || "An error occurred.");
    } finally {
      setDiffLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-sans items-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Result Audit Trail & Versions</h1>
              <p className="text-xs text-text-muted mt-0.5 font-mono">Result: {result_id}</p>
            </div>
          </div>
          <Link href="/result-portal" className="px-4 py-2 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold">
            ← Return to Portal
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-xs text-text-muted animate-pulse">
            Retrieving cryptographic version trees...
          </div>
        ) : versions.length === 0 ? (
          <div className="bg-card-bg p-12 rounded-2xl border border-border-color text-center flex flex-col items-center gap-4">
            <span className="text-5xl opacity-40">📭</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">No version history</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              This result has not been revised post-publication. It contains only its original genesis version records.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Version List */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Revision History</h2>
              
              <div className="relative border-l border-border-color pl-6 flex flex-col gap-6 ml-2 py-2">
                {versions.map((v) => (
                  <div key={v.id} className="relative flex flex-col gap-2 bg-card-bg p-5 rounded-xl border border-border-color">
                    {/* Circle marker on timeline */}
                    <div className="absolute -left-[31px] top-6 w-3 h-3 rounded-full bg-accent-emerald border-4 border-background"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald">
                          Version {v.version_number}
                        </span>
                        {v.version_number === 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-background border border-border-color text-text-muted">
                            Genesis
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">
                        {v.created_at ? new Date(v.created_at).toLocaleString() : ""}
                      </span>
                    </div>

                    <p className="text-xs text-white mt-1 leading-relaxed">{v.change_reason}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-color/60 text-[10px] font-mono text-text-muted">
                      <div>
                        <span className="block font-semibold">Result Hash:</span>
                        <span className="text-white break-all">{v.new_result_hash}</span>
                      </div>
                      <div>
                        <span className="block font-semibold">EC Signature:</span>
                        <span className="text-white break-all">{v.signature}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-text-muted mt-2 pt-1">
                      <span>Revised by: {v.changed_by}</span>
                      {v.linked_dispute_id && (
                        <Link href={`/disputes/${v.linked_dispute_id}`} className="text-accent-amber hover:underline font-bold">
                          ⚠️ Linked Dispute: {v.linked_dispute_id.substring(0, 8)}...
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compare Tool */}
            <div className="flex flex-col gap-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Compare Tool</h2>
              
              <div className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4 text-xs">
                <p className="text-text-muted">Select two version states from the revision ledger to compare audit modifications.</p>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-text-muted mb-1 font-semibold">Baseline Version (A)</label>
                    <select
                      value={versionA}
                      onChange={(e) => setVersionA(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full p-2 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white font-mono"
                    >
                      <option value="">-- Choose Version --</option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.version_number}>
                          Version {v.version_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-muted mb-1 font-semibold">Target Version (B)</label>
                    <select
                      value={versionB}
                      onChange={(e) => setVersionB(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full p-2 bg-background border border-border-color rounded focus:border-accent-emerald focus:outline-none text-white font-mono"
                    >
                      <option value="">-- Choose Version --</option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.version_number}>
                          Version {v.version_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {diffError && (
                  <div className="p-3.5 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-[11px]">
                    <strong>Compare Error:</strong> {diffError}
                  </div>
                )}

                <button
                  onClick={handleCompare}
                  disabled={diffLoading || versionA === "" || versionB === ""}
                  className="w-full py-2.5 bg-accent-emerald text-background font-extrabold rounded hover:bg-accent-emerald/90 transition cursor-pointer text-[11px] uppercase tracking-wider"
                >
                  {diffLoading ? "Executing Diff Comparison..." : "Compare Audit Diffs"}
                </button>
              </div>

              {/* Diff Results Output */}
              {diffResult && (
                <div className="bg-card-bg p-5 rounded-xl border border-border-color flex flex-col gap-4 text-xs animate-in fade-in duration-300">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-border-color pb-2">Diff Comparison Report</h3>
                  
                  <div className="flex flex-col gap-2 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Baseline:</span>
                      <span className="text-white">Version {diffResult.version_a}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Revision Target:</span>
                      <span className="text-white">Version {diffResult.version_b}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Revision Actor:</span>
                      <span className="text-white break-all">{diffResult.changed_by}</span>
                    </div>
                  </div>

                  <div className="bg-background/50 p-3.5 rounded border border-border-color flex flex-col gap-2">
                    <span className="font-semibold text-text-muted block">Revision Reason Statement:</span>
                    <span className="text-white leading-relaxed italic">&quot;{diffResult.change_reason}&quot;</span>
                  </div>

                  <p className="text-[10px] text-text-muted leading-relaxed">
                    This diff document was dynamically generated and verified against the append-only database logs to confirm transparency.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
