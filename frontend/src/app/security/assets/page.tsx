"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

interface Asset {
  id: string;
  asset_id: string;
  resource_type: string;
  field_name: string;
  classification: string;
  encryption_required: boolean;
  redaction_required: boolean;
  access_audit_required: boolean;
  retention_policy: string;
}

export default function AssetGovernancePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [assetId, setAssetId] = useState("");
  const [resourceType, setResourceType] = useState("Candidate");
  const [fieldName, setFieldName] = useState("");
  const [classification, setClassification] = useState("PII");
  const [encryptionRequired, setEncryptionRequired] = useState(false);
  const [redactionRequired, setRedactionRequired] = useState(false);
  const [accessAuditRequired, setAccessAuditRequired] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState("EXAM_PLUS_180_DAYS");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/security/assets`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error("Failed to load assets", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BACKEND_URL}/api/security/assets/classify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          asset_id: assetId,
          resource_type: resourceType,
          field_name: fieldName,
          classification,
          encryption_required: encryptionRequired,
          redaction_required: redactionRequired,
          access_audit_required: accessAuditRequired,
          retention_policy: retentionPolicy,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to classify asset.");
      }

      setSuccess("Asset classified and policy mapped successfully!");
      setAssetId("");
      setFieldName("");
      setEncryptionRequired(false);
      setRedactionRequired(false);
      setAccessAuditRequired(false);
      fetchAssets();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted font-mono text-xs">
        <span className="animate-spin text-lg mb-2">⚙️</span>
        DECRYPTING DATA ASSETS REGISTRY...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Assets List Column (2 cols) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Data Asset Governance</h2>
          <p className="text-xs text-text-muted mt-1">Review data asset classification fields and their corresponding protection policies.</p>
        </div>

        <div className="flex flex-col gap-4">
          {assets.length === 0 ? (
            <div className="p-8 bg-card-bg rounded-2xl border border-border-color text-center text-text-muted text-xs">
              No sensitive data asset fields classified yet.
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="p-5 rounded-2xl border border-border-color bg-card-bg shadow-sm">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/25 px-2 py-0.5 rounded">
                        {asset.classification}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">{asset.resource_type}.{asset.field_name}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">Asset ID: {asset.asset_id}</h4>
                  </div>
                  
                  {/* Applied Rules Badges */}
                  <div className="flex gap-1.5 shrink-0 flex-wrap">
                    {asset.encryption_required && (
                      <span className="px-1.5 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-[8px] font-mono font-bold rounded">
                        AES-GCM
                      </span>
                    )}
                    {asset.redaction_required && (
                      <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-mono font-bold rounded">
                        REDACTABLE
                      </span>
                    )}
                    {asset.access_audit_required && (
                      <span className="px-1.5 py-0.5 bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-[8px] font-mono font-bold rounded">
                        AUDITED
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-color/50 text-[10px] text-text-muted flex justify-between">
                  <span>Retention Rule: <span className="text-white font-mono">{asset.retention_policy}</span></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Asset Classification Form */}
      <div className="flex flex-col gap-6">
        <div className="bg-card-bg p-6 rounded-2xl border border-border-color shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald"></span> Classify Asset Field
          </h3>

          <form onSubmit={handleClassify} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Asset ID</label>
              <input
                type="text"
                required
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                placeholder="e.g. AST-CAND-NAME"
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Resource Type</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none"
                >
                  <option value="Candidate">Candidate</option>
                  <option value="Evaluator">Evaluator</option>
                  <option value="Exam">Exam</option>
                  <option value="AuditLog">AuditLog</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Field Name</label>
                <input
                  type="text"
                  required
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g. candidate_name"
                  className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Classification Type</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="SECRET">SECRET</option>
                <option value="PII">PII (Personal Info)</option>
                <option value="EVIDENCE">EVIDENCE (Audit Proofs)</option>
                <option value="CRYPTO_MATERIAL">CRYPTO_MATERIAL</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Retention Policy</label>
              <select
                value={retentionPolicy}
                onChange={(e) => setRetentionPolicy(e.target.value)}
                className="w-full p-2 bg-background border border-border-color rounded text-xs text-white focus:outline-none"
              >
                <option value="EXAM_PLUS_180_DAYS">EXAM_PLUS_180_DAYS</option>
                <option value="INDEFINITE_AUDIT_ONLY">INDEFINITE_AUDIT_ONLY</option>
                <option value="PURGE_IMMEDIATE">PURGE_IMMEDIATE</option>
              </select>
            </div>

            {/* Checkbox Policy rules */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enc"
                  checked={encryptionRequired}
                  onChange={(e) => setEncryptionRequired(e.target.checked)}
                  className="rounded border-border-color bg-background text-accent-emerald focus:ring-0"
                />
                <label htmlFor="enc" className="text-xs text-text-muted cursor-pointer">Enforce AES-GCM encryption</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="red"
                  checked={redactionRequired}
                  onChange={(e) => setRedactionRequired(e.target.checked)}
                  className="rounded border-border-color bg-background text-accent-emerald focus:ring-0"
                />
                <label htmlFor="red" className="text-xs text-text-muted cursor-pointer">Enforce redaction filtering on exports</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aud"
                  checked={accessAuditRequired}
                  onChange={(e) => setAccessAuditRequired(e.target.checked)}
                  className="rounded border-border-color bg-background text-accent-emerald focus:ring-0"
                />
                <label htmlFor="aud" className="text-xs text-text-muted cursor-pointer">Audit all reads/accesses of this field</label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-[11px] leading-normal font-mono">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-[11px] leading-normal">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-accent-emerald text-background font-bold rounded hover:bg-accent-emerald/90 transition text-xs cursor-pointer uppercase mt-2"
            >
              {submitting ? "Classifying Asset..." : "Commit Governance Record"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
