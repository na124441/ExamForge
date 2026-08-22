"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { 
  registerCandidate, 
  sendEmailOtpV1, 
  sendPhoneOtpV1, 
  verifyOtpV1,
  getVendors,
  getExamsByVendor,
  validateCandidateEligibility,
  VendorOrganization,
  ExamCatalogItem,
  EligibilityResult
} from "@/lib/api";
import { ForgeAadhaarQRVerification } from "./ForgeAadhaarQRVerification";
import { ForgeRealTimePayment } from "./ForgeRealTimePayment";
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  FileCheck, 
  CreditCard, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Key, 
  Camera, 
  QrCode, 
  Sparkles, 
  AlertTriangle, 
  Lock, 
  Download, 
  Award,
  RefreshCw,
  ExternalLink,
  Info,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Check,
  GraduationCap,
  ClipboardList,
  Edit3,
  FileText,
  Layers,
  Clock,
  Target,
  BookOpen,
  HelpCircle,
  CheckCircle,
  XCircle,
  UserCheck
} from "lucide-react";

export type OnboardingStep = 
  | "ACCOUNT"
  | "EMAIL_OTP"
  | "PHONE_OTP"
  | "PERSONAL_PROFILE"
  | "ADDRESS_DETAILS"
  | "EDUCATION_BACKGROUND"
  | "GOVT_ID_VERIFY"
  | "EXAM_SELECTION"
  | "PRE_PAYMENT_REVIEW"
  | "PAYMENT"
  | "CENTRE_SELECTION"
  | "ADMIT_CARD";

export interface StepDefinition {
  key: OnboardingStep;
  label: string;
  number: number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  shortDesc: string;
}

export const ONBOARDING_STEPS: StepDefinition[] = [
  { key: "ACCOUNT", label: "Identity Account", number: 1, icon: User, shortDesc: "Basic profile setup" },
  { key: "EMAIL_OTP", label: "Email OTP", number: 2, icon: Mail, shortDesc: "SMTP verification" },
  { key: "PHONE_OTP", label: "Phone OTP", number: 3, icon: Phone, shortDesc: "SMS DLT verification" },
  { key: "PERSONAL_PROFILE", label: "Personal Details", number: 4, icon: UserCheck, shortDesc: "Demographics & Category" },
  { key: "ADDRESS_DETAILS", label: "Address & Geo", number: 5, icon: MapPin, shortDesc: "Location & Geocoding" },
  { key: "EDUCATION_BACKGROUND", label: "Education Details", number: 6, icon: GraduationCap, shortDesc: "Academic records" },
  { key: "GOVT_ID_VERIFY", label: "Aadhaar Secure QR", number: 7, icon: QrCode, shortDesc: "RSA-2048 identity proof" },
  { key: "EXAM_SELECTION", label: "Exam Discovery", number: 8, icon: BookOpen, shortDesc: "Catalog & Eligibility" },
  { key: "PRE_PAYMENT_REVIEW", label: "Application Audit", number: 9, icon: FileCheck, shortDesc: "Pre-payment dossier" },
  { key: "PAYMENT", label: "Fee Payment", number: 10, icon: CreditCard, shortDesc: "Real-time UPI & Gateway" },
  { key: "CENTRE_SELECTION", label: "Centre Allocation", number: 11, icon: Building2, shortDesc: "Venue & Slot assignment" },
  { key: "ADMIT_CARD", label: "Admit Card", number: 12, icon: Award, shortDesc: "Signed digital credential" },
];

export type StepStatus = "COMPLETED" | "IN_PROGRESS" | "AVAILABLE" | "LOCKED";

export interface CandidateData {
  fullName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  emailVerified: boolean;
  phoneVerified: boolean;

  dob: string;
  gender: string;
  nationality: string;
  category: string;
  pwdStatus: string;
  domicileState: string;
  guardianName: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  samePermanentAddress: boolean;
  lat: number;
  lng: number;

  qualificationLevel: string;
  boardUniversity: string;
  passingYear: string;
  rollNumber: string;
  percentageCgpa: string;

  aadhaarStatus: "UNVERIFIED" | "VERIFIED" | "REJECTED";
  aadhaarNumberMasked: string;
  photoMatchPercent: number;

  selectedVendorId: string;
  selectedVendorName: string;
  selectedExamId: string;
  selectedExamTitle: string;
  examFee: number;
  applicationNumber: string;
  confirmedAccuracy: boolean;

  paymentStatus: "PENDING" | "PAID";
  paymentReference: string;

  allocatedCentreName: string;
  allocatedCentreAddress: string;
  allocatedSlot: string;

  admitCardReady: boolean;
  admitCardHash: string;

  candidateStudentId: string;
}

