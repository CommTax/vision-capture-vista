import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { CarouselDots } from "./carousel-dots";

// ─────────────────────────────────────────────────────────────
// REAL TESTIMONIALS — DRAFTS
// All quotes are suggested wordings awaiting approval.
// Publish only after each user confirms.
// ─────────────────────────────────────────────────────────────

type Testimonial = {
  id: string;
  name: string;
  quote: string;
  tint: string;
  primary: boolean;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: "arun",
    name: "Arun",
    quote:
      "I had the right points in my head, but too much background kept burying them. TheUnspoken showed me where I was losing the message.",
    tint: "rgb(167, 139, 250)",
    primary: true,
  },
  {
    id: "srikanth",
    name: "Srikanth",
    quote:
      "I explained things in the order they came to mind. The feedback helped me structure them the way people needed to hear.",
    tint: "rgb(96, 165, 250)",
    primary: true,
  },
  {
    id: "priya",
    name: "Priya",
    quote:
      "Practising is one thing. Understanding how it lands is another. Each retry felt more purposeful.",
    tint: "rgb(249, 115, 111)",
    primary: true,
  },
  {
    id: "mian",
    name: "Mian",
    quote:
      "I didn't realise how often I softened my own point with \u201CI think\u201D and \u201Cmaybe.\u201D Seeing those habits made the feedback feel personal.",
    tint: "rgb(251, 191, 36)",
    primary: false,
  },
  {
    id: "romeo",
    name: "Romeo",
    quote:
      "I wasn't making the important part stand out. TheUnspoken showed me the difference between what I said and what came through.",
    tint: "rgb(52, 211, 153)",
    primary: false,
  },
];

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="glass flex h-full flex-col rounded-2xl border border-border p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
          style={{
            background: t.tint,
            boxShadow: `0 0 0 1px ${t.tint}40`,
          }}
          aria-hidden
        >
          {t.name.charAt(0).toUpperCase()}
        </span>
        <div className="truncate text-[14px] font-semibold text-foreground">
          {t.name}
        </div>
      </div>

      <p className="mt-4 text-[13.5px] leading-6 text-foreground/85">
        {t.quote}
      </p>
    </article>
  );
}

export function TestimonialsStrip() {
  const [showAll, setShowAll] = useState(false);

  const primary = TESTIMONIALS.filter((t) => t.primary);
  const secondary = TESTIMONIALS.filter((t) => !t.primary);

  // Scroll tracking for the mobile carousel
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      children.forEach((child, i) => {
        const center = child.offsetLeft + child.offsetWidth / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.children[i] as HTMLElement | undefined;
    if (!target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  };

  return (
    <section className="border-y border-border bg-card/20">
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
        <ScrollReveal>
          <div className="text-center">
            <div className="eyebrow !text-primary">In their words</div>
            <p className="mt-2 text-[15px] text-muted-foreground md:text-[16px]">
              Practice sessions that changed something real.
              <span className="text-muted-foreground/60"> — Early user feedback</span>
            </p>
          </div>
        </ScrollReveal>

        {/* Dots — mobile only */}
        <div className="mt-6 md:hidden">
          <CarouselDots
            count={primary.length}
            active={active}
            onSelect={goTo}
            label="Testimonials"
          />
        </div>

        {/* Mobile: horizontal snap scroll. Desktop: 3-column grid. */}
        <div
          ref={scrollerRef}
          className="
            -mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0
          "
        >
          {primary.map((t, i) => (
            <div
              key={t.id}
              className="w-[78vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none"
            >
              <ScrollReveal delay={i * 80} className="h-full">
                <TestimonialCard t={t} />
              </ScrollReveal>
            </div>
          ))}
        </div>

        {/* More stories — reveal */}
        <div className="mt-6">
          <div
            className={`
              overflow-hidden transition-all duration-500
              ${showAll ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}
            `}
            aria-hidden={!showAll}
          >
            {/* Mobile: horizontal scroll. Desktop: 2-column grid. */}
            <div
              className="
                -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2
                [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0
              "
            >
              {secondary.map((t) => (
                <div
                  key={t.id}
                  className="w-[78vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none"
                >
                  <TestimonialCard t={t} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary underline-offset-4 transition hover:underline"
            >
              {showAll ? "Show less" : `More stories · ${secondary.length}`}
              <span
                className={`transition-transform duration-300 ${
                  showAll ? "rotate-180" : ""
                }`}
              >
                ↓
              </span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <ScrollReveal delay={240}>
          <div className="mt-10 flex flex-col items-center gap-6 border-t border-border pt-8 md:flex-row md:justify-center md:gap-16">
            <div className="text-center">
              <div className="font-display text-[36px] font-bold leading-none text-primary md:text-[40px]">
                50+
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Professionals practiced
              </div>
            </div>
            <div className="hidden h-10 w-px bg-border md:block" />
            <div className="text-center">
              <div className="font-display text-[36px] font-bold leading-none text-primary md:text-[40px]">
                1,084
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Drills last month
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
