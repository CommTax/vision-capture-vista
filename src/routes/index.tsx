import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Briefcase, TrendingUp, MessageSquare, Presentation, Crown, Handshake, Sparkles, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { getState, useStore } from "@/lib/store";
import { useHydrated } from "@/components/app-shell";
import { MobileNav } from "@/components/mobile-nav";
import { HowItWorksDemo } from "@/components/how-demo";
import { seedDemo } from "@/lib/demo";
import { dataProvider, formatPrice } from "@/services/data-provider";
import type { IconKey, PracticeMoment } from "@/content/types";
import { RotatingWord, TransformationReel } from "@/components/landing-visuals";
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
    <Link to="/practice" search={{ mode: m.category }} className={`glass group relative flex flex-col p-6 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-glass-strong ${m.category === "custom" ? "border-dashed" : ""} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <ArrowRight className="h-4 w-4 -translate-x-1 text-primary opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
      </div>
      <div className="eyebrow mt-6">{m.name}</div>
      <p className="mt-2 font-display text-[17px] font-bold leading-snug">{m.description}</p>
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
    <section id="faq" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-28">
      <h2 className="text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]">Questions</h2>
      <div className="mt-8 border-b border-border">
        {dataProvider.getFaq().map((f, i) => (
          <FaqItem key={f.id} q={f.question} a={f.answer} id={`faq-${i}`} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </div>
    </section>
  );
}



function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return <section id={id} className={`mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-28 ${className}`}>{children}</section>;
}
const H2 = "text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]";
const SUB = "mt-3 text-[15px] text-muted-foreground md:text-[17px]";

function Landing() {
  const navigate = useNavigate();
  const home = dataProvider.getHomepageContent();
  const { hero, transformations, feedback, contact } = home;
  const moments = dataProvider.getPracticeMoments();
    const plans = dataProvider.getPricingPlans();
  const hydrated = useHydrated();
  const signedIn = useStore((s) => !!s.profile?.onboarded) && hydrated;
  const tryFree = () => { if (!getState().profile) seedDemo(); navigate({ to: "/practice/$questionId", params: { questionId: "int-3" } }); };
  const primaryCta = () => (signedIn ? navigate({ to: "/practice" }) : tryFree());
  return (
    <div className="overflow-x-hidden pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground">Home</Link><a href="#modes" className="hover:text-foreground">Practice</a><a href="#how" className="hover:text-foreground">How it works</a><a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">{signedIn ? <Link to="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground">Dashboard</Link> : <Link to="/signup" search={{ mode: "signin" }} className="text-[13px] text-muted-foreground hover:text-foreground">Sign in</Link>}<button onClick={primaryCta} className="btn btn-primary btn-sm">{signedIn ? hero.ctaSignedIn : hero.cta}</button></div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-[1200px] px-5 pt-14 pb-0 md:px-8 md:pt-24 md:pb-0">
        <div className="rise max-w-5xl">
          <h1 className="text-[clamp(36px,5.6vw,76px)] font-bold leading-[1.04]"><span className="block text-[0.82em] lg:whitespace-nowrap">{hero.headline}</span><span className="block"><RotatingWord words={hero.rotatingWords} /></span><span className="block">Responses</span></h1>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-7 md:text-[19px]">{hero.body}</p>
          <p className="mt-2 text-[13px] text-muted-foreground">{hero.audience}</p>
          <div className="mt-9"><button onClick={primaryCta} className="btn btn-primary">{signedIn ? hero.ctaSignedIn : hero.cta}</button></div>
        </div>
      </section>

      {/* THE REAL PROBLEM */}
      <Section className="!pt-14 md:!pt-20">
        <div className="eyebrow mb-4 text-center !text-primary">The real problem</div>
        <h2 className="mx-auto max-w-[880px] text-pretty text-center text-[clamp(28px,3.6vw,46px)] font-bold leading-[1.1]">You know what you want to say. <span className="text-muted-foreground">The problem is getting it across.</span></h2>
        <TransformationReel pairs={transformations} video={landingVideo.url} closing={<>Make the thing you mean <span className="text-primary">easier to hear.</span></>} />
      </Section>

      {/* HOW UNSPOKEN WORKS */}
      <section id="how" className="py-16 md:py-28"><HowItWorksDemo /></section>

      {/* PRACTICE MOMENTS */}
      <Section id="modes">
        <h2 className={H2}>Practice the moments that matter.</h2>
        <p className={SUB}>Choose a situation.</p>
        <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:hidden">
          {moments.map((m) => <MomentCard key={m.id} m={m} className="w-[230px] shrink-0 snap-start" />)}
        </div>
        <div className="mt-12 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {moments.map((m, i) => <MomentCard key={m.id} m={m} className={i === 0 ? "md:col-span-2 lg:row-span-2 lg:[&_p]:text-[26px]" : ""} />)}
        </div>
      </Section>

      {/* FEEDBACK */}
      <Section id="analysis">
        <h2 className={H2}>Feedback that <span className="text-primary">listens.</span></h2>
        <p className={SUB}>Based on what you actually said.</p>
        <div className="glass glass-float mt-12 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-6 py-3">
            <span className="h-2 w-2 rounded-full bg-primary" /><span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Analysis · Attempt 01</span>
          </div>
          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {([["What got lost", feedback.whatGotLost, true], ["Why", feedback.why, false], ["Try this", feedback.tryThis, true]] as const).map(([l, t, hi]) => (
              <div key={l} className="p-6 md:p-9"><div className={`eyebrow ${hi ? "!text-primary" : ""}`}>{l}</div><p className="mt-3 font-display text-[20px] font-bold leading-snug md:text-[24px]">{t}</p></div>
            ))}
          </div>
        </div>
        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-primary">Try again. See what changes. →</p>
      </Section>

      {/* PRICING */}
      <Section id="pricing">
        <h2 className={H2}>Pricing</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map((t) => (
            <div key={t.id} className={`glass flex flex-col p-8 ${t.highlighted ? "glass-float border-primary/50" : ""}`}>
              <div className="eyebrow">{t.name}</div><div className="mt-3 font-display text-[40px] font-bold leading-none">{formatPrice(t)}</div>
              <ul className="mt-7 flex-1 space-y-2.5 text-[14px] text-muted-foreground">{t.features.map((x) => <li key={x}>{x}</li>)}</ul>
              <Link to="/signup" className={`btn mt-8 w-full ${t.highlighted ? "btn-primary" : "btn-ghost"}`}>{t.cta}</Link>
            </div>
          ))}
        </div>
      </Section>

      <FaqSection />

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-[1200px] px-5 md:px-8">
        <a href={`mailto:${contact.email}`} className="flex items-center justify-between border-y border-border py-6">
          <span className="font-display text-[20px] font-bold">Have a question?</span><span className="text-[14px] text-primary">Contact us →</span>
        </a>
      </section>

      {/* FINAL CTA */}
      <Section>
        <div className="text-center">
          <h2 className={`${H2} mx-auto max-w-3xl`}>Practice until the important thing doesn't get lost.</h2>
          <p className={`${SUB} mx-auto max-w-xl`}>Your next interview. Your next presentation. Your next difficult conversation. Practice it before it matters.</p>
          <button onClick={primaryCta} className="btn btn-primary mt-9">{signedIn ? hero.ctaSignedIn : hero.cta}</button>
        </div>
      </Section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center md:px-8">
          <Logo />
          <div className="flex gap-6 text-[13px] text-muted-foreground"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href={`mailto:${contact.email}`}>Contact</a></div>
        </div>
      </footer>
      <MobileNav />
    </div>
  );
}