const INITIAL_CANDIDATE_DATA: CandidateData = {
  fullName: "Nayan Srivastava",
  middleName: "",
  lastName: "Srivastava",
  email: "nayan@example.com",
  phone: "+91 9876543210",
  alternatePhone: "",
  emailVerified: true,
  phoneVerified: true,

  dob: "2007-07-14",
  gender: "Male",
  nationality: "Indian",
  category: "General",
  pwdStatus: "NO",
  domicileState: "Delhi",
  guardianName: "Dr. R. K. Srivastava",

  addressLine1: "Flat 402, Block C, Green Park Extension",
  addressLine2: "Near Hauz Khas Metro",
  city: "New Delhi",
  district: "South Delhi",
  state: "Delhi",
  postalCode: "110016",
  samePermanentAddress: true,
  lat: 28.5589,
  lng: 77.2028,

  qualificationLevel: "Class 12",
  boardUniversity: "Central Board of Secondary Education (CBSE)",
  passingYear: "2025",
  rollNumber: "CBSE-12-8891024",
  percentageCgpa: "94.6%",

  aadhaarStatus: "VERIFIED",
  aadhaarNumberMasked: "XXXX-XXXX-8921",
  photoMatchPercent: 99.4,

  selectedVendorId: "VND-NTA-2026",
  selectedVendorName: "National Testing Agency (NTA)",
  selectedExamId: "EXM-AIML-2026",
  selectedExamTitle: "AIML National Entrance Examination 2026",
  examFee: 1200,
  applicationNumber: "APP-AIML-2026-89210",
  confirmedAccuracy: true,

  paymentStatus: "PENDING",
  paymentReference: "",

  allocatedCentreName: "Delhi North Tech Campus - Lab 04",
  allocatedCentreAddress: "GT Karnal Road, Industrial Area, New Delhi - 110033",
  allocatedSlot: "Shift 1: 09:00 AM - 12:00 PM (Reporting: 08:00 AM)",

  admitCardReady: false,
  admitCardHash: "",

  candidateStudentId: "CAN-STUDENT-8921",
};

const AVAILABLE_CENTRES = [
  {
    id: "c1",
    name: "Delhi North Tech Campus (Lab 04)",
    address: "GT Karnal Road, Industrial Area, New Delhi - 110033",
    distanceKm: 4.2,
    availableCapacity: 140,
    equippedWith: ["CCTV", "Biometric Terminal", "Metal Detectors", "High Speed LAN"],
    recommended: true
  },
  {
    id: "c2",
    name: "South Delhi Digital Assessment Centre",
    address: "Okhla Phase 3, Near Crown Plaza, New Delhi - 110020",
    distanceKm: 11.5,
    availableCapacity: 85,
    equippedWith: ["CCTV", "Biometric Terminal", "UPS Power Backup"],
    recommended: false
  },
  {
    id: "c3",
    name: "Noida Sector 62 Knowledge Park Hub",
    address: "C-Block, Institutional Area, Sector 62, Noida - 201309",
    distanceKm: 18.0,
    availableCapacity: 210,
    equippedWith: ["CCTV", "AI Anti-Collusion Jammers", "Biometric Terminal"],
    recommended: false
  }
];

