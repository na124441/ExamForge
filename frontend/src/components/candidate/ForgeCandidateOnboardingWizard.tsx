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
  // Step 1: Basic Identity
  fullName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  emailVerified: boolean;
  phoneVerified: boolean;

  // Step 4: Demographics
  dob: string;
  gender: string;
  nationality: string;
  category: string; // General, OBC-NCL, SC, ST, EWS
  pwdStatus: string; // YES, NO
  domicileState: string;
  guardianName: string;

  // Step 5: Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  samePermanentAddress: boolean;
  lat: number;
  lng: number;

  // Step 6: Education
  qualificationLevel: string;
  boardUniversity: string;
  passingYear: string;
  rollNumber: string;
  percentageCgpa: string;

  // Step 7: Identity
  aadhaarStatus: "UNVERIFIED" | "VERIFIED" | "REJECTED";
  aadhaarNumberMasked: string;
  photoMatchPercent: number;

  // Step 8 & 9: Vendor & Exam & Review
  selectedVendorId: string;
  selectedVendorName: string;
  selectedExamId: string;
  selectedExamTitle: string;
  examFee: number;
  applicationNumber: string;
  confirmedAccuracy: boolean;

  // Step 10 & 11: Payment & Centre
  paymentStatus: "PENDING" | "PAID";
  paymentReference: string;
  candidateStudentId: string;
  preferredCentres: string[];
  allocatedCentreName: string;
  allocatedCentreAddress: string;
  allocatedSlot: string;

  // Step 12: Admit Card
  admitCardReady: boolean;
  admitCardHash: string;
}

const INITIAL_CANDIDATE: CandidateData = {
  fullName: "Nayant Srivastava",
  middleName: "",
  lastName: "Srivastava",
  email: "nayantsri19@gmail.com",
  phone: "+91 98765 43210",
  alternatePhone: "+91 98111 22233",
  emailVerified: false,
  phoneVerified: false,

  dob: "2007-11-21",
  gender: "Male",
  nationality: "Indian",
  category: "General",
  pwdStatus: "NO",
  domicileState: "Delhi",
  guardianName: "Anand Srivastava",

  addressLine1: "Flat 402, Green Park Apartments, Sector 14",
  addressLine2: "Near Metro Gate 3",
  city: "New Delhi",
  district: "South Delhi",
  state: "Delhi",
  postalCode: "110016",
  samePermanentAddress: true,
  lat: 28.5492,
  lng: 77.2001,

  qualificationLevel: "Undergraduate",
  boardUniversity: "Delhi Technological University (DTU)",
  passingYear: "2024",
  rollNumber: "DTU-2020-CS-084",
  percentageCgpa: "8.85 CGPA",

  aadhaarStatus: "UNVERIFIED",
  aadhaarNumberMasked: "XXXX-XXXX-8921",
  photoMatchPercent: 99.4,

  selectedVendorId: "VND-NTA-2026",
  selectedVendorName: "National Testing Agency (NTA)",
  selectedExamId: "EXM-JEE-MAIN-2026",
  selectedExamTitle: "Joint Entrance Examination (Main) - 2026",
  examFee: 1000,
  applicationNumber: "EXF-2026-00001842",
  confirmedAccuracy: false,

  paymentStatus: "PENDING",
  paymentReference: "",
  candidateStudentId: "EXF-CAN-2026-8F42A1",
  preferredCentres: [],
  allocatedCentreName: "",
  allocatedCentreAddress: "",
  allocatedSlot: "",

  admitCardReady: false,
  admitCardHash: ""
};

const AVAILABLE_CENTRES = [
  {
    id: "CTR-DELHI-01",
    name: "Delhi Technological Examination Center",
    address: "Bawana Road, Shahbad Daulatpur, New Delhi - 110042",
    city: "New Delhi",
    lat: 28.7501,
    lng: 77.1177,
    availableCapacity: 142,
    distanceKm: 4.2
  },
  {
    id: "CTR-GURUGRAM-02",
    name: "Gurugram Cyber City Tech Center",
    address: "DLF Phase 2, Cyber Hub, Gurugram - 122002",
    city: "Gurugram",
    lat: 28.4950,
    lng: 77.0890,
    availableCapacity: 88,
    distanceKm: 14.8
  },
  {
    id: "CTR-NOIDA-03",
    name: "Noida Knowledge Park Assessment Hub",
    address: "Plot 7, Knowledge Park II, Greater Noida - 201310",
    city: "Noida",
    lat: 28.4670,
    lng: 77.5140,
    availableCapacity: 210,
    distanceKm: 22.5
  }
];

