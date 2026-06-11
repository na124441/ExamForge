"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function StorageDashboard() {
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Upload form state
  const [bucket, setBucket] = useState("examforge-written-pages");
  const [key, setKey] = useState("INS-001/EXM-008/WBK-001/test-sheet.png");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchObjects = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/storage/objects`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not retrieve objects registry.");
      const data = await res.json();
      setObjects(data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError("Please select a file to upload.");
      return;
    }
    
    setError("");
    setSuccess("");
    setUploadLoading(true);
    
    try {
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("file", uploadFile);
      
      const res = await fetch(
        `${BACKEND_URL}/api/storage/upload?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        }
      );
      if (!res.ok) throw new Error("File upload failed.");
      const data = await res.json();
      setSuccess(`File uploaded successfully! SHA-256: ${data.sha256}`);
      fetchObjects();
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (objectId: string) => {
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BACKEND_URL}/api/storage/keys/${objectId}/url`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to get presigned URL.");
      const data = await res.json();
      // Open download URL in a new tab
      window.open(data.url, "_blank");
    } catch (err: any) {
      setError(err.message || "Could not retrieve download link.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="border-b border-border-color pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Object storage manifest</h1>
          <p className="text-xs text-text-muted mt-0.5">Audit uploaded OMR files, answer sheets, and certificates with cryptographic SHA-256 verification.</p>
        </div>
        <button
          onClick={fetchObjects}
          className="px-3 py-1.5 bg-card-bg border border-border-color text-white rounded text-xs hover:bg-border-color transition font-semibold"
        >
          🔄 Refresh registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Form Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <form onSubmit={handleUpload} className="bg-card-bg p-6 rounded-xl border border-border-color flex flex-col gap-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Simulate Storage Upload</h2>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Target Bucket</label>
              <input
                type="text"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                className="bg-background border border-border-color rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-emerald"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Object Key (Path)</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="bg-background border border-border-color rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-emerald font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted">Select File</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="text-xs text-text-muted file:bg-background file:border file:border-border-color file:text-white file:rounded file:px-3 file:py-1 file:mr-3 file:cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={uploadLoading}
              className="w-full mt-2 py-2 bg-accent-emerald text-background font-extrabold rounded text-xs hover:bg-accent-emerald/90 transition uppercase tracking-wider disabled:opacity-50"
            >
              📤 Upload Object
            </button>
          </form>
        </div>

        {/* Object manifests registry list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider px-1">Objects Registry</h2>

          {error && (
            <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded text-xs">
              <strong>Storage Alert:</strong> {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded text-xs">
              <strong>Upload Verdict:</strong> {success}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-xs text-text-muted animate-pulse">
              Parsing object registry blocks...
            </div>
          ) : objects.length === 0 ? (
            <div className="bg-card-bg p-12 rounded-xl border border-border-color text-center flex flex-col items-center gap-4">
              <span className="text-4xl opacity-40">📦</span>
              <h3 className="text-white font-bold text-xs uppercase tracking-wider">Empty Storage Ledger</h3>
              <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                No storage objects logged in this tenant namespace yet. Upload a file to generate a manifest record.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className="bg-card-bg p-5 rounded-xl border border-border-color hover:border-accent-emerald/30 transition flex flex-col gap-2.5 shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono text-text-muted">{obj.bucket}</span>
                      <strong className="text-xs text-white font-mono break-all">{obj.object_key}</strong>
                    </div>
                    
                    <span className="px-2 py-0.5 rounded text-[9px] bg-background border border-border-color text-white font-mono uppercase tracking-wider">
                      {obj.storage_backend}
                    </span>
                  </div>

                  <div className="bg-background/80 p-2.5 rounded border border-border-color/60 text-[10px] font-mono text-text-muted flex flex-col gap-1">
                    <div>Size: <span className="text-white">{formatSize(obj.size_bytes)}</span></div>
                    <div>SHA-256 Hash: <span className="text-white break-all">{obj.sha256_hash}</span></div>
                    <div>Content-Type: <span className="text-white">{obj.content_type || "Unknown"}</span></div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border-color/60 pt-2.5 mt-1 text-[10px]">
                    <span className="text-text-muted">Logged: {new Date(obj.created_at).toLocaleString()}</span>
                    
                    <button
                      onClick={() => handleDownload(obj.id)}
                      className="px-3 py-1 bg-accent-emerald/10 border border-accent-emerald/20 hover:bg-accent-emerald/20 text-accent-emerald font-semibold rounded transition cursor-pointer"
                    >
                      Presigned Download Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
