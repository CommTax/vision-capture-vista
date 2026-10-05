import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createRazorpayOrder, createRazorpaySubscription, getPaymentsStatus, verifyRazorpayPayment, verifyRazorpaySubscription } from "@/lib/payments.functions";
import type { PlanKey } from "@/lib/prices";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } } }

function loadCheckout() {
  return new Promise<void>((ok, fail) => {
    if (window.Razorpay) return ok();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => ok(); s.onerror = () => fail(new Error("Could not load checkout"));
    document.body.appendChild(s);
  });
}

/** Pay button. Shows "Payments coming soon" until Razorpay keys are added. */
export function PayButton({ plan, label, goal, goalText, onPaid, beforePay, recurring, prefill }: { plan: PlanKey; label: string; goal?: string; goalText?: string; onPaid: () => void; beforePay?: () => boolean; recurring?: boolean; prefill?: { name?: string; email?: string; contact?: string } }) {
  const status = useQuery({ queryKey: ["payments-status"], queryFn: () => getPaymentsStatus(), staleTime: 60_000 });
  const create = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  const createSub = useServerFn(createRazorpaySubscription);
  const verifySub = useServerFn(verifyRazorpaySubscription);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!status.data?.live) return <button className="btn btn-ghost mt-3 w-full" disabled>Payments coming soon</button>;
  const pay = async () => {
    if (beforePay && !beforePay()) return;
    setBusy(true); setErr("");
    try {
      await loadCheckout();
      const done = async (fn: () => Promise<unknown>) => {
        try { await fn(); const { syncNow } = await import("@/lib/cloud-sync"); await syncNow(); onPaid(); }
        catch (e) { setErr((e as Error).message); setBusy(false); }
      };
      type R = { razorpay_order_id?: string; razorpay_subscription_id?: string; razorpay_payment_id: string; razorpay_signature: string };
      const base = { currency: "INR", name: "TheUnspoken", prefill: prefill ?? {}, theme: { color: "#F3A34A" } };
      const opts = recurring
        ? await createSub().then((o) => ({ ...base, key: o.keyId, subscription_id: o.subscriptionId, description: o.label,
            handler: (r: R) => done(() => verifySub({ data: { subscription_id: r.razorpay_subscription_id!, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature } })) }))
        : await create({ data: { plan, goal, goal_text: goalText } }).then((o) => ({ ...base, key: o.keyId, order_id: o.orderId, amount: o.amount, description: o.label,
            prefill: { email: o.email, ...prefill },
            handler: (r: R) => done(() => verify({ data: { order_id: r.razorpay_order_id!, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature } })) }));
      new window.Razorpay!({
        ...opts,
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <>
      <button className="btn btn-primary mt-3 w-full" disabled={busy} onClick={pay}>{busy ? "Opening payment…" : label}</button>
      {err && <p className="mt-2 text-[13px] text-destructive">{err}</p>}
    </>
  );
}
