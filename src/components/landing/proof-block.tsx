import { AlertTriangle, ArrowRight, Check, Quote } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const H2 = "text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]";

// Shorter, punchier quotes
const WHAT_YOU_SAID =
  "\u201CSo basically I've worked on a few things, and um, mostly backend…\u201D";

const TIGHTER_VERSION =
  "\u201CI'm a backend engineer with four years in payments. I've cut API latency by 40%, and I'm looking for a team where I can own reliability end to end.\u201D";

export function ProofBlock() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
      <ScrollReveal>
        <div className="eyebrow mb-3 text-center !text-primary">
          See what you get back
        </div>
        <h2 className={`${H2} mx-auto max-w-3xl text-center`}>
          One response. What got lost. What lands.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[15px] text-muted-foreground md:text-[17px]">
          Every practice returns a diagnosis, a tighter version, and one thing to fix.
        </p>
      </ScrollReveal>

      {/* Side-by-side on desktop — Before | After */}
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
        {/* BEFORE */}
        <ScrollReveal delay={80}>
          <div className="glass relative flex h-full flex-col p-6 md:p-7">
            <div className="flex items-center justify-between">
              <div className="eyebrow text-muted-foreground">What you said</div>
              <Quote className="size-3.5 text-muted-foreground/40" />
            </div>

            <p className="mt-4 text-[15px] italic leading-6 text-foreground/75">
              {WHAT_YOU_SAID}
            </p>

            {/* Inline diagnosis — compact 2-bullet summary */}
            <div className="mt-6 space-y-2 border-t border-destructive/20 pt-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-destructive">
                <AlertTriangle className="size-3" />
                What got lost
              </div>
              <ul className="space-y-1.5 text-[13.5px] leading-5 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-destructive/70" />
                  <span>
                    <strong className="font-medium text-foreground/90">
                      Point arrived at 0:38.
                    </strong>{" "}
                    First 37s were warm-up.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-destructive/70" />
                  <span>
                    <strong className="font-medium text-foreground/90">
                      Role never named.
                    </strong>{" "}
                    Listener can't picture where you fit.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </ScrollReveal>

        {/* AFTER */}
        <ScrollReveal delay={160}>
          <div className="glass-float relative flex h-full flex-col border-primary/45 p-6 md:p-7">
            <div className="flex items-center justify-between">
              <div className="eyebrow !text-primary">Same answer, sharper</div>
              <Check className="size-3.5 text-primary" />
            </div>

            <p className="mt-4 text-[15px] italic leading-6 text-foreground">
              {TIGHTER_VERSION}
            </p>

            {/* Fix next time */}
            <div className="mt-6 flex items-start gap-2.5 border-t border-primary/20 pt-5">
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  Fix next time
                </div>
                <p className="mt-1 text-[13.5px] leading-5 text-foreground/85">
                  Open with your role and one result.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-[12px] text-muted-foreground">
        Example only. Real outputs vary by response.
      </p>
    </section>
  );
}
