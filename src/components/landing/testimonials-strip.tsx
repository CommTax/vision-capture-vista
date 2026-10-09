import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

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
  /** Shown on the primary row (up to 3). */
  primary: boolean;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: "arun",
    name: "Arun",
    quote:
      "I had the right points in my head, but too much background kept burying them. TheUnspoken showed me where I was losing the message.",
    tint: "rgb(167, 139, 250)", // lilac
    primary: true,
  },
  {
    id: "srikanth",
    name: "Srikanth",
    quote:
      "I explained things in the order they came to mind. The feedback helped me structure them the way people needed to hear.",
    tint: "rgb(96, 165, 250)", // sky
    primary: true,
  },
  {
    id: "priya",
    name: "Priya",
    quote:
      "Practising is one thing. Understanding how it lands is another. Each retry felt more purposeful.",
    tint: "rgb(249, 115, 111)", // coral
    primary: true,
  },
  {
    id: "mian",
    name: "Mian",
    quote:
      "I didn't realise how often I softened my own point with \u201CI think\u201D and \u201Cmaybe.\u201D Seeing those habits made the feedback feel personal.",
    tint: "rgb(251, 191, 36)", // amber
    primary: false,
  },
  {
    id: "romeo",
    name: "Romeo",
    quote:
      "I wasn't making the important part stand out. TheUnspoken showed me the difference between what I said and what came through.",
    tint: "rgb(52, 211, 153)", // emerald
    primary: false,
  },
];

// ─────────────────────────────────────────────────────────────
// Card — compact, one-line quote style
// ─────────────────────────────────────────────────────────────

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="glass flex h-full flex-col rounded-2xl border border-border p-5 md:p-6">
      {/* Header: avatar + name only */}
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

      {/* Quote */}
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
  const [showAll, setShowAll] = useState(false);

  const primary = TESTIMONIALS.filter((t) => t.primary);
  const secondary = TESTIMONIALS.filter((t) => !t.primary);

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

        {/* Primary row: 3 cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {primary.map((t, i) => (
            <ScrollReveal key={t.id} delay={i * 80} className="h-full">
              <TestimonialCard t={t} />
            </ScrollReveal>
          ))}
        </div>

        {/* More stories — reveal */}
        <div className="mt-4">
          <div
            className={`grid grid-cols-1 gap-4 overflow-hidden transition-all duration-500 md:grid-cols-2 ${
              showAll ? "mt-4 max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
            }`}
            aria-hidden={!showAll}
          >
            {secondary.map((t) => (
              <div key={t.id} className="h-full">
                <TestimonialCard t={t} />
              </div>
            ))}
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
