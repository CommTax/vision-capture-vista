import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import type { Analysis } from "@/lib/analysis";
import { PATTERNS } from "@/lib/data";
import { saveLead, useEntitlement, type Feature } from "@/lib/entitlements";
import { ScoreBar, cap } from "@/components/analysis-view";

/** Renders children when the feature is in the user's plan; otherwise a calm locked panel. */
export function Gate({ feature, title, body, cta = "Unlock", children }: { feature: Feature; title: string; body: string; cta?: string; children: ReactNode }) {
  const { has } = useEntitlement();
  if (has(feature)) return <>{children}</>;
  return (
    <div className="glass glass-float mx-auto max-w-2xl p-8 text-center">
      <Lock aria-hidden="true" className="mx-auto mb-3 size-4 text-primary" />
      <h1 className="text-[clamp(24px,3.5vw,32px)] font-bold">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/plans" className="btn btn-primary">{cta}</Link>
        <Link to="/practice" className="btn btn-ghost">Keep practicing</Link>
      </div>
    </div>
  );
}

/** Free users see a faded peek of the deeper content plus one compact, contextual unlock card. */
export function Locked({ feature = "history", title, body, cta = "Unlock", items, children }: { feature?: Feature; title: string; body: string; cta?: string; items?: string[]; children?: ReactNode }) {
  const { has } = useEntitlement();
  if (has(feature)) return <>{children}</>;
  return (
    <div>
      {children && (
        <div aria-hidden="true" inert className="pointer-events-none max-h-[120px] select-none overflow-hidden opacity-60 [mask-image:linear-gradient(to_bottom,black_10%,transparent)]">{children}</div>
      )}
      <div className={`glass flex items-start gap-3 p-5 ${children ? "-mt-6 relative" : ""}`}>
        <Lock aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="font-display text-[16px] font-bold">{title}</div>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
          {items && <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">{items.map((x) => <li key={x}><span className="text-primary">· </span>{x}</li>)}</ul>}
          <Link to="/plans" className="btn btn-primary btn-sm mt-3">{cta}</Link>
        </div>
      </div>
    </div>
  );
}

export function FreeCounter() {
  const { free, remaining } = useEntitlement();
  if (!free) return null;
  return <span className="font-mono text-[12px] text-muted-foreground">{remaining === 0 ? "No free attempts remaining" : `${remaining} free attempt${remaining === 1 ? "" : "s"} remaining`}</span>;
}

export function Conversion() {
  return (
    <div className="glass glass-float rise p-6 md:p-10">
      <div className="eyebrow mb-3">Your free practices are complete</div>
      <h2 className="text-balance text-[clamp(24px,3.5vw,34px)] font-bold">You've found your pattern. Now work on it.</h2>
      <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">Your free practices showed where your communication gets lost. Keep going with a practice path built around your response patterns — targeted drills, deeper analysis and progress you can see.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link to="/plans" className="btn btn-primary">Unlock your practice path</Link><Link to="/dashboard" className="btn btn-ghost">See my dashboard</Link></div>
    </div>
  );
}

const PHONE = /^[+\d][\d\s-]{6,}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadCapture({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = "Please enter your name.";
    if (!EMAIL.test(f.email.trim())) er.email = "Please enter a valid email.";
    if (!PHONE.test(f.phone.trim())) er.phone = "Please enter a valid phone number.";
    setErr(er);
    if (Object.keys(er).length) return;
    saveLead({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() }, consent);
    onDone();
  };
  const field = (k: keyof typeof f, label: string, type = "text") => (
    <div>
      <input className="field" type={type} placeholder={label} aria-label={label} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      {err[k] && <p className="mt-1 text-[12px] text-destructive">{err[k]}</p>}
    </div>
  );
  return (
    <form onSubmit={submit} className="glass glass-float rise mx-auto max-w-lg space-y-4 p-6 md:p-8">
      <div className="eyebrow">Your analysis is ready</div>
      <h2 className="text-[26px] font-bold">Where should we save your results?</h2>
      <p className="text-[14px] text-muted-foreground">So your practice and pattern stay with you.</p>
      {field("name", "Name")}
      {field("email", "Email", "email")}
      {field("phone", "Phone", "tel")}
      <label className="flex cursor-pointer items-start gap-2 text-[13px] text-muted-foreground">
        <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Send me Cadence tips, product updates, and offers by email.
      </label>
      <button className="btn btn-primary w-full">Show my result</button>
      <p className="text-center text-[12px] text-muted-foreground">By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
    </form>
  );
}

const BASIC = ["structure", "clarity", "conciseness", "relevance", "impact"] as const;

/** Free-tier result: the full insight, a narrower set of measures. */
export function FreeResult({ a, transcript }: { a: Analysis; transcript: string }) {
  const p = PATTERNS[a.primary_pattern];
  const why = a.main_point_delay > 3 ? `Your main point appeared after ${a.main_point_delay} seconds of context.` : a.what_got_lost.why[0];
  return (
    <div className="space-y-6">
      <div className="glass p-6 md:p-8">
        <div className="eyebrow mb-2">Response insight</div>
        <p className="text-[18px] leading-relaxed">{a.summary}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass p-6">
          <div className="eyebrow mb-2">Primary pattern</div>
          <div className="font-display text-[28px] font-bold text-primary">{p?.short ?? a.primary_pattern.toUpperCase()}</div>
          {p && <p className="mt-1 text-[14px] text-muted-foreground">{p.desc}</p>}
        </div>
        <div className="glass p-6">
          <div className="eyebrow mb-2">What got lost</div>
          <p className="text-[15px]">{a.what_got_lost.heard}</p>
          {why && <><div className="eyebrow mb-1 mt-4">Why</div><p className="text-[14px] text-muted-foreground">{why}</p></>}
        </div>
      </div>
      <div className="glass border-primary/30 p-6">
        <div className="eyebrow mb-2 !text-primary">One next move</div>
        <p className="text-[17px]">{a.retry_instruction}</p>
      </div>
      <div className="glass p-6">
        <div className="eyebrow mb-4">Basic skill indicators</div>
        <div className="space-y-3">{BASIC.filter((d) => typeof a.scores[d] === "number").map((d) => <ScoreBar key={d} label={cap(d)} value={a.scores[d]} />)}</div>
      </div>
      <Locked title="Detailed response breakdown" body="See how every part of this response landed — and the evidence behind each score." items={["Delivery", "Confidence", "Relevance", "Detailed structure analysis", "Response-level evidence", "Deeper patterns"]} cta="Unlock detailed analysis" />
      <details className="glass p-6"><summary className="cursor-pointer text-[14px] text-muted-foreground">Your response</summary><p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{transcript}</p></details>
    </div>
  );
}
