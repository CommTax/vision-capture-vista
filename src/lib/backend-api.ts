import { apiGet, apiPost, apiPostForm } from "./backend";

export type TrialUploadResponse = {
  drill_id: string;
};

export type TrialCaptureResponse = {
  user_id: string;
  session_token: string;
  drill_id: string;
  expires_in: number;
};

export async function uploadTrialResponse(form: FormData) {
  return apiPostForm<TrialUploadResponse>(
    "/api/trial/upload",
    form,
  );
}

export async function captureTrial(
  payload: Record<string, unknown>,
) {
  return apiPost<TrialCaptureResponse>(
    "/api/trial/capture",
    payload,
  );
}

export async function analyzeTrial(
  payload: Record<string, unknown>,
) {
  return apiPost<Record<string, unknown>>(
    "/api/trial/analyze",
    payload,
  );
}

export async function uploadPaidResponse(form: FormData) {
  return apiPostForm<{ drill_id: string }>(
    "/api/paid/upload",
    form,
  );
}

export async function analyzePaidResponse(
  payload: Record<string, unknown>,
) {
  return apiPost<Record<string, unknown>>(
    "/api/paid/analyze",
    payload,
  );
}

export async function getPaidSession() {
  return apiPost<Record<string, unknown>>(
    "/api/paid/session",
  );
}

export async function getPaidStats() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/stats",
  );
}

export async function getPaidLimits() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/limits",
  );
}

export async function getPaidReps() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/reps",
  );
}

export async function getLatestAnalysis() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/reps/latest-analysis",
  );
}
