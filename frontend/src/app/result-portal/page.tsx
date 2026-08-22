"use client";

import { useState } from "react";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeMonoText } from "@/components/forge/ForgeMonoText";
import { ForgeBadge } from "@/components/forge/ForgeBadge";
import { Search, Download, Shield, Award, CheckCircle2 } from "lucide-react";

export default function ResultPortalPage() {
  const [regNo, setRegNo] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [searchState, setSearchState] = useState<"idle" | "searching" | "found">("idle");

  const handleSearch = () => {
    setSearchState("searching");
    setTimeout(() => {
      setSearchState("found");
    }, 1000);
  };

  return (
    <div className="forge-public min-h-screen bg-[var(--surface-sunken)] p-8 font-sans text-[var(--text-main)]">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2 text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-strong)]">Candidate Transcript Portal</h1>
          <p className="text-[var(--text-subtle)] text-lg">
            Securely access your verifiable exam results using your Registration Number and Secret Roll Key.
          </p>
        </header>

        {searchState !== "found" ? (
          <div className="bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-4)] p-8 max-w-md mx-auto shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-main)]">Registration Number</label>
                <ForgeInput 
                  placeholder="e.g. REG-2026-XXXXX" 
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-main)]">Secret Roll Key</label>
                <ForgeInput 
                  type="password"
                  placeholder="••••••••••••" 
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
              </div>
            </div>
            <ForgeButton 
              className="w-full" 
              onClick={handleSearch}
              disabled={!regNo || !secretKey || searchState === "searching"}
            >
              {searchState === "searching" ? (
                "Locating Transcript..."
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  View Results
                </>
              )}
            </ForgeButton>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <ForgeButton variant="outline" onClick={() => setSearchState("idle")}>
                &larr; Back to Search
              </ForgeButton>
              <ForgeButton>
                <Download className="w-4 h-4 mr-2" />
                Download Signed PDF
              </ForgeButton>
            </div>

            <div className="bg-[var(--surface-default)] border border-[var(--border-strong)] rounded-[var(--radius-4)] p-0 overflow-hidden shadow-sm">
              <div className="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-[var(--text-strong)] flex items-center gap-2">
                    Official Grade Sheet
                    <ForgeBadge variant="success" className="ml-2">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </ForgeBadge>
                  </h2>
                  <p className="text-[var(--text-subtle)]">Examination Session: Spring 2026</p>
                </div>
                <div className="text-left md:text-right space-y-1">
                  <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider font-semibold">Candidate ID</p>
                  <ForgeMonoText>{regNo || "REG-2026-98124"}</ForgeMonoText>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                <div className="border border-[var(--border-subtle)] rounded-[var(--radius-2)] overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="px-4 py-3 font-medium text-[var(--text-subtle)]">Subject Code</th>
                        <th className="px-4 py-3 font-medium text-[var(--text-subtle)]">Subject Name</th>
                        <th className="px-4 py-3 font-medium text-[var(--text-subtle)] text-right">Marks Obtained</th>
                        <th className="px-4 py-3 font-medium text-[var(--text-subtle)] text-right">Maximum Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      <tr>
                        <td className="px-4 py-4 font-mono text-xs text-[var(--text-main)]">CS-401</td>
                        <td className="px-4 py-4 text-[var(--text-main)]">Advanced Algorithms</td>
                        <td className="px-4 py-4 text-right font-medium text-[var(--text-strong)]">87</td>
                        <td className="px-4 py-4 text-right text-[var(--text-subtle)]">100</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-4 font-mono text-xs text-[var(--text-main)]">CS-402</td>
                        <td className="px-4 py-4 text-[var(--text-main)]">Distributed Systems</td>
                        <td className="px-4 py-4 text-right font-medium text-[var(--text-strong)]">92</td>
                        <td className="px-4 py-4 text-right text-[var(--text-subtle)]">100</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-4 font-mono text-xs text-[var(--text-main)]">CS-403</td>
                        <td className="px-4 py-4 text-[var(--text-main)]">Cryptography</td>
                        <td className="px-4 py-4 text-right font-medium text-[var(--text-strong)]">95</td>
                        <td className="px-4 py-4 text-right text-[var(--text-subtle)]">100</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-[var(--surface-sunken)] border-t border-[var(--border-strong)]">
                      <tr>
                        <td colSpan={2} className="px-4 py-4 font-semibold text-[var(--text-strong)]">Total Performance</td>
                        <td className="px-4 py-4 text-right font-semibold text-[var(--text-strong)] text-lg">274</td>
                        <td className="px-4 py-4 text-right text-[var(--text-subtle)]">300</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-4 rounded-[var(--radius-3)]">
                    <Award className="w-8 h-8 text-[var(--accent-main)]" />
                    <div>
                      <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider font-semibold">Overall Percentile</p>
                      <p className="text-2xl font-bold text-[var(--text-strong)]">98.4<span className="text-sm font-normal text-[var(--text-subtle)]">%</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-4 rounded-[var(--radius-3)]">
                    <Shield className="w-8 h-8 text-[var(--accent-main)]" />
                    <div className="min-w-0 overflow-hidden w-full">
                      <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider font-semibold">Integrity Seal Hash</p>
                      <ForgeMonoText className="text-xs truncate block w-full mt-1">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</ForgeMonoText>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
