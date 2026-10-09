import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const AUTO_ADVANCE_MS = 7000;
const IDLE_RESUME_MS = 12000;

// ─────────────────────────────────────────────────────────────
// Media / reduced-motion
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
// The scattered response — split into segments.
// Each segment has a color matching its annotation on the right.
// `key` links to the ANNOTATIONS array for hover sync.
// ─────────────────────────────────────────────────────────────

type Segment = { text: string; key: string };

const SEGMENTS: Segment[] = [
  { key: "context",      text: "So basically, I've worked on a few things," },
  { key: "qualifier",    text: " and um, mostly backend," },
  { key: "tangent",      text: " but also some other frontend stuff and product," },
  { key: "hedge",        text: " and I think what drives me" },
  { key: "side-thought", text: " is learning and how things come together," },
  { key: "intent",       text: " and I'm really interested in building…" },
];

type Annotation = {
  key: string;
  label: string;
  time: string;
  color: string;
};

const ANNOTATIONS: Annotation[] = [
  { key: "context",      label: "Context",      time: "0:00 – 0:08", color: "rgb(96, 165, 250)"  },
  { key: "qualifier",    label: "Qualifier",    time: "0:08 – 0:14", color: "rgb(251, 191, 36)"  },
  { key: "tangent",      label: "Tangent",      time: "0:14 – 0:22", color: "rgb(249, 115, 111)" },
  { key: "hedge",        label: "Hedge",        time: "0:22 – 0:28", color: "rgb(167, 139, 250)" },
  { key: "side-thought", label: "Side thought", time: "0:28 – 0:34", color: "rgb(56, 189, 248)"  },
  { key: "intent",       label: "Intent",       time: "0:34 – 0:38", color: "rgb(52, 211, 153)"  },
];

/**
 * Soft wireframe of a floating card with a central waveform orb.
 * Pure CSS + SVG — no external assets, no dependencies.
 * Matches the reference illustration with muted violet accents.
 */
