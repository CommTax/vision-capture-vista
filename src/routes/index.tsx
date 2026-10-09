import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { getBackendSession } from "@/lib/backend-auth";
import { ArrowRight, Briefcase, MessageSquareWarning, Sparkles } from "lucide-react";
import { Logo, useHydrated } from "@/components/app-shell";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme";
import { StoryFlow } from "@/components/landing/story-flow";
import { TestimonialsStrip } from "@/components/landing/testimonials-strip";
import { ExploreSheet } from "@/components/landing/explore-sheet";
import { dataProvider } from "@/services/data-provider";
import { RotatingWord } from "@/components/landing-visuals";
import { HeroPreview } from "@/components/landing/hero-preview";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import type { PracticeMoment } from "@/content/types";
import { StackedPricing } from "@/components/landing/stacked-pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TheUnspoken — Say what you mean. Make it land." },
      { name: "description", content: "Practice the answers, conversations, and high-stakes moments that matter — then see exactly what gets lost when you speak." },
      { property: "og:title", content: "TheUnspoken — Say what you mean. Make it land." },
      { property: "og:description", content: "Practice what you need to say, see what isn't landing, fix it, and try again." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

// ─────────────────────────────────────────────────────────────
// Moment icons + tints
// ─────────────────────────────────────────────────────────────

const MOMENT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  interview: Briefcase,
  "high-stakes": MessageSquareWarning,
  presentation: Briefcase,
  leadership: Briefcase,
  persuasion: MessageSquareWarning,
  custom: Sparkles,
};

const MOMENT_TINTS: Record<string, string> = {
  interview: "rgb(167, 139, 250)",   // lilac
  "high-stakes": "rgb(110, 231, 183)", // mint
  custom: "rgb(249, 168, 158)",      // rose
  presentation: "rgb(251, 191, 36)", // amber
  leadership: "rgb(139, 127, 255)",
  persuasion: "rgb(96, 165, 250)",
};

// ─────────────────────────────────────────────────────────────
// Moment tile — tinted card with Explore action
// ─────────────────────────────────────────────────────────────

