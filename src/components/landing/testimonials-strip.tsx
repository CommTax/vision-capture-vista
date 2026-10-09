import { ScrollReveal } from "./scroll-reveal";

type Testimonial = {
  id: string;
  /** Placeholder text — replace with a real screenshot when available. */
  placeholderName: string;
  placeholderRole: string;
  /** Optional real image URL. Leave undefined to show the placeholder. */
  imageUrl?: string;
  /** Optional real quote. Leave undefined if using an image. */
  quote?: string;
  /** Optional attribution. */
  author?: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    placeholderName: "Testimonial 1",
    placeholderRole: "Add screenshot",
    // imageUrl: "/testimonials/priya.png",     // ← uncomment when you have a real screenshot
    // quote: "I did three practices before my PM interview. The pattern it showed me was the reason I got the offer.",
    // author: "Priya, Product Manager",
  },
  {
    id: "t2",
    placeholderName: "Testimonial 2",
    placeholderRole: "Add screenshot",
  },
  {
    id: "t3",
    placeholderName: "Testimonial 3",
    placeholderRole: "Add screenshot",
  },
  {
    id: "t4",
    placeholderName: "Testimonial 4",
    placeholderRole: "Add screenshot",
  },
];

export function TestimonialsStrip() {
  return (
    <section className="border-y border-border bg-card/20">
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
        <ScrollReveal>
          <div className="text-center">
            <div className="eyebrow !text-primary">In their words</div>
            <p className="mt-2 text-[15px] text-muted-foreground md:text-[16px]">
              Real practice sessions, real improvement.
            </p>
          </div>
        </ScrollReveal>

        {/* Horizontal scroll — mobile-first, becomes a row on desktop */}
        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.id} delay={i * 80} className="w-[78vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none">
              <article className="glass flex h-full flex-col rounded-2xl p-5">
                {t.imageUrl ? (
                  <img
                    src={t.imageUrl}
                    alt={t.author ? `Testimonial from ${t.author}` : "Testimonial"}
                    className="w-full rounded-xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border bg-background/40">
                    <div className="text-center">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                        {t.placeholderName}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground/60">
                        {t.placeholderRole}
                      </div>
                    </div>
                  </div>
                )}

                {t.quote && (
                  <p className="mt-4 text-[13.5px] leading-6 text-foreground/85">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                )}
                {t.author && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    — {t.author}
                  </p>
                )}
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Stat line below */}
        <ScrollReveal delay={240}>
          <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-8 md:flex-row md:justify-center md:gap-12">
            <div className="text-center">
              <div className="font-display text-[32px] font-bold leading-none text-primary md:text-[36px]">
                50+
              </div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Professionals practiced
              </div>
            </div>
            <div className="hidden h-10 w-px bg-border md:block" />
            <div className="text-center">
              <div className="font-display text-[32px] font-bold leading-none text-primary md:text-[36px]">
                1,084
              </div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Drills last month
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