function HeroCardIllustration() {
  return (
    <div className="relative aspect-square w-full max-w-[340px]">
      {/* Ambient glow behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,127,255,0.4), transparent 70%)",
        }}
      />

      {/* Soft floating cards — layered behind the main frame */}
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

      {/* Main frame — the front card */}
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="relative flex aspect-[3/4] w-[62%] items-center justify-center rounded-3xl border border-border bg-card/70 backdrop-blur-md"
          style={{
            boxShadow:
              "0 30px 80px -30px rgba(139,127,255,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Central waveform orb */}
          <div
            className="relative grid size-20 place-items-center rounded-full"
            style={{
              background:
                "linear-gradient(150deg, rgba(139,127,255,0.35) 0%, rgba(139,127,255,0.15) 100%)",
              boxShadow: "0 0 60px 10px rgba(139,127,255,0.35)",
            }}
          >
            {/* Waveform bars inside the orb */}
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

          {/* Faint grid overlay for depth */}
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

// ─────────────────────────────────────────────────────────────
// Beat 1 — Promise
// ─────────────────────────────────────────────────────────────

function BeatOne() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
        {/* Left — headline */}
        <div>
          <h2 className="text-[clamp(34px,5.5vw,68px)] font-bold leading-[1.05] tracking-tight">
            It sees
            <br />
            what you don&apos;t.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-6 text-muted-foreground md:text-[16px]">
            Practice the moment. See what got lost. Say it again.
          </p>
        </div>

        {/* Right — wireframe illustration */}
        <div className="flex items-center justify-center">
          <HeroCardIllustration />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 2 — Annotated scattered response (interactive)
// ─────────────────────────────────────────────────────────────

function BeatTwo() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[1.35fr_1fr] md:gap-12">
        {/* Left — quote with colored underline segments */}
        <div>
<div className="relative flex items-center justify-between pl-9">
  {/* Mic badge */}
  <div
    aria-hidden
    className="absolute left-0 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-primary/15 text-primary"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" />
    </svg>
  </div>

  <span className="eyebrow text-muted-foreground">You said</span>
  <span className="font-mono text-[11px] text-muted-foreground">00:38</span>
</div>

          <div className="glass mt-3 rounded-2xl p-5 md:p-6">
            <p className="text-[15px] leading-8 text-foreground/85 md:text-[16px]">
              {SEGMENTS.map((seg, i) => {
                const ann = ANNOTATIONS.find((a) => a.key === seg.key);
                const color = ann?.color ?? "currentColor";
                const isActive = activeKey === seg.key;
                const isDimmed = activeKey !== null && !isActive;
                return (
                  <span
                    key={seg.key}
                    onMouseEnter={() => setActiveKey(seg.key)}
                    onMouseLeave={() => setActiveKey(null)}
                    className="cursor-default transition-opacity duration-300"
                    style={{
                      opacity: isDimmed ? 0.35 : 1,
                      borderBottom: `2px solid ${color}`,
                      paddingBottom: "2px",
                      boxShadow: isActive ? `0 4px 0 -2px ${color}40` : undefined,
                    }}
                  >
                    {seg.text}
                    {i < SEGMENTS.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </p>

            {/* Waveform + play button strip */}
            <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground">
                <svg viewBox="0 0 12 12" fill="currentColor" className="size-3">
                  <path d="M3 2l7 4-7 4V2z" />
                </svg>
              </span>
              <div className="flex h-6 flex-1 items-end gap-[2px]">
                {Array.from({ length: 55 }, (_, i) => {
                  const h = Math.abs(Math.sin(i * 0.71) * 12) + 3;
                  const segIndex = Math.floor((i / 55) * SEGMENTS.length);
                  const segKey = SEGMENTS[segIndex]?.key;
                  const ann = ANNOTATIONS.find((a) => a.key === segKey);
                  const color = ann?.color ?? "rgb(180, 120, 90)";
                  const isDimmed = activeKey !== null && activeKey !== segKey;
                  return (
                    <span
                      key={i}
                      className="flex-1 rounded-sm transition-opacity duration-300"
                      style={{
                        height: h,
                        background: color,
                        opacity: isDimmed ? 0.2 : 0.75,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right — connected annotations with color spine */}
        <div className="relative flex flex-col justify-center">
          <div className="relative">
            {/* Vertical connector segments — one per annotation */}
            <div
              aria-hidden
              className="absolute left-[5px] top-3 bottom-3 w-px"
              style={{
                background:
                  "linear-gradient(to bottom, " +
                  ANNOTATIONS.map(
                    (a, i) =>
                      `${a.color} ${(i / (ANNOTATIONS.length - 1)) * 100}%`,
                  ).join(", ") +
                  ")",
                opacity: 0.4,
              }}
            />

            <div className="relative flex flex-col gap-4">
              {ANNOTATIONS.map((a) => {
                const isActive = activeKey === a.key;
                const isDimmed = activeKey !== null && !isActive;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onMouseEnter={() => setActiveKey(a.key)}
                    onMouseLeave={() => setActiveKey(null)}
                    onFocus={() => setActiveKey(a.key)}
                    onBlur={() => setActiveKey(null)}
                    className="flex items-center gap-3.5 text-left transition-opacity duration-300"
                    style={{ opacity: isDimmed ? 0.4 : 1 }}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full ring-2 ring-background transition-transform duration-300"
                      style={{
                        background: a.color,
                        transform: isActive ? "scale(1.4)" : "scale(1)",
                      }}
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-8 text-[13px] leading-6 text-muted-foreground">
            Your point is there.
            <br />
            It&apos;s just buried.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 3 — Diagnosis with timeline visualization
// ─────────────────────────────────────────────────────────────

// Timeline dots: color + offset from top (0 = top, 1 = bottom)
const TIMELINE_DOTS: { key: string; color: string; at: number }[] = [
  { key: "context",      color: "rgb(96, 165, 250)",  at: 0.05 },
  { key: "qualifier",    color: "rgb(251, 191, 36)",  at: 0.22 },
  { key: "tangent",      color: "rgb(249, 115, 111)", at: 0.42 },
  { key: "hedge",        color: "rgb(167, 139, 250)", at: 0.58 },
  { key: "side-thought", color: "rgb(56, 189, 248)",  at: 0.78 },
  { key: "intent",       color: "rgb(52, 211, 153)",  at: 0.92 },
];

function BeatThree() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1.35fr_1fr] md:gap-12">
        {/* Left — vertical timeline visualization */}
        <div className="relative flex h-[260px] md:h-[340px] items-stretch">
          <div className="relative flex flex-1 gap-5">
            {/* Spine + dots */}
            <div className="relative w-6 shrink-0">
              {/* Vertical connector — soft gradient */}
              <div
                aria-hidden
                className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(to bottom, " +
                    TIMELINE_DOTS.map(
                      (d) => `${d.color} ${d.at * 100}%`,
                    ).join(", ") +
                    ")",
                  opacity: 0.35,
                }}
              />

              {/* Colored dots along the spine */}
              {TIMELINE_DOTS.map((d) => (
                <span
                  key={d.key}
                  aria-hidden
                  className="absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full ring-2 ring-background"
                  style={{
                    background: d.color,
                    top: `calc(${d.at * 100}% - 5px)`,
                  }}
                />
              ))}
            </div>

            {/* Dashed bars representing the response */}
            <div className="relative flex flex-1 flex-col justify-around py-2">
              {Array.from({ length: 8 }, (_, i) => {
                const w = 55 + Math.sin(i * 1.3) * 30;
                return (
                  <div
                    key={i}
                    className="h-3.5 rounded-sm bg-muted-foreground/15"
                    style={{ width: `${Math.max(30, Math.min(95, w))}%` }}
                  />
                );
              })}

              {/* Floating "point arrived at" card at the mid-point */}
              <div
                className="absolute left-[28%] top-[38%] flex items-center gap-2.5 rounded-xl border border-primary/40 bg-background/95 px-3.5 py-2.5 shadow-[0_12px_40px_-12px_rgba(139,127,255,0.5)] backdrop-blur"
                style={{ pointerEvents: "none" }}
              >
                <Clock className="size-4 shrink-0 text-primary" strokeWidth={2} />
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
                    Your point arrived at
                  </div>
                  <div className="font-display text-[18px] font-bold leading-none text-foreground">
                    0:23
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — diagnosis */}
        <div>
          <p className="text-[13px] italic leading-6 text-muted-foreground">
            TheUnspoken
          </p>
          <h2 className="mt-2 text-balance text-[clamp(26px,4vw,42px)] font-bold leading-tight">
            Your point is
            <br />
            still buried.
          </h2>
          <p className="mt-4 max-w-md text-[14.5px] leading-6 text-muted-foreground">
            You know what you want to say. But your answer makes the listener work for it.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Beat 4 — Clean retry
// ─────────────────────────────────────────────────────────────

const CLEAN_QUOTE =
  "I'm a backend engineer with four years in payments. I've reduced API latency by 40%, and I'm looking for a role where I can own reliability end to end.";

function BeatFour() {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[1.35fr_1fr] md:gap-12">
        {/* Left — clean response */}
        <div>
          {/* Header with mic badge (mirrors Beat 2) */}
          <div className="relative flex items-center justify-between pl-9">
            <div
              aria-hidden
              className="absolute left-0 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-primary/15 text-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3"
              >
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" />
              </svg>
            </div>
            <span className="eyebrow !text-primary">Try again</span>
            <span className="font-mono text-[11px] text-muted-foreground">00:05</span>
          </div>

          {/* Quote card — mirrors Beat 2's glass + waveform structure */}
          <div className="glass-float mt-3 rounded-2xl border-primary/40 p-5 md:p-6">
            <p className="text-[15px] leading-8 text-foreground md:text-[16px]">
              {CLEAN_QUOTE}
            </p>

            {/* Waveform — single-color (primary), same bar count */}
            <div className="mt-6 flex items-center gap-3 border-t border-primary/20 pt-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <svg viewBox="0 0 12 12" fill="currentColor" className="size-3">
                  <path d="M3 2l7 4-7 4V2z" />
                </svg>
              </span>
              <div className="flex h-6 flex-1 items-end gap-[2px]">
                {Array.from({ length: 55 }, (_, i) => {
                  const h = Math.abs(Math.sin(i * 0.9) * 12) + 3;
                  return (
                    <span
                      key={i}
                      className="flex-1 rounded-sm bg-primary/70"
                      style={{ height: h }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trailing note */}
          <p className="mt-4 text-[13px] leading-6 text-muted-foreground">
            Clean. One idea. One outcome.
          </p>
        </div>

        {/* Right — outcome + checks */}
        <div className="flex flex-col justify-center">
          <p className="text-[13px] italic leading-6 text-muted-foreground">
            TheUnspoken
          </p>
          <p className="mt-2 font-display text-[clamp(28px,4vw,44px)] font-bold leading-tight">
            That landed.
          </p>
          <p className="mt-3 max-w-sm text-[14.5px] leading-6 text-muted-foreground">
            Same experience. A clearer signal.
          </p>

          {/* Three checks — animated in on reveal */}
          <ul className="mt-6 space-y-3 border-t border-border pt-6 text-[13.5px] leading-6">
            {[
              { label: "No tangents", sub: "Every sentence moved toward the point." },
              { label: "No hedges", sub: "Stated directly — no 'I think', no 'kind of'." },
              { label: "One outcome", sub: "40% latency reduction. That's the number." },
            ].map((item, i) => (
              <li
                key={item.label}
                className="check-in flex items-start gap-3"
                style={{ animationDelay: `${200 + i * 180}ms` }}
              >
                <span
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-muted-foreground">{item.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
  { id: "b4", node: <BeatFour /> },
];

// ─────────────────────────────────────────────────────────────
// Horizontal scroller
// ─────────────────────────────────────────────────────────────

function HorizontalStory() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userInteractedAt, setUserInteractedAt] = useState(0);
  const reduced = usePrefersReducedMotion();

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
        aria-label="Product story"
        className="
          flex h-[62vh] min-h-[380px] w-full snap-x snap-mandatory
          overflow-x-auto overflow-y-hidden
          scroll-smooth outline-none
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {BEATS.map((beat, i) => (
          <div
            key={beat.id}
            className="
              flex h-full w-[92vw] shrink-0 snap-center items-center
              px-5 sm:w-[88vw] md:w-[82vw] md:px-10
              lg:w-[min(1100px,82vw)]
            "
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${BEATS.length}`}
          >
            <div className="w-full">{beat.node}</div>
          </div>
        ))}
      </div>

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

      <div
        className="mt-4 flex items-center justify-center gap-2.5"
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
