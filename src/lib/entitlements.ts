// Product entitlements: one practice system, three access layers (Free, Practice, Sprint).
// Identity (profile), entitlement and marketing consent are stored separately.
// Paid status is never set from the client — the backend's plan hint is the source of truth.
import type { Dimension } from "./data";
import { getState, setState, today, useStore, type State } from "./store";

export const PLAN_CONFIG = {
  /** Free: this many submitted answers per day (India time); resets at midnight IST. */
  free: { attempts: 5 },
  practice: {
    trialDays: 3,
    billing: ["monthly"] as const,
    monthlyPrice: "₹3,999/mo",
    /** Configure when annual pricing is decided. null = not configured, no % shown. */
    annualDiscountPct: null as number | null,
  },
  sprint: {
    trialDays: 3,
    durations: [
      { id: "14d", label: "14 days", days: 14, trial: true, price: "₹1,499" },
    ],
    price: "₹1,499",
  },
};

export type SprintDurationId = (typeof PLAN_CONFIG.sprint.durations)[number]["id"];
export type SprintGoal = { id: string; label: string; goal: string; focus: Dimension[] };

export const SPRINT_GOALS: SprintGoal[] = [
  { id: "interview", label: "Interview preparation", goal: "Communicate clearly and confidently in senior-level interviews.", focus: ["structure", "conciseness", "impact", "confidence"] },
  { id: "executive", label: "Executive communication", goal: "Lead with the decision and keep senior listeners with you.", focus: ["conciseness", "clarity", "impact", "structure"] },
  { id: "presentation", label: "Presentation preparation", goal: "Deliver a presentation people follow and remember.", focus: ["structure", "clarity", "delivery", "impact"] },
  { id: "leadership", label: "Leadership communication", goal: "Set direction in a way people understand and act on.", focus: ["clarity", "confidence", "memorability", "structure"] },
  { id: "high-stakes", label: "High-stakes conversations", goal: "Stay clear and steady when the conversation matters.", focus: ["confidence", "clarity", "relevance", "conciseness"] },
  { id: "persuasion", label: "Persuasion", goal: "Make a case people agree with.", focus: ["impact", "relevance", "confidence", "structure"] },
  { id: "custom", label: "Custom goal", goal: "Your own communication goal.", focus: ["structure", "clarity", "conciseness", "impact"] },
];

export type EntitlementState = "FREE" | "PRACTICE_TRIAL" | "PRACTICE_PAID" | "SPRINT_TRIAL" | "SPRINT_PAID";

export type Entitlement = {
  user_id: string;
  product_type: "free" | "practice" | "sprint";
  plan_type: string;
  billing_frequency: "monthly" | "annual" | null;
  status: "active" | "trialing" | "expired" | "cancelled";
  started_at: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  sprint?: { duration: SprintDurationId; goal: string; goal_text?: string; start_date: string; end_date: string; status: "active" | "completed" | "expired" };
};

export type Lead = { name: string; email: string; phone: string; captured_at: string };
export type Marketing = { consent: boolean; consent_at: string | null; unsubscribed: boolean };
export type Interest = { product: "practice" | "sprint"; plan: string; at: string };

const userId = (s: State) => s.profile?.email || "local-user";

/** Current entitlement after expiry checks. Lapsed trials fall back to FREE. */
export function currentEntitlement(s: State): Entitlement | null {
  const e = s.entitlement;
  if (!e) return null;
  const now = Date.now();
  if (e.status === "trialing" && e.trial_ends_at && Date.parse(e.trial_ends_at) < now) return { ...e, status: "expired" };
  if (e.expires_at && Date.parse(e.expires_at) < now) return { ...e, status: "expired" };
  return e;
}

// ───────────────────────────────────────────────────────────────
// Backend plan hint
//
// `backend-auth.ts` caches `{ is_paid, plan }` in localStorage after
// a successful OTP login and refreshes it every time /api/auth/session
// returns. It is a *hint*, not the source of truth — the backend is.
// But it lets the UI know a user is paid even before session fetch
// resolves, and it survives a page reload.
// ───────────────────────────────────────────────────────────────

type PlanHint = { is_paid: boolean; plan: string | null };

function readPlanHint(): PlanHint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("unspoken-plan-hint");
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

/**
 * Maps the backend's `plan` string to a local EntitlementState.
 * Returns null when there is no usable hint.
 */
export function backendEntitlementState(): EntitlementState | null {
  // If there's no live session token, the plan hint is meaningless —
  // it's a cache of a paid login that no longer applies. This stops a
  // stale `is_paid: true` from routing anonymous users into the paid flow.
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("unspoken-session-token");
    if (!token) return null;
  }

  const hint = readPlanHint();
  if (!hint) return null;

  const plan = (hint.plan ?? "").toLowerCase();

  if (hint.is_paid) {
    if (plan.includes("sprint")) return "SPRINT_PAID";
    if (plan.includes("practice") || plan.includes("pass")) return "PRACTICE_PAID";
    // is_paid true but unknown plan — treat as practice to unlock features.
    return "PRACTICE_PAID";
  }

  // Not paid: could still be a local trial (see entitlementState below).
  return null;
}

/** Public helper — useful for pages that need the raw backend plan name. */
export function getBackendPlan(): string | null {
  const hint = readPlanHint();
  return hint?.plan ?? null;
}

/**
 * The current entitlement state.
 *
 * Priority:
 *   1. Backend plan hint (is_paid + plan) — the authoritative paid signal.
 *   2. Local entitlement record — used for trial windows and offline demo.
 *   3. FREE.
 */
