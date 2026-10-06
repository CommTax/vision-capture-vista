import {
  apiGet,
  apiPost,
  apiPostForm,
} from "./backend";

export type TrialUploadResponse = {
  drill_id: string;
};

export type TrialCaptureResponse = {
  user_id: string;
  session_token: string;
  drill_id: string;
  expires_in: number;
};

export async function uploadTrialResponse(
  form: FormData,
): Promise<TrialUploadResponse> {
  return apiPostForm<TrialUploadResponse>(
    "/api/trial/upload",
    form,
  );
}

export async function captureTrial(payload: {
  email: string;
  name?: string;
  drill_id: string;
  mode: string;
  question_slot: number;
  question_type: string;
  question_prompt: string;
}): Promise<TrialCaptureResponse> {
  return apiPost<TrialCaptureResponse>(
    "/api/trial/capture",
    payload,
  );
}

export async function analyzeTrial(payload: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>(
    "/api/trial/analyze",
    payload,
  );
}

export async function uploadPaidResponse(
  form: FormData,
) {
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

export async function getPaidQuestions() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/questions",
  );
}

export async function getPaidScenarios() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/scenarios",
  );
}

export async function getNextQuestion() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/questions/next",
  );
}

export async function savePaidProfile(
  payload: Record<string, unknown>,
) {
  return apiPost<Record<string, unknown>>(
    "/api/paid/profile",
    payload,
  );
}

export async function saveReflection(
  payload: Record<string, unknown>,
) {
  return apiPost<Record<string, unknown>>(
    "/api/paid/reflect",
    payload,
  );
}

export async function getReflections() {
  return apiGet<Record<string, unknown>>(
    "/api/paid/reflections",
  );
}
