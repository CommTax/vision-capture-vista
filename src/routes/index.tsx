import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Briefcase, TrendingUp, MessageSquare, Presentation, Crown, Handshake, Sparkles, type LucideIcon } from "lucide-react";
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
import interviewImage from "@/assets/practice-interview.jpg";
import leadershipImage from "@/assets/practice-leadership.jpg";
import presentationImage from "@/assets/practice-presentation.jpg";

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


const MOMENT_IMAGES: Partial<Record<PracticeMoment["id"], string>> = {
  interview: interviewImage,
  leadership: leadershipImage,
  presentation: presentationImage,
};

function MomentCard({ m, className = "" }: { m: PracticeMoment; className?: string }) {
  const Icon = ICONS[m.icon];
  return (
    <Link to="/practice" search={{ mode: m.category }} className={`group flex min-h-28 items-center justify-between gap-5 border-t border-border py-5 transition-colors hover:border-primary/50 ${className}`}>
      <span className="flex min-w-0 items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span>
        <span className="min-w-0"><span className="block font-display text-[17px] font-semibold">{m.name}</span><span className="mt-1 block text-[13px] leading-5 text-muted-foreground">{m.description}</span></span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
    </Link>
  );
}

function FeaturedMoment({ m, image, layout = "standard" }: { m: PracticeMoment; image: string; layout?: "standard" | "wide" | "full" }) {
  const Icon = ICONS[m.icon];
  return (
    <Link to="/practice" search={{ mode: m.category }} className={`group relative isolate min-h-[360px] overflow-hidden rounded-lg border border-border bg-card ${layout === "wide" ? "md:col-span-2 md:min-h-[520px]" : layout === "full" ? "md:col-span-3 md:min-h-[440px]" : "md:min-h-[520px]"}`}>
      <img src={image} alt="" loading="lazy" width={1600} height={1072} className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 md:p-8">
        <div>
          <span className="mb-4 grid size-10 place-items-center rounded-full border border-foreground/20 bg-background/60 text-primary backdrop-blur-md"><Icon className="size-4" aria-hidden="true" /></span>
          <h3 className="text-[26px] font-semibold leading-tight md:text-[30px]">{m.name}</h3>
          <p className="mt-2 max-w-[38ch] text-[14px] leading-6 text-foreground/75">{m.description}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight className="size-4" aria-hidden="true" /></span>
      </div>
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
  const { hero, transformations, contact } = home;
  const moments = dataProvider.getPracticeMoments();
  const featuredMoments = ["interview", "leadership", "presentation"].map((id) => moments.find((moment) => moment.id === id)).filter((moment): moment is PracticeMoment => Boolean(moment));
  const moreMoments = moments.filter((moment) => !MOMENT_IMAGES[moment.id]);
    const plans = dataProvider.getPricingPlans();
  const hydrated = useHydrated();
  const signedIn = useStore((s) => !!s.profile?.onboarded) && hydrated;
  const tryFree = () => { if (!getState().profile) seedDemo(); navigate({ to: "/practice/$questionId", params: { questionId: "int-3" } }); };
  const primaryCta = () => (signedIn ? navigate({ to: "/practice" }) : tryFree());
  return (
    <div className="overflow-x-clip pb-20 md:pb-0">
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
      <section id="how"><HowItWorksDemo /></section>

      {/* PRACTICE MOMENTS */}
      <Section id="modes" className="!py-20 md:!py-32">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><div className="product-kicker !text-primary">Choose your moment</div><h2 className={`${H2} mt-4 max-w-[720px]`}>Practice where clarity matters most.</h2></div>
          <p className="max-w-[34ch] text-[15px] leading-6 text-muted-foreground">Walk into the real conversation with your words already tested.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {featuredMoments.map((moment, index) => {
            const image = MOMENT_IMAGES[moment.id];
            if (!image) return null;
            return <FeaturedMoment key={moment.id} m={moment} image={image} layout={index === 0 ? "wide" : index === 2 ? "full" : "standard"} />;
          })}
        </div>
        <div className="mt-10 grid border-b border-border md:grid-cols-3 md:gap-8">
          {moreMoments.map((m) => <MomentCard key={m.id} m={m} />)}
        </div>
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
