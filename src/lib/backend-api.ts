import { apiGet, apiPost, apiPostForm } from "./backend";

// ---------------------------------------------------------------
// Shared
// ---------------------------------------------------------------

export type DrillUploadResponse = {
  drill_id: string;
  [k: string]: unknown;
};

export type TrialCaptureResponse = {
  session_token?: string;
  [k: string]: unknown;
};

export type AuthSessionResponse = {
  plan?: string;
  is_paid?: boolean;
  email?: string;
  [k: string]: unknown;
};

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------

export async function requestOtp(payload: { email: string }) {
  return apiPost<Record<string, unknown>>("/api/auth/request-otp", payload);
}

export async function verifyOtp(payload: { email: string; otp: string }) {
  return apiPost<Record<string, unknown>>("/api/auth/verify-otp", payload);
}

export async function getAuthSession() {
  return apiGet<AuthSessionResponse>("/api/auth/session");
}

// ---------------------------------------------------------------
// Trial
// ---------------------------------------------------------------

export type TrialUploadForm = {
  text?: string;
  audio?: Blob;
  /** Response modality — backend validates this must be "voice" or "text". */
  mode: "voice" | "text";
  question_slot: string;
  question_type: string;
  question_prompt: string;
  duration_seconds: number;
};

export function buildTrialUploadForm(f: TrialUploadForm): FormData {
  const fd = new FormData();
  if (f.audio) fd.append("audio", f.audio, "response.webm");
  if (f.text) fd.append("text", f.text);
  fd.append("mode", f.mode);
  fd.append("question_slot", f.question_slot);
  fd.append("question_type", f.question_type);
  fd.append("question_prompt", f.question_prompt);
  fd.append("duration_seconds", String(f.duration_seconds));
  return fd;
}

export async function uploadTrialResponse(form: FormData) {
  return apiPostForm<DrillUploadResponse>("/api/trial/upload", form);
}

export async function captureTrial(payload: {
  drill_id: string;
  name: string;
  email: string;
  mobile: string;
  stage: string;
  question_type?: string;
  question_slot?: string;
  mode?: "voice" | "text";
}) {
  return apiPost<TrialCaptureResponse>("/api/trial/capture", payload);
}

export async function analyzeTrial(payload: { drill_id: string }) {
  return apiPost<Record<string, unknown>>("/api/trial/analyze", payload);
}

// ---------------------------------------------------------------
// Paid
// ---------------------------------------------------------------

export type PaidUploadForm = {
  text?: string;
  audio?: Blob;
  /** Response modality — backend validates this must be "voice" or "text". */
  mode: "voice" | "text";
  question_slot: string;
  question_type: string;
  question_prompt: string;
  duration_seconds: number;
  question_source?: string;
  bank_question_id?: string | null;
};

export function buildPaidUploadForm(f: PaidUploadForm): FormData {
  const fd = new FormData();
  if (f.audio) fd.append("audio", f.audio, "response.webm");
  if (f.text) fd.append("text", f.text);
  fd.append("mode", f.mode);
  fd.append("question_slot", f.question_slot);
  fd.append("question_type", f.question_type);
  fd.append("question_prompt", f.question_prompt);
  fd.append("duration_seconds", String(f.duration_seconds));
  fd.append("question_source", f.question_source ?? "bank");
  if (f.bank_question_id) fd.append("bank_question_id", f.bank_question_id);
  return fd;
}

export async function uploadPaidResponse(form: FormData) {
  return apiPostForm<DrillUploadResponse>("/api/paid/upload", form);
}

export async function analyzePaidResponse(payload: { drill_id: string }) {
  return apiPost<Record<string, unknown>>("/api/paid/analyze", payload);
}

export async function savePaidRepAnalysis(
  drill_id: string,
  payload: {
    analysis: Record<string, unknown>;
    question_prompt?: string;
    activity_title?: string;
  },
) {
  return apiPost<Record<string, unknown>>(
    `/api/paid/reps/${encodeURIComponent(drill_id)}/analysis`,
    payload,
  );
}

export async function getPaidRepAnalysis(drill_id: string) {
  return apiGet<Record<string, unknown>>(
    `/api/paid/reps/${encodeURIComponent(drill_id)}/analysis`,
  );
}

export async function getPaidSession() {
  return apiPost<Record<string, unknown>>("/api/paid/session", {});
}

export async function getPaidStats() {
  return apiGet<Record<string, unknown>>("/api/paid/stats");
}

export async function getPaidLimits() {
  return apiGet<Record<string, unknown>>("/api/paid/limits");
}

export async function getPaidReps(limit = 200) {
  return apiGet<Record<string, unknown>>(`/api/paid/reps?limit=${limit}`);
}

export async function getLatestAnalysis() {
  return apiGet<Record<string, unknown>>("/api/paid/reps/latest-analysis");
}

export async function getPaidQuestions(count = 2) {
  return apiGet<Record<string, unknown>>(`/api/paid/questions?count=${count}`);
}

export async function getPaidScenarios(activity?: string, count = 12) {
  const q = new URLSearchParams();
  if (activity) q.set("activity", activity);
  q.set("count", String(count));
  return apiGet<Record<string, unknown>>(`/api/paid/scenarios?${q.toString()}`);
}

export async function getNextQuestion(exclude_id?: string) {
  const q = exclude_id ? `?exclude_id=${encodeURIComponent(exclude_id)}` : "";
  return apiGet<Record<string, unknown>>(`/api/paid/questions/next${q}`);
}

export async function savePaidProfile(payload: {
  role: string;
  role_family?: string;
  role_custom?: string;
  career_stage?: string;
  target_industry?: string;
  track?: string;
}) {
  return apiPost<Record<string, unknown>>("/api/paid/profile", payload);
}

export async function saveReflection(payload: {
  prompt: string;
  answer: string;
  drill_id?: string;
  metric_snapshot?: Record<string, unknown>;
}) {
  return apiPost<Record<string, unknown>>("/api/paid/reflect", payload);
}

export async function getReflections(limit = 50) {
  return apiGet<Record<string, unknown>>(`/api/paid/reflections?limit=${limit}`);
}

// ---------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------

export async function createCheckoutOrder(payload: {
  email: string;
  plan: "sprint" | "pass";
  sprint?: string;
  name?: string;
  phone?: string;
  billing?: "annual" | "monthly";
}) {
  return apiPost<Record<string, unknown>>("/api/checkout/create-order", payload);
}

export async function verifyPayment(payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  email: string;
  plan: "sprint" | "pass";
  sprint?: string;
  name?: string;
  phone?: string;
  billing?: "annual" | "monthly";
}) {
  return apiPost<Record<string, unknown>>("/api/checkout/verify-payment", payload);
}

export async function verifyCheckoutSession() {
  return apiPost<Record<string, unknown>>("/api/checkout/verify-session", {});
}