export function ForgeCandidateOnboardingWizard() {
  const [candidate, setCandidate] = useState<CandidateData>(INITIAL_CANDIDATE);
  const [activeStep, setActiveStep] = useState<OnboardingStep>("ACCOUNT");
  const [stepLockError, setStepLockError] = useState<string | null>(null);

  // Single Source of Truth for Completed Steps
  const [completedSteps, setCompletedSteps] = useState<Record<OnboardingStep, boolean>>({
    ACCOUNT: false,
    EMAIL_OTP: false,
    PHONE_OTP: false,
    PERSONAL_PROFILE: false,
    ADDRESS_DETAILS: false,
    EDUCATION_BACKGROUND: false,
    GOVT_ID_VERIFY: false,
    EXAM_SELECTION: false,
    PRE_PAYMENT_REVIEW: false,
    PAYMENT: false,
    CENTRE_SELECTION: false,
    ADMIT_CARD: false,
  });

  // Stepper container ref for smooth horizontal auto-scrolling
  const stepperContainerRef = useRef<HTMLDivElement | null>(null);
  const activeStepBtnRef = useRef<HTMLButtonElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // OTP State & API Integrations
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [emailChallengeId, setEmailChallengeId] = useState<string | null>(null);
  const [phoneChallengeId, setPhoneChallengeId] = useState<string | null>(null);

  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Dynamic Vendor & Exam Discovery State (100% Database-Driven)
  const [vendorsList, setVendorsList] = useState<VendorOrganization[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("VND-NTA-2026");
  const [examsList, setExamsList] = useState<ExamCatalogItem[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState<boolean>(false);
  const [selectedExamDetails, setSelectedExamDetails] = useState<ExamCatalogItem | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [isValidatingEligibility, setIsValidatingEligibility] = useState<boolean>(false);

  // Auto-scroll active step into center of horizontal stepper
  useEffect(() => {
    if (activeStepBtnRef.current) {
      activeStepBtnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    checkScrollIndicators();
  }, [activeStep]);

  const checkScrollIndicators = () => {
    if (!stepperContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = stepperContainerRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  const handleScrollStepper = (direction: "left" | "right") => {
    if (!stepperContainerRef.current) return;
    const scrollAmount = 260;
    stepperContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Load vendors from database
  useEffect(() => {
    async function loadVendors() {
      setIsLoadingVendors(true);
      try {
        const vList = await getVendors();
        setVendorsList(vList);
        if (vList.length > 0) {
          const matchedVendor = vList.find(v => v.id === candidate.selectedVendorId) || vList[0];
          setSelectedVendorId(matchedVendor.id);
        }
      } catch (err) {
        console.error("Failed to load vendors from database:", err);
      } finally {
        setIsLoadingVendors(false);
      }
    }
    loadVendors();
  }, []);

  // Load exams for selected vendor from database
  useEffect(() => {
    if (!selectedVendorId) return;
    async function loadExams() {
      setIsLoadingExams(true);
      try {
        const list = await getExamsByVendor(selectedVendorId);
        setExamsList(list);
        if (list.length > 0) {
          const match = list.find(e => e.id === candidate.selectedExamId) || list[0];
          setSelectedExamDetails(match);
        } else {
          setSelectedExamDetails(null);
        }
      } catch (err) {
        console.error("Failed to load exams for vendor:", err);
      } finally {
        setIsLoadingExams(false);
      }
    }
    loadExams();
  }, [selectedVendorId]);

  // Run eligibility check against DB criteria when selected exam changes
  useEffect(() => {
    const currentExam = selectedExamDetails;
    if (!currentExam) {
      setEligibilityResult(null);
      return;
    }
    async function runEligibility(examItem: ExamCatalogItem) {
      setIsValidatingEligibility(true);
      try {
        const res = await validateCandidateEligibility({
          exam_id: examItem.id,
          qualification_level: candidate.qualificationLevel,
          percentage_cgpa: candidate.percentageCgpa,
          dob: candidate.dob,
          category: candidate.category
        });
        setEligibilityResult(res);
      } catch (err) {
        console.error("Eligibility validation failed:", err);
      } finally {
        setIsValidatingEligibility(false);
      }
    }
    runEligibility(currentExam);
  }, [selectedExamDetails, candidate.qualificationLevel, candidate.percentageCgpa, candidate.category]);

  const handleApplyForExam = (exam: ExamCatalogItem) => {
    const isReserved = candidate.category && candidate.category.toUpperCase() !== "GENERAL";
    const fee = isReserved ? exam.fee_reserved : exam.fee_general;
    const vendor = vendorsList.find(v => v.id === exam.vendor_id);
    
    setCandidate(prev => ({
      ...prev,
      selectedVendorId: exam.vendor_id,
      selectedVendorName: vendor ? vendor.name : exam.vendor_name,
      selectedExamId: exam.id,
      selectedExamTitle: exam.title,
      examFee: fee
    }));
    setSelectedExamDetails(exam);
  };

  // Timer countdown effect
  useEffect(() => {
    if (emailCooldown > 0) {
      const timer = setTimeout(() => setEmailCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCooldown]);

  useEffect(() => {
    if (phoneCooldown > 0) {
      const timer = setTimeout(() => setPhoneCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCooldown]);

  // ═══════════════════════════════════════════════════════════
  // STATE MACHINE RESOLVER (Single Source of Truth)
  // ═══════════════════════════════════════════════════════════

  const getStepStatus = (stepKey: OnboardingStep): StepStatus => {
    if (stepKey === activeStep) {
      return "IN_PROGRESS";
    }

    const stepIdx = ONBOARDING_STEPS.findIndex(s => s.key === stepKey);

    // Verify all prerequisites (steps 0 to stepIdx-1) are complete
    let allPrereqsMet = true;
    for (let i = 0; i < stepIdx; i++) {
      if (!completedSteps[ONBOARDING_STEPS[i].key]) {
        allPrereqsMet = false;
        break;
      }
    }

    if (!allPrereqsMet) {
      return "LOCKED";
    }

    if (completedSteps[stepKey]) {
      return "COMPLETED";
    }

    return "AVAILABLE";
  };

  const canAccessStep = (targetKey: OnboardingStep): boolean => {
    const targetIdx = ONBOARDING_STEPS.findIndex(s => s.key === targetKey);
    if (targetIdx <= 0) return true;

    for (let i = 0; i < targetIdx; i++) {
      if (!completedSteps[ONBOARDING_STEPS[i].key]) {
        return false;
      }
    }
    return true;
  };

  const handleStepClick = (targetKey: OnboardingStep) => {
    if (canAccessStep(targetKey)) {
      setStepLockError(null);
      setActiveStep(targetKey);
    } else {
      const targetIdx = ONBOARDING_STEPS.findIndex(s => s.key === targetKey);
      const pendingStep = ONBOARDING_STEPS.find((s, idx) => idx < targetIdx && !completedSteps[s.key]);
      setStepLockError(
        `Step "${ONBOARDING_STEPS.find(s => s.key === targetKey)?.label}" is locked. Complete "${pendingStep?.label || 'previous step'}" first.`
      );
    }
  };

  const markStepComplete = (key: OnboardingStep, nextStep?: OnboardingStep) => {
    setCompletedSteps(prev => ({ ...prev, [key]: true }));
    setStepLockError(null);
    if (nextStep) {
      setActiveStep(nextStep);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // WORKFLOW ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════

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
      setEmailFeedback(`Verification code dispatched via Gmail SMTP to ${candidate.email}! Check your inbox.`);
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
    handleApplyForExam(exam);
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
    <div className="space-y-6 font-sans w-full max-w-7xl mx-auto text-[#FFF4E2] select-none">
      
      {/* 1. TOP HEADER & HORIZONTAL STEPPER CARD */}
      <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-5">
        
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(138,216,184,0.15)] pb-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#FFF4E2] tracking-tight flex items-center gap-2">
                Candidate Registration &amp; State-Controlled Verification Flow
              </h1>
              <p className="text-xs text-[#8AD8B8]/80 font-mono">
                Finite-State Workflow • Dual-Layer Prerequisite Step Locking • UIDAI Secure QR Identity
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="text-[#8AD8B8]/70">Student ID:</span>
            <span className="font-bold text-[#FFF4E2] bg-[rgba(64,133,118,0.3)] px-3 py-1.5 rounded-xl border border-[rgba(138,216,184,0.3)]">
              {candidate.candidateStudentId}
            </span>
            <span className="px-3 py-1 rounded-full bg-[rgba(138,216,184,0.15)] text-[#8AD8B8] border border-[rgba(138,216,184,0.3)] text-xs font-semibold">
              {progressPercent === 100 ? "● COMPLETE (100%)" : `● IN PROGRESS (${progressPercent}%)`}
            </span>
          </div>
        </div>

        {/* 2. HORIZONTAL STEPPER NAVIGATION VIEWPORT */}
        <div className="relative w-full overflow-hidden">
          {/* Left / Right Scroll Overlay Controls */}
          {canScrollLeft && (
            <button
              onClick={() => handleScrollStepper("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#132D28] border border-[rgba(138,216,184,0.4)] text-[#8AD8B8] hover:text-[#FFF4E2] flex items-center justify-center shadow-lg cursor-pointer"
              aria-label="Scroll steps left"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => handleScrollStepper("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#132D28] border border-[rgba(138,216,184,0.4)] text-[#8AD8B8] hover:text-[#FFF4E2] flex items-center justify-center shadow-lg cursor-pointer"
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
            className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1.5 px-0.5 no-scrollbar"
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
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold shrink-0 min-w-max whitespace-nowrap transition-all border cursor-pointer",
                    isActive
                      ? "bg-[#408576] border-[#8AD8B8] text-[#FFF4E2] shadow-[0_0_20px_rgba(138,216,184,0.4)] font-bold scale-[1.02]"
                      : isCompleted
                      ? "bg-[rgba(64,133,118,0.25)] border-[rgba(138,216,184,0.35)] text-[#8AD8B8] hover:bg-[rgba(64,133,118,0.4)]"
                      : isAccessible
                      ? "bg-[rgba(19,45,40,0.6)] border-[rgba(138,216,184,0.2)] text-[#FFF4E2]/90 hover:border-[#8AD8B8]"
                      : "bg-[rgba(19,45,40,0.4)] border-[rgba(138,216,184,0.12)] text-[#8AD8B8]/60 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-mono font-bold shrink-0",
                      isActive
                        ? "bg-[#FFF4E2] text-[#132D28]"
                        : isCompleted
                        ? "bg-[#8AD8B8] text-[#132D28]"
                        : isAccessible
                        ? "bg-[rgba(64,133,118,0.4)] text-[#FFF4E2]"
                        : "bg-[rgba(19,45,40,0.8)] text-[#8AD8B8]/60 border border-[rgba(138,216,184,0.2)]"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
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
        <div className="p-4 rounded-2xl bg-[rgba(180,120,40,0.2)] border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-2 font-semibold">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            {stepLockError}
          </span>
          <button onClick={() => setStepLockError(null)} className="text-amber-100 font-bold underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. MAIN DUAL-COLUMN INTERACTIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Candidate Real-Time Verification Monitor */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-3">
                <span className="text-xs font-bold text-[#8AD8B8] tracking-wider uppercase font-mono">
                  CANDIDATE VERIFICATION BADGE
                </span>
                <span className="text-xs font-mono font-bold text-[#8AD8B8]">{progressPercent}% Complete</span>
              </div>

              {/* Candidate Profile Summary Header Card */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] shadow-inner">
                <div className="w-12 h-12 rounded-2xl bg-[#408576] border border-[rgba(138,216,184,0.3)] text-[#FFF4E2] flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  {candidate.fullName.charAt(0)}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-[#FFF4E2] text-sm truncate">{candidate.fullName}</div>
                  <div className="text-[#8AD8B8]/80 font-mono text-[11px] truncate">{candidate.email}</div>
                  <div className="text-[#8AD8B8]/60 font-mono text-[10px]">{candidate.phone}</div>
                </div>
              </div>

              {/* Step Prerequisites Checklist (Derived Directly from State Machine) */}
              <div className="space-y-2 text-xs font-medium">
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
                        "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer min-h-[44px]",
                        isCurrent
                          ? "bg-[rgba(64,133,118,0.3)] border-[#8AD8B8] shadow-sm"
                          : isComplete
                          ? "bg-[rgba(19,45,40,0.7)] border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8]"
                          : "bg-[rgba(19,45,40,0.4)] border-[rgba(138,216,184,0.1)] text-[#8AD8B8]/60"
                      )}
                    >
                      <span className="flex items-center gap-2.5 text-[#FFF4E2] text-xs">
                        <s.icon className={cn("w-4 h-4 shrink-0", isCurrent ? "text-[#8AD8B8]" : isComplete ? "text-[#8AD8B8]" : "text-[#8AD8B8]/50")} />
                        <span className={cn(isCurrent && "font-bold text-[#FFF4E2]")}>{s.label}</span>
                      </span>

                      <span className="ml-auto font-mono text-[11px] font-bold">
                        {isComplete ? (
                          <span className="text-[#8AD8B8] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> OK
                          </span>
                        ) : isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#408576] text-[#FFF4E2] border border-[#8AD8B8]/50 text-[10px]">
                            ● Active
                          </span>
                        ) : isLocked ? (
                          <span className="text-[#8AD8B8]/50 flex items-center gap-1 text-[10px]">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-[#8AD8B8]/80 text-[10px]">Ready</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cryptographic Trust Footer in Sidebar */}
            <div className="p-3.5 rounded-2xl bg-[rgba(8,19,16,0.6)] border border-[rgba(138,216,184,0.15)] text-[11px] font-mono text-[#8AD8B8]/70 flex items-center justify-between">
              <span>SHA-256 State Ledger</span>
              <span className="text-[#8AD8B8] font-bold">VERIFIED</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Step Content Panel */}
        <div className="lg:col-span-8 min-w-0 flex flex-col space-y-6">
          
          {/* STEP 1: IDENTITY ACCOUNT & CREATION */}
          {activeStep === "ACCOUNT" && (
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#8AD8B8]" />
                  Step 1: Candidate Identity Account Setup
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">1 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">First Name</label>
                    <input
                      type="text"
                      value={candidate.fullName.split(" ")[0] || "Nayant"}
                      onChange={e => setCandidate(prev => ({ ...prev, fullName: e.target.value + " " + (prev.lastName || "") }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Middle Name (Optional)</label>
                    <input
                      type="text"
                      value={candidate.middleName}
                      onChange={e => setCandidate(prev => ({ ...prev, middleName: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Last Name</label>
                    <input
                      type="text"
                      value={candidate.lastName}
                      onChange={e => setCandidate(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Primary Email Address</label>
                    <input
                      type="email"
                      value={candidate.email}
                      onChange={e => setCandidate(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Mobile Number (E.164 India)</label>
                    <input
                      type="text"
                      value={candidate.phone}
                      onChange={e => setCandidate(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm font-mono focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSendEmailOtp}
                    disabled={isSendingEmailOtp}
                    className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer disabled:opacity-50 transition-all font-sans"
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
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#8AD8B8]" />
                  Step 2: Email Address OTP Verification
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">2 of 12</span>
              </div>

              <div className="space-y-6 text-xs">
                {emailFeedback && (
                  <div className="p-3 rounded-2xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#8AD8B8] shrink-0" />
                    {emailFeedback}
                  </div>
                )}

                {emailError && (
                  <div className="p-3 rounded-2xl bg-[rgba(180,60,60,0.2)] border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    {emailError}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] space-y-2">
                  <div className="text-xs text-[#FFF4E2]/90">
                    A 6-digit verification code was dispatched to: <strong className="font-mono text-[#8AD8B8]">{candidate.email}</strong>
                  </div>
                  <div className="text-[11px] text-[#8AD8B8]/70 font-mono">
                    For local testing, standard simulation OTP: <strong>123456</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider font-mono">Enter 6-Digit Email OTP</label>
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
                        className="w-12 h-14 text-center text-xl font-mono font-bold rounded-2xl border border-[rgba(138,216,184,0.25)] bg-[rgba(8,19,16,0.8)] text-[#FFF4E2] focus:border-[#8AD8B8]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleSendEmailOtp}
                    disabled={emailCooldown > 0 || isSendingEmailOtp}
                    className="text-xs text-[#8AD8B8] hover:text-[#FFF4E2] underline font-mono cursor-pointer disabled:opacity-50"
                  >
                    {emailCooldown > 0 ? `Resend Code in ${emailCooldown}s` : "Resend Email Code"}
                  </button>

                  <button
                    onClick={handleVerifyEmailOtp}
                    disabled={isVerifyingEmailOtp}
                    className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer disabled:opacity-50 transition-all font-sans"
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
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#8AD8B8]" />
                  Step 3: Mobile SMS OTP Verification
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">3 of 12</span>
              </div>

              <div className="space-y-6 text-xs">
                {phoneFeedback && (
                  <div className="p-3 rounded-2xl bg-[rgba(64,133,118,0.25)] border border-[rgba(138,216,184,0.3)] text-[#8AD8B8] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#8AD8B8] shrink-0" />
                    {phoneFeedback}
                  </div>
                )}

                {phoneError && (
                  <div className="p-3 rounded-2xl bg-[rgba(180,60,60,0.2)] border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    {phoneError}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] space-y-2">
                  <div className="text-xs text-[#FFF4E2]/90">
                    India DLT Gateway verification code for mobile: <strong className="font-mono text-[#8AD8B8]">{candidate.phone}</strong>
                  </div>
                  <div className="text-[11px] text-[#8AD8B8]/70 font-mono">
                    For local testing, standard simulation OTP: <strong>123456</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider font-mono">Enter 6-Digit SMS OTP</label>
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
                        className="w-12 h-14 text-center text-xl font-mono font-bold rounded-2xl border border-[rgba(138,216,184,0.25)] bg-[rgba(8,19,16,0.8)] text-[#FFF4E2] focus:border-[#8AD8B8]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleSendPhoneOtp}
                    disabled={phoneCooldown > 0 || isSendingPhoneOtp}
                    className="text-xs text-[#8AD8B8] hover:text-[#FFF4E2] underline font-mono cursor-pointer disabled:opacity-50"
                  >
                    {phoneCooldown > 0 ? `Resend SMS in ${phoneCooldown}s` : "Resend SMS Code"}
                  </button>

                  <button
                    onClick={handleVerifyPhoneOtp}
                    disabled={isVerifyingPhoneOtp}
                    className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer disabled:opacity-50 transition-all font-sans"
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
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#8AD8B8]" />
                  Step 4: Candidate Demographics &amp; Category
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">4 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Date of Birth</label>
                    <input
                      type="date"
                      value={candidate.dob}
                      onChange={e => setCandidate(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-mono text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Gender</label>
                    <select
                      value={candidate.gender}
                      onChange={e => setCandidate(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Transgender</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Nationality</label>
                    <input
                      type="text"
                      value={candidate.nationality}
                      onChange={e => setCandidate(prev => ({ ...prev, nationality: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Social Category</label>
                    <select
                      value={candidate.category}
                      onChange={e => setCandidate(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    >
                      <option value="General">General / Open</option>
                      <option value="OBC-NCL">OBC-NCL (Non-Creamy Layer)</option>
                      <option value="SC">Scheduled Caste (SC)</option>
                      <option value="ST">Scheduled Tribe (ST)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">PwD Status</label>
                    <select
                      value={candidate.pwdStatus}
                      onChange={e => setCandidate(prev => ({ ...prev, pwdStatus: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    >
                      <option value="NO">NO</option>
                      <option value="YES">YES (40%+ Benchmark Disability)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Father / Guardian Name</label>
                    <input
                      type="text"
                      value={candidate.guardianName}
                      onChange={e => setCandidate(prev => ({ ...prev, guardianName: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setActiveStep("PHONE_OTP")}
                    className="px-4 py-2.5 rounded-2xl border border-[rgba(138,216,184,0.25)] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] text-[#FFF4E2] text-xs font-semibold cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSavePersonalProfile}
                    className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer transition-all font-sans"
                  >
                    Save &amp; Continue to Address <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ADDRESS DETAILS */}
          {activeStep === "ADDRESS_DETAILS" && (
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#8AD8B8]" />
                  Step 5: Communication Address &amp; Geocoding
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">5 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Address Line 1</label>
                  <input
                    type="text"
                    value={candidate.addressLine1}
                    onChange={e => setCandidate(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">City / Town</label>
                    <input
                      type="text"
                      value={candidate.city}
                      onChange={e => setCandidate(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">State / UT</label>
                    <input
                      type="text"
                      value={candidate.state}
                      onChange={e => setCandidate(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">PIN Code</label>
                    <input
                      type="text"
                      value={candidate.postalCode}
                      onChange={e => setCandidate(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm font-mono focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.2)] flex items-center justify-between text-xs">
                  <span className="text-[#FFF4E2]">Permanent address is identical to communication address</span>
                  <input
                    type="checkbox"
                    checked={candidate.samePermanentAddress}
                    onChange={e => setCandidate(prev => ({ ...prev, samePermanentAddress: e.target.checked }))}
                    className="w-4 h-4 accent-[#8AD8B8] cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setActiveStep("PERSONAL_PROFILE")}
                    className="px-4 py-2.5 rounded-2xl border border-[rgba(138,216,184,0.25)] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] text-[#FFF4E2] text-xs font-semibold cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSaveAddressDetails}
                    className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer transition-all font-sans"
                  >
                    Save &amp; Continue to Education <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: EDUCATION BACKGROUND */}
          {activeStep === "EDUCATION_BACKGROUND" && (
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#8AD8B8]" />
                  Step 6: Academic Qualifications &amp; Eligibility Records
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">6 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Highest Qualification Level</label>
                    <select
                      value={candidate.qualificationLevel}
                      onChange={e => setCandidate(prev => ({ ...prev, qualificationLevel: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    >
                      <option value="Class 10">Class 10 / Secondary</option>
                      <option value="Class 12">Class 12 / Senior Secondary</option>
                      <option value="Diploma">Diploma / Polytechnic</option>
                      <option value="Undergraduate">Undergraduate (B.Tech / B.Sc / B.Com)</option>
                      <option value="Postgraduate">Postgraduate (M.Tech / M.Sc / MBA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Board / University</label>
                    <input
                      type="text"
                      value={candidate.boardUniversity}
                      onChange={e => setCandidate(prev => ({ ...prev, boardUniversity: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Passing Year</label>
                    <input
                      type="text"
                      value={candidate.passingYear}
                      onChange={e => setCandidate(prev => ({ ...prev, passingYear: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-mono text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Roll / Registration Number</label>
                    <input
                      type="text"
                      value={candidate.rollNumber}
                      onChange={e => setCandidate(prev => ({ ...prev, rollNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-mono text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider mb-1 font-mono">Percentage / CGPA</label>
                    <input
                      type="text"
                      value={candidate.percentageCgpa}
                      onChange={e => setCandidate(prev => ({ ...prev, percentageCgpa: e.target.value }))}
                      className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-mono text-sm focus:outline-none focus:border-[#8AD8B8]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setActiveStep("ADDRESS_DETAILS")}
                    className="px-4 py-2.5 rounded-2xl border border-[rgba(138,216,184,0.25)] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] text-[#FFF4E2] text-xs font-semibold cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSaveEducationDetails}
                    className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer transition-all font-sans"
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
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#8AD8B8]" />
                  Step 8: Examination Catalog &amp; Eligibility Check
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">8 of 12</span>
              </div>

              <div className="space-y-5 text-xs">
                {/* Vendor Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider font-mono">
                    Select Conducting Authority / Examination Board
                  </label>
                  <select
                    value={selectedVendorId}
                    onChange={e => setSelectedVendorId(e.target.value)}
                    className="w-full px-4 py-3 bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] rounded-2xl text-[#FFF4E2] font-sans text-sm focus:outline-none focus:border-[#8AD8B8]"
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
                  <span className="block text-xs font-bold text-[#FFF4E2]/90 uppercase tracking-wider font-mono">
                    Active Examination Catalog
                  </span>

                  {isLoadingExams ? (
                    <div className="p-8 text-center text-[#8AD8B8] flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading Catalog...
                    </div>
                  ) : examsList.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[rgba(19,45,40,0.5)] border border-[rgba(138,216,184,0.15)] text-center text-[#8AD8B8]/70">
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
                              "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                              isSelected
                                ? "bg-[rgba(64,133,118,0.3)] border-[#8AD8B8] shadow-md"
                                : "bg-[rgba(19,45,40,0.7)] border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8]"
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#FFF4E2]">{exam.title}</span>
                                <span className="px-2 py-0.5 rounded-full bg-[rgba(138,216,184,0.15)] text-[#8AD8B8] font-mono text-[10px] font-bold">
                                  {exam.code}
                                </span>
                              </div>
                              <p className="text-xs text-[#8AD8B8]/80">{exam.purpose || exam.syllabus_summary || "National competitive examination session."}</p>
                              <div className="flex items-center gap-4 text-[11px] font-mono text-[#8AD8B8]/70 pt-1">
                                <span>Exam Date: {exam.exam_date}</span>
                                <span>•</span>
                                <span>Duration: {exam.duration_minutes} Mins</span>
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-[10px] text-[#8AD8B8]/70 font-mono block">APPLICATION FEE</span>
                              <span className="text-lg font-bold font-mono text-[#8AD8B8]">₹{fee}</span>
                              <div className="text-[10px] text-[#8AD8B8] font-semibold mt-1 flex items-center gap-1">
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
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#8AD8B8]" />
                  Step 9: Application Review &amp; Pre-Payment Audit
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">9 of 12</span>
              </div>

              <div className="space-y-5 text-xs">
                <div className="p-4 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] space-y-3">
                  <span className="text-xs font-bold text-[#8AD8B8] uppercase font-mono tracking-wider">
                    Candidate Dossier Summary
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Candidate Full Name</span>
                      <span className="font-bold text-[#FFF4E2]">{candidate.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Selected Examination</span>
                      <span className="font-bold text-[#8AD8B8]">{candidate.selectedExamTitle}</span>
                    </div>
                    <div>
                      <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Registered Email</span>
                      <span className="font-mono text-[#FFF4E2]">{candidate.email}</span>
                    </div>
                    <div>
                      <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Application Fee</span>
                      <span className="font-mono font-bold text-[#8AD8B8]">₹{candidate.examFee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[rgba(64,133,118,0.2)] border border-[rgba(138,216,184,0.25)] flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="confirmAccuracy"
                    checked={candidate.confirmedAccuracy}
                    onChange={e => setCandidate(prev => ({ ...prev, confirmedAccuracy: e.target.checked }))}
                    className="w-4 h-4 accent-[#8AD8B8] mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="confirmAccuracy" className="text-xs text-[#FFF4E2] leading-relaxed cursor-pointer">
                    I solemnly declare that all particulars submitted in this application are authentic, accurate, and cryptographically verified against my official identity credentials.
                  </label>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setActiveStep("EXAM_SELECTION")}
                    className="px-4 py-2.5 rounded-2xl border border-[rgba(138,216,184,0.25)] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] text-[#FFF4E2] text-xs font-semibold cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmReview}
                    disabled={!candidate.confirmedAccuracy}
                    className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer disabled:opacity-50 transition-all font-sans"
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
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#8AD8B8]" />
                  Step 11: Automated Test Centre Allocation &amp; Geo-Proximity
                </h2>
                <span className="text-xs font-mono text-[#8AD8B8]/70">11 of 12</span>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-xs text-[#8AD8B8]/80 leading-relaxed">
                  Centres sorted dynamically based on your registered address coordinates (New Delhi) and real-time seat matrix capacity:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {AVAILABLE_CENTRES.map(centre => (
                    <div
                      key={centre.id}
                      onClick={() => handleAllocateCentre(centre)}
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                        candidate.allocatedCentreName === centre.name
                          ? "bg-[rgba(64,133,118,0.35)] border-[#8AD8B8] shadow-md"
                          : "bg-[rgba(19,45,40,0.7)] border-[rgba(138,216,184,0.2)] hover:border-[#8AD8B8]"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#FFF4E2]">{centre.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[rgba(138,216,184,0.15)] text-[#8AD8B8] font-mono text-[10px] font-bold">
                            {centre.distanceKm} km away
                          </span>
                        </div>
                        <p className="text-xs text-[#8AD8B8]/80">{centre.address}</p>
                        <div className="text-[11px] font-mono text-[#8AD8B8]/70 pt-1">
                          Available Seats: <strong className="text-[#FFF4E2]">{centre.availableCapacity}</strong>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => handleAllocateCentre(centre)}
                          className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-2.5 px-5 rounded-xl border border-[rgba(138,216,184,0.35)] text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
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
            <div className="p-6 rounded-3xl bg-[rgba(19,45,40,0.65)] border border-[rgba(138,216,184,0.2)] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(64,133,118,0.3)] text-[#8AD8B8] flex items-center justify-center border border-[rgba(138,216,184,0.3)]">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#FFF4E2]">Cryptographic Examination Admit Card</h2>
                    <p className="text-xs text-[#8AD8B8]/80 font-mono">Issued &amp; ECDSA Signed by ExamForge Security Engine</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[rgba(138,216,184,0.2)] text-[#8AD8B8] font-mono font-bold text-xs border border-[#8AD8B8]">
                  ● VERIFIED &amp; ISSUED
                </span>
              </div>

              {/* Admit Card Dossier */}
              <div className="p-6 rounded-2xl bg-[rgba(19,45,40,0.85)] border border-[rgba(138,216,184,0.25)] space-y-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(138,216,184,0.15)] pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#8AD8B8] tracking-wider block">
                      OFFICIAL ADMISSION TICKET (HALL TICKET)
                    </span>
                    <h3 className="font-bold text-[#FFF4E2] text-sm mt-0.5">{candidate.selectedExamTitle}</h3>
                  </div>
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-[10px] text-[#8AD8B8]/70 block">ROLL NUMBER</span>
                    <span className="font-bold text-[#8AD8B8] text-sm">2026-EXF-8921-01</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)]">
                    <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Candidate Name</span>
                    <span className="font-bold text-[#FFF4E2]">{candidate.fullName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)]">
                    <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Student ID</span>
                    <span className="font-mono font-bold text-[#8AD8B8]">{candidate.candidateStudentId}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)]">
                    <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Allocated Slot</span>
                    <span className="font-mono font-semibold text-[#FFF4E2] text-[11px]">{candidate.allocatedSlot}</span>
                  </div>
                  <div className="sm:col-span-3 p-3 rounded-xl bg-[rgba(8,19,16,0.7)] border border-[rgba(138,216,184,0.15)]">
                    <span className="text-[#8AD8B8]/70 text-[10px] font-mono block">Allocated Examination Centre</span>
                    <span className="font-bold text-[#FFF4E2] block">{candidate.allocatedCentreName}</span>
                    <span className="text-[11px] text-[#8AD8B8]/80 block mt-0.5">{candidate.allocatedCentreAddress}</span>
                  </div>
                </div>

                {/* Cryptographic Proof Hash */}
                <div className="p-3 rounded-xl bg-[rgba(8,19,16,0.8)] border border-[rgba(138,216,184,0.25)] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#8AD8B8] uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8AD8B8]" />
                    Immutable Proof Hash
                  </span>
                  <span className="font-mono text-[10px] text-[#FFF4E2] break-all block bg-[rgba(19,45,40,0.6)] p-2 rounded border border-[rgba(138,216,184,0.15)]">
                    {candidate.admitCardHash || "ADMIT_SHA256_0x789A4B12C098DE56"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-[rgba(138,216,184,0.25)] bg-[rgba(255,244,226,0.06)] hover:bg-[rgba(255,244,226,0.12)] text-[#FFF4E2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Signed PDF Admit Card
                </button>

                <a
                  href="/student-exam"
                  className="bg-[#408576] hover:bg-[#132D28] text-[#FFF4E2] font-bold py-3 px-6 rounded-2xl border border-[rgba(138,216,184,0.35)] flex items-center gap-2 text-xs shadow-md shadow-[#132D28]/50 cursor-pointer transition-all"
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