export function entitlementState(s: State): EntitlementState {
  // 1. Backend paid status wins.
  const backend = backendEntitlementState();
  if (backend) return backend;

  // 2. Local entitlement (trials, offline demo, dev).
  const e = currentEntitlement(s);
  if (!e || e.status === "expired" || e.status === "cancelled" || e.product_type === "free") {
    return "FREE";
  }
  const paid = e.status === "active";
  if (e.product_type === "practice") return paid ? "PRACTICE_PAID" : "PRACTICE_TRIAL";
  return paid ? "SPRINT_PAID" : "SPRINT_TRIAL";
}

export const isFree = (s: State) => entitlementState(s) === "FREE";

/** Today's date in India time (YYYY-MM-DD) — the free limit resets at IST midnight. */
export const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
export const freeUsed = (s: State) => (s.freeDay === istDay() ? s.freeAttemptsUsed ?? 0 : 0);
export const freeRemaining = (s: State) => Math.max(0, PLAN_CONFIG.free.attempts - freeUsed(s));
export const canSubmit = (s: State) => !isFree(s) || freeRemaining(s) > 0;

export type Feature = "unlimited" | "history" | "skills" | "progress" | "drills" | "coaching" | "custom" | "compare" | "sprint";
export function hasFeature(s: State, f: Feature) {
  const st = entitlementState(s);
  if (st === "FREE") return false;
  if (f === "sprint") return st.startsWith("SPRINT");
  return true;
}

export function useEntitlement() {
  const state = useStore((s) => s);
  return {
    state: entitlementState(state),
    ent: currentEntitlement(state),
    free: isFree(state),
    remaining: freeRemaining(state),
    canSubmit: canSubmit(state),
    has: (f: Feature) => hasFeature(state, f),
  };
}

/** Called after a submitted response is analyzed. Only submissions count. */
export function recordSubmission() {
  setState((s) => (isFree(s) ? { ...s, freeAttemptsUsed: freeUsed(s) + 1, freeDay: istDay() } : s));
}

const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };

export function startPracticeTrial(billing: "monthly" | "annual") {
  const now = new Date().toISOString();
  setState((s) => ({ ...s, entitlement: {
    user_id: userId(s), product_type: "practice", plan_type: "practice", billing_frequency: billing, status: "trialing",
    started_at: now, trial_started_at: now, trial_ends_at: addDays(PLAN_CONFIG.practice.trialDays), expires_at: null, cancelled_at: null,
  } }));
  // TODO: POST /api/checkout/create-order → start a real trial on the backend.
  // Legacy `cloud-sync.pushTrial()` call removed during the Render migration.
}

export function sprintDuration(id: SprintDurationId) { return PLAN_CONFIG.sprint.durations.find((d) => d.id === id)!; }

export function startSprintTrial(goalId: string, duration: SprintDurationId, goalText?: string) {
  const d = sprintDuration(duration);
  if (!d.trial) throw new Error("This Sprint has no trial");
  const now = new Date().toISOString();
  setState((s) => ({ ...s, entitlement: {
    user_id: userId(s), product_type: "sprint", plan_type: `sprint-${duration}`, billing_frequency: null, status: "trialing",
    started_at: now, trial_started_at: now, trial_ends_at: addDays(PLAN_CONFIG.sprint.trialDays), expires_at: null, cancelled_at: null,
    sprint: { duration, goal: goalId, goal_text: goalText, start_date: today(), end_date: addDays(d.days).slice(0, 10), status: "active" },
  } }));
  // TODO: POST /api/checkout/create-order → start a real sprint on the backend.
  // Legacy `cloud-sync.pushTrial()` call removed during the Render migration.
}

export function cancelEntitlement() {
  setState((s) => (s.entitlement ? { ...s, entitlement: { ...s.entitlement, status: "cancelled", cancelled_at: new Date().toISOString() } } : s));
}

/** Records interest in a paid plan. Never grants access. */
export function registerInterest(product: Interest["product"], plan: string) {
  setState((s) => ({ ...s, interests: [...(s.interests ?? []), { product, plan, at: new Date().toISOString() }] }));
}

/** Saves contact details onto the user's profile (single source of truth) and records the lead. */
export function saveContact(c: { name: string; email: string; phone_country_code: string; phone: string }, marketingConsent?: boolean) {
  const at = new Date().toISOString();
  setState((s) => ({
    ...s,
    lead: { name: c.name, email: c.email, phone: `${c.phone_country_code} ${c.phone}`, captured_at: s.lead?.captured_at ?? at },
    marketing: marketingConsent === undefined ? s.marketing : { consent: marketingConsent, consent_at: marketingConsent ? at : null, unsubscribed: false },
    profile: s.profile
      ? { ...s.profile, name: c.name, email: c.email, phone: c.phone, phone_country_code: c.phone_country_code, id: s.profile.id ?? uidOf(c.email), created_at: s.profile.created_at ?? at, updated_at: at }
      : { id: uidOf(c.email), name: c.name, email: c.email, phone: c.phone, phone_country_code: c.phone_country_code, created_at: at, updated_at: at, goal: "", struggle: "", experience: "", level: "Mid career", onboarded: true, plan: "free" },
  }));
}
const uidOf = (email: string) => `u_${email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24)}`;

export function setMarketingConsent(consent: boolean) {
  const at = new Date().toISOString();
  setState((s) => ({ ...s, marketing: { consent, consent_at: consent ? at : s.marketing?.consent_at ?? null, unsubscribed: !consent } }));
}

/** True when the profile already holds name, email and phone. */
export const hasLead = () => { const p = getState().profile; return !!(p?.name && p.email && p.phone && p.phone_country_code); };

export const STATE_LABEL: Record<EntitlementState, string> = {
  FREE: "Free", PRACTICE_TRIAL: "Practice · trial", PRACTICE_PAID: "Practice", SPRINT_TRIAL: "Sprint · trial", SPRINT_PAID: "Sprint",
};
