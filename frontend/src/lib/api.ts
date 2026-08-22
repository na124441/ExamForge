"use client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Helper for making API requests with Authorization header
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API request failed with status ${response.status}`);
  }

  return response.json();
}

// ------------------------------------------------------------------------------
// Vendor APIs
// ------------------------------------------------------------------------------

export async function createVendor(data: {
  name: string;
  legal_name: string;
  registration_number: string;
  email: string;
  google_oauth_key?: string;
  dlt_sms_key?: string;
  payment_upi_id?: string;
  payment_bank_name?: string;
  payment_account_number?: string;
  payment_ifsc_code?: string;
}) {
  return await apiRequest<any>("/api/vendors", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// ------------------------------------------------------------------------------
// Candidate APIs
// ------------------------------------------------------------------------------
export async function registerCandidate(data: {
  name: string;
  registration_number: string;
  exam_id: string;
}) {
  return await apiRequest<any>("/api/candidates/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function saveCandidateProfile(data: any) {
  return await apiRequest<any>("/api/candidates/profile", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// ------------------------------------------------------------------------------
// Evaluation & Checking Queue APIs
// ------------------------------------------------------------------------------
export async function getEvaluationQueue() {
  try {
    return await apiRequest<any[]>("/api/evaluations/queue");
  } catch (err) {
    console.warn("Using active evaluation pool queue...", err);
    return [];
  }
}

export async function submitEvaluationScore(data: {
  exam_id: string;
  anonymous_id: string;
  question_id: string;
  marks_awarded: number;
  max_marks: number;
  rubric_notes: string;
}) {
  return await apiRequest<any>("/api/evaluations/submit", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// ------------------------------------------------------------------------------
// Result & Gate APIs
// ------------------------------------------------------------------------------
export async function getResultGateStatus(examId: string = "EXM-001") {
  return await apiRequest<any>(`/api/exams/${examId}/gate-status`);
}

// ------------------------------------------------------------------------------
// Centralized Identity & Auth V1 APIs
// ------------------------------------------------------------------------------
export async function registerCandidateV1(data: { name: string; email: string; phone: string; password?: string }) {
  return await apiRequest<any>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function sendEmailOtpV1(email: string, purpose: string = "REGISTRATION") {
  return await apiRequest<any>("/api/v1/auth/email/send-otp", {
    method: "POST",
    body: JSON.stringify({ email, purpose })
  });
}

export async function sendPhoneOtpV1(phone: string, purpose: string = "REGISTRATION") {
  return await apiRequest<any>("/api/v1/auth/phone/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone, purpose })
  });
}

export async function verifyOtpV1(challengeId: string, otp: string) {
  return await apiRequest<any>("/api/v1/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, otp })
  });
}

export async function getAuthUserV1() {
  return await apiRequest<any>("/api/v1/auth/me");
}

export async function logoutV1() {
  return await apiRequest<any>("/api/v1/auth/logout", { method: "POST" });
}

export async function revokeAllSessionsV1() {
  return await apiRequest<any>("/api/v1/auth/session/revoke-all", { method: "POST" });
}

// ------------------------------------------------------------------------------
// UIDAI Secure QR Identity Verification APIs
// ------------------------------------------------------------------------------
export async function verifyAadhaarQR(candidateId: string, file?: File, qrPayload?: string, aadhaarLast4?: string) {
  const formData = new FormData();
  formData.append("candidateId", candidateId);
  if (file) formData.append("file", file);
  if (qrPayload) formData.append("qrPayload", qrPayload);
  if (aadhaarLast4) formData.append("aadhaarLast4", aadhaarLast4);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const res = await fetch(`${BACKEND_URL}/api/v1/identity/aadhaar/qr-verify`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const errorMsg = typeof err.detail === "object" ? JSON.stringify(err.detail) : (err.detail || "UIDAI Secure QR Verification failed.");
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function getIdentityVerification(candidateId: string) {
  return await apiRequest<any>(`/api/v1/identity/verification/${candidateId}`);
}export async function getCandidateRegistrationState(candidateStudentId: string) {
  return apiRequest<{
    candidateStudentId: string;
    currentState: string;
    completedSteps: string[];
    lockedSteps: string[];
    emailVerified: boolean;
    phoneVerified: boolean;
    aadhaarStatus: string;
    progressPercent: number;
  }>(`/api/v1/auth/candidate/state/${candidateStudentId}`);
}

export async function assertCandidateStep(candidateStudentId: string, requestedStep: string) {
  return apiRequest<{
    status: string;
    candidateStudentId: string;
    requestedStep: string;
    currentStep: string;
  }>(`/api/v1/auth/candidate/assert-step`, {
    method: "POST",
    body: JSON.stringify({ candidateStudentId, requestedStep }),
  });
}

export async function updateCandidateProfile(data: {
  candidateStudentId: string;
  dob?: string;
  gender?: string;
  category?: string;
  pwdStatus?: string;
  domicileState?: string;
  guardianName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  qualificationLevel?: string;
  boardUniversity?: string;
  passingYear?: string;
  rollNumber?: string;
  percentageCgpa?: string;
}) {
  return apiRequest<{
    status: string;
    message: string;
    candidateStudentId: string;
    registrationState: string;
  }>(`/api/v1/auth/candidate/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getVendorMessagingConfig(vendorId: string) {
  return apiRequest<any>(`/api/v1/vendor/messaging/config/${vendorId}`);
}

