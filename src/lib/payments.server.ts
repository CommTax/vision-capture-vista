import { createHmac, timingSafeEqual } from "crypto";
import { PRICES, type PlanKey } from "./prices";

export function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export const hmac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("hex");

/** Marks an order paid and writes the PAID entitlement. Safe to call twice for the same order. */
export async function fulfilOrder(orderId: string, paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin.from("payment_orders").select("*").eq("razorpay_order_id", orderId).maybeSingle();
  if (!order) return { ok: false as const };
  if (order.status === "paid") return { ok: true as const, product: order.product };
  const price = PRICES[order.plan as PlanKey];
  const meta = (order.meta ?? {}) as { goal?: string; goal_text?: string };
  const now = new Date();
  const end = new Date(now.getTime() + price.days * 86400000);
  const sprintDur = order.plan.replace("sprint-", "");
  const ent = {
    user_id: order.user_id, product_type: price.product, plan_type: price.product === "practice" ? "practice" : order.plan,
    billing_frequency: price.product === "practice" ? "monthly" : null, status: "active",
    started_at: now.toISOString(), trial_started_at: null, trial_ends_at: null, expires_at: end.toISOString(), cancelled_at: null,
    ...(price.product === "sprint" ? { sprint: { duration: sprintDur, goal: meta.goal ?? "interview", goal_text: meta.goal_text, start_date: now.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10), status: "active" } } : {}),
  };
  await supabaseAdmin.from("payment_orders").update({ status: "paid", razorpay_payment_id: paymentId }).eq("id", order.id);
  await supabaseAdmin.from("entitlements").upsert({ user_id: order.user_id, state: price.product === "practice" ? "PRACTICE_PAID" : "SPRINT_PAID", data: ent as never, updated_at: now.toISOString() });
  return { ok: true as const, product: price.product };
}

/** Monthly renewal of a Practice Pass subscription: extends access by 30 days once per payment. */
export async function renewSubscription(subId: string, paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin.from("payment_orders").select("*").eq("razorpay_order_id", subId).maybeSingle();
  if (!order) return;
  if (order.status !== "paid") { await fulfilOrder(subId, paymentId); return; }
  const meta = (order.meta ?? {}) as { payments?: string[] };
  const seen = [order.razorpay_payment_id, ...(meta.payments ?? [])];
  if (seen.includes(paymentId)) return;
  const { data: e } = await supabaseAdmin.from("entitlements").select("data").eq("user_id", order.user_id).maybeSingle();
  const ent = (e?.data ?? {}) as Record<string, unknown>;
  const from = Math.max(Date.now(), new Date(String(ent["expires_at"] ?? 0)).getTime() || 0);
  const next = { ...ent, status: "active", expires_at: new Date(from + 30 * 86400000).toISOString() };
  await supabaseAdmin.from("entitlements").upsert({ user_id: order.user_id, state: "PRACTICE_PAID", data: next as never, updated_at: new Date().toISOString() });
  await supabaseAdmin.from("payment_orders").update({ meta: { ...meta, payments: [...(meta.payments ?? []), paymentId] } as never }).eq("id", order.id);
}
