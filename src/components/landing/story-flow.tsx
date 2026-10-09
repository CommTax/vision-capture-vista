import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_ADVANCE_MS = 6000;
const IDLE_RESUME_MS = 12000;

// ─────────────────────────────────────────────────────────────
// Media / reduced-motion hooks
// ─────────────────────────────────────────────────────────────

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

// ─────────────────────────────────────────────────────────────
// Beat content — the six story panels
// ─────────────────────────────────────────────────────────────

const SCATTERED_QUOTE =
  "So basically, I've worked on a few things, and um, mostly backend, but also some other frontend stuff and product, and I think what drives me is learning and how things come together, and I'm really interested in building…";

const CLEAN_QUOTE =
  "I'm a backend engineer with four years in payments. I've reduced API latency by 40%, and I'm looking for a role where I can own reliability end to end.";

const ANNOTATIONS = [
  { label: "Context",      time: "0:00 – 0:08", color: "rgb(96, 165, 250)"  },
  { label: "Qualifier",    time: "0:08 – 0:14", color: "rgb(251, 191, 36)"  },
  { label: "Tangent",      time: "0:14 – 0:22", color: "rgb(249, 115, 111)" },
  { label: "Hedge",        time: "0:22 – 0:28", color: "rgb(167, 139, 250)" },
  { label: "Side thought", time: "0:28 – 0:34", color: "rgb(56, 189, 248)"  },
  { label: "Intent",       time: "0:34 – 0:38", color: "rgb(52, 211, 153)"  },
];

// ─────────────────────────────────────────────────────────────
// Beat 1 — Promise
// ─────────────────────────────────────────────────────────────

