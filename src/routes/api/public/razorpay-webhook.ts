import { createFileRoute } from "@tanstack/react-router";

// Razorpay → "payment.captured" / "order.paid". Signature checked over the raw body before anything runs.
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        const body = await request.text();
        const sig = request.headers.get("x-razorpay-signature") ?? "";
        const { hmac, safeEqualHex, fulfilOrder, renewSubscription } = await import("@/lib/payments.server");
        if (!safeEqualHex(hmac(secret, body), sig)) return new Response("Invalid signature", { status: 401 });
        let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } }; subscription?: { entity?: { id?: string } } } };
        try { evt = JSON.parse(body); } catch { return new Response("Bad body", { status: 400 }); }
        const p = evt.payload?.payment?.entity;
        if ((evt.event === "payment.captured" || evt.event === "order.paid") && p?.id && p.order_id) await fulfilOrder(p.order_id, p.id);
        const sub = evt.payload?.subscription?.entity;
        if (evt.event === "subscription.charged" && sub?.id && p?.id) await renewSubscription(sub.id, p.id);
        return new Response("ok");
      },
    },
  },
});
