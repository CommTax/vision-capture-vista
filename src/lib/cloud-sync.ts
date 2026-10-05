// Keeps the browser store in step with the signed-in account in Lovable Cloud.
// The account's entitlement always wins over the browser copy (access is decided server-side).
import { supabase } from "@/integrations/supabase/client";
import { claimFreeIdentity, saveContactCloud, startTrialCloud, syncAccount } from "./account.functions";
import { getState, setState, subscribe, type ResponseRecord } from "./store";
import { entitlementState, istDay, type Entitlement, type EntitlementState } from "./entitlements";

let running: Promise<EntitlementState | null> | null = null;
let signedIn = false;
export const isSignedIn = () => signedIn;

function strip(r: ResponseRecord) { const { audio_url: _a, ...rest } = r; return rest; }

export async function syncNow(): Promise<EntitlementState | null> {
  if (running) return running;
  running = (async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { signedIn = false; return null; }
    signedIn = true;
    const s = getState();
    const p = s.profile;
    const raw = await syncAccount({ data: {
      responses: s.responses.map(strip) as never,
      freeIds: s.freeResponseIds ?? [],
      prefs: p ? { goal: p.goal, struggle: p.struggle, experience: p.experience, level: p.level, onboarded: p.onboarded } : undefined,
    } });
    const res = JSON.parse(raw) as { entitlement: unknown; freeAttempts: number; responses: unknown[]; profile: null | { name: string; email: string; phone: string | null; phone_country_code: string | null; marketing_consent: boolean; prefs: Record<string, unknown> } };
    setState((cur) => {
      const byId = new Map(cur.responses.map((r) => [r.id, r]));
      for (const r of res.responses as unknown as ResponseRecord[]) if (!byId.has(r.id)) byId.set(r.id, r);
      const responses = [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
      const prefs = (res.profile?.prefs ?? {}) as Record<string, unknown>;
      const email = res.profile?.email ?? data.session!.user.email ?? "";
      const profile = {
        name: res.profile?.name || cur.profile?.name || email.split("@")[0],
        email,
        phone: res.profile?.phone ?? cur.profile?.phone,
        phone_country_code: res.profile?.phone_country_code ?? cur.profile?.phone_country_code,
        goal: cur.profile?.goal ?? String(prefs.goal ?? ""),
        struggle: cur.profile?.struggle ?? String(prefs.struggle ?? ""),
        experience: cur.profile?.experience ?? String(prefs.experience ?? ""),
        level: cur.profile?.level ?? String(prefs.level ?? "Mid career"),
        onboarded: true,
        plan: cur.profile?.plan ?? "free",
        id: data.session!.user.id,
      } as const;
      const practiceDays = Array.from(new Set([...cur.practiceDays, ...responses.map((r) => r.created_at.slice(0, 10))]));
      return {
        ...cur, profile: { ...profile }, responses, practiceDays,
        entitlement: (res.entitlement as Entitlement | null) ?? undefined,
        freeAttemptsUsed: Math.max(cur.freeDay === istDay() ? cur.freeAttemptsUsed ?? 0 : 0, res.freeAttempts), freeDay: istDay(),
        marketing: cur.marketing ?? (res.profile ? { consent: !!res.profile.marketing_consent, consent_at: null, unsubscribed: false } : undefined),
      };
    });
    return entitlementState(getState());
  })().finally(() => { running = null; });
  return running;
}

/** Free funnel: create/link the person by email right after their first submitted answer. */
export async function claimFree(c: { name: string; email: string; phone: string; phone_country_code: string; marketing_consent: boolean }) {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) { await saveContactCloud({ data: { name: c.name, phone: c.phone, phone_country_code: c.phone_country_code, marketing_consent: c.marketing_consent } }); await syncNow(); return "signed-in"; }
    const r = await claimFreeIdentity({ data: c });
    if (r.status === "created" && r.token_hash) {
      await supabase.auth.verifyOtp({ token_hash: r.token_hash, type: "magiclink" });
      await syncNow();
      return "created";
    }
    return "existing";
  } catch { return "offline"; }
}

export async function pushTrial() {
  const s = getState();
  const e = s.entitlement;
  if (!signedIn || !e || e.status !== "trialing" || e.product_type === "free") return;
  try { await startTrialCloud({ data: { product: e.product_type, entitlement: e as never } }); } catch { /* keep local */ }
}

export async function signOut() {
  await supabase.auth.signOut();
  signedIn = false;
  setState(() => ({ profile: null, responses: [], drillsDone: [], practiceDays: [] }));
}

let started = false;
/** Called once on the client: syncs on sign-in and pushes new answers while signed in. */
export function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  void syncNow();
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") setTimeout(() => void syncNow(), 0);
    if (event === "SIGNED_OUT") signedIn = false;
  });
  let count = getState().responses.length;
  let t: ReturnType<typeof setTimeout> | undefined;
  subscribe(() => {
    const n = getState().responses.length;
    if (n === count || !signedIn) { count = n; return; }
    count = n;
    clearTimeout(t);
    t = setTimeout(() => void syncNow(), 800);
  });
}