function MomentTile({
  m,
  tint,
  onExplore,
}: {
  m: PracticeMoment;
  tint: string;
  onExplore: () => void;
}) {
  const Icon = MOMENT_ICONS[m.id] ?? Briefcase;

  return (
    <button
      type="button"
      onClick={onExplore}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 text-left transition duration-500 hover:-translate-y-1 md:p-6"
      style={{
        background: `linear-gradient(160deg, ${tint}18 0%, ${tint}0a 55%, rgba(20, 22, 30, 0.4) 100%)`,
        borderColor: `${tint}35`,
        boxShadow: `0 20px 60px -30px ${tint}30`,
      }}
    >
      {/* Icon plate */}
      <div
        className="grid size-10 place-items-center rounded-lg transition-transform duration-500 group-hover:scale-105 md:size-11"
        style={{
          background: `${tint}20`,
          border: `1px solid ${tint}40`,
        }}
      >
        <Icon className="size-5" style={{ color: tint }} />
      </div>

      {/* Title */}
      <h3 className="mt-5 font-display text-[19px] font-bold leading-tight md:text-[21px]">
        {m.name}
      </h3>

      {/* Description */}
      <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground md:text-[13.5px]">
        {m.description}
      </p>

      {/* Explore */}
      <div
        className="mt-auto flex items-center gap-1 pt-6 text-[12.5px] font-semibold"
        style={{ color: tint }}
      >
        Explore
        <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────

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
  const items = dataProvider.getFaq();
  return (
    <section id="faq" className="mx-auto max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
      <h2 className="text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]">Questions</h2>
      <div className="mt-8 border-b border-border">
        {items.map((f, i) => (
          <FaqItem key={f.id} q={f.question} a={f.answer} id={`faq-${i}`} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────────────

const H2 = "text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]";
const SUB = "mt-3 text-[15px] text-muted-foreground md:text-[17px]";

function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return <section id={id} className={`mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14 ${className}`}>{children}</section>;
}

// ─────────────────────────────────────────────────────────────
// Modes section — tinted cards + Explore sheet
// ─────────────────────────────────────────────────────────────

function ModesSection({ moments }: { moments: PracticeMoment[] }) {
  const [exploreIndex, setExploreIndex] = useState<number | null>(null);
  const exploringMoment = exploreIndex !== null ? moments[exploreIndex] : null;
  const exploringTint = exploringMoment
    ? (MOMENT_TINTS[exploringMoment.id] ?? "rgb(139, 127, 255)")
    : "rgb(139, 127, 255)";

  return (
    <Section id="modes" className="!py-14 md:!py-20">
      <ScrollReveal>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className={H2}>Where should we start?</h2>
          <p className="max-w-[34ch] text-[15px] leading-6 text-muted-foreground">
            Walk into the real conversation with your words already tested.
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {moments.map((m, i) => (
          <ScrollReveal key={m.id} delay={i * 80} className="h-full">
            <MomentTile
              m={m}
              tint={MOMENT_TINTS[m.id] ?? "rgb(139, 127, 255)"}
              onExplore={() => setExploreIndex(i)}
            />
          </ScrollReveal>
        ))}
      </div>

      <ExploreSheet
        moment={exploringMoment}
        open={exploreIndex !== null}
        onClose={() => setExploreIndex(null)}
        tint={exploringTint}
      />
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────
// Landing
// ─────────────────────────────────────────────────────────────

function Landing() {
  const navigate = useNavigate();
  const home = dataProvider.getHomepageContent();
  const { hero, contact } = home;
  const moments = dataProvider.getPracticeMoments().slice(0, 3);
  const plans = dataProvider.getPricingPlans();
  const hydrated = useHydrated();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    void getBackendSession().then((session) => setSignedIn(!!session));
  }, [hydrated]);

  const tryFree = () => navigate({ to: "/practice" });
  const primaryCta = () => (signedIn ? navigate({ to: "/practice" }) : tryFree());

  return (
    <div className="overflow-x-clip pb-20 md:pb-0">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-[14px] font-semibold text-foreground md:flex">
            <Link to="/" className="hover:text-primary">Home</Link>
            <a href="#modes" className="hover:text-primary">Practice</a>
            <a href="#how" className="hover:text-primary">How it works</a>
            <a href="#pricing" className="hover:text-primary">Pricing</a>
            <a href="/university/index.html" className="hover:text-primary">University</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {signedIn ? (
              <Link to="/dashboard" className="btn btn-ghost btn-sm">Login</Link>
            ) : (
              <Link to="/signup" search={{ mode: "signin" }} className="btn btn-ghost btn-sm">Login</Link>
            )}
            <button onClick={primaryCta} className="btn btn-primary btn-sm hidden sm:inline-flex">
              {signedIn ? hero.ctaSignedIn : "Try TheUnspoken"}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-[1200px] px-5 pt-14 pb-14 md:px-8 md:pt-20 md:pb-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div className="rise">
            <h1 className="text-[clamp(36px,5.6vw,68px)] font-bold leading-[1.04]">
              <span className="block text-[0.82em] lg:whitespace-nowrap">{hero.headline}</span>
              <span className="block"><RotatingWord words={hero.rotatingWords} /></span>
              <span className="block">Responses</span>
            </h1>
            <p className="mt-6 max-w-[44ch] text-[17px] leading-7 md:text-[19px]">{hero.body}</p>
            <p className="mt-2 text-[13px] text-muted-foreground">{hero.audience}</p>
            <div className="mt-9">
              <button onClick={primaryCta} className="btn btn-primary px-6 py-3 text-[15px]">
                {signedIn ? hero.ctaSignedIn : "Try TheUnspoken"}
                <ArrowRight className="ml-1 size-4" />
              </button>
              <p className="mt-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
                no card required · free practices · voice or text
              </p>
            </div>
          </div>
          <div className="hidden md:block"><HeroPreview /></div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsStrip />

      {/* STORY FLOW */}
      <StoryFlow />

      {/* PRACTICE MOMENTS */}
      <ModesSection moments={moments} />

      {/* PRICING */}
      <Section id="pricing">
        <ScrollReveal>
          <h2 className={H2}>Pricing</h2>
          <p className={`${SUB} max-w-2xl`}>
            Start free. Upgrade when you want unlimited practice, deeper analysis, or a focused program.
          </p>
        </ScrollReveal>

        <StackedPricing plans={plans} />
      </Section>

      <FaqSection />

      <section id="contact" className="mx-auto max-w-[1200px] px-5 md:px-8">
        <a href={`mailto:${contact.email}`} className="flex items-center justify-between border-y border-border py-6">
          <span className="font-display text-[20px] font-bold">Have a question?</span>
          <span className="text-[14px] text-primary">Contact us →</span>
        </a>
      </section>

      <Section>
        <ScrollReveal>
          <div className="text-center">
            <h2 className={`${H2} mx-auto max-w-3xl`}>Practice until the important thing doesn't get lost.</h2>
            <p className={`${SUB} mx-auto max-w-xl`}>
              Your next interview. Your next presentation. Your next difficult conversation.
            </p>
            <button onClick={primaryCta} className="btn btn-primary mt-9 px-6 py-3 text-[15px]">
              {signedIn ? hero.ctaSignedIn : "Try TheUnspoken"}
              <ArrowRight className="ml-1 size-4" />
            </button>
            <p className="mt-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
              no card required · free practices · voice or text
            </p>
          </div>
        </ScrollReveal>
      </Section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center md:px-8">
          <Logo />
          <div className="flex gap-6 text-[13px] text-muted-foreground">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href={`mailto:${contact.email}`}>Contact</a>
          </div>
        </div>
      </footer>
      <MobileNav />
    </div>
  );
}
