import { apiGet, apiPost } from "./backend";
import { clearUserState, getState } from "./store";
import { saveContact } from "./entitlements";

const SESSION_KEY = "unspoken-session-token";
const PLAN_HINT_KEY = "unspoken-plan-hint";

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

export type PlanHint = {
  is_paid: boolean;
  plan: string | null;
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
  try {
    localStorage.removeItem(PLAN_HINT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Cached entitlement hint from the last successful verify-otp.
 * The server is still authoritative — this is only used as an immediate
 * fallback while /api/auth/session is cold-starting or slow.
 */
export function setPlanHint(hint: PlanHint) {
  try {
    localStorage.setItem(PLAN_HINT_KEY, JSON.stringify(hint));
  } catch {
    /* ignore */
  }
}

export function getPlanHint(): PlanHint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlanHint>;
    return {
      is_paid: Boolean(parsed.is_paid),
      plan: typeof parsed.plan === "string" ? parsed.plan : null,
    };
  } catch {
    return null;
  }
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

  // Clear any previous user's local state before writing the new
  // session — important on shared browsers.
  clearUserState();

  setSessionToken(result.session_token);

  // Cache entitlement so the UI has an immediate value while
  // /api/auth/session is still in flight (or Render is cold-starting).
  setPlanHint({
    is_paid: Boolean(result.is_paid),
    plan: result.plan ?? null,
  });

  return result;
}

export async function getBackendSession() {
  const token = getSessionToken();

  if (!token) return null;

  try {
    const session = await apiGet<BackendUserSession>("/api/auth/session");

    // Refresh the plan hint whenever the server confirms it.
    if (typeof session.is_paid === "boolean") {
      setPlanHint({
        is_paid: session.is_paid,
        plan: session.plan ?? null,
      });
    }

    return session;
  } catch (err) {
    // Only clear the token when the server explicitly rejects it.
    // Do NOT clear on network errors, 5xx, or Render cold-starts.
    const message = err instanceof Error ? err.message : String(err);
    const isAuthFailure = /401|403|invalid|expired|unauthor/i.test(message);

    if (isAuthFailure) {
      clearSessionToken();
    } else {
      console.warn(
        "[backend-auth] session fetch failed, keeping token:",
        message,
      );
    }

    return null;
  }
}

export function logoutBackend() {
  clearSessionToken();
  try {
    // Also wipe any local user state so the next person on this
    // browser doesn't see the previous user's profile or responses.
    if (typeof window !== "undefined") {
      localStorage.removeItem("unspoken-state-v1");
      localStorage.removeItem("unspoken-trial-token");
      localStorage.removeItem("unspoken-free-reflection");
    }
  } catch {
    /* ignore */
  }
}

/**
 * Store a free-user session. Same slot as a paid session — the token
 * identifies the user; the plan on the server decides their cap.
 *
 * If contact info is provided AND differs from what's already in the
 * store, we re-save it. Same-contact no-ops are skipped so we don't
 * churn the store on repeated `Edit → Continue` cycles.
 */
export function setFreeSession(
  token: string,
  contact?: {
    name: string;
    email: string;
    phone: string;
    phone_country_code: string;
  },
) {
  const previous = getState().profile;

  // Are we looking at the same user? Compare by email (case-insensitive).
  const isSameUser =
    !!previous?.email &&
    !!contact?.email &&
    previous.email.toLowerCase() === contact.email.toLowerCase();

  if (!isSameUser) {
    // New user (or unknown identity) → wipe and set up fresh.
    clearUserState();
    setSessionToken(token);
    setPlanHint({ is_paid: false, plan: "free" });

    if (contact) {
      saveContact(contact);
    }
    return;
  }

  // Same user — refresh the token/hint. Only re-save the contact if a
  // field actually changed, so `Edit → Continue` without changes is a
  // no-op on the store.
  setSessionToken(token);
  setPlanHint({ is_paid: false, plan: "free" });

  if (contact) {
    const nameChanged = (previous?.name ?? "") !== contact.name;
    const phoneChanged = (previous?.phone ?? "") !== contact.phone;
    const codeChanged =
      (previous?.phone_country_code ?? "") !== contact.phone_country_code;

    if (nameChanged || phoneChanged || codeChanged) {
      saveContact(contact);
    }
  }
}
