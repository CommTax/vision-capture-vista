import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/app-shell";
import { EXPERIENCE, GOALS, STRUGGLES } from "@/lib/data";
import { setState } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your practice — TheUnspoken" }, { name: "description", content: "Tell us what you're preparing for." }, { property: "og:title", content: "Set up your practice — TheUnspoken" }, { property: "og:description", content: "Personalize your practice plan." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Onboarding,
});

const STEPS = [
  { key: "goal", q: "What are you preparing for?", opts: GOALS },
  { key: "struggle", q: "What is hardest for you?", opts: STRUGGLES },
  { key: "experience", q: "Experience level", opts: EXPERIENCE },
] as const;

function levelFor(exp: string) { return exp === "15+ years" ? "Senior / Leadership" : exp === "5–15 years" ? "Mid career" : exp === "1–5 years" ? "Early career" : "Fresher"; }

function Onboarding() {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const S = STEPS[step];
  const pick = (v: string) => {
    const next = { ...ans, [S.key]: v };
    setAns(next);
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setState((s) => ({ ...s, profile: { ...(s.profile ?? { name: "Friend", email: "", plan: "free" as const }), goal: next.goal, struggle: next.struggle, experience: next.experience, level: levelFor(next.experience), onboarded: true } as NonNullable<typeof s.profile> }));
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <div className="mb-12 flex items-center justify-between"><Logo /><span className="font-mono text-[12px] text-muted-foreground">{step + 1} / {STEPS.length}</span></div>
      <div className="bar mb-10"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <h1 key={S.q} className="rise mb-8 text-[clamp(28px,4vw,40px)] font-bold">{S.q}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {S.opts.map((o) => (
          <button key={o} onClick={() => pick(o)} className="glass flex items-center gap-3 p-4 text-left text-[15px] transition hover:border-primary/50">
            <span className="size-4 rounded-full border border-input" />{o}
          </button>
        ))}
      </div>
      {step > 0 && <button className="mt-8 text-[13px] text-muted-foreground" onClick={() => setStep(step - 1)}>← Back</button>}
    </div>
  );
}
