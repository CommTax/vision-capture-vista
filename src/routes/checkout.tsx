import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { ContactDetails } from "@/components/contact-details";
import { PayButton } from "@/components/razorpay-pay";
import { PLAN_CONFIG, SPRINT_GOALS, sprintDuration, type SprintDurationId } from "@/lib/entitlements";
import { getState } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import type { PlanKey } from "@/lib/prices";

const SPRINT_OPTIONS: SprintDurationId[] = ["7d", "14d", "3m"];

export const Route = createFileRoute("/checkout")({
  validateSearch: z.object({ product: z.enum(["practice", "sprint"]).catch("sprint"), d: z.enum(["7d", "14d", "3m"]).optional(), goal: z.string().optional() }),
  head: () => ({ meta: [
    { title: "Checkout — TheUnspoken" },
    { name: "description", content: "Pick your Sprint length or Practice Pass and pay securely with Razorpay." },
    { property: "og:title", content: "Checkout — TheUnspoken" },
    { property: "og:description", content: "Secure payment for Sprint and Practice Pass." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <AppShell allowGuest><Checkout /></AppShell>,
});

type Step = "plan" | "details" | "otp" | "pay";

function Checkout() {
  const s = Route.useSearch();
  const navigate = useNavigate();
  const [product, setProduct] = useState(s.product);
  const [dur, setDur] = useState<SprintDurationId>(s.d ?? "14d");
  const [goal, setGoal] = useState(s.goal ?? SPRINT_GOALS[0].id);
  const [goalText, setGoalText] = useState("");
  const [step, setStep] = useState<Step>("plan");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");

  const d = sprintDuration(dur);
  const summary = product === "practice" ? `Practice Pass · ${PLAN_CONFIG.practice.monthlyPrice}, renews monthly` : `Sprint · ${d.label} · ${d.price}`;
  const profile = getState().profile;

  // After details: make sure the person has a signed-in account. New emails get one now; existing emails confirm with a code.
  const afterDetails = async () => {
    const p = getState().profile; if (!p) return;
    setBusy(true); setErr("");
    const { claimFree } = await import("@/lib/cloud-sync");
    const r = await claimFree({ name: p.name, email: p.email, phone: p.phone ?? "", phone_country_code: p.phone_country_code ?? "+91", marketing_consent: false });
    if (r === "existing") {
      const { error } = await supabase.auth.signInWithOtp({ email: p.email, options: { shouldCreateUser: false } });
      setBusy(false);
      if (error) { setErr("We couldn't send your code. Please try again."); return; }
      setStep("otp"); return;
    }
    setBusy(false);
    if (r === "offline") { setErr("We couldn't reach the server. Please try again."); return; }
    setStep("pay");
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    const p = getState().profile; if (!p) return;
    setBusy(true); setErr("");
    const { error } = await supabase.auth.verifyOtp({ email: p.email, token: code.trim(), type: "email" });
    if (error) { setBusy(false); setErr("That code didn't work. Check it and try again."); return; }
    const { claimFree } = await import("@/lib/cloud-sync");
    await claimFree({ name: p.name, email: p.email, phone: p.phone ?? "", phone_country_code: p.phone_country_code ?? "+91", marketing_consent: false });
    setBusy(false); setStep("pay");
  };

  const steps: Step[] = ["plan", "details", "pay"];
  const at = steps.indexOf(step === "otp" ? "details" : step);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-muted-foreground">
        {["Choose", "Your details", "Pay"].map((l, i) => (
          <span key={l} className={`rounded-full px-3 py-1 ${i <= at ? "bg-primary/15 text-primary" : "border border-border"}`}>{i + 1}. {l}</span>
        ))}
      </div>

      {step === "plan" && (
        <section className="glass space-y-5 p-6 md:p-8">
          <div className="grid grid-cols-2 gap-2">
            {(["sprint", "practice"] as const).map((x) => (
              <button key={x} className="chip justify-center" data-active={product === x} onClick={() => setProduct(x)}>{x === "sprint" ? "Sprint" : "Practice Pass"}</button>
            ))}
          </div>
          {product === "sprint" ? (
            <>
              <div>
                <label className="eyebrow block">Goal</label>
                <select className="field mt-1" value={goal} onChange={(e) => setGoal(e.target.value)}>{SPRINT_GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
                {goal === "custom" && <input className="field mt-2" placeholder="Describe your goal" value={goalText} onChange={(e) => setGoalText(e.target.value)} />}
              </div>
              <div className="space-y-2">
                <label className="eyebrow block">Length</label>
                {SPRINT_OPTIONS.map((id) => { const o = sprintDuration(id); return (
                  <button key={id} onClick={() => setDur(id)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${dur === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                    <span className="font-semibold">{o.label}</span><span className="font-display font-bold">{o.price}</span>
                  </button>); })}
                {dur === "3m" && <p className="text-[12px] text-muted-foreground">Charged ₹2,997 once for 3 months.</p>}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-primary bg-primary/10 p-4">
              <div className="flex items-center justify-between"><span className="font-semibold">Monthly · auto-renew</span><span className="font-display font-bold">{PLAN_CONFIG.practice.monthlyPrice}</span></div>
              <p className="mt-1 text-[13px] text-muted-foreground">Charged every month until you cancel. Unlimited practice, full analysis, history and drills.</p>
            </div>
          )}
          <button className="btn btn-primary w-full" onClick={() => setStep("details")}>Continue</button>
          <Link to="/plans" className="block text-center text-[13px] text-muted-foreground underline">Back to plans</Link>
        </section>
      )}

      {step === "details" && (
        <>
          <ContactDetails eyebrow={summary} title="Your details" body="We'll send your receipt here. Next time, you'll sign in with a code sent to this email." submit={busy ? "Please wait…" : "Continue to payment"} onCancel={() => setStep("plan")} onDone={afterDetails} />
          {err && <p className="text-center text-[13px] text-destructive">{err}</p>}
        </>
      )}

      {step === "otp" && (
        <form onSubmit={verify} className="glass space-y-4 p-6 md:p-8">
          <div className="eyebrow">{summary}</div>
          <h2 className="text-[24px] font-bold">Welcome back</h2>
          <p className="text-[14px] text-muted-foreground">This email already has an account. Enter the 6-digit code we sent to {profile?.email}.</p>
          <input className="field text-center font-mono text-[20px] tracking-[0.4em]" inputMode="numeric" maxLength={6} autoComplete="one-time-code" aria-label="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          {err && <p className="text-[13px] text-destructive">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Verify and continue"}</button>
          <button type="button" className="btn btn-ghost w-full" onClick={() => setStep("details")}>Use a different email</button>
        </form>
      )}

      {step === "pay" && (
        <section className="glass space-y-4 p-6 md:p-8">
          <div className="eyebrow">Review and pay</div>
          <h2 className="text-[24px] font-bold">{summary}</h2>
          <div className="space-y-1 rounded-xl border border-border p-4 text-[14px]">
            <div>{profile?.name}</div><div className="text-muted-foreground">{profile?.email}</div><div className="text-muted-foreground">{profile?.phone_country_code} {profile?.phone}</div>
            <button className="mt-1 text-[12px] text-primary underline" onClick={() => setStep("details")}>Edit</button>
          </div>
          <PayButton
            plan={product === "practice" ? "practice-monthly" : (`sprint-${dur}` as PlanKey)}
            recurring={product === "practice"}
            label={product === "practice" ? `Subscribe · ${PLAN_CONFIG.practice.monthlyPrice}` : `Pay ${dur === "3m" ? "₹2,997" : d.price}`}
            goal={product === "sprint" ? goal : undefined} goalText={goalText || undefined}
            prefill={{ name: profile?.name, email: profile?.email, contact: `${profile?.phone_country_code ?? ""}${profile?.phone ?? ""}` }}
            onPaid={() => navigate({ to: product === "practice" ? "/dashboard" : "/sprint" })}
          />
          <p className="text-center text-[12px] text-muted-foreground">Secure payment by Razorpay.</p>
        </section>
      )}
    </div>
  );
}
