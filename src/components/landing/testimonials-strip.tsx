import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { CarouselDots } from "./carousel-dots";

// ─────────────────────────────────────────────────────────────
// REAL TESTIMONIALS — DRAFTS
// Suggested wordings sent to the users for approval.
// Do not publish until each user confirms. Once approved, set
// `approved: true` on that testimonial.
// ─────────────────────────────────────────────────────────────

type Testimonial = {
  id: string;
  name: string;
  quote: string;
  /** Stable color for the avatar circle. */
  tint: string;
  /** Flip to true once the user has approved their quote. */
  approved?: boolean;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: "arun",
    name: "Arun",
    quote:
      "I always had the right points in my head, but I struggled to get to them without giving too much background. TheUnspoken helped me see exactly where I was losing the message — and how to get to the point faster.",
    tint: "rgb(139, 127, 255)", // violet
  },
  {
    id: "srikanth",
    name: "Srikanth",
    quote:
      "I used to explain things in the order they came to mind, not in the order people needed to hear them. The feedback helped me recognize that pattern and make my answers more structured, direct, and easier to follow.",
    tint: "rgb(96, 165, 250)", // sky
  },
  {
    id: "mian",
    name: "Mian",
    quote:
      "I didn't realize how often I softened my own point with phrases like \u201CI think\u201D and \u201Cmaybe.\u201D Seeing those habits in my actual responses made the feedback feel personal and practical. I could work on the way I communicate, not just read another set of tips.",
    tint: "rgb(251, 191, 36)", // amber
  },
  {
    id: "priya",
    name: "Priya",
    quote:
      "Practising an answer is one thing. Understanding how it actually comes across is another. TheUnspoken helped me see where my answer needed more focus and gave me a clear reason to try again. Each retry felt more purposeful.",
    tint: "rgb(249, 115, 111)", // coral
  },
  {
    id: "romeo",
    name: "Romeo",
    quote:
      "I knew what I wanted to communicate, but I wasn't always making the important part stand out. What I liked was seeing the difference between what I said and what really came through. It gave me something specific to improve instead of leaving me guessing.",
    tint: "rgb(52, 211, 153)", // emerald
  },
];

// ─────────────────────────────────────────────────────────────
// Testimonial card — full quote, no truncation
// ─────────────────────────────────────────────────────────────

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="glass flex h-full flex-col rounded-2xl border border-border p-5 md:p-6">
      {/* Header — avatar + name only */}
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

      {/* Full quote — no line-clamp */}
      <p className="mt-4 text-[13.5px] leading-6 text-foreground/85">
        {t.quote}
      </p>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export function TestimonialsStrip() {
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
            count={TESTIMONIALS.length}
            active={active}
            onSelect={goTo}
            label="Testimonials"
          />
        </div>

        {/* Scroll strip — mobile: horizontal scroll. Desktop: horizontal scroll too. */}
        <div
          ref={scrollerRef}
          className="
            -mx-5 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            md:mx-0 md:mt-10 md:gap-4 md:px-0
          "
        >
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal
              key={t.id}
              delay={i * 80}
              className="w-[72vw] max-w-[320px] shrink-0 snap-center md:w-[320px] md:max-w-none"
            >
              <TestimonialCard t={t} />
            </ScrollReveal>
          ))}
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
