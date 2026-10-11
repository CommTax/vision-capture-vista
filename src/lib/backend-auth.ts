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

/* ─────────────────────────────────────────────────────────────
   Token storage — hardened.
   A valid JWT is ~150–800 chars. Anything shorter is definitely
   not a real token, and the strings "undefined"/"null" are the
   classic silent-poison values that turn into
   `Authorization: Bearer undefined` and then into 401/403.
   ───────────────────────────────────────────────────────────── */
const MIN_TOKEN_LENGTH = 20;

function isPlausibleToken(t: unknown): t is string {
  if (typeof t !== "string") return false;
  if (t.length < MIN_TOKEN_LENGTH) return false;
  if (t === "undefined" || t === "null") return false;
  return true;
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(SESSION_KEY);
  if (!t) return null;
  // Self-heal: if we ever find garbage, remove it on read so the
  // rest of the app sees a clean "no session" state instead of
  // sending `Bearer undefined` on the next request.
  if (!isPlausibleToken(t)) {
    console.warn(
      "[backend-auth] discarding invalid stored token:",
      JSON.stringify(t),
    );
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
  return t;
}

export function setSessionToken(token: string | null | undefined) {
  if (typeof window === "undefined") return;
  if (!isPlausibleToken(token)) {
    console.error(
      "[backend-auth] refusing to store invalid session token:",
      JSON.stringify(token),
    );
    // Do NOT write garbage — leave whatever was there before.
    return;
  }
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

/* ─────────────────────────────────────────────────────────────
   Plan hint — cached entitlement from the last verify-otp.
   The server is still authoritative; this is only used as an
   immediate fallback while /api/auth/session is cold-starting.
   ───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   Paid flow — OTP sign in
   ───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   Session read — hardened against accidental logouts.

   Only clear the token when the server EXPLICITLY says the
   session is bad. Network errors, 5xx, Render cold-starts, and
   unrelated 401s must NOT wipe a good session — that's how a
   paying user gets logged out mid-flight.
   ───────────────────────────────────────────────────────────── */
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
    const message = err instanceof Error ? err.message : String(err);

    // Narrow the pattern drastically. Match only messages that
    // clearly indicate the SESSION ITSELF is invalid. Do not match
    // bare "401"/"403" — those can come from unrelated endpoints
    // (rate limits, missing params, feature gates) and must not
    // log the user out.
    const isExplicitAuthFailure =
      /invalid session|session expired|token expired|invalid token|unauthorized session/i.test(
        message,
      );

    if (isExplicitAuthFailure) {
      console.warn(
        "[backend-auth] server rejected session, clearing token:",
        message,
      );
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

/* ─────────────────────────────────────────────────────────────
   Sign out — wipes everything for the current browser.
   ───────────────────────────────────────────────────────────── */
export function logoutBackend() {
  clearSessionToken();
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("unspoken-state-v1");
      localStorage.removeItem("unspoken-trial-token");
      localStorage.removeItem("unspoken-free-reflection");
    }
  } catch {
    /* ignore */
  }
}

/* ─────────────────────────────────────────────────────────────
   Free user session — from the free signup form
   (name + email + phone). No OTP.

   Hardened: if `token` is missing/invalid, we throw instead of
   silently writing garbage into localStorage. The caller
   (signup.tsx) should catch this and show an error to the user
   instead of proceeding as if they were signed in.
   ───────────────────────────────────────────────────────────── */
export function setFreeSession(
  token: string | null | undefined,
  contact?: {
    name: string;
    email: string;
    phone: string;
    phone_country_code: string;
  },
) {
  if (!isPlausibleToken(token)) {
    console.error(
      "[backend-auth] setFreeSession called with invalid token:",
      JSON.stringify(token),
    );
    throw new Error(
      "Signup failed: no valid session token returned. Please try again.",
    );
  }

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
