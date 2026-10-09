import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { ContactDetails } from "@/components/contact-details";
import { PayButton } from "@/components/razorpay-pay";
import { PLAN_CONFIG, SPRINT_GOALS, type SprintDurationId } from "@/lib/entitlements";
import { getState, useStore } from "@/lib/store";
import {
  lookupEmail,
  signupFree,
  verifyOtp,
  requestOtp,
} from "@/lib/backend-api";
import { setFreeSession } from "@/lib/backend-auth";


export const Route = createFileRoute("/checkout")({
  validateSearch: z.object({
    product: z.enum(["practice", "sprint"]).catch("sprint"),
    d: z.enum(["14d"]).optional(),
    goal: z.string().optional(),
    billing: z.enum(["monthly", "annual"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Checkout — TheUnspoken" },
      { name: "description", content: "Pick your Sprint or Practice Pass and pay securely with Razorpay." },
      { property: "og:title", content: "Checkout — TheUnspoken" },
      { property: "og:description", content: "Secure payment for Sprint and Practice Pass." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell allowGuest><Checkout /></AppShell>,
});

type Step = "plan" | "details" | "otp" | "pay";
type Billing = "monthly" | "annual";

function Checkout() {
  const s = Route.useSearch();
  const navigate = useNavigate();
  const [product, setProduct] = useState<"practice" | "sprint">(s.product);
  const [billing, setBilling] = useState<Billing>(s.billing ?? "monthly");
  const [goal, setGoal] = useState(s.goal ?? SPRINT_GOALS[0].id);
  const [goalText, setGoalText] = useState("");
  const [step, setStep] = useState<Step>("plan");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");

  // ── Pricing display ──────────────────────────────────────────
  const practicePriceDisplay =
    billing === "monthly"
      ? PLAN_CONFIG.practice.monthlyPrice
      : PLAN_CONFIG.practice.annualPrice;

  const practicePriceSubline =
    billing === "annual" && PLAN_CONFIG.practice.annualPerMonth
      ? `${PLAN_CONFIG.practice.annualPerMonth} · billed annually`
      : "Charged every month until you cancel";

  const sprintPrice = PLAN_CONFIG.sprint.price; // "₹1"

  const summary =
    product === "practice"
      ? `Practice Pass · ${practicePriceDisplay}${billing === "monthly" ? ", renews monthly" : ", billed yearly"}`
      : `Sprint · 14 days · ${sprintPrice}`;

  // Read profile reactively so it updates after `saveContact`.
  const profile = useStore((s) => s.profile);

  const afterDetails = async () => {
    const p = getState().profile;
    if (!p?.email) return;
    setBusy(true);
    setErr("");

    try {
      const lookup = await lookupEmail(p.email);

      if (lookup.is_paid) {
        await requestOtp(p.email);
        setStep("otp");
        setBusy(false);
        return;
      }

      const mobile = p.phone_country_code
        ? `${p.phone_country_code} ${p.phone ?? ""}`.trim()
        : (p.phone ?? "");

      const res = await signupFree({
        name: p.name ?? "",
        email: p.email,
        mobile,
        stage: p.level ?? undefined,
      });

      if (res.session_token) {
        setFreeSession(res.session_token, {
          name: p.name ?? "",
          email: p.email,
          phone: p.phone ?? "",
          phone_country_code: p.phone_country_code ?? "+91",
        });
      }
      setStep("pay");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't continue. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    const p = getState().profile;
    if (!p?.email) return;
    setBusy(true);
    setErr("");
    try {
      await verifyOtp(p.email, code.trim());
      setStep("pay");
    } catch {
      setErr("That code didn't work. Check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  const steps: Step[] = ["plan", "details", "pay"];
  const at = steps.indexOf(step === "otp" ? "details" : step);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-muted-foreground">
        {["Choose", "Your details", "Pay"].map((l, i) => (
          <span
            key={l}
            className={`rounded-full px-3 py-1 ${
              i <= at ? "bg-primary/15 text-primary" : "border border-border"
            }`}
          >
            {i + 1}. {l}
          </span>
        ))}
      </div>

      {step === "plan" && (
        <section className="glass space-y-5 p-6 md:p-8">
          <div className="grid grid-cols-2 gap-2">
            {(["sprint", "practice"] as const).map((x) => (
              <button
                key={x}
                className="chip justify-center"
                data-active={product === x}
                onClick={() => setProduct(x)}
              >
                {x === "sprint" ? "Sprint" : "Practice Pass"}
              </button>
            ))}
          </div>

          {product === "sprint" ? (
            <>
              <div>
                <label className="eyebrow block">Goal</label>
                <select className="field mt-1" value={goal} onChange={(e) => setGoal(e.target.value)}>
                  {SPRINT_GOALS.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
                {goal === "custom" && (
                  <input
                    className="field mt-2"
                    placeholder="Describe your goal"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                  />
                )}
              </div>
              <div className="rounded-xl border border-primary bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Sprint · 14 days</span>
                  <span className="font-display font-bold">{sprintPrice}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Goal-based practice, personalised drills, and a progress report at the end.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Monthly / Annual toggle */}
              <div className="flex gap-2">
                {PLAN_CONFIG.practice.billing.map((b) => (
                  <button
                    key={b}
                    className="chip"
                    data-active={billing === b}
                    onClick={() => setBilling(b as Billing)}
                  >
                    {b === "monthly"
                      ? "Monthly"
                      : `Annual${PLAN_CONFIG.practice.annualDiscountPct ? ` · save ${PLAN_CONFIG.practice.annualDiscountPct}%` : ""}`}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-primary bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {billing === "monthly" ? "Monthly · auto-renew" : "Annual · billed yearly"}
                  </span>
                  <span className="font-display font-bold">{practicePriceDisplay}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {practicePriceSubline}. Unlimited practice, full analysis, history and drills.
                </p>
              </div>
            </>
          )}

          <button className="btn btn-primary w-full" onClick={() => setStep("details")}>
            Continue
          </button>
          <Link to="/plans" className="block text-center text-[13px] text-muted-foreground underline">
            Back to plans
          </Link>
        </section>
      )}

      {step === "details" && (
        <>
          <ContactDetails
            eyebrow={summary}
            title="Your details"
            body="We'll send your receipt here. Next time, you'll sign in with a code sent to this email."
            submit={busy ? "Please wait…" : "Continue to payment"}
            onCancel={() => setStep("plan")}
            onDone={afterDetails}
          />
          {err && <p className="text-center text-[13px] text-destructive">{err}</p>}
        </>
      )}

      {step === "otp" && (
        <form onSubmit={verify} className="glass space-y-4 p-6 md:p-8">
          <div className="eyebrow">{summary}</div>
          <h2 className="text-[24px] font-bold">Welcome back</h2>
          <p className="text-[14px] text-muted-foreground">
            This email already has a paid account. Enter the 6-digit code we sent to {profile?.email}.
          </p>
          <input
            className="field text-center font-mono text-[20px] tracking-[0.4em]"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            aria-label="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          {err && <p className="text-[13px] text-destructive">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy || code.length < 6}>
            {busy ? "Checking…" : "Verify and continue"}
          </button>
          <button type="button" className="btn btn-ghost w-full" onClick={() => setStep("details")}>
            Use a different email
          </button>
        </form>
      )}

      {step === "pay" && (
        <section className="glass space-y-4 p-6 md:p-8">
          <div className="eyebrow">Review and pay</div>
          <h2 className="text-[24px] font-bold">{summary}</h2>

          {/* Contact details card — reads reactively from the store */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1 text-[14px]">
                {profile?.name ? (
                  <div className="font-medium text-foreground">{profile.name}</div>
                ) : null}
                {profile?.email ? (
                  <div className="truncate text-muted-foreground">{profile.email}</div>
                ) : null}
                {profile?.phone || profile?.phone_country_code ? (
                  <div className="text-muted-foreground">
                    {profile.phone_country_code} {profile.phone}
                  </div>
                ) : null}
                {!profile?.name && !profile?.email && (
                  <div className="italic text-muted-foreground">
                    No contact details on file
                  </div>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 text-[12px] font-medium text-primary underline underline-offset-4"
                onClick={() => setStep("details")}
              >
                Edit
              </button>
            </div>
          </div>

          <PayButton
            plan={product === "practice" ? "pass" : "sprint"}
            sprint={product === "sprint" ? goal : undefined}
            email={profile?.email ?? ""}
            name={profile?.name}
            phone={
              profile?.phone_country_code
                ? `${profile.phone_country_code}${profile.phone ?? ""}`
                : profile?.phone
            }
            billing={product === "practice" ? billing : undefined}
            label={
              product === "practice"
                ? `Subscribe · ${practicePriceDisplay}`
                : `Pay ${sprintPrice}`
            }
            onPaid={() => navigate({ to: product === "practice" ? "/dashboard" : "/sprint" })}
          />
          <p className="text-center text-[12px] text-muted-foreground">Secure payment by Razorpay.</p>
        </section>
      )}
    </div>
  );
}
