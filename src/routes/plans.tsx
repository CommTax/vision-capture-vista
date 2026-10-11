import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AppShell, Logo, PageHead } from "@/components/app-shell";
import { PLAN_CONFIG, SPRINT_GOALS, STATE_LABEL, cancelEntitlement, sprintDuration, useEntitlement, type SprintDurationId } from "@/lib/entitlements";
import { useStore } from "@/lib/store";
import { ContactDetails } from "@/components/contact-details";

export const Route = createFileRoute("/plans")({
  validateSearch: z.object({ p: z.enum(["practice", "sprint"]).optional() }),
  head: () => ({ meta: [{ title: "Plans — Practice and Sprint — TheUnspoken" }, { name: "description", content: "Choose ongoing Practice or a focused, goal-specific Sprint." }, { property: "og:title", content: "Plans — TheUnspoken" }, { property: "og:description", content: "Ongoing Practice or a focused Sprint." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PlansPage,
});

// ─────────────────────────────────────────────────────────────
// Public header — used when the visitor has no session
// ─────────────────────────────────────────────────────────────

function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Logo />
        <Link
          to="/"
          className="text-[14px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          ← Back to home
        </Link>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Route shell — public layout for guests, app layout for signed in
// ─────────────────────────────────────────────────────────────

function PlansPage() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined" &&
      !!localStorage.getItem("unspoken-session-token");
    setHasToken(token);
  }, []);

  // Avoid a flash of the wrong shell
  if (hasToken === null) return <div className="min-h-screen" />;

  if (!hasToken) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 md:px-8 md:py-14">
          <Plans />
        </main>
      </div>
    );
  }

  return (
    <AppShell allowGuest>
      <Plans />
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Plans content
// ─────────────────────────────────────────────────────────────

function Plans() {
  const { p } = Route.useSearch();
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const { state, free, remaining } = useEntitlement();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [goal, setGoal] = useState(SPRINT_GOALS[0].id);
  const [goalText, setGoalText] = useState("");
  const [dur, setDur] = useState<SprintDurationId>("14d");
  const d = sprintDuration(dur);
  const disc = PLAN_CONFIG.practice.annualDiscountPct;
  const [pending, setPending] = useState<null | { label: string; run: () => void }>(null);

  // Signed-in detection (used to hide the account banner for guests)
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  useEffect(() => {
    const token =
      typeof window !== "undefined" &&
      !!localStorage.getItem("unspoken-session-token");
    setHasToken(token);
  }, []);

  const needAccount = () => { if (!profile) { navigate({ to: "/signup" }); return true; } return false; };
  const begin = (label: string, run: () => void) => { if (needAccount()) return; setPending({ label, run }); };

  if (pending) return (
    <ContactDetails
      eyebrow={pending.label}
      title="Confirm your details"
      body="We'll use these for your plan. Change anything that's out of date."
      submit="Continue"
      onCancel={() => setPending(null)}
      onDone={() => { const r = pending.run; setPending(null); r(); }}
    />
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <PageHead eyebrow="Plans" title="Keep practicing." />
        <p className="-mt-6 text-[15px] text-muted-foreground">
          Choose the way you want to improve.
        </p>
      </div>

      {/* Account banner — only shown to signed-in users */}
      {hasToken && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 p-5 text-[14px]">
          <span>
            <span className="text-muted-foreground">Your plan: </span>
            {STATE_LABEL[state]}
            {free && ` · ${remaining} free response${remaining === 1 ? "" : "s"} left`}
          </span>
          {!free && (
            <button
              className="text-[13px] text-muted-foreground underline"
              onClick={cancelEntitlement}
            >
              Cancel plan
            </button>
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* Practice plan */}
        <section className={`glass p-6 md:p-8 ${p !== "sprint" ? "border-primary/40" : ""}`}>
          <div className="eyebrow mb-1 !text-primary">Practice</div>
          <h2 className="text-[26px] font-bold">Ongoing practice</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Ongoing communication practice. No end date.
          </p>

          <div className="mt-5 flex gap-2">
            {PLAN_CONFIG.practice.billing.map((b) => (
              <button
                key={b}
                className="chip"
                data-active={billing === b}
                onClick={() => setBilling(b)}
              >
                {b === "monthly" ? "Monthly" : `Annual${disc ? ` · save ${disc}%` : ""}`}
              </button>
            ))}
          </div>

          <div className="mt-4 font-display text-[28px] font-bold">
            {billing === "monthly"
              ? PLAN_CONFIG.practice.monthlyPrice
              : PLAN_CONFIG.practice.annualPrice}
          </div>
          {billing === "annual" && PLAN_CONFIG.practice.annualPerMonth && (
            <p className="mt-1 text-[12px] text-muted-foreground">
              {PLAN_CONFIG.practice.annualPerMonth} · billed annually
            </p>
          )}

          <ul className="mt-4 space-y-1.5 text-[14px] text-muted-foreground">
            {[
              "Unlimited practice, voice and text",
              "Detailed analysis and AI coaching",
              "Response history and comparisons",
              "Skills, patterns and progress",
              "Targeted drills and custom practice",
              "Personalized next practice",
            ].map((x) => (
              <li key={x}>· {x}</li>
            ))}
          </ul>

          {state !== "PRACTICE_PAID" && (
            <Link
              to="/checkout"
              search={{ product: "practice", billing }}
              className="btn btn-primary mt-6 w-full"
            >
              Choose Practice Pass
            </Link>
          )}
          {state === "PRACTICE_PAID" && (
            <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-center text-[14px] text-primary">
              You're on Practice
            </div>
          )}
        </section>

        {/* Sprint plan */}
        <section className={`glass p-6 md:p-8 ${p === "sprint" ? "border-primary/40" : ""}`}>
          <div className="eyebrow mb-1 !text-primary">Sprint</div>
          <h2 className="text-[26px] font-bold">A focused program</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Focused, goal-specific improvement — one goal, a set length, a progress report at the end.
          </p>

          <label className="eyebrow mt-5 block">Goal</label>
          <select
            className="field mt-1"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
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

          <label className="eyebrow mt-4 block">Length</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {PLAN_CONFIG.sprint.durations.map((x) => (
              <button
                key={x.id}
                className="chip"
                data-active={dur === x.id}
                onClick={() => setDur(x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">{d.price}</p>

          {state !== "SPRINT_PAID" && (
            <Link
              to="/checkout"
              search={{ product: "sprint", d: dur, goal }}
              className="btn btn-primary mt-6 w-full"
            >
              Choose Sprint
            </Link>
          )}
          {state === "SPRINT_PAID" && (
            <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-center text-[14px] text-primary">
              You're on a Sprint
            </div>
          )}
        </section>
      </div>

      <p className="text-center text-[13px] text-muted-foreground">
        Secure payments by Razorpay.{" "}
        <Link to="/practice" className="text-primary">Keep practicing →</Link>
      </p>
    </div>
  );
}
