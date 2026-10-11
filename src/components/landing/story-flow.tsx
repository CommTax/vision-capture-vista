import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Reduced motion hook
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
// Timeline bar — the horizontal segmented strip.
// Uniform brown/tan palette, high-contrast labels.
// ─────────────────────────────────────────────────────────────

type Segment = {
  label: string;
  time: string;
  /** Flex-grow weight. Segments scale proportionally. */
  weight: number;
  /** Optional: mark this segment as where the point lands. */
  pointLands?: boolean;
};

const SCATTERED_SEGMENTS: Segment[] = [
  { label: "Context",      time: "0:00–0:08", weight: 8 },
  { label: "Qualifier",    time: "0:08–0:12", weight: 4 },
  { label: "Tangent",      time: "0:12–0:20", weight: 8 },
  { label: "Hedge",        time: "0:20–0:28", weight: 8 },
  { label: "Side thought", time: "0:28–0:33", weight: 5 },
  { label: "Intent",       time: "0:33–0:38", weight: 5, pointLands: true },
];

const CLEAN_SEGMENTS: Segment[] = [
  { label: "Role",   time: "0:00–0:04", weight: 4 },
  { label: "Result", time: "0:04–0:07", weight: 3, pointLands: true },
  { label: "Ask",    time: "0:07–0:11", weight: 4 },
];

