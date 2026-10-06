import { apiGet, apiPost } from "./backend";

const SESSION_KEY = "unspoken-session-token";

export type AuthSession = {
  user_id: string;
  session_token: string;
  is_paid?: boolean;
  plan?: string;
  expires_in?: number;
};

export type BackendUserSession = {
  user_id: string;
  email?: string;
  name?: string;
  is_paid?: boolean;
  plan?: string;
  [key: string]: unknown;
};

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string) {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_KEY);
}

export async function requestOtp(email: string) {
  return apiPost<{
    status: string;
    expires_in: number;
  }>("/api/auth/request-otp", {
    email: email.trim().toLowerCase(),
  });
}

export async function verifyOtp(email: string, otp: string) {
  const result = await apiPost<AuthSession>("/api/auth/verify-otp", {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
  });

  if (!result.session_token) {
    throw new Error("The server did not return a session token.");
  }

  setSessionToken(result.session_token);

  return result;
}

export async function getBackendSession() {
  const token = getSessionToken();

  if (!token) return null;

  try {
    return await apiGet<BackendUserSession>("/api/auth/session");
  } catch {
    clearSessionToken();
    return null;
  }
}

export function logoutBackend() {
  clearSessionToken();
}