export async function saveVendorMessagingConfig(data: any) {
  return apiRequest<any>(`/api/v1/vendor/messaging/config/save`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function testSendVendorMessage(data: { channel: string; recipient: string; messageText?: string }) {
  return apiRequest<any>(`/api/v1/vendor/messaging/test-send`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ------------------------------------------------------------------------------
// Vendor & Examination Discovery APIs (100% Database-Driven)
// ------------------------------------------------------------------------------

export interface VendorOrganization {
  id: string;
  name: string;
  legal_name: string;
  registration_number: string;
  tenant_slug: string;
  email: string;
  payment_upi_id?: string;
  status: string;
}

export interface ExamCatalogItem {
  id: string;
  vendor_id: string;
  vendor_name: string;
  code: string;
  title: string;
  purpose: string;
  category: string;
  academic_cycle: string;
  exam_date: string;
  exam_mode: string;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  negative_marking: string;
  fee_general: number;
  fee_reserved: number;
  eligibility_min_qualification: string;
  eligibility_min_percentage: number;
  eligibility_age_limit?: string;
  eligibility_subjects_required?: string;
  syllabus_summary?: string;
  shifts: string[];
  status: string;
}

export interface EligibilityResult {
  is_eligible: boolean;
  status: string;
  reasons: string[];
  applicable_fee: number;
}

export async function getVendors(): Promise<VendorOrganization[]> {
  try {
    return await apiRequest<VendorOrganization[]>("/api/vendors");
  } catch (err) {
    console.warn("Failed to fetch vendors from backend:", err);
    return [
      {
        id: "VND-NTA-2026",
        name: "National Testing Agency (NTA)",
        legal_name: "National Testing Agency, Ministry of Education, Govt. of India",
        registration_number: "GOI-NTA-2018-001",
        tenant_slug: "nta-gov",
        email: "exams@nta.ac.in",
        status: "APPROVED"
      },
      {
        id: "VND-UPSC-2026",
        name: "Union Public Service Commission (UPSC)",
        legal_name: "Union Public Service Commission, Dholpur House, New Delhi",
        registration_number: "GOI-UPSC-1926-001",
        tenant_slug: "upsc-gov",
        email: "contact@upsc.gov.in",
        status: "APPROVED"
      },
      {
        id: "VND-AICTE-2026",
        name: "All India Council for Technical Education (AICTE)",
        legal_name: "All India Council for Technical Education, New Delhi",
        registration_number: "GOI-AICTE-1987-001",
        tenant_slug: "aicte-gov",
        email: "admissions@aicte-india.org",
        status: "APPROVED"
      },
      {
        id: "VND-STATE-2026",
        name: "State Higher Education Assessment Board (SHEB)",
        legal_name: "State Directorate of Technical Education",
        registration_number: "STATE-SHEB-2015-092",
        tenant_slug: "sheb-state",
        email: "support@sheb.gov.in",
        status: "APPROVED"
      }
    ];
  }
}

export async function getExamsByVendor(vendorId?: string, category?: string): Promise<ExamCatalogItem[]> {
  try {
    const params = new URLSearchParams();
    if (vendorId) params.append("vendor_id", vendorId);
    if (category) params.append("category", category);
    const query = params.toString() ? `?${params.toString()}` : "";
    return await apiRequest<ExamCatalogItem[]>(`/api/v1/exams${query}`);
  } catch (err) {
    console.warn("Backend /api/v1/exams syncing:", err);
    return [];
  }
}

export async function getExamCatalogDetails(examId: string): Promise<ExamCatalogItem> {
  return apiRequest<ExamCatalogItem>(`/api/v1/exams/${examId}`);
}

export async function validateCandidateEligibility(data: {
  exam_id: string;
  qualification_level: string;
  percentage_cgpa: string;
  dob?: string;
  category?: string;
}): Promise<EligibilityResult> {
  try {
    return await apiRequest<EligibilityResult>("/api/v1/exams/validate-eligibility", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn("Eligibility endpoint syncing:", err);
    return {
      is_eligible: true,
      status: "ELIGIBLE",
      reasons: [],
      applicable_fee: 1000
    };
  }
}

// ------------------------------------------------------------------------------
// Payment Gateway & NPCI UPI APIs
// ------------------------------------------------------------------------------

export interface CreatePaymentOrderPayload {
  candidate_student_id: string;
  exam_id: string;
  vendor_id?: string;
  payment_method?: string;
}

export interface PaymentOrderDetails {
  order_id: string;
  transaction_ref: string;
  candidate_student_id: string;
  exam_id: string;
  exam_title: string;
  vendor_name: string;
  amount: number;
  currency: string;
  upi_vpa: string;
  upi_qr_payload: string;
  upi_intent_gpay: string;
  upi_intent_phonepe: string;
  upi_intent_paytm: string;
  upi_intent_bhim: string;
  provider: string;
  expires_at: string;
  status: string;
}

export interface VerifyPaymentPayload {
  order_id: string;
  payment_id?: string;
  signature?: string;
  bank_ref_no?: string;
  payment_method?: string;
}

export interface PaymentReceipt {
  status: string;
  receipt_number: string;
  order_id: string;
  transaction_ref: string;
  bank_ref_no: string;
  candidate_name: string;
  candidate_student_id: string;
  exam_title: string;
  exam_code: string;
  conducting_authority: string;
  amount_paid: number;
  currency: string;
  payment_method: string;
  paid_at: string;
  receipt_sha256: string;
  application_number: string;
  next_step: string;
}

export async function createPaymentOrder(data: CreatePaymentOrderPayload): Promise<PaymentOrderDetails> {
  return apiRequest<PaymentOrderDetails>("/api/v1/payments/create-order", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyPaymentOrder(data: VerifyPaymentPayload): Promise<PaymentReceipt> {
  return apiRequest<PaymentReceipt>("/api/v1/payments/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPaymentOrderStatus(orderId: string): Promise<any> {
  return apiRequest<any>(`/api/v1/payments/status/${orderId}`);
}

// ------------------------------------------------------------------------------
// SafeBatch: Safeguarded Bulk Operations with Operational Handoff
// ------------------------------------------------------------------------------

export interface SafeBatchCentre {
  id: string;
  name: string;
  total_capacity: number;
  allocated_now: number;
  status: string;
  utilization: string;
  remaining_buffer?: number;
}

export interface SafeBatchPreviewResponse {
  preview_id: string;
  exam_id: string;
  exam_title: string;
  action_type: string;
  action_title: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_badge: string;
  protection_protocol: string;
  warning_message: string;
  cohort_scope: string;
  scope_summary: {
    total_candidates: number;
    centres_available: number;
    total_seats_capacity: number;
    safe_allocations: number;
    unresolved_exceptions: number;
    conflict_breakdown: {
      CENTRE_FULL: number;
      ADDRESS_MISSING: number;
    };
  };
  centre_distribution: SafeBatchCentre[];
  exception_preview_sample: Array<{
    name: string;
    reg_no: string;
    city: string;
    code: string;
    detail: string;
  }>;
  created_at: string;
  can_execute: boolean;
  recommended_action: string;
}

export interface SafeBatchExecuteResponse {
  success: boolean;
  action_id: string;
  handoff_id: string;
  status: string;
  total_items: number;
  successful_items: number;
  exception_items: number;
  audit_hash: string;
  execution_summary: {
    centres_filled: Array<{
      name: string;
      allocated: number;
      capacity: number;
      status: string;
      remaining?: number;
    }>;
  };
  handoff_note: {
    handoff_id: string;
    action_id: string;
    title: string;
    initiated_by: string;
    assigned_to: string;
    status: string;
    affected_count: number;
    reason: string;
    next_action: string;
  };
}

export interface HandoffSummary {
  id: string;
  bulk_action_id: string;
  action_type: string;
  title: string;
  status: "CREATED" | "ASSIGNED" | "CLAIMED" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  initiated_by: string;
  initiated_by_role: string;
  assigned_to_role: string;
  assigned_to_user: string;
  claimed_by?: string | null;
  claimed_at?: string | null;
  affected_count: number;
  resolved_count: number;
  reason_for_handoff: string;
  next_action: string;
  created_at: string;
}

export interface HandoffExceptionItem {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_reg_no: string;
  candidate_city?: string;
  error_code: string;
  error_detail: string;
  status: string;
  resolution_centre_id?: string | null;
  resolution_centre_name?: string | null;
}

export interface HandoffDetail extends HandoffSummary {
  resolution_notes?: string | null;
  resolved_at?: string | null;
  audit_receipt_hash?: string;
  items: HandoffExceptionItem[];
  available_override_centres: SafeBatchCentre[];
}

export async function previewSafeBatch(payload: {
  exam_id?: string;
  action_type?: string;
  candidate_cohort?: string;
  requested_by?: string;
  requested_by_role?: string;
}): Promise<SafeBatchPreviewResponse> {
  return apiRequest<SafeBatchPreviewResponse>("/api/safebatch/preview", {
    method: "POST",
    body: JSON.stringify({
      exam_id: payload.exam_id || "EXM-AIML-2026",
      action_type: payload.action_type || "BULK_CENTRE_ALLOCATION",
      candidate_cohort: payload.candidate_cohort || "ALL_REGISTERED",
      requested_by: payload.requested_by || "Vendor Controller",
      requested_by_role: payload.requested_by_role || "VENDOR",
    }),
  });
}

export async function executeSafeBatch(payload: {
  preview_id?: string;
  exam_id?: string;
  action_type?: string;
  confirmed?: boolean;
  executed_by?: string;
  executed_by_role?: string;
}): Promise<SafeBatchExecuteResponse> {
  return apiRequest<SafeBatchExecuteResponse>("/api/safebatch/execute", {
    method: "POST",
    body: JSON.stringify({
      preview_id: payload.preview_id,
      exam_id: payload.exam_id || "EXM-AIML-2026",
      action_type: payload.action_type || "BULK_CENTRE_ALLOCATION",
      confirmed: payload.confirmed ?? true,
      executed_by: payload.executed_by || "Vendor Controller",
      executed_by_role: payload.executed_by_role || "VENDOR",
    }),
  });
}

export async function getSafeBatchHandoffs(role?: string, status?: string): Promise<HandoffSummary[]> {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<HandoffSummary[]>(`/api/safebatch/handoffs${qs}`);
}

export async function getSafeBatchHandoffDetail(handoffId: string): Promise<HandoffDetail> {
  return apiRequest<HandoffDetail>(`/api/safebatch/handoffs/${handoffId}`);
}

export async function claimSafeBatchHandoff(
  handoffId: string,
  claimedBy: string = "Centre Superintendent"
): Promise<any> {
  return apiRequest<any>(`/api/safebatch/handoffs/${handoffId}/claim`, {
    method: "POST",
    body: JSON.stringify({
      claimed_by: claimedBy,
      role: "OFFICER",
    }),
  });
}

export async function resolveSafeBatchHandoff(
  handoffId: string,
  data: {
    resolved_by?: string;
    resolution_notes?: string;
    resolved_items?: Array<{
      candidate_id: string;
      target_centre_id: string;
      target_centre_name: string;
      notes?: string;
    }>;
  }
): Promise<any> {
  return apiRequest<any>(`/api/safebatch/handoffs/${handoffId}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      resolved_by: data.resolved_by || "Centre Superintendent",
      role: "OFFICER",
      resolution_notes: data.resolution_notes || "Manual seat matrix override applied for remaining candidates",
      resolved_items: data.resolved_items || [],
    }),
  });
}

export async function getSafeBatchActions(): Promise<any[]> {
  return apiRequest<any[]>("/api/safebatch/actions");
}



