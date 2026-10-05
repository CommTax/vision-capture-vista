// Backend content + share-reward plumbing. Everything here is gated by app_settings switches
// (backend_content, share_rewards) which start OFF — the app keeps using local content until enabled.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    } },
  });
}

export type ShareRewardsConfig = {
  enabled: boolean; instagram_handle: string; tag_discount_pct: number; follow_discount_pct: number;
  referrer_discount_pct: number; friend_discount_pct: number; max_discount_pct: number;
};

/** Public: which switches are on, plus share-reward settings. */
export const getGrowthSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient().from("app_settings").select("key, enabled, value");
    const row = (k: string) => data?.find((r) => r.key === k);
    const sr = row("share_rewards");
    return {
      backendContent: !!row("backend_content")?.enabled,
      shareRewards: { enabled: !!sr?.enabled, ...(sr?.value as object ?? {}) } as ShareRewardsConfig,
    };
  } catch { return { backendContent: false, shareRewards: { enabled: false } as ShareRewardsConfig }; }
});

/** Public: all content from the database, or null while the backend_content switch is off. */
export const getBackendContent = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data: flag } = await sb.from("app_settings").select("enabled").eq("key", "backend_content").maybeSingle();
  if (!flag?.enabled) return null;
  const [q, m, p, d, b] = await Promise.all([
    sb.from("content_questions").select("data").order("sort"),
    sb.from("content_modes").select("data").order("sort"),
    sb.from("content_patterns").select("id, data"),
    sb.from("content_drills").select("data").order("sort"),
    sb.from("content_blocks").select("key, data"),
  ]);
  return JSON.stringify({
    questions: q.data?.map((r) => r.data) ?? [],
    modes: m.data?.map((r) => r.data) ?? [],
    patterns: Object.fromEntries(p.data?.map((r) => [r.id, r.data]) ?? []),
    drills: d.data?.map((r) => r.data) ?? [],
    blocks: Object.fromEntries(b.data?.map((r) => [r.key, r.data]) ?? []),
  });
});

/** Signed-in: the user's invite code (created on first call) and reward claims. */
export const getMyRewards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let { data: rc } = await supabase.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
    if (!rc) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const code = "UNS-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      await supabaseAdmin.from("referral_codes").insert({ user_id: userId, code });
      rc = { code };
    }
    const [{ data: rewards }, { data: refs }] = await Promise.all([
      supabase.from("share_rewards").select("kind, status, discount_code, discount_pct"),
      supabase.from("referral_redemptions").select("status").eq("referrer_id", userId),
    ]);
    return { code: rc.code, rewards: rewards ?? [], friends: refs?.length ?? 0 };
  });

/** Signed-in: claim the tag or follow reward. You review it, then send the code on Instagram. */
export const claimShareReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    kind: z.enum(["tag", "follow"]),
    instagram_handle: z.string().trim().min(1).max(60),
    post_url: z.string().trim().url().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("share_rewards").insert({ user_id: context.userId, ...data });
    if (error && !error.message.includes("duplicate")) throw new Error("Could not save your claim");
    return { ok: true };
  });
