"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard, 
  Globe, 
  FileText, 
  Key, 
  Mail, 
  ArrowRight, 
  Plus, 
  Layers, 
  Sparkles, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Landmark,
  BadgeCheck
} from "lucide-react";
import { ForgePageHeader } from "@/components/forge/ForgePageHeader";
import { ForgeFormField } from "@/components/forge/ForgeFormField";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeStatusPill } from "@/components/forge/ForgeStatusPill";
import { cn } from "@/lib/cn";
import { getVendors, VendorOrganization } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function VendorPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"REGISTER" | "DIRECTORY" | "EXAM_CREATOR">("REGISTER");
  const [vendors, setVendors] = useState<VendorOrganization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    registration_number: "",
    email: "",
    tenant_slug: "",
    payment_upi_id: "",
    payment_bank_name: "State Bank of India",
    payment_account_number: "",
    payment_ifsc_code: "",
    google_oauth_key: "",
    dlt_sms_key: ""
  });

  const loadVendorsList = async () => {
    setIsLoading(true);
    try {
      const list = await getVendors();
      setVendors(list);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendorsList();
  }, []);

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.legal_name || !formData.registration_number || !formData.email) {
      setErrorMessage("Please fill in all mandatory organizational fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Registration failed." }));
        throw new Error(err.detail || `Server returned ${res.status}`);
      }

      const created = await res.json();
      setSuccessMessage(`Successfully registered ${created.name} (${created.registration_number})!`);
      // Reload vendor list
      loadVendorsList();
      setActiveTab("DIRECTORY");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to register vendor organization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] font-sans p-4 sm:p-6 lg:p-8 space-y-6 select-none">
      <ForgePageHeader
        breadcrumbs={[
          { label: "Operations Hub", href: "/authority" },
          { label: "Vendor & Authority Registry" }
        ]}
        title="Authority & Vendor Management Hub"
        description="Statutory registration, banking settlement coordinates, and accredited testing agency directories."
        status={
          <ForgeStatusPill variant="info" dot>
            NATIONAL REPOSITORY
          </ForgeStatusPill>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <ForgeButton
              variant="secondary"
              size="md"
              onClick={() => router.push("/safebatch")}
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            >
              SafeBatch Studio
            </ForgeButton>
            <ForgeButton
              variant="secondary"
              size="md"
              onClick={() => router.push("/candidate")}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Candidate Portal
            </ForgeButton>
            <ForgeButton
              variant="primary"
              size="md"
              onClick={() => router.push("/create-exam")}
            >
              Publish Exam
            </ForgeButton>
          </div>
        }
      />

      {/* Main Container */}
      <main className="w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("REGISTER")}
            className={cn(
              "py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "REGISTER"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            <Plus className="w-4 h-4" />
            Register Examination Authority
          </button>

          <button
            onClick={() => setActiveTab("DIRECTORY")}
            className={cn(
              "py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer",
              activeTab === "DIRECTORY"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            <Building2 className="w-4 h-4" />
            Active Authorities Directory ({vendors.length})
          </button>

          <Link
            href="/create-exam"
            className="py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all ml-auto"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            Publish New Examination Catalog →
          </Link>
        </div>

        {/* TAB 1: REGISTRATION FORM */}
        {activeTab === "REGISTER" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Form */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Examination Conducting Organization Onboarding
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Register national, state, university, or private assessment bodies to conduct tamper-evident CBT & OMR examinations.
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleRegisterVendor} className="space-y-6 text-xs">
                {/* 1. Legal Entity Profile */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-blue-700">
                    <Building2 className="w-4 h-4" /> 1. Statutory & Legal Entity Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Organization Common Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. National Testing Agency (NTA)"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Official Registration / Gazette Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. GOI-NTA-2018-001"
                        value={formData.registration_number}
                        onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Full Legal Entity Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. National Testing Agency, Ministry of Education, Government of India"
                      value={formData.legal_name}
                      onChange={e => setFormData({ ...formData, legal_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Official Communication Email *</label>
                      <input
                        type="email"
                        placeholder="e.g. exams@nta.ac.in"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Subdomain Tenant Slug</label>
                      <input
                        type="text"
                        placeholder="e.g. nta-gov (auto-generated if blank)"
                        value={formData.tenant_slug}
                        onChange={e => setFormData({ ...formData, tenant_slug: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Fee Settlement & Banking */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-blue-700">
                    <CreditCard className="w-4 h-4" /> 2. Fee Collection & Banking Settlement
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Merchant UPI ID / VPA for Fee Collection *</label>
                      <input
                        type="text"
                        placeholder="e.g. nta.exams@govicici"
                        value={formData.payment_upi_id}
                        onChange={e => setFormData({ ...formData, payment_upi_id: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Used to generate real-time Dynamic NPCI QR codes on candidate checkout.
                      </span>
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Settlement Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India"
                        value={formData.payment_bank_name}
                        onChange={e => setFormData({ ...formData, payment_bank_name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Institutional Bank Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 0000003891274912"
                        value={formData.payment_account_number}
                        onChange={e => setFormData({ ...formData, payment_account_number: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Bank IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0000691"
                        value={formData.payment_ifsc_code}
                        onChange={e => setFormData({ ...formData, payment_ifsc_code: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Communication & Security Gateway */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-blue-700">
                    <Key className="w-4 h-4" /> 3. Security, Single Sign-On & DLT Gateway
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Google OAuth Client ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 9128374-apps.googleusercontent.com"
                        value={formData.google_oauth_key}
                        onChange={e => setFormData({ ...formData, google_oauth_key: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">TRAI DLT SMS Entity ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. DLT-GOI-1101928"
                        value={formData.dlt_sms_key}
                        onChange={e => setFormData({ ...formData, dlt_sms_key: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning Examination Authority...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Register & Authorize Organization
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right 1 Col: Authority Standards & Features */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-md space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Authorized Vendor Ecosystem</h3>
                  <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                    ExamForge isolates question authoring, candidate applications, question distribution encryption keys, and OMR audits per authorized statutory vendor.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 text-xs text-blue-100 border-t border-blue-800/60 font-mono">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cryptographic Multi-Tenancy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>NPCI UPI 2.0 Fee Routing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>UIDAI Secure QR Identity Linkage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Air-Gapped Delivery Keys</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                  Quick Actions
                </h4>
                <div className="space-y-2 text-xs">
                  <Link
                    href="/candidate"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between text-slate-800 font-semibold"
                  >
                    <span>Test Candidate Onboarding Flow</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/create-exam"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between text-slate-800 font-semibold"
                  >
                    <span>Create & Publish Exam Template</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <Link
                    href="/security"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between text-slate-800 font-semibold"
                  >
                    <span>Security & Threat Model Center</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECTORY OF VENDORS */}
        {activeTab === "DIRECTORY" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Registered Examination Authorities ({vendors.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Live statutory conducting bodies loaded directly from ExamForge database.
                </p>
              </div>
              <button
                onClick={loadVendorsList}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 text-slate-700"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} /> Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">
                Loading statutory vendor directory from database...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors.map(v => (
                  <div
                    key={v.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{v.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] border border-emerald-200">
                            {v.status || "APPROVED"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 block">{v.legal_name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {v.registration_number}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Merchant UPI VPA</span>
                        <span className="text-slate-800 font-bold truncate block">{v.payment_upi_id || "examforge@sbi"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Official Email</span>
                        <span className="text-slate-800 font-bold truncate block">{v.email || "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-slate-400 font-mono">Tenant: {v.tenant_slug}</span>
                      <Link
                        href={`/candidate?vendor=${v.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        View Exams Offered <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