function TimelineBars({
  segments,
  pointLabel,
  pointAt,
  variant = "muted",
}: {
  segments: Segment[];
  pointLabel?: string;
  /** Percentage (0-100) where the marker line should sit. */
  pointAt?: number;
  variant?: "muted" | "accent";
}) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);

  const barBg =
    variant === "accent"
      ? "rgb(190, 130, 80)"
      : "rgb(150, 115, 82)";
  const barBgAlt =
    variant === "accent"
      ? "rgb(205, 145, 95)"
      : "rgb(135, 105, 75)";
  const barText = "rgb(245, 240, 235)";
  const pointColor = "rgb(235, 150, 70)";

  return (
    <div className="relative">
      {pointLabel && pointAt !== undefined && (
        <div
          className="pointer-events-none absolute -top-7 z-10"
          style={{
            left: `${pointAt}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="whitespace-nowrap font-medium text-[11px] md:text-[12px]"
            style={{ color: pointColor }}
          >
            {pointLabel}
          </div>
          <div
            className="mx-auto mt-0.5 w-px"
            style={{ background: pointColor, height: "14px" }}
          />
        </div>
      )}

      <div className="flex h-12 w-full overflow-hidden rounded-md md:h-11">
        {segments.map((seg, i) => {
          const widthPct = (seg.weight / total) * 100;
          const isAlt = i % 2 === 1;
          return (
            <div
              key={seg.label}
              className="relative flex items-center px-1.5 md:px-3"
              style={{
                width: `${widthPct}%`,
                background: isAlt ? barBgAlt : barBg,
                color: barText,
                borderRight:
                  i < segments.length - 1
                    ? "1px solid rgba(0,0,0,0.18)"
                    : "none",
              }}
            >
              <span className="text-[10px] font-semibold leading-[1.15] tracking-[0.01em] md:text-[12.5px] md:leading-[1.2]">
                {seg.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex w-full">
        {segments.map((seg) => {
          const widthPct = (seg.weight / total) * 100;
          return (
            <div
              key={seg.label}
              className="font-mono text-[9px] leading-none text-muted-foreground/70 md:text-[10px]"
              style={{ width: `${widthPct}%` }}
            >
              {seg.time}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 1 — Promise + illustration
// ─────────────────────────────────────────────────────────────

function HeroCardIllustration() {
  return (
    <div className="relative aspect-square w-full max-w-[280px] md:max-w-[340px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,127,255,0.4), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute left-2 top-6 h-[78%] w-[68%] rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm"
        style={{
          transform: "rotate(-8deg)",
          boxShadow: "0 20px 60px -30px rgba(139,127,255,0.3)",
        }}
      />
      <div
        aria-hidden
        className="absolute right-2 top-10 h-[74%] w-[62%] rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm"
        style={{
          transform: "rotate(6deg)",
          boxShadow: "0 20px 60px -30px rgba(139,127,255,0.3)",
        }}
      />
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="relative flex aspect-[3/4] w-[62%] items-center justify-center rounded-3xl border border-border bg-card/70 backdrop-blur-md"
          style={{
            boxShadow:
              "0 30px 80px -30px rgba(139,127,255,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="relative grid size-20 place-items-center rounded-full"
            style={{
              background:
                "linear-gradient(150deg, rgba(139,127,255,0.35) 0%, rgba(139,127,255,0.15) 100%)",
              boxShadow: "0 0 60px 10px rgba(139,127,255,0.35)",
            }}
          >
            <div className="flex h-6 items-center gap-[3px]">
              {[6, 12, 18, 24, 18, 14, 10, 16, 12, 8].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-primary"
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function BeatOne() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-6 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
        <div>
          <h2 className="text-[clamp(28px,5vw,64px)] font-bold leading-[1.05] tracking-tight">
            The Unspoken sees
            <br />
            what you don&apos;t.
          </h2>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-[200px] md:max-w-[340px]">
            <HeroCardIllustration />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 2 — Scattered response with horizontal timeline bars
// ─────────────────────────────────────────────────────────────

function BeatTwo() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground md:text-[11px]">
            You said
          </span>
          <span className="font-mono text-[10px] text-muted-foreground md:text-[11px]">
            0:38
          </span>
        </div>

        <p className="text-[14.5px] italic leading-7 text-muted-foreground/90 md:text-[16px] md:leading-8">
          So basically, I&apos;ve worked on a few things, and um, mostly backend, but also
          some other frontend stuff and product, and I think what drives me is learning
          and how things come together,{" "}
          <span className="text-primary">and I&apos;m really interested in building…</span>
        </p>

        <div className="mt-8 md:mt-10">
          <TimelineBars
            segments={SCATTERED_SEGMENTS}
            pointLabel="Your point · 0:33"
            pointAt={85}
            variant="muted"
          />
        </div>

        <h3 className="mt-8 text-balance font-display text-[clamp(22px,3.5vw,34px)] font-bold leading-tight md:mt-10">
          Your point is{" "}
          <span className="text-primary">just scattered &amp; buried.</span>
        </h3>
        <p className="mt-2 text-[12.5px] leading-5 text-muted-foreground md:text-[14px] md:leading-6">
          Your point arrived at <span className="text-foreground">0:33</span>. The first
          33 seconds were setup.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 3 — Clean retry with horizontal timeline bars
// ─────────────────────────────────────────────────────────────

function BeatThree() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary md:text-[11px]">
            Pattern Awareness &amp; Revised Response
          </span>
          <span className="font-mono text-[10px] text-muted-foreground md:text-[11px]">
            0:11
          </span>
        </div>

        <p className="text-[14.5px] italic leading-7 text-foreground/90 md:text-[16px] md:leading-8">
          I&apos;m a backend engineer with four years in payments. I&apos;ve reduced API
          latency by 40%, and I&apos;m looking for a role where I can own reliability end
          to end.
        </p>

        <div className="mt-8 md:mt-10">
          <TimelineBars
            segments={CLEAN_SEGMENTS}
            pointLabel="Your point · 0:04"
            pointAt={30}
            variant="accent"
          />
        </div>

        <h3 className="mt-8 text-balance font-display text-[clamp(22px,3.5vw,34px)] font-bold leading-tight md:mt-10">
          Your point arrived at{" "}
          <span className="text-primary">0:04</span>.
        </h3>
        <p className="mt-2 text-[12.5px] leading-5 text-muted-foreground md:text-[14px] md:leading-6">
          Clean. One idea. One outcome.
          Same experience. A clearer signal.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beats registry
// ─────────────────────────────────────────────────────────────

const BEATS = [
  { id: "b1", node: <BeatOne /> },
  { id: "b2", node: <BeatTwo /> },
  { id: "b3", node: <BeatThree /> },
];

// ─────────────────────────────────────────────────────────────
// Horizontal carousel — one card at a time, no autoplay
// ─────────────────────────────────────────────────────────────

function HorizontalStory() {
  const [active, setActive] = useState(0);
  const total = BEATS.length;

  const go = useCallback(
    (next: number) => {
      setActive(Math.max(0, Math.min(total - 1, next)));
    },
    [total],
  );

  const canPrev = active > 0;
  const canNext = active < total - 1;

  return (
    <div
      className="relative mx-auto w-full max-w-[1200px] px-5 md:px-8"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(active - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(active + 1);
        }
      }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product story"
    >
      <div className="relative">
        {/* Prev arrow — always visible, above the card */}
        <button
          type="button"
          onClick={() => go(active - 1)}
          disabled={!canPrev}
          aria-label="Previous panel"
          className="absolute left-0 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 backdrop-blur transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground md:size-12"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Next arrow — always visible, above the card */}
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={!canNext}
          aria-label="Next panel"
          className="absolute right-0 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 backdrop-blur transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground md:size-12"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Single active card — perfectly centered, no peeking neighbors */}
        <div className="mx-auto flex min-h-[56vh] max-w-[1100px] items-center px-14 py-8 md:min-h-[62vh] md:px-20 md:py-12">
          <div className="w-full">{BEATS[active].node}</div>
        </div>
      </div>

      {/* Dots below — clickable, active pill is wider */}
      <div
        className="mt-6 flex items-center justify-center gap-2.5 md:mt-8"
        role="tablist"
        aria-label="Story panels"
      >
        {BEATS.map((beat, i) => (
          <button
            key={beat.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Go to panel ${i + 1}`}
            onClick={() => go(i)}
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

export function StoryFlow() {
  const reduced = usePrefersReducedMotion();

  return (
    <section id="how" className="relative">
      <div className="mx-auto max-w-2xl px-5 pt-8 pb-0 text-center md:px-8 md:pt-12 md:pb-0">
        <p className="text-balance text-[clamp(20px,2.6vw,28px)] font-bold leading-tight text-muted-foreground">
          It&apos;s rarely the ideas.{" "}
          <span className="text-foreground">It&apos;s how they land.</span>
        </p>
      </div>

      <div className="py-2 md:py-8">
        {reduced ? <VerticalStory /> : <HorizontalStory />}
      </div>
    </section>
  );
}
