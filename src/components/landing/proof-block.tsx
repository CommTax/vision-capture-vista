import { AlertTriangle, ArrowRight, Check, Quote } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const H2 = "text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]";

const WHAT_YOU_SAID =
  "\u201CSo basically I've worked on a few things, and um, mostly backend, but also some other stuff, and I think what drives me is learning…\u201D";

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
          Every practice returns a diagnosis, a tighter version, and one thing to fix next time.
        </p>
      </ScrollReveal>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4">
        {/* What you said */}
        <ScrollReveal delay={80}>
          <div className="glass relative p-6 md:p-7">
            <Quote className="absolute right-6 top-6 size-4 text-muted-foreground/40" />
            <div className="eyebrow mb-3 text-muted-foreground">
              What you said
            </div>
            <p className="text-[16px] italic leading-7 text-foreground/85 md:text-[17px]">
              {WHAT_YOU_SAID}
            </p>
          </div>
        </ScrollReveal>

        {/* What got lost */}
        <ScrollReveal delay={160}>
          <div className="glass border-destructive/30 p-6 md:p-7">
            <div className="eyebrow mb-4 flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-3.5" />
              What got lost
            </div>
            <ul className="space-y-3 text-[15px] leading-6">
              <li className="flex gap-3">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-destructive" />
                <span>
                  <strong className="font-semibold text-foreground">Your point arrived at second 38.</strong>{" "}
                  <span className="text-muted-foreground">
                    The first 37 seconds were warm-up.
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-destructive" />
                <span>
                  <strong className="font-semibold text-foreground">The role you want never came up.</strong>{" "}
                  <span className="text-muted-foreground">
                    The listener can't picture where you'd fit.
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </ScrollReveal>

        {/* Tighter version */}
        <ScrollReveal delay={240}>
          <div className="glass-float border-primary/45 p-6 md:p-7">
            <div className="eyebrow mb-3 flex items-center gap-2 !text-primary">
              <Check className="size-3.5" />
              Tighter version
            </div>
            <p className="text-[16px] italic leading-7 text-foreground md:text-[17px]">
              {TIGHTER_VERSION}
            </p>
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  Fix next time
                </div>
                <p className="mt-1 text-[14px] leading-6 text-foreground/90">
                  Open with your role and one result. You have 15 seconds to
                  make the listener want to keep listening.
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
