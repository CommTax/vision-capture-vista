import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Briefcase, TrendingUp, MessageSquare, Presentation, Crown, Handshake, Sparkles, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { ScoreBar } from "@/components/analysis-view";
import { getState } from "@/lib/store";
import { seedDemo } from "@/lib/demo";
import { dataProvider, formatPrice } from "@/services/data-provider";
import type { IconKey, PracticeMoment } from "@/content/types";
import landingVideo from "@/assets/landing-transformation.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Unspoken — Say what you mean. Make it land." },
      { name: "description", content: "Practice the answers, conversations, and high-stakes moments that matter — then see exactly what gets lost when you speak." },
      { property: "og:title", content: "Unspoken — Say what you mean. Make it land." },
      { property: "og:description", content: "Practice what you need to say, see what isn't landing, fix it, and try again." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ICONS: Record<IconKey, LucideIcon> = { briefcase: Briefcase, trending: TrendingUp, message: MessageSquare, presentation: Presentation, crown: Crown, handshake: Handshake, sparkles: Sparkles };

function MomentCard({ m, className = "" }: { m: PracticeMoment; className?: string }) {
  const Icon = ICONS[m.icon];
  return (
    <Link to="/practice" search={{ mode: m.category }} className={`glass group flex flex-col p-5 transition hover:bg-glass-strong md:p-6 ${m.category === "custom" ? "border-dashed" : ""} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" aria-hidden="true" /><span className="eyebrow !text-primary">{m.name}</span></span>
        {m.common && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Most practiced</span>}
      </div>
      <p className="mt-3 flex-1 font-display text-[15px] font-bold leading-snug md:mt-4 md:text-[18px]">“{m.description}”</p>
      <span className="mt-4 text-[13px] text-primary">Practice →</span>
    </Link>
  );
}

function FaqItem({ q, a, id, open, onToggle }: { q: string; a: string; id: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-border">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between gap-6 py-5 text-left">
        <span className="font-display text-[17px] font-bold leading-snug">{q}</span>
        <span aria-hidden="true" className={`shrink-0 font-mono text-[16px] text-primary transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div id={id} role="region" aria-hidden={!open} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden"><p className="max-w-[72ch] pb-5 text-[14px] leading-6 text-muted-foreground">{a}</p></div>
      </div>
    </div>
  );
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-16">
      <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Questions, answered.</h2>
      <div className="mt-8 border-b border-border">
        {dataProvider.getFaq().map((f, i) => (
          <FaqItem key={f.id} q={f.question} a={f.answer} id={`faq-${i}`} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </div>
    </section>
  );
}

const EMPTY_FORM = { name: "", email: "", phone: "", topic: "", time: "" };
type CallbackForm = typeof EMPTY_FORM;

function ContactSection() {
  const contact = dataProvider.getHomepageContent().contact;
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<CallbackForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "phone", string>>>({});

  const set = (k: keyof CallbackForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<"name" | "email" | "phone", string>> = {};
    if (!form.name.trim()) errs.name = "Please add your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "Please add a valid email.";
    if (!form.phone.trim()) errs.phone = "Please add your phone number.";
    setErrors(errs);
    if (Object.keys(errs).length === 0) setSent(true);
  };

  const req = (k: "name" | "email" | "phone", label: string, type: string) => (
    <div>
      <label className="eyebrow" htmlFor={`cb-${k}`}>{label}</label>
      <input id={`cb-${k}`} type={type} className="field mt-2 w-full" value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `cb-${k}-err` : undefined} />
      {errors[k] && <p id={`cb-${k}-err`} className="mt-1.5 text-[12px] text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <section id="contact" className="mx-auto max-w-[1200px] px-5 pb-8 md:px-8">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="contact-panel" className="flex w-full items-center justify-between gap-6 border-t border-border py-6 text-left">
        <div>
          <div className="eyebrow">Contact us</div>
          <div className="mt-1.5 font-display text-[20px] font-bold">{contact.heading}</div>
        </div>
        <span aria-hidden="true" className={`shrink-0 font-mono text-[16px] text-primary transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div id="contact-panel" role="region" aria-hidden={!open} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="glass p-6 md:p-8">
            <p className="max-w-[64ch] text-[15px] leading-6 text-muted-foreground">{contact.intro} Write to us at <a href={`mailto:${contact.email}`} className="text-primary">{contact.email}</a> or request a callback.</p>
            {sent ? (
              <p className="mt-5 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-[14px] leading-6">Thanks — we've received your request. We'll get in touch with you soon.</p>
            ) : (
              <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
                {req("name", "Name", "text")}
                {req("email", "Email", "email")}
                {req("phone", "Phone", "tel")}
                <div>
                  <label className="eyebrow" htmlFor="cb-time">Preferred time to call (optional)</label>
                  <input id="cb-time" type="text" className="field mt-2 w-full" value={form.time} onChange={set("time")} placeholder="e.g. Weekdays after 6pm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="eyebrow" htmlFor="cb-topic">What would you like to discuss? (optional)</label>
                  <textarea id="cb-topic" rows={3} className="field mt-2 w-full resize-none" value={form.topic} onChange={set("topic")} />
                </div>
                <div className="sm:col-span-2"><button type="submit" className="btn btn-primary">Request a callback</button></div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  const navigate = useNavigate();
  const home = dataProvider.getHomepageContent();
  const { hero, proof, transformations, howItWorks, feedback, comparison, pattern } = home;
  const moments = dataProvider.getPracticeMoments();
  const drills = dataProvider.getDrillTeasers();
  const plans = dataProvider.getPricingPlans();
  const tryFree = () => { if (!getState().profile) seedDemo(); navigate({ to: "/practice/$questionId", params: { questionId: "int-3" } }); };
  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link to="/" className="font-display text-[19px] font-bold tracking-tight">Home</Link>
          <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
            <a href="#modes" className="hover:text-foreground">Practice</a><a href="#how" className="hover:text-foreground">How it works</a><a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-3"><Link to="/signup" search={{ mode: "signin" }} className="text-[13px] text-muted-foreground hover:text-foreground">Sign in</Link><Link to="/signup" className="btn btn-primary btn-sm">Start Practicing</Link></div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-6 px-5 pt-8 pb-10 md:gap-12 md:px-8 md:pt-20 md:pb-16 lg:grid-cols-12">
        <div className="rise md:hidden">
          <h1 className="text-balance text-[36px] font-bold leading-[1.05]">{hero.mobileHeadline}</h1>
          <p className="mt-3 font-display text-[20px] font-bold text-primary">{hero.headline} {hero.headlineAccent}</p>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">{hero.mobileBody}</p>
          <div className="mt-5 grid grid-cols-2 gap-2"><Link to="/signup" className="btn btn-primary justify-center">Start Practicing</Link><button onClick={tryFree} className="btn btn-ghost justify-center">Try Free Practice</button></div>
        </div>
        <div className="rise hidden md:block lg:col-span-6">
          <div className="eyebrow mb-5 !text-primary">{hero.eyebrow}</div>
          <h1 className="text-balance text-[clamp(42px,5.8vw,72px)] font-bold leading-[1.0]">{hero.headline} <span className="text-primary">{hero.headlineAccent}</span></h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-7 text-muted-foreground">{hero.body}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/signup" className="btn btn-primary">Start Practicing</Link><button onClick={tryFree} className="btn btn-ghost">Try a Free Practice</button></div>
        </div>
        <div className="rise lg:col-span-6" style={{ animationDelay: "120ms" }}>
          <div className="glass glass-float p-5 md:p-7">
            <div className="mb-4 md:mb-6"><span className="eyebrow">{proof.title}</span></div>
            <div className="rounded-2xl border border-border p-4">
              <div className="eyebrow">Attempt 01</div>
              <div className="mt-1 font-display text-[17px] font-bold text-muted-foreground line-through sm:text-[20px] decoration-1">{proof.before}</div>
              <div className="text-[13px] text-muted-foreground">Main point at {proof.mainPoint.before}s</div>
            </div>
            <div className="py-2 text-center text-primary">↓</div>
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
              <div className="eyebrow !text-primary">Attempt 02</div>
              <div className="clip-in mt-1 font-display text-[19px] font-bold sm:text-[24px]">{proof.after}</div>
              <div className="text-[13px]">Main point at <span className="text-primary">{proof.mainPoint.after}s</span></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              {proof.metrics.map((m) => (
                <div key={m.metric}><div className="text-[11px] text-muted-foreground">{m.metric}</div><div className="mt-1 font-mono text-[13px]"><span className="text-muted-foreground">{m.before}</span> → <span className="text-primary">{m.after}</span></div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* THE REAL PROBLEM — compact mobile version */}
      <section className="mx-auto px-5 pb-8 md:hidden">
        <div className="eyebrow mb-2 !text-primary">The real problem</div>
        <h2 className="text-balance text-[24px] font-bold leading-tight">You know what you want to say. <span className="text-muted-foreground">The problem is getting it across.</span></h2>
        <p className="mt-2 text-[14px] text-muted-foreground">Sometimes the idea is strong. The response isn't.</p>
        <ul className="glass mt-4 divide-y divide-border">
          {transformations.map(({ from, to }) => (
            <li key={from} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-2.5">
              <span className="truncate font-mono text-[12px] text-muted-foreground line-through">{from}</span>
              <span className="text-primary" aria-label="becomes">→</span>
              <span className="truncate text-right font-display text-[14px] font-bold">{to}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto hidden max-w-[1200px] px-5 py-20 md:block md:px-8">
        <div className="relative min-h-[560px] overflow-hidden rounded-3xl border border-border">
          <video
            src={landingVideo.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/15 to-background/90" />
          <div className="relative flex min-h-[560px] flex-col justify-between p-7 md:p-10">
            <div>
              <div className="eyebrow mb-4 !text-primary">The real problem</div>
              <h2 className="max-w-2xl text-[clamp(28px,3.6vw,44px)] font-bold leading-tight">You know what you want to say. <span className="text-muted-foreground">The problem is getting it across.</span></h2>
              <p className="mt-3 max-w-xl text-[16px] text-muted-foreground">Sometimes the idea is strong. The response isn't.</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {transformations.map(({ from, to }) => (
                <div key={from} className="glass rounded-2xl px-4 py-4">
                  <div className="font-mono text-[11px] text-muted-foreground line-through">{from}</div>
                  <div className="mt-2 font-display text-[15px] font-bold leading-tight"><span className="text-primary">→ </span>{to}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-8 max-w-xl text-[15px] leading-6">The goal isn't to sound perfect. It's to make the thing you actually mean easier to hear.</p>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-20">
        <div className="eyebrow mb-6 hidden md:block">How it works</div>
        <h2 className="mb-4 text-[26px] font-bold leading-tight md:hidden">Practice. See. Fix. Retry.</h2>
        <div className="grid gap-0 md:grid-cols-5 md:gap-4">
          {howItWorks.map((s) => (
            <div key={s.step} className="flex items-baseline gap-4 border-t border-border py-2.5 md:block md:py-0 md:pt-4"><div className="font-mono text-[12px] text-primary">{String(s.step).padStart(2, "0")}</div><div className="font-display text-[16px] font-bold leading-tight md:mt-2 md:text-[19px]"><span className="md:hidden">{s.shortTitle}</span><span className="hidden md:inline">{s.title}</span></div></div>
          ))}
        </div>
        <p className="mt-5 font-display text-[18px] font-bold md:mt-10 md:text-[22px]">Don't rewrite yourself. <span className="text-primary">Learn what to change.</span></p>
      </section>

      {/* MODES + PRACTICE MOMENTS */}
      <section id="modes" className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-20">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Practice the moments that matter.</h2>
        <p className="mt-3 text-[15px] text-muted-foreground md:text-[16px]">Choose a situation. We'll give you something real to respond to.</p>
        <div className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:hidden">
          {moments.map((m) => <MomentCard key={m.id} m={m} className="w-[220px] shrink-0 snap-start" />)}
        </div>
        <div className="mt-10 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {moments.map((m) => <MomentCard key={m.id} m={m} />)}
        </div>
      </section>

      {/* FEEDBACK */}
      <section id="analysis" className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-20">
        <div className="eyebrow mb-3 hidden !text-primary md:block">Feedback that listens to the response.</div>
        <h2 className="max-w-2xl text-[26px] font-bold leading-tight md:hidden">Feedback that listens to the response.</h2>
        <h2 className="hidden max-w-2xl text-[clamp(28px,3.4vw,40px)] font-bold leading-tight md:block">Not generic communication advice. Feedback based on what <span className="text-primary">you</span> actually said.</h2>
        <div className="glass glass-float mt-5 grid divide-y md:mt-10 divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
          {([
            ["What you said", feedback.whatYouSaid, false],
            ["What got lost", feedback.whatGotLost, true],
            ["Why", feedback.why, false],
            ["Try this", feedback.tryThis, true],
          ] as const).map(([l, t, hi]) => (
            <div key={l} className="p-4 md:p-7"><div className={`eyebrow ${hi ? "!text-primary" : ""}`}>{l}</div><p className="mt-1.5 font-display text-[16px] font-bold leading-snug md:mt-3 md:text-[19px]">{t}</p></div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="mx-auto hidden md:block max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Don't just get feedback. <span className="text-primary">Try again.</span></h2>
        <div className="mt-10 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="glass p-7"><div className="eyebrow">{comparison.before.label}</div><div className="mt-4 flex gap-10"><div><div className="font-display text-[40px] font-bold text-muted-foreground">{comparison.before.structure}</div><div className="text-[12px] text-muted-foreground">Structure</div></div><div><div className="font-display text-[40px] font-bold text-muted-foreground">{comparison.before.mainPointSeconds}s</div><div className="text-[12px] text-muted-foreground">Main point</div></div></div></div>
          <div className="text-center text-[24px] text-primary"><span className="hidden md:inline">→</span><span className="md:hidden">↓</span></div>
          <div className="glass border-primary/50 p-7"><div className="eyebrow !text-primary">{comparison.after.label}</div><div className="mt-4 flex gap-10"><div><div className="font-display text-[40px] font-bold text-primary">{comparison.after.structure}</div><div className="text-[12px] text-muted-foreground">Structure</div></div><div><div className="font-display text-[40px] font-bold text-primary">{comparison.after.mainPointSeconds}s</div><div className="text-[12px] text-muted-foreground">Main point</div></div></div><div className="mt-5"><ScoreBar label="Structure" value={comparison.after.structure} prev={comparison.before.structure} /></div></div>
        </div>
        <p className="mt-6 text-[15px] text-muted-foreground">{comparison.caption}</p>
      </section>

      {/* PATTERN */}
      <section className="mx-auto hidden md:block max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Over time, you'll start seeing your pattern.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="glass p-6 md:col-span-2"><div className="eyebrow">Your primary pattern</div><div className="mt-3 font-display text-[32px] font-bold">{pattern.primaryPattern.label.toUpperCase()}</div><p className="mt-2 text-[14px] text-muted-foreground">{pattern.primaryPattern.description}</p></div>
          <div className="glass p-6"><div className="eyebrow">Secondary</div><div className="mt-3 font-display text-[18px] font-bold">{pattern.secondaryPattern.label.toUpperCase()}</div><div className="eyebrow mt-6">Strength</div><div className="mt-2 font-display text-[18px] font-bold">{pattern.strength.label.toUpperCase()}</div></div>
          <div className="glass border-primary/50 p-6"><div className="eyebrow !text-primary">Current focus</div><div className="mt-3 font-display text-[24px] font-bold text-primary">{pattern.currentFocus.label.toUpperCase()}</div></div>
        </div>
        <p className="mt-6 text-[15px] text-muted-foreground">Your feedback gets more useful as you practice.</p>
        <p className="mt-2 text-[14px] text-muted-foreground">Your next move: {pattern.nextMove}</p>
      </section>

      {/* DRILLS */}
      <section className="mx-auto hidden md:block max-w-[1200px] px-5 py-20 md:px-8">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">Practice the specific thing <span className="text-primary">holding you back.</span></h2>
        <p className="mt-3 text-[16px] text-muted-foreground">Targeted drills turn feedback into something you can actually practice.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {drills.map((d) => (
            <div key={d.id} className="glass flex flex-col p-6"><div className="font-mono text-[12px] uppercase tracking-[0.12em] text-primary">{d.title}</div><p className="mt-3 flex-1 text-[14px] leading-6 text-muted-foreground">{d.description}</p><Link to="/drills" className="btn btn-ghost btn-sm mt-6 self-start">Practice</Link></div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto hidden md:block max-w-[1200px] px-5 py-20 md:px-8">
        <div className="eyebrow mb-6">Pricing</div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((t) => (
            <div key={t.id} className={`glass p-7 ${t.highlighted ? "border-primary/50" : ""}`}>
              <div className="eyebrow">{t.name}</div><div className="mt-3 font-display text-[36px] font-bold">{formatPrice(t)}</div>
              <ul className="mt-5 space-y-2 text-[14px]">{t.features.map((x) => <li key={x} className="flex gap-2"><span className="text-primary">·</span>{x}</li>)}</ul>
              <Link to="/signup" className={`btn mt-7 w-full ${t.highlighted ? "btn-primary" : "btn-ghost"}`}>{t.cta}</Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">Payments coming soon. Start practicing free today.</p>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* CONTACT */}
      <ContactSection />

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-20">
        <div className="glass glass-float p-7 text-center md:p-16">
          <h2 className="mx-auto max-w-2xl text-balance text-[clamp(30px,4vw,48px)] font-bold leading-tight">Practice until the important thing doesn't get lost.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground md:text-[16px]">Your next interview. Your next presentation. Your next difficult conversation.<span className="hidden md:inline"> Practice it before it matters.</span></p>
          <Link to="/signup" className="btn btn-primary mt-8">Start Practicing</Link>
        </div>
      </section>

      <footer className="mt-8 border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center md:px-8">
          <Logo />
          <div className="flex gap-6 text-[13px] text-muted-foreground"><span>Privacy</span><Link to="/responses">Practice log</Link><span>Contact</span></div>
        </div>
      </footer>
    </div>
  );
}
