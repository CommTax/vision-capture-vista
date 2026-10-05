import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const contact = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(3).max(30),
  phone_country_code: z.string().trim().regex(/^\+\d{1,4}$/),
  marketing_consent: z.boolean(),
});

/**
 * Free funnel: after a first submitted answer, create the person by email.
 * New emails get a session straight away. Existing emails never get a session here —
 * that would let anyone take over an account by typing its email; they sign in with a code.
 */
export const claimFreeIdentity = createServerFn({ method: "POST" })
  .inputValidator((d) => contact.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("email", data.email).maybeSingle();
    if (existing) return { status: "existing" as const };
    const created = await supabaseAdmin.auth.admin.createUser({ email: data.email, email_confirm: true });
    if (created.error || !created.data.user) return { status: "existing" as const };
    const id = created.data.user.id;
    const now = new Date().toISOString();
    await supabaseAdmin.from("profiles").insert({ id, name: data.name, email: data.email, phone: data.phone, phone_country_code: data.phone_country_code, marketing_consent: data.marketing_consent, consent_at: data.marketing_consent ? now : null });
    await supabaseAdmin.from("entitlements").insert({ user_id: id, state: "FREE", data: null });
    const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: data.email });
    const token_hash = link.data?.properties?.hashed_token;
    if (link.error || !token_hash) return { status: "created" as const, token_hash: null };
    return { status: "created" as const, token_hash };
  });

const recordSchema = z.object({ id: z.string().min(1).max(40), created_at: z.string(), question_id: z.string(), attempt: z.number() }).passthrough();

/** Merge local history into the account and return the server copy (entitlement, profile, responses). */
export const syncAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    responses: z.array(recordSchema).max(500),
    freeIds: z.array(z.string()).max(50),
    prefs: z.record(z.string(), z.unknown()).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const email = String((claims as { email?: string }).email ?? "").toLowerCase();
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!prof && email) await supabase.from("profiles").insert({ id: userId, email, prefs: (data.prefs ?? {}) as never });
    else if (prof && data.prefs) await supabase.from("profiles").update({ prefs: data.prefs as never, updated_at: new Date().toISOString() }).eq("id", userId);
    if (data.responses.length) {
      const rows = data.responses.map((r) => ({ id: r.id, user_id: userId, record: { ...r, audio_url: undefined } as never, created_at: r.created_at }));
      await supabase.from("responses").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
      const free = data.responses.filter((r) => data.freeIds.includes(r.id));
      if (free.length) await supabase.from("free_attempts").upsert(free.map((r) => ({ user_id: userId, scenario_id: r.question_id, attempt_number: r.attempt, submitted_at: r.created_at, response_id: r.id, entitlement_type: "FREE", analysis_id: r.id })), { onConflict: "response_id", ignoreDuplicates: true });
    }
    const [{ data: ent }, { data: rs }, { data: p2 }, { count }] = await Promise.all([
      supabase.from("entitlements").select("state,data").eq("user_id", userId).maybeSingle(),
      supabase.from("responses").select("record").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("name,email,phone,phone_country_code,marketing_consent,prefs").eq("id", userId).maybeSingle(),
      supabase.from("free_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    return {
      entitlement: (ent?.data ?? null) as Record<string, unknown> | null,
      profile: p2 ? { ...p2, prefs: (p2.prefs ?? {}) as Record<string, unknown> } : null,
      responses: (rs ?? []).map((r) => r.record as Record<string, unknown>),
      freeAttempts: count ?? 0,
    };
  });

/** Saves contact details for a signed-in person (same email = same person). */
export const saveContactCloud = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => contact.omit({ email: true }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("profiles").update({ ...data, consent_at: data.marketing_consent ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", context.userId);
    return { ok: true };
  });

/** Starts a configured trial for a signed-in person, once. Paid status is never written here. */
export const startTrialCloud = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ product: z.enum(["practice", "sprint"]), entitlement: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data, context }) => {
    const e = data.entitlement as { status?: string; product_type?: string; trial_ends_at?: string };
    if (e.status !== "trialing" || e.product_type !== data.product || !e.trial_ends_at) throw new Error("Invalid trial");
    if (Date.parse(e.trial_ends_at) > Date.now() + 4 * 86400000) throw new Error("Invalid trial length");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("entitlements").select("state,data").eq("user_id", context.userId).maybeSingle();
    const prev = cur?.data as { trial_started_at?: string | null; product_type?: string } | null;
    if (prev && prev.trial_started_at && prev.product_type === data.product) return { ok: false };
    if (cur && cur.state.endsWith("_PAID")) return { ok: false };
    await supabaseAdmin.from("entitlements").upsert({ user_id: context.userId, state: data.product === "practice" ? "PRACTICE_TRIAL" : "SPRINT_TRIAL", data: { ...data.entitlement, user_id: context.userId } as never, updated_at: new Date().toISOString() });
    return { ok: true };
  });
