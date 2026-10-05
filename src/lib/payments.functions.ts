// Razorpay checkout. Payments switch on automatically once RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_KEYS, PRICES } from "./prices";

/** Public: whether payments are live, plus the publishable key id for checkout. */
export const getPaymentsStatus = createServerFn({ method: "GET" }).handler(async () => {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const live = !!keyId && !!process.env["RAZORPAY_KEY_SECRET"];
  return { live, keyId: live ? keyId! : null };
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ plan: z.enum(PLAN_KEYS), goal: z.string().max(40).optional(), goal_text: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"]; const secret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !secret) throw new Error("Payments aren't switched on yet.");
    const price = PRICES[data.plan];
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${keyId}:${secret}`) },
      body: JSON.stringify({ amount: price.amount_paise, currency: "INR", receipt: `u${Date.now()}`, notes: { user_id: context.userId, plan: data.plan } }),
    });
    if (!res.ok) { console.error("razorpay order", res.status, await res.text()); throw new Error("Could not start payment. Please try again."); }
    const order = (await res.json()) as { id: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payment_orders").insert({ user_id: context.userId, product: price.product, plan: data.plan, amount_paise: price.amount_paise, razorpay_order_id: order.id, meta: { goal: data.goal, goal_text: data.goal_text } });
    const email = String((context.claims as { email?: string }).email ?? "");
    return { orderId: order.id, keyId, amount: price.amount_paise, label: price.label, email };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ order_id: z.string().max(60), payment_id: z.string().max(60), signature: z.string().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const secret = process.env["RAZORPAY_KEY_SECRET"];
    if (!secret) throw new Error("Payments aren't switched on yet.");
    const { hmac, safeEqualHex, fulfilOrder } = await import("./payments.server");
    if (!safeEqualHex(hmac(secret, `${data.order_id}|${data.payment_id}`), data.signature)) throw new Error("Payment could not be verified.");
    const { data: own } = await context.supabase.from("payment_orders").select("id").eq("razorpay_order_id", data.order_id).maybeSingle();
    if (!own) throw new Error("Order not found.");
    return fulfilOrder(data.order_id, data.payment_id);
  });