function BeatOne() {
  return (
    <div className="flex h-full flex-col justify-center">
      <h2 className="text-center text-[clamp(34px,6vw,72px)] font-bold leading-[1.05] tracking-tight">
        It sees
        <br />
        what you don&apos;t.
      </h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 2 — Scattered response, annotated
// ─────────────────────────────────────────────────────────────

function BeatTwo() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12">
        {/* Left — quote card */}
        <div>
          <div className="flex items-center justify-between">
            <span className="eyebrow text-muted-foreground">You said</span>
            <span className="font-mono text-[11px] text-muted-foreground">00:38</span>
          </div>

          <div className="glass mt-3 rounded-2xl p-5 md:p-6">
            <p className="text-[14.5px] leading-7 text-foreground/85 md:text-[15px]">
              {SCATTERED_QUOTE}
            </p>
            <div className="mt-5 flex h-7 items-end gap-[3px] border-t border-border pt-3">
              {Array.from({ length: 42 }, (_, i) => {
                const h = Math.abs(Math.sin(i * 0.71) * 14) + 4;
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
        <div className="flex flex-col justify-center gap-2">
          {ANNOTATIONS.map((a) => (
            <div key={a.label} className="flex items-center gap-3.5">
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
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 3 — Diagnosis
// ─────────────────────────────────────────────────────────────

function BeatThree() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-[clamp(30px,4.5vw,52px)] font-bold leading-tight">
          Your point is still buried.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-6 text-muted-foreground">
          You know what you want to say. But your answer makes the listener work for it.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 4 — Clean retry
// ─────────────────────────────────────────────────────────────

function BeatFour() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12">
        {/* Left — clean quote */}
        <div>
          <div className="flex items-center justify-between">
            <span className="eyebrow !text-primary">Try again</span>
            <span className="font-mono text-[11px] text-muted-foreground">00:05</span>
          </div>

          <div className="glass-float mt-3 rounded-2xl border-primary/40 p-5 md:p-6">
            <p className="text-[14.5px] leading-7 text-foreground md:text-[15px]">
              {CLEAN_QUOTE}
            </p>
            <div className="mt-5 flex h-7 items-end gap-[3px] border-t border-primary/20 pt-3">
              {Array.from({ length: 42 }, (_, i) => {
                const h = Math.abs(Math.sin(i * 0.9) * 12) + 5;
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
          <p className="font-display text-[clamp(26px,4vw,40px)] font-bold leading-tight">
            That landed.
          </p>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
            Same experience. A clearer signal.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 5 — Numbers
// ─────────────────────────────────────────────────────────────

function BeatFive() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-4 md:gap-8">
          <span className="font-display text-[clamp(52px,9vw,110px)] font-bold leading-none text-muted-foreground/35 line-through decoration-destructive/60 decoration-2">
            23s
          </span>
          <ArrowRight className="size-6 text-muted-foreground md:size-8" />
          <span className="font-display text-[clamp(52px,9vw,110px)] font-bold leading-none text-primary">
            5s
          </span>
        </div>
        <p className="mx-auto mt-6 max-w-md text-[15px] leading-6 text-muted-foreground">
          Same answer. Same person.{" "}
          <span className="text-foreground/80">18 seconds faster to the point.</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 6 — Final CTA
// ─────────────────────────────────────────────────────────────

function BeatSix() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="text-center">
        <h2 className="mx-auto max-w-3xl text-balance text-[clamp(26px,4vw,48px)] font-bold leading-[1.1]">
          Practice the moment.
          <br />
          See what got lost.
          <br />
          Say it again.
        </h2>

        <div className="mt-8">
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
    </div>
  );
}

const BEATS = [
  { id: "b1", node: <BeatOne /> },
  { id: "b2", node: <BeatTwo /> },
  { id: "b3", node: <BeatThree /> },
  { id: "b4", node: <BeatFour /> },
  { id: "b5", node: <BeatFive /> },
  { id: "b6", node: <BeatSix /> },
];

// ─────────────────────────────────────────────────────────────
// Horizontal scroller (desktop + mobile, no reduced motion)
// ─────────────────────────────────────────────────────────────

function HorizontalStory() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userInteractedAt, setUserInteractedAt] = useState(0);
  const reduced = usePrefersReducedMotion();

  // Scroll to a specific beat
  const goTo = useCallback((index: number, smooth = true) => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.children[index] as HTMLElement | undefined;
    if (!target) return;
    el.scrollTo({
      left: target.offsetLeft,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // Listen for scroll to update active dot
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

  // Auto-advance — pauses on hover, resumes after idle after manual interaction
  useEffect(() => {
    if (reduced) return;
    if (hovering) return;
    const sinceInteraction = Date.now() - userInteractedAt;
    if (sinceInteraction < IDLE_RESUME_MS) return;

    const timer = setTimeout(() => {
      goTo((active + 1) % BEATS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [active, hovering, userInteractedAt, reduced, goTo]);

  // Detect manual user scroll (touch/mouse wheel/keys) to pause auto-advance
  const markInteraction = useCallback(() => {
    setUserInteractedAt(Date.now());
  }, []);

  const canPrev = active > 0;
  const canNext = active < BEATS.length - 1;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Scroller */}
      <div
        ref={scrollerRef}
        onWheel={markInteraction}
        onTouchStart={markInteraction}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            markInteraction();
            goTo(Math.max(0, active - 1));
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            markInteraction();
            goTo(Math.min(BEATS.length - 1, active + 1));
          }
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Six-panel product story"
        className="
          flex h-[70vh] min-h-[420px] w-full snap-x snap-mandatory
          overflow-x-auto overflow-y-hidden
          scroll-smooth outline-none
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {BEATS.map((beat, i) => (
          <div
            key={beat.id}
            className="
              flex h-full w-[90vw] shrink-0 snap-center items-center
              px-5 sm:w-[85vw] md:w-[80vw] md:px-10
              lg:w-[min(1100px,80vw)]
            "
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${BEATS.length}`}
          >
            <div className="w-full">{beat.node}</div>
          </div>
        ))}
      </div>

      {/* Side arrows — desktop only, subtle */}
      <button
        type="button"
        onClick={() => {
          markInteraction();
          goTo(Math.max(0, active - 1));
        }}
        disabled={!canPrev}
        aria-label="Previous"
        className="absolute left-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur transition hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground md:flex"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          markInteraction();
          goTo(Math.min(BEATS.length - 1, active + 1));
        }}
        disabled={!canNext}
        aria-label="Next"
        className="absolute right-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur transition hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground md:flex"
      >
        <ChevronRight className="size-4" />
      </button>

      {/* Dots */}
      <div
        className="mt-6 flex items-center justify-center gap-2.5"
        role="tablist"
        aria-label="Story panels"
      >
        {BEATS.map((beat, i) => (
          <button
            key={beat.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Panel ${i + 1}`}
            onClick={() => {
              markInteraction();
              goTo(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active
                ? "w-8 bg-primary"
                : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Vertical fallback — reduced motion
// ─────────────────────────────────────────────────────────────

function VerticalStory() {
  return (
    <div className="mx-auto max-w-[1200px]">
      {BEATS.map((beat) => (
        <div key={beat.id} className="px-5 py-14 md:px-8 md:py-20">
          {beat.node}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export function StoryFlow() {
  const reduced = usePrefersReducedMotion();

  return (
    <section id="how" className="relative">
      {/* Section header */}
      <div className="mx-auto max-w-2xl px-5 pt-10 pb-6 text-center md:px-8 md:pt-14 md:pb-10">
        <div className="eyebrow !text-primary">
          Three things cost you the role.
        </div>
        <p className="mt-3 text-balance text-[clamp(20px,2.6vw,28px)] font-bold leading-tight text-muted-foreground">
          It&apos;s rarely the ideas.{" "}
          <span className="text-foreground">It&apos;s how they land.</span>
        </p>
      </div>

      {reduced ? <VerticalStory /> : <HorizontalStory />}
    </section>
  );
}
