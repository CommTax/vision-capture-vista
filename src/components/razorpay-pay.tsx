import { useState } from "react";
import { createCheckoutOrder, verifyPayment } from "@/lib/backend-api";
import { setSessionToken, setPlanHint } from "@/lib/backend-auth";

declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckout() {
  return new Promise<void>((ok, fail) => {
    if (window.Razorpay) return ok();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => ok();
    s.onerror = () => fail(new Error("Could not load Razorpay checkout"));
    document.body.appendChild(s);
  });
}

type PayArgs = {
  /** "pass" → Practice Pass (monthly recurring). "sprint" → one-off Sprint. */
  plan: "pass" | "sprint";
  /** Sprint variant, e.g. "interview" | "gd". Ignored for pass. */
  sprint?: string;
  /** Sprint length bucket, e.g. "7d" | "14d" | "3m". Ignored for pass. */
  duration?: string;
  email: string;
  name?: string;
  phone?: string;
  billing?: "monthly" | "annual";
  /** Copy for the button. */
  label: string;
  /** Where to navigate after a successful payment. */
  onPaid: (info: { plan: string }) => void;
  /** Optional preflight — return false to abort payment. */
  beforePay?: () => boolean;
};

export function PayButton({
  plan,
  sprint,
  duration,
  email,
  name,
  phone,
  billing,
  label,
  onPaid,
  beforePay,
}: PayArgs) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pay = async () => {
    if (beforePay && !beforePay()) return;
    setBusy(true);
    setErr("");

    try {
      await loadCheckout();

      // 1. Create the order on the backend.
      const order = (await createCheckoutOrder({
        email,
        plan,
        sprint: plan === "sprint" ? sprint : undefined,
        name,
        phone,
        billing: plan === "pass" ? (billing ?? "monthly") : undefined,
      })) as {
        order_id?: string;
        orderId?: string;
        key_id?: string;
        keyId?: string;
        amount?: number;
        currency?: string;
        label?: string;
      };

      const orderId = order.order_id ?? order.orderId;
      const keyId = order.key_id ?? order.keyId;

      if (!orderId || !keyId) {
        throw new Error("Payment could not be started. Please try again.");
      }

      // 2. Open the Razorpay modal.
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: keyId,
          order_id: orderId,
          amount: order.amount,
          currency: order.currency ?? "INR",
          name: "TheUnspoken",
          description:
            order.label ?? (plan === "pass" ? "Practice Pass" : "Sprint"),
          prefill: { email, name, contact: phone },
          theme: { color: "#F3A34A" },
          handler: async (r: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 3. Verify on the backend.
              const result = (await verifyPayment({
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_order_id: r.razorpay_order_id,
                razorpay_signature: r.razorpay_signature,
                email,
                plan,
                sprint: plan === "sprint" ? sprint : undefined,
                name,
                phone,
                billing: plan === "pass" ? (billing ?? "monthly") : undefined,
              })) as {
                status?: string;
                session_token?: string;
                is_paid?: boolean;
                plan?: string;
              };

              // 4. Store the returned session so the user is signed in.
              if (result.session_token) {
                setSessionToken(result.session_token);
                setPlanHint({
                  is_paid: true,
                  plan: result.plan ?? (plan === "pass" ? "pass" : "sprint"),
                });
              }

              resolve();
              onPaid({ plan: result.plan ?? plan });
            } catch (e) {
              reject(e);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        });
        rzp.open();
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      if (!/cancelled/i.test(msg)) setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="btn btn-primary mt-3 w-full"
        disabled={busy}
        onClick={pay}
      >
        {busy ? "Opening payment…" : label}
      </button>
      {err && <p className="mt-2 text-[13px] text-destructive">{err}</p>}
    </>
  );
}
