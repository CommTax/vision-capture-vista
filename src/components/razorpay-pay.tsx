import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createRazorpayOrder, getPaymentsStatus, verifyRazorpayPayment } from "@/lib/payments.functions";
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
export function PayButton({ plan, label, goal, goalText, onPaid, beforePay }: { plan: PlanKey; label: string; goal?: string; goalText?: string; onPaid: () => void; beforePay?: () => boolean }) {
  const status = useQuery({ queryKey: ["payments-status"], queryFn: () => getPaymentsStatus(), staleTime: 60_000 });
  const create = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!status.data?.live) return <button className="btn btn-ghost mt-3 w-full" disabled>Payments coming soon</button>;
  const pay = async () => {
    if (beforePay && !beforePay()) return;
    setBusy(true); setErr("");
    try {
      await loadCheckout();
      const o = await create({ data: { plan, goal, goal_text: goalText } });
      new window.Razorpay!({
        key: o.keyId, order_id: o.orderId, amount: o.amount, currency: "INR", name: "TheUnspoken", description: o.label,
        prefill: { email: o.email }, theme: { color: "#F3A34A" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verify({ data: { order_id: r.razorpay_order_id, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature } });
            const { syncNow } = await import("@/lib/cloud-sync"); await syncNow();
            onPaid();
          } catch (e) { setErr((e as Error).message); }
        },
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