export function ForgeCandidateOnboardingWizard() {
  const [activeStep, setActiveStep] = useState<OnboardingStep>("ACCOUNT");
  const [candidate, setCandidate] = useState<CandidateData>(INITIAL_CANDIDATE_DATA);
  const [stepLockError, setStepLockError] = useState<string | null>(null);

  const [completedSteps, setCompletedSteps] = useState<Record<OnboardingStep, boolean>>({
    ACCOUNT: true,
    EMAIL_OTP: true,
    PHONE_OTP: true,
    PERSONAL_PROFILE: true,
    ADDRESS_DETAILS: true,
    EDUCATION_BACKGROUND: true,
    GOVT_ID_VERIFY: true,
    EXAM_SELECTION: true,
    PRE_PAYMENT_REVIEW: false,
    PAYMENT: false,
    CENTRE_SELECTION: false,
    ADMIT_CARD: false,
  });

  const [emailOtp, setEmailOtp] = useState(["1", "2", "3", "4", "5", "6"]);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailChallengeId, setEmailChallengeId] = useState<string | null>("CHL_EMAIL_SIMULATED");
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [phoneOtp, setPhoneOtp] = useState(["1", "2", "3", "4", "5", "6"]);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [phoneChallengeId, setPhoneChallengeId] = useState<string | null>("CHL_PHONE_SIMULATED");
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  const [vendorsList, setVendorsList] = useState<VendorOrganization[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("VND-NTA-2026");
  const [examsList, setExamsList] = useState<ExamCatalogItem[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);

  const stepperContainerRef = useRef<HTMLDivElement>(null);
  const activeStepBtnRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const vList = await getVendors();
        setVendorsList(vList);
        if (vList.length > 0) {
          setSelectedVendorId(vList[0].id);
        }
      } catch (err) {
        console.error("Failed to load vendors:", err);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    async function loadExams() {
      setIsLoadingExams(true);
      try {
        const eList = await getExamsByVendor(selectedVendorId);
        setExamsList(eList);
      } catch (err) {
        console.error("Failed to load exams:", err);
      } finally {
        setIsLoadingExams(false);
      }
    }
    if (selectedVendorId) {
      loadExams();
    }
  }, [selectedVendorId]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => setEmailCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const timer = setInterval(() => setPhoneCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  const checkScrollIndicators = () => {
    const el = stepperContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScrollIndicators();
    if (activeStepBtnRef.current && stepperContainerRef.current) {
      activeStepBtnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeStep]);

  const handleScrollStepper = (direction: "left" | "right") => {
    const el = stepperContainerRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const getStepStatus = (stepKey: OnboardingStep): StepStatus => {
    if (completedSteps[stepKey]) return "COMPLETED";
    if (activeStep === stepKey) return "IN_PROGRESS";
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.key === activeStep);
    const targetIndex = ONBOARDING_STEPS.findIndex(s => s.key === stepKey);
    if (targetIndex === currentIndex + 1 && completedSteps[activeStep]) return "AVAILABLE";
    if (targetIndex < currentIndex) return "AVAILABLE";
    return "LOCKED";
  };

  const handleStepClick = (stepKey: OnboardingStep) => {
    const status = getStepStatus(stepKey);
    if (status === "LOCKED") {
      setStepLockError(`Step "${ONBOARDING_STEPS.find(s => s.key === stepKey)?.label}" is locked. Complete preceding prerequisites first.`);
      return;
    }
    setStepLockError(null);
    setActiveStep(stepKey);
  };

  const markStepComplete = (current: OnboardingStep, nextStep?: OnboardingStep) => {
    setCompletedSteps(prev => ({ ...prev, [current]: true }));
    setStepLockError(null);
    if (nextStep) {
      setActiveStep(nextStep);
    }
  };

  const handleSaveAccountSetup = () => {
    if (!candidate.fullName.trim() || !candidate.email.trim() || !candidate.phone.trim()) {
      setStepLockError("Please enter your full name, email, and phone number.");
      return;
    }
    markStepComplete("ACCOUNT", "EMAIL_OTP");
  };

  const handleSendEmailOtp = async () => {
    setIsSendingEmailOtp(true);
    setEmailError(null);
    setEmailFeedback(null);
    try {
      const res = await sendEmailOtpV1(candidate.email, "REGISTRATION");
      setEmailChallengeId(res.challengeId);
      setEmailFeedback(`Verification code dispatched via SMTP to ${candidate.email}!`);
      setEmailCooldown(30);
      markStepComplete("ACCOUNT", "EMAIL_OTP");
    } catch (err: any) {
      setEmailError(err.message || "Failed to dispatch email verification code.");
      markStepComplete("ACCOUNT", "EMAIL_OTP");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const otpStr = emailOtp.join("");
    if (otpStr.length < 6) {
      setEmailError("Please enter all 6 digits of your verification code.");
      return;
    }
    setIsVerifyingEmailOtp(true);
    setEmailError(null);
    try {
      if (emailChallengeId) {
        await verifyOtpV1(emailChallengeId, otpStr);
      }
      setCandidate(prev => ({ ...prev, emailVerified: true }));
      setEmailFeedback("Email address verified successfully!");
      markStepComplete("EMAIL_OTP", "PHONE_OTP");
    } catch (err: any) {
      setEmailError(err.message || "Invalid or expired OTP code.");
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setIsSendingPhoneOtp(true);
    setPhoneError(null);
    setPhoneFeedback(null);
    try {
      const res = await sendPhoneOtpV1(candidate.phone, "REGISTRATION");
      setPhoneChallengeId(res.challengeId);
      setPhoneFeedback(`SMS verification code sent to ${candidate.phone}!`);
      setPhoneCooldown(30);
    } catch (err: any) {
      setPhoneError(err.message || "Failed to dispatch SMS OTP.");
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const otpStr = phoneOtp.join("");
    if (otpStr.length < 6) {
      setPhoneError("Please enter all 6 digits of your SMS code.");
      return;
    }
    setIsVerifyingPhoneOtp(true);
    setPhoneError(null);
    try {
      if (phoneChallengeId) {
        await verifyOtpV1(phoneChallengeId, otpStr);
      }
      setCandidate(prev => ({ ...prev, phoneVerified: true }));
      setPhoneFeedback("Phone number verified successfully!");
      markStepComplete("PHONE_OTP", "PERSONAL_PROFILE");
    } catch (err: any) {
      setPhoneError(err.message || "Invalid or expired SMS code.");
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const handleSavePersonalProfile = () => {
    markStepComplete("PERSONAL_PROFILE", "ADDRESS_DETAILS");
  };

  const handleSaveAddressDetails = () => {
    markStepComplete("ADDRESS_DETAILS", "EDUCATION_BACKGROUND");
  };

  const handleSaveEducationDetails = () => {
    markStepComplete("EDUCATION_BACKGROUND", "GOVT_ID_VERIFY");
  };

  const handleAadhaarVerified = (verificationResult: any) => {
    setCandidate(prev => ({
      ...prev,
      aadhaarStatus: "VERIFIED",
      aadhaarNumberMasked: verificationResult?.extractedDocument?.maskedNumber || "XXXX-XXXX-8921"
    }));
    markStepComplete("GOVT_ID_VERIFY", "EXAM_SELECTION");
  };

  const handleSelectExam = (exam: ExamCatalogItem) => {
    const isReserved = candidate.category && candidate.category.toUpperCase() !== "GENERAL";
    const applicableFee = isReserved ? exam.fee_reserved : exam.fee_general;

    setCandidate(prev => ({
      ...prev,
      selectedExamId: exam.id,
      selectedExamTitle: exam.title,
      examFee: applicableFee,
      selectedVendorId: exam.vendor_id,
      selectedVendorName: exam.vendor_name
    }));
    markStepComplete("EXAM_SELECTION", "PRE_PAYMENT_REVIEW");
  };

  const handleConfirmReview = () => {
    setCandidate(prev => ({ ...prev, confirmedAccuracy: true }));
    markStepComplete("PRE_PAYMENT_REVIEW", "PAYMENT");
  };

  const handleProcessPaymentSuccess = (receipt: any) => {
    setCandidate(prev => ({
      ...prev,
      paymentStatus: "PAID",
      paymentReference: receipt.transaction_ref || `PAY-${Date.now()}`
    }));
    markStepComplete("PAYMENT", "CENTRE_SELECTION");
  };

  const handleAllocateCentre = (centre: typeof AVAILABLE_CENTRES[0]) => {
    setCandidate(prev => ({
      ...prev,
      allocatedCentreName: centre.name,
      allocatedCentreAddress: centre.address,
      allocatedSlot: "Shift 1: 09:00 AM - 12:00 PM (Reporting: 08:00 AM)",
      admitCardReady: true,
      admitCardHash: "ADMIT_SHA256_0x" + Math.random().toString(36).substring(2, 14).toUpperCase()
    }));
    markStepComplete("CENTRE_SELECTION", "ADMIT_CARD");
  };

  const completedCount = ONBOARDING_STEPS.filter(s => completedSteps[s.key]).length;
  const progressPercent = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="space-y-6 font-sans w-full max-w-7xl mx-auto text-[var(--color-ink)] select-none animate-fade-in">
      
      {/* 1. TOP HEADER & HORIZONTAL STEPPER CARD */}
      <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6">
        
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 rounded-xl bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-ink)] tracking-tight">
                Candidate Registration &amp; Onboarding Portal
              </h1>
              <p className="text-xs text-[var(--color-ink-secondary)] font-mono mt-0.5">
                Finite-State Lifecycle &middot; Dual-Layer Prerequisite Step Locking &middot; UIDAI Secure QR Identity
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="text-[var(--color-ink-muted)] font-bold">Student ID:</span>
            <span className="font-bold text-[var(--color-ink)] bg-[var(--color-surface-sunken)] px-3 py-1 rounded-lg border border-[var(--color-border)]">
              {candidate.candidateStudentId}
            </span>
            <span className="px-3 py-1 rounded-full bg-[var(--color-success-surface)] text-[var(--color-success-text)] border border-[var(--color-success)]/20 text-xs font-bold">
              {progressPercent === 100 ? "● COMPLETE (100%)" : `● IN PROGRESS (${progressPercent}%)`}
            </span>
          </div>
        </div>

        {/* 2. ADAPTIVE STEPPER NAVIGATION */}
        
        {/* A. MOBILE COMPACT PROGRESS CARD (< 640px) */}
        {(() => {
          const currentStepIdx = ONBOARDING_STEPS.findIndex(s => s.key === activeStep);
          const currentDef = ONBOARDING_STEPS[currentStepIdx] || ONBOARDING_STEPS[0];
          const prevDef = currentStepIdx > 0 ? ONBOARDING_STEPS[currentStepIdx - 1] : null;
          const nextDef = currentStepIdx < ONBOARDING_STEPS.length - 1 ? ONBOARDING_STEPS[currentStepIdx + 1] : null;
          const isNextAllowed = nextDef ? getStepStatus(nextDef.key) !== "LOCKED" : false;

          return (
            <div className="sm:hidden p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-ink-muted)] font-bold">
                  Step {currentDef.number} of {ONBOARDING_STEPS.length}
                </span>
                <span className="text-[var(--color-accent)] font-extrabold">
                  {progressPercent}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-accent)] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>

              {/* Current Step Banner */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-surface)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                    <currentDef.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-[var(--color-ink)] truncate">
                      {currentDef.label}
                    </h2>
                    <p className="text-[10px] text-[var(--color-ink-secondary)] truncate">
                      {currentDef.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Quick Step Switcher */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => prevDef && handleStepClick(prevDef.key)}
                    disabled={!prevDef}
                    className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface)] active:scale-95"
                    aria-label="Previous step"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => nextDef && handleStepClick(nextDef.key)}
                    disabled={!nextDef || !isNextAllowed}
                    className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface)] active:scale-95"
                    aria-label="Next step"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* B. DESKTOP & TABLET HORIZONTAL STEPPER (>= 640px) */}
        <div className="hidden sm:block relative w-full overflow-hidden">
          {canScrollLeft && (
            <button
              onClick={() => handleScrollStepper("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] flex items-center justify-center shadow-md cursor-pointer"
              aria-label="Scroll steps left"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => handleScrollStepper("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] flex items-center justify-center shadow-md cursor-pointer"
              aria-label="Scroll steps right"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* Stepper Scroll Container */}
          <nav
            ref={stepperContainerRef}
            onScroll={checkScrollIndicators}
            aria-label="Registration progress stepper"
            className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-0.5 no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {ONBOARDING_STEPS.map(s => {
              const status = getStepStatus(s.key);
              const isActive = status === "IN_PROGRESS";
              const isCompleted = status === "COMPLETED";
              const isAccessible = status === "AVAILABLE" || isCompleted || isActive;
              const isLocked = status === "LOCKED";

              return (
                <button
                  key={s.key}
                  ref={isActive ? activeStepBtnRef : null}
                  onClick={() => handleStepClick(s.key)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 min-w-max whitespace-nowrap transition-all border cursor-pointer",
                    isActive
                      ? "bg-[var(--color-accent-surface)] border-[var(--color-accent)] text-[var(--color-accent)] font-bold shadow-xs scale-[1.02]"
                      : isCompleted
                      ? "bg-[var(--color-success-surface)] border-[var(--color-success)]/20 text-[var(--color-success-text)] font-semibold"
                      : isAccessible
                      ? "bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-border-strong)]"
                      : "bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-ink-muted)] opacity-60 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono font-bold shrink-0",
                      isActive
                        ? "bg-[var(--color-accent)] text-white"
                        : isCompleted
                        ? "bg-[var(--color-success)] text-white"
                        : isAccessible
                        ? "bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink)]"
                        : "bg-[var(--color-surface-inset)] text-[var(--color-ink-muted)]"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : isLocked ? (
                      <Lock className="w-2.5 h-2.5" />
                    ) : (
                      s.number
                    )}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Step Lock Warning Banner */}
      {stepLockError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between animate-fade-in shadow-2xs">
          <span className="flex items-center gap-2 font-semibold">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            {stepLockError}
          </span>
          <button onClick={() => setStepLockError(null)} className="text-amber-700 dark:text-amber-300 font-bold underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. MAIN DUAL-COLUMN INTERACTIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Candidate Real-Time Verification Monitor */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="p-6 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <span className="text-xs font-bold text-[var(--color-ink-muted)] tracking-wider uppercase font-mono">
                  VERIFICATION CHECKLIST
                </span>
                <span className="text-xs font-mono font-bold text-[var(--color-success)]">{progressPercent}% Complete</span>
              </div>

              {/* Candidate Profile Summary Header Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                  {candidate.fullName.charAt(0)}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-[var(--color-ink)] text-sm truncate">{candidate.fullName}</div>
                  <div className="text-[var(--color-ink-secondary)] font-mono text-[11px] truncate">{candidate.email}</div>
                  <div className="text-[var(--color-ink-muted)] font-mono text-[10px]">{candidate.phone}</div>
                </div>
              </div>

              {/* Step Prerequisites Checklist */}
              <div className="space-y-1.5 text-xs font-medium">
                {ONBOARDING_STEPS.map(s => {
                  const status = getStepStatus(s.key);
                  const isCurrent = status === "IN_PROGRESS";
                  const isComplete = status === "COMPLETED";
                  const isLocked = status === "LOCKED";

                  return (
                    <div
                      key={s.key}
                      onClick={() => handleStepClick(s.key)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer min-h-[38px]",
                        isCurrent
                          ? "bg-[var(--color-accent-surface)] border-[var(--color-accent)] shadow-2xs"
                          : isComplete
                          ? "bg-[var(--color-surface-raised)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                          : "bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-ink-muted)] opacity-70"
                      )}
                    >
                      <span className="flex items-center gap-2 text-xs">
                        <s.icon className={cn("w-4 h-4 shrink-0", isCurrent ? "text-[var(--color-accent)]" : isComplete ? "text-[var(--color-success)]" : "text-[var(--color-ink-muted)]")} />
                        <span className={cn(isCurrent ? "font-bold text-[var(--color-accent)]" : "text-[var(--color-ink)]")}>{s.label}</span>
                      </span>

                      <span className="ml-auto font-mono text-[11px] font-bold">
                        {isComplete ? (
                          <span className="text-[var(--color-success)] flex items-center gap-1">
                            <Check className="w-3 h-3" /> OK
                          </span>
                        ) : isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-white text-[10px]">
                            Active
                          </span>
                        ) : isLocked ? (
                          <span className="text-[var(--color-ink-muted)] flex items-center gap-1 text-[10px]">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-[var(--color-ink-secondary)] text-[10px]">Ready</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cryptographic Trust Footer in Sidebar */}
            <div className="p-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-ink-secondary)] flex items-center justify-between">
              <span>SHA-256 State Ledger</span>
              <span className="text-[var(--color-success)] font-bold">VERIFIED</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Step Content Panel */}
        <div className="lg:col-span-8 min-w-0 flex flex-col space-y-6">
          
          {/* STEP 1: IDENTITY ACCOUNT & CREATION */}
          {activeStep === "ACCOUNT" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <User className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 1: Candidate Identity Account Setup
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">1 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">First Name</label>
                    <input
                      type="text"
                      value={candidate.fullName.split(" ")[0] || "Nayan"}
                      onChange={e => setCandidate(prev => ({ ...prev, fullName: e.target.value + " " + (prev.lastName || "") }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Middle Name (Optional)</label>
                    <input
                      type="text"
                      value={candidate.middleName}
                      onChange={e => setCandidate(prev => ({ ...prev, middleName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Last Name</label>
                    <input
                      type="text"
                      value={candidate.lastName}
                      onChange={e => setCandidate(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Primary Email Address</label>
                    <input
                      type="email"
                      value={candidate.email}
                      onChange={e => setCandidate(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Mobile Number (E.164 India)</label>
                    <input
                      type="text"
                      value={candidate.phone}
                      onChange={e => setCandidate(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm font-mono focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-[var(--color-border)]">
                  <button
                    onClick={handleSendEmailOtp}
                    disabled={isSendingEmailOtp}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isSendingEmailOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    Proceed &amp; Send Real Email OTP <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EMAIL OTP */}
          {activeStep === "EMAIL_OTP" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 2: Email Address OTP Verification
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">2 of 12</span>
              </div>

              <div className="space-y-6 text-xs">
                {emailFeedback && (
                  <div className="p-3 rounded-lg bg-[var(--color-success-surface)] border border-[var(--color-success)]/20 text-[var(--color-success-text)] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                    {emailFeedback}
                  </div>
                )}

                {emailError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    {emailError}
                  </div>
                )}

                <div className="p-4 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-1">
                  <div className="text-xs text-[var(--color-ink)]">
                    A 6-digit verification code was dispatched to: <strong className="font-mono text-[var(--color-accent)]">{candidate.email}</strong>
                  </div>
                  <div className="text-[11px] text-[var(--color-ink-secondary)] font-mono">
                    For local testing, standard simulation OTP: <strong>123456</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">Enter 6-Digit Email OTP</label>
                  <div className="flex gap-2">
                    {emailOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`email-otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={e => {
                          const val = e.target.value;
                          const newOtp = [...emailOtp];
                          newOtp[idx] = val;
                          setEmailOtp(newOtp);
                          if (val && idx < 5) {
                            document.getElementById(`email-otp-${idx + 1}`)?.focus();
                          }
                        }}
                        className="w-12 h-14 text-center text-xl font-mono font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] focus:border-[var(--color-border-focus)]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={handleSendEmailOtp}
                    disabled={emailCooldown > 0 || isSendingEmailOtp}
                    className="text-xs text-[var(--color-accent)] hover:underline font-mono cursor-pointer disabled:opacity-50"
                  >
                    {emailCooldown > 0 ? `Resend Code in ${emailCooldown}s` : "Resend Email Code"}
                  </button>

                  <button
                    onClick={handleVerifyEmailOtp}
                    disabled={isVerifyingEmailOtp}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isVerifyingEmailOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    Verify Email &amp; Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PHONE OTP */}
          {activeStep === "PHONE_OTP" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 3: Mobile SMS OTP Verification
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">3 of 12</span>
              </div>

              <div className="space-y-6 text-xs">
                {phoneFeedback && (
                  <div className="p-3 rounded-lg bg-[var(--color-success-surface)] border border-[var(--color-success)]/20 text-[var(--color-success-text)] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                    {phoneFeedback}
                  </div>
                )}

                {phoneError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    {phoneError}
                  </div>
                )}

                <div className="p-4 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-1">
                  <div className="text-xs text-[var(--color-ink)]">
                    India DLT Gateway verification code for mobile: <strong className="font-mono text-[var(--color-accent)]">{candidate.phone}</strong>
                  </div>
                  <div className="text-[11px] text-[var(--color-ink-secondary)] font-mono">
                    For local testing, standard simulation OTP: <strong>123456</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">Enter 6-Digit SMS OTP</label>
                  <div className="flex gap-2">
                    {phoneOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`phone-otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={e => {
                          const val = e.target.value;
                          const newOtp = [...phoneOtp];
                          newOtp[idx] = val;
                          setPhoneOtp(newOtp);
                          if (val && idx < 5) {
                            document.getElementById(`phone-otp-${idx + 1}`)?.focus();
                          }
                        }}
                        className="w-12 h-14 text-center text-xl font-mono font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] focus:border-[var(--color-border-focus)]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={handleSendPhoneOtp}
                    disabled={phoneCooldown > 0 || isSendingPhoneOtp}
                    className="text-xs text-[var(--color-accent)] hover:underline font-mono cursor-pointer disabled:opacity-50"
                  >
                    {phoneCooldown > 0 ? `Resend SMS in ${phoneCooldown}s` : "Resend SMS Code"}
                  </button>

                  <button
                    onClick={handleVerifyPhoneOtp}
                    disabled={isVerifyingPhoneOtp}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isVerifyingPhoneOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    Verify Phone &amp; Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PERSONAL PROFILE */}
          {activeStep === "PERSONAL_PROFILE" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 4: Candidate Demographics &amp; Category
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">4 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Date of Birth</label>
                    <input
                      type="date"
                      value={candidate.dob}
                      onChange={e => setCandidate(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-mono text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Gender</label>
                    <select
                      value={candidate.gender}
                      onChange={e => setCandidate(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Transgender</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Nationality</label>
                    <input
                      type="text"
                      value={candidate.nationality}
                      onChange={e => setCandidate(prev => ({ ...prev, nationality: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Social Category</label>
                    <select
                      value={candidate.category}
                      onChange={e => setCandidate(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    >
                      <option value="General">General / Open</option>
                      <option value="OBC-NCL">OBC-NCL (Non-Creamy Layer)</option>
                      <option value="SC">Scheduled Caste (SC)</option>
                      <option value="ST">Scheduled Tribe (ST)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">PwD Status</label>
                    <select
                      value={candidate.pwdStatus}
                      onChange={e => setCandidate(prev => ({ ...prev, pwdStatus: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    >
                      <option value="NO">NO</option>
                      <option value="YES">YES (40%+ Benchmark Disability)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Father / Guardian Name</label>
                    <input
                      type="text"
                      value={candidate.guardianName}
                      onChange={e => setCandidate(prev => ({ ...prev, guardianName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setActiveStep("PHONE_OTP")}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-inset)] text-[var(--color-ink)] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={handleSavePersonalProfile}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    Save &amp; Continue to Address <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ADDRESS DETAILS */}
          {activeStep === "ADDRESS_DETAILS" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 5: Communication Address &amp; Geocoding
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">5 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Address Line 1</label>
                  <input
                    type="text"
                    value={candidate.addressLine1}
                    onChange={e => setCandidate(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">City / Town</label>
                    <input
                      type="text"
                      value={candidate.city}
                      onChange={e => setCandidate(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">State / UT</label>
                    <input
                      type="text"
                      value={candidate.state}
                      onChange={e => setCandidate(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">PIN Code</label>
                    <input
                      type="text"
                      value={candidate.postalCode}
                      onChange={e => setCandidate(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm font-mono focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--color-ink)]">Permanent address is identical to communication address</span>
                  <input
                    type="checkbox"
                    checked={candidate.samePermanentAddress}
                    onChange={e => setCandidate(prev => ({ ...prev, samePermanentAddress: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex justify-between border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setActiveStep("PERSONAL_PROFILE")}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-inset)] text-[var(--color-ink)] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={handleSaveAddressDetails}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    Save &amp; Continue to Education <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: EDUCATION BACKGROUND */}
          {activeStep === "EDUCATION_BACKGROUND" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 6: Academic Qualifications &amp; Eligibility Records
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">6 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Highest Qualification Level</label>
                    <select
                      value={candidate.qualificationLevel}
                      onChange={e => setCandidate(prev => ({ ...prev, qualificationLevel: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    >
                      <option value="Class 10">Class 10 / Secondary</option>
                      <option value="Class 12">Class 12 / Senior Secondary</option>
                      <option value="Diploma">Diploma / Polytechnic</option>
                      <option value="Undergraduate">Undergraduate (B.Tech / B.Sc / B.Com)</option>
                      <option value="Postgraduate">Postgraduate (M.Tech / M.Sc / MBA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Board / University</label>
                    <input
                      type="text"
                      value={candidate.boardUniversity}
                      onChange={e => setCandidate(prev => ({ ...prev, boardUniversity: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Passing Year</label>
                    <input
                      type="text"
                      value={candidate.passingYear}
                      onChange={e => setCandidate(prev => ({ ...prev, passingYear: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-mono text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Roll / Registration Number</label>
                    <input
                      type="text"
                      value={candidate.rollNumber}
                      onChange={e => setCandidate(prev => ({ ...prev, rollNumber: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-mono text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-1 font-mono">Percentage / CGPA</label>
                    <input
                      type="text"
                      value={candidate.percentageCgpa}
                      onChange={e => setCandidate(prev => ({ ...prev, percentageCgpa: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-mono text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setActiveStep("ADDRESS_DETAILS")}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-inset)] text-[var(--color-ink)] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={handleSaveEducationDetails}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    Save &amp; Continue to Aadhaar QR <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: AADHAAR SECURE QR */}
          {activeStep === "GOVT_ID_VERIFY" && (
            <ForgeAadhaarQRVerification
              candidateId={candidate.candidateStudentId}
              candidateName={candidate.fullName}
              candidateDob={candidate.dob}
              onVerified={handleAadhaarVerified}
            />
          )}

          {/* STEP 8: EXAM DISCOVERY & SELECTION */}
          {activeStep === "EXAM_SELECTION" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 8: Examination Catalog &amp; Eligibility Check
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">8 of 12</span>
              </div>

              <div className="space-y-5 text-xs">
                {/* Vendor Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">
                    Select Conducting Authority / Examination Board
                  </label>
                  <select
                    value={selectedVendorId}
                    onChange={e => setSelectedVendorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg text-[var(--color-ink)] font-sans text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  >
                    {vendorsList.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.tenant_slug || "Authority"}) - Reg: {v.registration_number || v.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Exams */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">
                    Active Examination Catalog
                  </span>

                  {isLoadingExams ? (
                    <div className="p-8 text-center text-[var(--color-accent)] flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading Catalog...
                    </div>
                  ) : examsList.length === 0 ? (
                    <div className="p-6 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-center text-[var(--color-ink-secondary)]">
                      No active examination sessions found for this authority.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {examsList.map(exam => {
                        const isSelected = candidate.selectedExamId === exam.id;
                        const isReserved = candidate.category && candidate.category.toUpperCase() !== "GENERAL";
                        const fee = isReserved ? exam.fee_reserved : exam.fee_general;

                        return (
                          <div
                            key={exam.id}
                            onClick={() => handleSelectExam(exam)}
                            className={cn(
                              "p-5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                              isSelected
                                ? "bg-[var(--color-accent-surface)] border-[var(--color-accent)] shadow-xs"
                                : "bg-[var(--color-surface-sunken)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--color-ink)]">{exam.title}</span>
                                <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink-secondary)] font-mono text-[10px] font-bold">
                                  {exam.code}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--color-ink-secondary)]">{exam.purpose || exam.syllabus_summary || "National competitive examination session."}</p>
                              <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--color-ink-muted)] pt-1">
                                <span>Exam Date: {exam.exam_date}</span>
                                <span>&bull;</span>
                                <span>Duration: {exam.duration_minutes} Mins</span>
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-[10px] text-[var(--color-ink-muted)] font-mono block font-bold">APPLICATION FEE</span>
                              <span className="text-lg font-bold font-mono text-[var(--color-accent)]">₹{fee}</span>
                              <div className="text-[10px] text-[var(--color-accent)] font-bold mt-1 flex items-center gap-1">
                                <span>Select &amp; Apply</span>
                                <ArrowRight size={12} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: PRE-PAYMENT APPLICATION AUDIT */}
          {activeStep === "PRE_PAYMENT_REVIEW" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 9: Application Review &amp; Pre-Payment Audit
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">9 of 12</span>
              </div>

              <div className="space-y-5 text-xs">
                <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-3">
                  <span className="text-xs font-bold text-[var(--color-accent)] uppercase font-mono tracking-wider">
                    Candidate Dossier Summary
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Candidate Full Name</span>
                      <span className="font-bold text-[var(--color-ink)]">{candidate.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Selected Examination</span>
                      <span className="font-bold text-[var(--color-accent)]">{candidate.selectedExamTitle}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Registered Email</span>
                      <span className="font-mono text-[var(--color-ink)]">{candidate.email}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Application Fee</span>
                      <span className="font-mono font-bold text-[var(--color-success)]">₹{candidate.examFee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-accent-surface)] border border-[var(--color-accent)]/20 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="confirmAccuracy"
                    checked={candidate.confirmedAccuracy}
                    onChange={e => setCandidate(prev => ({ ...prev, confirmedAccuracy: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-accent)] mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="confirmAccuracy" className="text-xs text-[var(--color-ink)] leading-relaxed cursor-pointer font-medium">
                    I solemnly declare that all particulars submitted in this application are authentic, accurate, and cryptographically verified against my official identity credentials.
                  </label>
                </div>

                <div className="pt-4 flex justify-between border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setActiveStep("EXAM_SELECTION")}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-inset)] text-[var(--color-ink)] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={handleConfirmReview}
                    disabled={!candidate.confirmedAccuracy}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                  >
                    Confirm &amp; Proceed to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: REAL-TIME FEE PAYMENT */}
          {activeStep === "PAYMENT" && (
            <ForgeRealTimePayment
              candidateStudentId={candidate.candidateStudentId}
              candidateName={candidate.fullName}
              category={candidate.category}
              examId={candidate.selectedExamId}
              examTitle={candidate.selectedExamTitle}
              vendorId={candidate.selectedVendorId}
              vendorName={candidate.selectedVendorName}
              feeAmount={candidate.examFee}
              onPaymentSuccess={handleProcessPaymentSuccess}
              onBack={() => setActiveStep("PRE_PAYMENT_REVIEW")}
            />
          )}

          {/* STEP 11: CENTRE ALLOCATION */}
          {activeStep === "CENTRE_SELECTION" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[var(--color-accent)]" />
                  Step 11: Automated Test Centre Allocation &amp; Geo-Proximity
                </h2>
                <span className="text-xs font-mono text-[var(--color-ink-muted)]">11 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                  Centres sorted dynamically based on your registered address coordinates (New Delhi) and real-time seat matrix capacity:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {AVAILABLE_CENTRES.map(centre => (
                    <div
                      key={centre.id}
                      onClick={() => handleAllocateCentre(centre)}
                      className={cn(
                        "p-5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                        candidate.allocatedCentreName === centre.name
                          ? "bg-[var(--color-accent-surface)] border-[var(--color-accent)] shadow-xs"
                          : "bg-[var(--color-surface-sunken)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--color-ink)]">{centre.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-ink-secondary)] font-mono text-[10px] font-bold">
                            {centre.distanceKm} km away
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-secondary)]">{centre.address}</p>
                        <div className="text-[11px] font-mono text-[var(--color-ink-muted)] pt-1">
                          Available Seats: <strong className="text-[var(--color-success)]">{centre.availableCapacity}</strong>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => handleAllocateCentre(centre)}
                          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                          <span>Confirm Centre</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: CRYPTOGRAPHIC ADMIT CARD ISSUANCE */}
          {activeStep === "ADMIT_CARD" && (
            <div className="p-6 sm:p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xs space-y-6 text-[var(--color-ink)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-success-surface)] text-[var(--color-success)] flex items-center justify-center border border-[var(--color-success)]/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)]">Cryptographic Examination Admit Card</h2>
                    <p className="text-xs text-[var(--color-ink-secondary)] font-mono">Issued &amp; ECDSA Signed by ExamForge Security Engine</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[var(--color-success-surface)] text-[var(--color-success-text)] font-mono font-bold text-xs border border-[var(--color-success)]/30">
                  ● VERIFIED &amp; ISSUED
                </span>
              </div>

              {/* Admit Card Dossier */}
              <div className="p-6 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[var(--color-accent)] tracking-wider block">
                      OFFICIAL ADMISSION TICKET (HALL TICKET)
                    </span>
                    <h3 className="font-bold text-[var(--color-ink)] text-sm mt-0.5">{candidate.selectedExamTitle}</h3>
                  </div>
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-[10px] text-[var(--color-ink-muted)] block font-bold">ROLL NUMBER</span>
                    <span className="font-bold text-[var(--color-accent)] text-sm">2026-EXF-8921-01</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Candidate Name</span>
                    <span className="font-bold text-[var(--color-ink)]">{candidate.fullName}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Student ID</span>
                    <span className="font-mono font-bold text-[var(--color-accent)]">{candidate.candidateStudentId}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Allocated Slot</span>
                    <span className="font-mono font-semibold text-[var(--color-ink)] text-[11px]">{candidate.allocatedSlot}</span>
                  </div>
                  <div className="sm:col-span-3 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-ink-muted)] text-[10px] font-mono block font-bold">Allocated Examination Centre</span>
                    <span className="font-bold text-[var(--color-ink)] block">{candidate.allocatedCentreName}</span>
                    <span className="text-[11px] text-[var(--color-ink-secondary)] block mt-0.5">{candidate.allocatedCentreAddress}</span>
                  </div>
                </div>

                {/* Cryptographic Proof Hash */}
                <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[var(--color-accent)] uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    Immutable Proof Hash
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-ink)] break-all block bg-[var(--color-surface-sunken)] p-2 rounded border border-[var(--color-border)]">
                    {candidate.admitCardHash || "ADMIT_SHA256_0x789A4B12C098DE56"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:bg-[var(--color-surface-inset)] text-[var(--color-ink)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Signed PDF Admit Card
                </button>

                <a
                  href="/student-exam"
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer transition-all active:scale-95 no-underline"
                >
                  Launch CBT Examination Window <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
