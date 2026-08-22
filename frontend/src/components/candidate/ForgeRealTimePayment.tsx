"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { 
  createPaymentOrder, 
  verifyPaymentOrder, 
  getPaymentOrderStatus,
  PaymentOrderDetails, 
  PaymentReceipt 
} from "@/lib/api";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  ArrowRight, 
  Download, 
  Sparkles,
  Lock,
  ChevronRight
} from "lucide-react";

interface ForgeRealTimePaymentProps {
  candidateStudentId: string;
  candidateName: string;
  category: string;
  examId: string;
  examTitle: string;
  vendorId?: string;
  vendorName?: string;
  feeAmount: number;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
  onBack: () => void;
}

export function ForgeRealTimePayment({
  candidateStudentId,
  candidateName,
  category,
  examId,
  examTitle,
  vendorId,
  vendorName,
  feeAmount,
  onPaymentSuccess,
  onBack
}: ForgeRealTimePaymentProps) {
  const [activeTab, setActiveTab] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [order, setOrder] = useState<PaymentOrderDetails | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600); // 10 mins

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(candidateName);
  const [showCardOtpModal, setShowCardOtpModal] = useState(false);
  const [cardOtp, setCardOtp] = useState(["", "", "", "", "", ""]);

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState("SBI");

  // 1. Initialize Payment Order on Mount
  useEffect(() => {
    async function initOrder() {
      setIsLoadingOrder(true);
      setErrorMessage(null);
      try {
        const orderData = await createPaymentOrder({
          candidate_student_id: candidateStudentId,
          exam_id: examId,
          vendor_id: vendorId,
          payment_method: activeTab
        });
        setOrder(orderData);
        setTimeLeftSeconds(600);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to initialize payment gateway order.");
      } finally {
        setIsLoadingOrder(false);
      }
    }
    initOrder();
  }, [candidateStudentId, examId, vendorId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  // 3. Copy helper
  const copyToClipboard = (text: string, fieldKey: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // 4. Handle UPI Simulation & Verification
  const handleVerifyUpiPayment = async () => {
    if (!order) return;
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const verifiedReceipt = await verifyPaymentOrder({
        order_id: order.order_id,
        payment_id: `PAY-UPI-${Date.now().toString().slice(-8)}`,
        bank_ref_no: `UPI-UTR-${Date.now().toString().slice(-10)}`,
        payment_method: "UPI_DYNAMIC_QR"
      });
      setReceipt(verifiedReceipt);
      onPaymentSuccess(verifiedReceipt);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify UPI settlement with NPCI gateway.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 5. Handle Card Verification
  const handleVerifyCardPayment = async () => {
    if (!order) return;
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const verifiedReceipt = await verifyPaymentOrder({
        order_id: order.order_id,
        payment_id: `PAY-CARD-${Date.now().toString().slice(-8)}`,
        bank_ref_no: `AUTH-3DS-${Date.now().toString().slice(-8)}`,
        payment_method: "CARD_RUPAY"
      });
      setShowCardOtpModal(false);
      setReceipt(verifiedReceipt);
      onPaymentSuccess(verifiedReceipt);
    } catch (err: any) {
      setErrorMessage(err.message || "Card transaction failed 3D-Secure authentication.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 6. Handle Netbanking Verification
  const handleVerifyNetBanking = async () => {
    if (!order) return;
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const bankRef = `NET-${selectedBank}-${Date.now().toString().slice(-8)}`;
      const verifiedReceipt = await verifyPaymentOrder({
        order_id: order.order_id,
        payment_id: `PAY-${selectedBank}-${order.transaction_ref.slice(-6)}`,
        bank_ref_no: bankRef,
        payment_method: `NETBANKING_${selectedBank}`
      });
      setReceipt(verifiedReceipt);
      onPaymentSuccess(verifiedReceipt);
    } catch (err: any) {
      setErrorMessage(err.message || "Netbanking transaction failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // If already paid, show immutable cryptographic receipt
  if (receipt) {
    return (
      <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6 text-[#FFF4E2] font-sans">
        {/* Success Header */}
        <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(64,133,118,0.3)] text-[#8AD8B8] flex items-center justify-center border border-[rgba(138,216,184,0.3)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2]">Payment Completed &amp; Verified</h2>
              <p className="text-xs text-[#8AD8B8]/80 font-mono">Receipt No: {receipt.receipt_number}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[rgba(138,216,184,0.2)] text-[#8AD8B8] font-mono font-bold text-xs border border-[#8AD8B8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8AD8B8] animate-pulse"></span>
            SETTLED &amp; CONFIRMED
          </span>
        </div>

        {/* Cryptographic Payment Dossier */}
        <div className="p-5 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-[#8AD8B8] tracking-wider">
                Official Examination Application Receipt
              </span>
              <h3 className="font-bold text-[#FFF4E2] text-sm mt-0.5">{receipt.exam_title}</h3>
              <p className="text-xs text-[#8AD8B8]/80 font-mono mt-0.5">Authority: {receipt.conducting_authority}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#8AD8B8]/70 font-mono block">AMOUNT PAID</span>
              <span className="text-2xl font-bold font-mono text-[#8AD8B8]">₹{receipt.amount_paid.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)] space-y-0.5">
              <span className="text-[#8AD8B8]/70 text-[10px] block font-mono">Candidate Name</span>
              <span className="font-bold text-[#FFF4E2]">{receipt.candidate_name}</span>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)] space-y-0.5">
              <span className="text-[#8AD8B8]/70 text-[10px] block font-mono">Application Number</span>
              <span className="font-mono font-bold text-[#8AD8B8]">{receipt.application_number}</span>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)] space-y-0.5">
              <span className="text-[#8AD8B8]/70 text-[10px] block font-mono">Bank Reference No (UTR)</span>
              <span className="font-mono font-bold text-[#FFF4E2]">{receipt.bank_ref_no}</span>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)] space-y-0.5">
              <span className="text-[#8AD8B8]/70 text-[10px] block font-mono">Transaction Ref ID</span>
              <span className="font-mono text-[#8AD8B8] text-[11px]">{receipt.transaction_ref}</span>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)] space-y-0.5">
              <span className="text-[#8AD8B8]/70 text-[10px] block font-mono">Payment Channel</span>
              <span className="font-bold text-[#FFF4E2]">{receipt.payment_method}</span>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)] space-y-0.5">
              <span className="text-[#8AD8B8]/70 text-[10px] block font-mono">Timestamp</span>
              <span className="font-mono text-[#FFF4E2]/80 text-[11px]">{receipt.paid_at}</span>
            </div>
          </div>

          {/* Cryptographic Hash Verification Banner */}
          <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] flex items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#8AD8B8] uppercase flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8AD8B8]" />
                Immutable SHA-256 Audit Hash
              </span>
              <span className="font-mono text-[10px] text-[#FFF4E2] break-all select-all block bg-[rgba(19,45,40,0.6)] p-2 rounded border border-[rgba(138,216,184,0.15)]">
                {receipt.receipt_sha256}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(receipt.receipt_sha256, "receipt_hash")}
              className="px-2.5 py-1.5 rounded-lg border border-[rgba(138,216,184,0.25)] bg-[rgba(64,133,118,0.2)] hover:bg-[rgba(64,133,118,0.35)] text-[#8AD8B8] font-mono text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer mt-4 transition-colors"
            >
              {copiedField === "receipt_hash" ? <Check className="w-3 h-3 text-[#8AD8B8]" /> : <Copy className="w-3 h-3" />}
              {copiedField === "receipt_hash" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-[rgba(138,216,184,0.25)] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] text-[#FFF4E2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" /> Download / Print Official Receipt
          </button>

          <button
            onClick={() => onPaymentSuccess(receipt)}
            className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer transition-all"
          >
            Proceed to Test Centre Allocation <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6 text-[#FFF4E2] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4 gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#8AD8B8]" />
            Step 10: Examination Fee Payment
          </h2>
          <p className="text-xs text-[#8AD8B8]/80 mt-0.5 font-mono">
            Real-time secure transaction gateway powered by NPCI Unified Payments Interface (UPI) &amp; Banking Networks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[rgba(64,133,118,0.25)] text-[#8AD8B8] font-mono font-bold text-[11px] border border-[rgba(138,216,184,0.3)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#8AD8B8]" />
            Order Valid: <strong className="text-[#FFF4E2]">{timerDisplay}</strong>
          </span>
          <span className="text-xs font-mono text-[#8AD8B8]/70">10 of 12</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[rgba(180,60,60,0.2)] border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage(null)} className="text-red-100 font-bold text-[11px] underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Order Summary Card */}
      <div className="p-4 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold text-[#8AD8B8] tracking-wider">
            Fee Assessment Breakdown
          </span>
          <div className="font-bold text-[#FFF4E2] text-sm">{examTitle}</div>
          <div className="text-xs text-[#8AD8B8]/80 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span>Authority: <strong>{vendorName || "National Testing Agency"}</strong></span>
            <span>•</span>
            <span>Category: <strong>{category || "General"}</strong></span>
            <span>•</span>
            <span>Student ID: <strong>{candidateStudentId}</strong></span>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 border-[rgba(138,216,184,0.15)] pt-2 sm:pt-0 shrink-0">
          <span className="text-[10px] text-[#8AD8B8]/70 font-mono block">TOTAL PAYABLE AMOUNT</span>
          <span className="text-2xl font-bold font-mono text-[#8AD8B8]">₹{feeAmount.toFixed(2)}</span>
          <span className="text-[10px] text-[#8AD8B8] font-mono block font-semibold">✓ Govt. Exam (GST Exempted)</span>
        </div>
      </div>

      {/* Payment Channel Selector Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-[rgba(138,216,184,0.15)] gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("UPI")}
            className={cn(
              "py-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "UPI"
                ? "border-[#8AD8B8] text-[#FFF4E2] bg-[rgba(64,133,118,0.3)] rounded-t-xl"
                : "border-transparent text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
            )}
          >
            <Smartphone className="w-4 h-4" />
            Instant UPI &amp; Dynamic QR
            <span className="px-1.5 py-0.5 rounded bg-[rgba(138,216,184,0.2)] text-[#8AD8B8] text-[9px] font-mono font-bold">Fastest</span>
          </button>

          <button
            onClick={() => setActiveTab("CARD")}
            className={cn(
              "py-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "CARD"
                ? "border-[#8AD8B8] text-[#FFF4E2] bg-[rgba(64,133,118,0.3)] rounded-t-xl"
                : "border-transparent text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Debit / Credit Card &amp; RuPay
          </button>

          <button
            onClick={() => setActiveTab("NETBANKING")}
            className={cn(
              "py-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "NETBANKING"
                ? "border-[#8AD8B8] text-[#FFF4E2] bg-[rgba(64,133,118,0.3)] rounded-t-xl"
                : "border-transparent text-[#8AD8B8]/70 hover:text-[#FFF4E2]"
            )}
          >
            <Building2 className="w-4 h-4" />
            Net Banking
          </button>
        </div>

        {/* TAB 1: INSTANT UPI & REAL-TIME QR CODE */}
        {activeTab === "UPI" && (
          <div className="p-6 rounded-2xl bg-[rgba(19,45,40,0.5)] border border-[rgba(138,216,184,0.2)] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Dynamic QR Code Box */}
            <div className="flex flex-col items-center justify-center p-6 bg-[rgba(8,19,16,0.85)] rounded-2xl border border-[rgba(138,216,184,0.2)] shadow-inner space-y-3">
              <div className="relative p-3 rounded-xl border border-[rgba(138,216,184,0.25)] bg-white">
                {isLoadingOrder ? (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#132D28]" />
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(order?.upi_qr_payload || `upi://pay?pa=nta.exams@govicici&pn=NTA&am=${feeAmount}`)}`}
                      alt="NPCI Dynamic UPI QR"
                      className="w-40 h-40 rounded-lg"
                    />
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#132D28] font-bold">
                      <ShieldCheck className="w-3 h-3 text-[#408576]" />
                      NPCI UPI 2.0 Certified
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-[#FFF4E2]">Scan with any UPI App</span>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-[#8AD8B8]">
                  <span className="px-1.5 py-0.5 rounded bg-[rgba(64,133,118,0.25)] font-semibold">GPay</span>
                  <span className="px-1.5 py-0.5 rounded bg-[rgba(64,133,118,0.25)] font-semibold">PhonePe</span>
                  <span className="px-1.5 py-0.5 rounded bg-[rgba(64,133,118,0.25)] font-semibold">Paytm</span>
                  <span className="px-1.5 py-0.5 rounded bg-[rgba(64,133,118,0.25)] font-semibold">BHIM</span>
                  <span className="px-1.5 py-0.5 rounded bg-[rgba(64,133,118,0.25)] font-semibold">CRED</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Intent, Copy VPA & Live Polling Status */}
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#FFF4E2] uppercase tracking-wider font-mono">
                  Merchant UPI ID / VPA
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] font-mono text-xs text-[#FFF4E2] truncate">
                    {order?.upi_vpa || "nta.exams@govicici"}
                  </div>
                  <button
                    onClick={() => copyToClipboard(order?.upi_vpa || "nta.exams@govicici", "vpa")}
                    className="px-3 py-2.5 rounded-xl border border-[rgba(138,216,184,0.3)] bg-[rgba(64,133,118,0.25)] hover:bg-[rgba(64,133,118,0.4)] text-[#FFF4E2] text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    {copiedField === "vpa" ? <Check className="w-3.5 h-3.5 text-[#8AD8B8]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === "vpa" ? "Copied" : "Copy VPA"}
                  </button>
                </div>
              </div>

              {/* Mobile Deep-Links */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#FFF4E2] uppercase tracking-wider font-mono">
                  Direct Mobile Payment Intent
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={order?.upi_intent_gpay || "#"}
                    className="p-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8] font-bold text-xs text-[#FFF4E2] flex items-center justify-center gap-1.5 text-center shadow-xs transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#8AD8B8]" /> Google Pay
                  </a>
                  <a
                    href={order?.upi_intent_phonepe || "#"}
                    className="p-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8] font-bold text-xs text-[#FFF4E2] flex items-center justify-center gap-1.5 text-center shadow-xs transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#8AD8B8]" /> PhonePe
                  </a>
                  <a
                    href={order?.upi_intent_paytm || "#"}
                    className="p-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8] font-bold text-xs text-[#FFF4E2] flex items-center justify-center gap-1.5 text-center shadow-xs transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#8AD8B8]" /> Paytm
                  </a>
                  <a
                    href={order?.upi_intent_bhim || "#"}
                    className="p-2.5 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8] font-bold text-xs text-[#FFF4E2] flex items-center justify-center gap-1.5 text-center shadow-xs transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#8AD8B8]" /> BHIM UPI
                  </a>
                </div>
              </div>

              {/* Real-time Polling Status & Instant Test Verification */}
              <div className="pt-2 space-y-2">
                <div className="p-3 rounded-xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.25)] flex items-center gap-2.5 text-xs text-[#8AD8B8] font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8AD8B8] animate-ping"></span>
                  <span>Awaiting payment settlement from your bank...</span>
                </div>

                <button
                  onClick={handleVerifyUpiPayment}
                  disabled={isVerifying}
                  className="w-full bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 rounded-xl border border-[rgba(138,216,184,0.35)] text-xs flex items-center justify-center gap-2 shadow-md shadow-[#132D28]/50 cursor-pointer disabled:opacity-50 transition-all font-sans"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Bank Settlement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Simulate Instant Bank Authorization (₹{feeAmount})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREDIT / DEBIT CARDS */}
        {activeTab === "CARD" && (
          <div className="p-6 rounded-2xl bg-[rgba(19,45,40,0.5)] border border-[rgba(138,216,184,0.2)] space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-2">
              <span className="font-bold text-xs text-[#FFF4E2] uppercase font-mono">
                Card Details (RuPay, Visa, MasterCard)
              </span>
              <div className="flex gap-1 text-[10px] font-mono text-[#8AD8B8]">
                <span>3D Secure 2.0</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#FFF4E2]/80 font-mono font-bold block mb-1">Card Number</label>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="4532 •••• •••• 8921"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[rgba(138,216,184,0.25)] bg-[rgba(8,19,16,0.8)] text-[#FFF4E2] font-mono text-xs focus:outline-none focus:border-[#8AD8B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#FFF4E2]/80 font-mono font-bold block mb-1">Expiry Date</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[rgba(138,216,184,0.25)] bg-[rgba(8,19,16,0.8)] text-[#FFF4E2] font-mono text-xs focus:outline-none focus:border-[#8AD8B8]"
                  />
                </div>
                <div>
                  <label className="text-[#FFF4E2]/80 font-mono font-bold block mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={3}
                    placeholder="•••"
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[rgba(138,216,184,0.25)] bg-[rgba(8,19,16,0.8)] text-[#FFF4E2] font-mono text-xs focus:outline-none focus:border-[#8AD8B8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#FFF4E2]/80 font-mono font-bold block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={e => setCardHolder(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[rgba(138,216,184,0.25)] bg-[rgba(8,19,16,0.8)] text-[#FFF4E2] font-medium text-xs focus:outline-none focus:border-[#8AD8B8]"
                />
              </div>

              <button
                onClick={() => setShowCardOtpModal(true)}
                className="w-full bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 rounded-xl border border-[rgba(138,216,184,0.35)] text-xs flex items-center justify-center gap-2 shadow-md shadow-[#132D28]/50 cursor-pointer mt-2 transition-all font-sans"
              >
                <Lock className="w-4 h-4" /> Pay ₹{feeAmount} with 3D Secure OTP
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: NET BANKING */}
        {activeTab === "NETBANKING" && (
          <div className="p-6 rounded-2xl bg-[rgba(19,45,40,0.5)] border border-[rgba(138,216,184,0.2)] space-y-4">
            <span className="font-bold text-xs text-[#FFF4E2] uppercase font-mono block">
              Select Your Bank for Direct Net Banking Payment
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { code: "SBI", name: "State Bank of India" },
                { code: "HDFC", name: "HDFC Bank" },
                { code: "ICICI", name: "ICICI Bank" },
                { code: "AXIS", name: "Axis Bank" },
                { code: "PNB", name: "Punjab National Bank" },
                { code: "BOB", name: "Bank of Baroda" }
              ].map(bank => (
                <div
                  key={bank.code}
                  onClick={() => setSelectedBank(bank.code)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                    selectedBank === bank.code
                      ? "bg-[rgba(64,133,118,0.35)] border-[#8AD8B8] font-bold text-[#FFF4E2] shadow-sm"
                      : "bg-[rgba(8,19,16,0.7)] border-[rgba(138,216,184,0.15)] hover:border-[#8AD8B8] text-[#FFF4E2]/80"
                  )}
                >
                  <span>{bank.name}</span>
                  {selectedBank === bank.code && <Check className="w-4 h-4 text-[#8AD8B8] shrink-0" />}
                </div>
              ))}
            </div>

            <button
              onClick={handleVerifyNetBanking}
              disabled={isVerifying}
              className="w-full bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 rounded-xl border border-[rgba(138,216,184,0.35)] text-xs flex items-center justify-center gap-2 shadow-md shadow-[#132D28]/50 cursor-pointer disabled:opacity-50 mt-4 transition-all font-sans"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing via {selectedBank}...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" /> Pay ₹{feeAmount} via {selectedBank} Net Banking
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Card 3D Secure OTP Modal Simulation */}
      {showCardOtpModal && (
        <div className="fixed inset-0 bg-[rgba(8,19,16,0.85)] backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#132D28] rounded-2xl border border-[rgba(138,216,184,0.3)] shadow-2xl p-6 max-w-md w-full space-y-4 text-[#FFF4E2]">
            <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8AD8B8]" />
                <h3 className="font-bold text-[#FFF4E2] text-sm">3D Secure 2.0 Authentication</h3>
              </div>
              <span className="text-[10px] font-mono text-[#8AD8B8]">Verified by Visa / RuPay</span>
            </div>

            <p className="text-xs text-[#FFF4E2]/80 leading-relaxed">
              An SMS OTP has been sent to your registered mobile number ending with <strong>•••210</strong> for transaction of <strong>₹{feeAmount}</strong>.
            </p>

            <div className="p-3 bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.25)] rounded-xl text-center font-mono text-xs text-[#8AD8B8]">
              Demo Test OTP: <strong>749201</strong>
            </div>

            <div className="flex justify-center gap-2">
              {cardOtp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`card-otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const val = e.target.value;
                    const newOtp = [...cardOtp];
                    newOtp[idx] = val;
                    setCardOtp(newOtp);
                    if (val && idx < 5) {
                      document.getElementById(`card-otp-${idx + 1}`)?.focus();
                    }
                  }}
                  className="w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border border-[rgba(138,216,184,0.3)] bg-[rgba(8,19,16,0.8)] text-[#FFF4E2] focus:border-[#8AD8B8]"
                />
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCardOtpModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[rgba(138,216,184,0.2)] text-[#8AD8B8] hover:text-[#FFF4E2] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCardPayment}
                disabled={isVerifying}
                className="flex-1 py-2.5 rounded-xl bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] text-xs font-bold border border-[rgba(138,216,184,0.35)] shadow-sm cursor-pointer disabled:opacity-50 transition-all"
              >
                {isVerifying ? "Verifying..." : "Submit OTP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-[rgba(138,216,184,0.25)] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] text-[#FFF4E2] text-xs font-semibold cursor-pointer transition-colors"
        >
          ← Back to Application Audit
        </button>
        <span className="text-[#8AD8B8]/70 text-xs font-mono self-center">
          256-Bit SSL Encrypted Payment Gateway
        </span>
      </div>
    </div>
  );
}
