import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ScrollReveal — appears when in view, respects reduced motion
// ─────────────────────────────────────────────────────────────

function ScrollReveal({
  children,
  delay = 0,
  y = 16,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const style: React.CSSProperties = reduced
    ? {}
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
      };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat shell — consistent vertical rhythm per beat
// ─────────────────────────────────────────────────────────────

function Beat({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex min-h-[60vh] max-w-[1200px] flex-col justify-center px-5 py-16 md:min-h-[70vh] md:px-8 md:py-24 ${className}`}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 1 — "It sees what you don't."
// ─────────────────────────────────────────────────────────────

function BeatOne() {
  return (
    <Beat>
      <ScrollReveal>
        <h2 className="text-center text-[clamp(38px,7vw,80px)] font-bold leading-[1.05] tracking-tight">
          It sees
          <br />
          what you don't.
        </h2>
      </ScrollReveal>
    </Beat>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 2 — Scattered response, annotated
// ─────────────────────────────────────────────────────────────

const SCATTERED_QUOTE =
  "So basically, I've worked on a few things, and um, mostly backend, but also some other frontend stuff and product, and I think what drives me is learning and how things come together, and I'm really interested in building…";

type Annotation = {
  label: string;
  time: string;
  color: string;
  bg: string;
  border: string;
};

const ANNOTATIONS: Annotation[] = [
  {
    label: "Context",
    time: "0:00 – 0:08",
    color: "rgb(96, 165, 250)",
    bg: "rgba(96, 165, 250, 0.08)",
    border: "rgba(96, 165, 250, 0.35)",
  },
  {
    label: "Qualifier",
    time: "0:08 – 0:14",
    color: "rgb(251, 191, 36)",
    bg: "rgba(251, 191, 36, 0.08)",
    border: "rgba(251, 191, 36, 0.35)",
  },
  {
    label: "Tangent",
    time: "0:14 – 0:22",
    color: "rgb(249, 115, 111)",
    bg: "rgba(249, 115, 111, 0.08)",
    border: "rgba(249, 115, 111, 0.35)",
  },
  {
    label: "Hedge",
    time: "0:22 – 0:28",
    color: "rgb(167, 139, 250)",
    bg: "rgba(167, 139, 250, 0.08)",
    border: "rgba(167, 139, 250, 0.35)",
  },
  {
    label: "Side thought",
    time: "0:28 – 0:34",
    color: "rgb(56, 189, 248)",
    bg: "rgba(56, 189, 248, 0.08)",
    border: "rgba(56, 189, 248, 0.35)",
  },
  {
    label: "Intent",
    time: "0:34 – 0:38",
    color: "rgb(52, 211, 153)",
    bg: "rgba(52, 211, 153, 0.08)",
    border: "rgba(52, 211, 153, 0.35)",
  },
];

function BeatTwo() {
  return (
    <Beat>
      <ScrollReveal>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:gap-14">
            {/* Left — quote card */}
            <div>
              <div className="flex items-center justify-between">
                <span className="eyebrow text-muted-foreground">You said</span>
                <span className="font-mono text-[11px] text-muted-foreground">00:38</span>
              </div>

              <div className="glass mt-4 rounded-2xl p-6 md:p-7">
                <p className="text-[15.5px] leading-7 text-foreground/85 md:text-[16px]">
                  {SCATTERED_QUOTE}
                </p>
                {/* Fake waveform row at the bottom of the card */}
                <div className="mt-6 flex h-8 items-end gap-[3px] border-t border-border pt-3">
                  {Array.from({ length: 42 }, (_, i) => {
                    const h = Math.abs(Math.sin(i * 0.71) * 16) + 4;
                    return (
                      <span
                        key={i}
                        className="flex-1 rounded-sm bg-accent/55"
                        style={{ height: h }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right — annotations */}
            <div className="flex flex-col justify-center gap-2.5">
              {ANNOTATIONS.map((a, i) => (
                <ScrollReveal key={a.label} delay={i * 90}>
                  <div className="flex items-center gap-3.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: a.color }}
                    />
                    <div className="flex flex-1 items-baseline justify-between gap-4">
                      <span
                        className="font-mono text-[11px] uppercase tracking-[0.14em]"
                        style={{ color: a.color }}
                      >
                        {a.label}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                        {a.time}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </Beat>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 3 — Diagnosis
// ─────────────────────────────────────────────────────────────

function BeatThree() {
  return (
    <Beat>
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-[clamp(32px,5vw,56px)] font-bold leading-tight">
            Your point is still buried.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-6 text-muted-foreground md:text-[16px]">
            You know what you want to say. But your answer makes the listener work for it.
          </p>
        </div>
      </ScrollReveal>
    </Beat>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 4 — Clean retry
// ─────────────────────────────────────────────────────────────

const CLEAN_QUOTE =
  "I'm a backend engineer with four years in payments. I've reduced API latency by 40%, and I'm looking for a role where I can own reliability end to end.";

function BeatFour() {
  return (
    <Beat>
      <ScrollReveal>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:gap-14">
            {/* Left — clean quote */}
            <div>
              <div className="flex items-center justify-between">
                <span className="eyebrow !text-primary">Try again</span>
                <span className="font-mono text-[11px] text-muted-foreground">00:05</span>
              </div>

              <div className="glass-float mt-4 rounded-2xl border-primary/40 p-6 md:p-7">
                <p className="text-[15.5px] leading-7 text-foreground md:text-[16px]">
                  {CLEAN_QUOTE}
                </p>
                <div className="mt-6 flex h-8 items-end gap-[3px] border-t border-primary/20 pt-3">
                  {Array.from({ length: 42 }, (_, i) => {
                    const h = Math.abs(Math.sin(i * 0.9) * 14) + 5;
                    return (
                      <span
                        key={i}
                        className="flex-1 rounded-sm bg-primary/60"
                        style={{ height: h }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right — outcome */}
            <div className="flex flex-col justify-center">
              <ScrollReveal delay={120}>
                <p className="font-display text-[clamp(28px,4vw,42px)] font-bold leading-tight">
                  That landed.
                </p>
                <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
                  Same experience. A clearer signal.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </Beat>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 5 — The numbers
// ─────────────────────────────────────────────────────────────

function BeatFive() {
  return (
    <Beat>
      <ScrollReveal>
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-4 md:gap-8">
            <span className="font-display text-[clamp(56px,10vw,120px)] font-bold leading-none text-muted-foreground/35 line-through decoration-destructive/60 decoration-2">
              23s
            </span>
            <ArrowRight className="size-6 text-muted-foreground md:size-8" />
            <span className="font-display text-[clamp(56px,10vw,120px)] font-bold leading-none text-primary">
              5s
            </span>
          </div>
          <p className="mx-auto mt-8 max-w-md text-[15px] leading-6 text-muted-foreground">
            Same answer. Same person.{" "}
            <span className="text-foreground/80">18 seconds faster to the point.</span>
          </p>
        </div>
      </ScrollReveal>
    </Beat>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 6 — Final CTA
// ─────────────────────────────────────────────────────────────

function BeatSix() {
  return (
    <Beat className="pb-20 md:pb-28">
      <ScrollReveal>
        <div className="text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(28px,4.5vw,52px)] font-bold leading-[1.1]">
            Practice the moment.
            <br />
            See what got lost.
            <br />
            Say it again.
          </h2>

          <div className="mt-10">
            <Link
              to="/practice"
              className="btn btn-primary px-7 py-3.5 text-[16px]"
            >
              Try TheUnspoken <ArrowRight className="ml-1 size-4" />
            </Link>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              No card required · Free practices · Voice or text
            </p>
          </div>
        </div>
      </ScrollReveal>
    </Beat>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export — assembles the six beats
// ─────────────────────────────────────────────────────────────

export function StoryFlow() {
  return (
    <section id="how" className="relative">
      {/* Section header */}
      <div className="mx-auto max-w-2xl px-5 pt-16 pb-4 text-center md:px-8 md:pt-24 md:pb-8">
        <ScrollReveal>
          <div className="eyebrow !text-primary">Three things cost you the role.</div>
          <p className="mt-4 text-balance text-[clamp(20px,2.6vw,30px)] font-bold leading-tight text-muted-foreground">
            It's rarely the ideas.{" "}
            <span className="text-foreground">It's how they land.</span>
          </p>
        </ScrollReveal>
      </div>

      {/* The six beats */}
      <BeatOne />
      <BeatTwo />
      <BeatThree />
      <BeatFour />
      <BeatFive />
      <BeatSix />
    </section>
  );
}
