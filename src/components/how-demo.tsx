import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Mic, RotateCcw, Search, ThumbsUp } from "lucide-react";

const EASE = [0.32, 0.72, 0, 1] as const;
const AUTO_MS = 6000;

// ─────────────────────────────────────────────────────────────
// Shared primitives (unchanged)
// ─────────────────────────────────────────────────────────────

function Waveform() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="flex h-10 items-center justify-center gap-1.5" aria-hidden="true">
      {Array.from({ length: 19 }, (_, i) => {
        const height = 8 + Math.abs(Math.sin(i * 0.72) * 24);
        return (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-accent"
            style={{ height }}
            animate={reducedMotion ? undefined : { scaleY: [0.55, 1, 0.7] }}
            transition={{ duration: 0.8 + (i % 4) * 0.18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}

function LogoMark() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent font-display text-[17px] font-bold text-accent-foreground">
      U
    </span>
  );
}

function CageArt() {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[170px] text-accent/35 md:size-[210px]"
      aria-hidden="true"
    >
      <rect x="70" y="30" width="120" height="110" rx="10" />
      <rect x="30" y="70" width="120" height="110" rx="10" />
      <path d="M30 70 70 30M150 70 190 30M30 180 70 140M150 180 190 140" />
      <path d="M70 70v110M110 70v110M30 110h120M30 145h120" />
    </svg>
  );
}

function OptionChip({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <span
      className={
        "how-float inline-flex items-center gap-2 !rounded-full !px-4 !py-2 text-[14px] font-semibold " +
        (active ? "!border-accent/50 !bg-accent/15 text-accent" : "text-foreground")
      }
    >
      {icon}
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 1 — Choose (unchanged)
// ─────────────────────────────────────────────────────────────

function ChooseView() {
  return (
    <div className="relative flex items-center justify-center">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-x-16 -inset-y-14 grid place-items-center">
        <CageArt />
      </div>
      <div className="absolute -left-12 -top-6 z-10 hidden sm:block">
        <OptionChip icon={<Mic className="size-4" />} label="Interview" active />
      </div>
      <div className="absolute -bottom-6 -right-12 z-10 hidden sm:block">
        <OptionChip icon={<ThumbsUp className="size-4 text-emerald-400" />} label="High-stakes" />
      </div>

      <div className="relative w-full max-w-[340px] space-y-3">
        <div className="how-float">
          <div className="product-kicker">The moment</div>
          <div className="mt-1.5 flex items-center gap-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-[16px] font-semibold leading-snug">Tell your manager you disagree with the approach.</p>
          </div>
        </div>
        <div className="how-float flex items-center justify-between !border-accent/40">
          <div>
            <div className="product-kicker !text-accent">What to work on</div>
            <p className="mt-1 text-[17px] font-semibold">Structure</p>
          </div>
          <ChevronDown className="size-4 text-accent" />
        </div>
        <div className="how-float flex items-center justify-between">
          <div>
            <div className="product-kicker">Mode</div>
            <p className="mt-1 text-[17px] font-semibold">High-stakes conversation</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Respond (unchanged)
// ─────────────────────────────────────────────────────────────

function RespondView() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 py-4">
      <div className="how-float flex items-start gap-3.5">
        <LogoMark />
        <p className="pt-1 text-[16px] font-medium leading-snug">So tell me — how would you handle the deadline slipping?</p>
      </div>
      <div className="how-float flex items-center gap-4 px-5 py-4">
        <Waveform />
        <span className="font-mono text-[13px] text-muted-foreground">00:12</span>
        <span className="ml-auto grid size-9 place-items-center rounded-full bg-accent text-accent-foreground"><Mic className="size-4" /></span>
      </div>
      <div className="how-float text-center text-[14px] font-medium text-muted-foreground">Finish response</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared timeline primitive — used by Steps 3 and 4
// ─────────────────────────────────────────────────────────────

type TimelineProps = {
  totalSeconds: number;
  markerSeconds: number;
  markerLabel: string;
  markerTone: "destructive" | "accent";
  leftNumber: string;
  leftLabel: string;
  rightNumber: string;
  rightLabel: string;
  quote: string;
  attribution: string;
  dimAfterMarker: boolean;
};

function Timeline({
  totalSeconds,
  markerSeconds,
  markerLabel,
  markerTone,
  leftNumber,
  leftLabel,
  rightNumber,
  rightLabel,
  quote,
  attribution,
  dimAfterMarker,
}: TimelineProps) {
  const reduced = useReducedMotion();
  const markerPct = (markerSeconds / totalSeconds) * 100;

  const markerColor = markerTone === "destructive" ? "var(--destructive)" : "var(--accent)";
  const markerFg = markerTone === "destructive" ? "rgb(248 113 113)" : "rgb(139 127 255)";

  return (
    <div className="flex h-full flex-col justify-center py-2">
      {/* ── The timeline strip ─────────────────────────────── */}
      <div className="how-float">
        {/* Waveform — a row of bars, the region past the marker dims */}
        <div className="flex h-14 items-end gap-[3px]">
          {Array.from({ length: 46 }, (_, i) => {
            const seed = Math.abs(Math.sin(i * 0.71) * 18) + 6;
            const past = (i / 46) * 100 > markerPct;
            const dim = dimAfterMarker && past;
            return (
              <motion.span
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: seed,
                  background: dim
                    ? "rgba(180, 120, 90, 0.18)"
                    : "rgb(180, 120, 90)",
                  transition: "background 600ms ease",
                }}
                initial={reduced ? undefined : { scaleY: 0.4 }}
                animate={reduced ? undefined : { scaleY: [0.4, 1, 0.9] }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.025,
                  ease: EASE,
                }}
              />
            );
          })}
        </div>

        {/* Baseline + marker */}
        <div className="relative mt-1 h-6">
          {/* Baseline */}
          <div className="absolute left-0 right-0 top-0 h-px bg-border" />

          {/* Marker: vertical line + label */}
          <motion.div
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${markerPct}%`, transform: "translateX(-50%)" }}
            initial={reduced ? undefined : { opacity: 0, y: -4 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9, ease: EASE }}
          >
            {/* Dot on the baseline */}
            <span
              className="size-2 rounded-full"
              style={{ background: markerColor }}
            />
            {/* Short vertical tick */}
            <span
              className="mt-0.5 h-3 w-px"
              style={{ background: markerColor }}
            />
            {/* Label */}
            <span
              className="mt-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em]"
              style={{ color: markerFg }}
            >
              {markerLabel}
            </span>
          </motion.div>
        </div>

        {/* Time axis labels */}
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] tracking-[0.1em] text-muted-foreground/60">
          <span>0:00</span>
          <span>{formatTime(totalSeconds)}</span>
        </div>
      </div>

      {/* ── The reveal — two numbers, one quote ─────────────── */}
      <motion.div
        className="mt-7 border-t border-border pt-6"
        initial={reduced ? undefined : { opacity: 0, y: 8 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6, ease: EASE }}
      >
        <div className="grid grid-cols-2 gap-6">
          {/* Left number */}
          <div>
            <div
              className="font-display text-[38px] font-bold leading-none tracking-tight md:text-[44px]"
              style={{ color: markerFg }}
            >
              {leftNumber}
            </div>
            <div className="mt-2 text-[12px] leading-5 text-muted-foreground md:text-[13px]">
              {leftLabel}
            </div>
          </div>

          {/* Right number */}
          <div>
            <div className="font-display text-[38px] font-bold leading-none tracking-tight text-muted-foreground/40 md:text-[44px]">
              {rightNumber}
            </div>
            <div className="mt-2 text-[12px] leading-5 text-muted-foreground md:text-[13px]">
              {rightLabel}
            </div>
          </div>
        </div>

        {/* Italic quote + attribution */}
        <div className="mt-6">
          <p className="text-[14px] italic leading-6 text-foreground/75 md:text-[15px]">
            {quote}
          </p>
          <p
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: markerFg }}
          >
            {attribution}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — See what got lost (red timeline)
// ─────────────────────────────────────────────────────────────

function LostView() {
  return (
    <Timeline
      totalSeconds={38}
      markerSeconds={12}
      markerLabel="Listener checked out"
      markerTone="destructive"
      leftNumber="0:12"
      leftLabel="The listener stopped listening."
      rightNumber="0:38"
      rightLabel="Your point arrived 26 seconds later."
      quote={"\u201CI always get there eventually.\u201D"}
      attribution="— every candidate, before TheUnspoken"
      dimAfterMarker={true}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Step 4 — Say it again (accent timeline)
// ─────────────────────────────────────────────────────────────

function RetryView() {
  return (
    <Timeline
      totalSeconds={38}
      markerSeconds={5}
      markerLabel="Point lands"
      markerTone="accent"
      leftNumber="0:05"
      leftLabel="The point arrives before the listener drifts."
      rightNumber="0:38"
      rightLabel="Same answer. Same length. Different room."
      quote={"\u201CI said what I actually meant.\u201D"}
      attribution="— the same person, second take"
      dimAfterMarker={false}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Step registry
// ─────────────────────────────────────────────────────────────

const STEPS = [
  { title: "Choose your moment", body: "Pick a real conversation and what you want to improve.", View: ChooseView },
  { title: "Respond naturally", body: "Speak or type your answer the way you'd say it in the room.", View: RespondView },
  { title: "See what got lost", body: "The second the listener stopped listening.", View: LostView },
  { title: "Say it again", body: "Same question. The point arrives earlier.", View: RetryView },
];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function HowItWorksDemo() {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => {
      setDir(1);
      setStep((p) => (p + 1) % STEPS.length);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [reducedMotion, step]);

  const active = STEPS[step]!;

  // Ambient glow shifts per step
  const glow =
    step === 2
      ? "radial-gradient(closest-side, rgba(248,113,113,0.28), transparent)"
      : "radial-gradient(closest-side, rgba(139,127,255,0.42), transparent)";

  return (
    <div className="product-stage py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        {/* ── Section header ─────────────────────────────── */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow !text-primary">Three things cost you the role.</div>
          <p className="mt-4 text-balance text-[clamp(22px,3vw,34px)] font-bold leading-tight">
            It's rarely the ideas.{" "}
            <span className="text-primary">It's how they land.</span>
          </p>
        </div>

        {/* ── Panel + step explanation ───────────────────── */}
        <div className="mt-8 grid items-stretch gap-6 md:mt-10 md:grid-cols-[1.4fr_1fr]">
          {/* Product panel */}
          <div className="how-panel relative min-h-[360px] overflow-hidden md:min-h-[420px]">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full opacity-70 blur-3xl transition-all duration-700"
              style={{ background: glow }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(139,127,255,0.3), transparent)",
              }}
            />

            <div className="relative mx-auto flex h-full max-w-[380px] items-center px-6 py-8 md:px-10">
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: EASE }}
                  className="w-full"
                >
                  <active.View />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="absolute inset-x-0 bottom-0 flex gap-1 px-6 pb-4 md:px-10">
              {STEPS.map((_, n) => (
                <span
                  key={n}
                  aria-hidden
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                    n <= step ? "bg-accent/80" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step explanation + dots */}
          <div className="flex items-center gap-4 md:justify-end">
            <div className="relative min-h-[140px] flex-1 md:max-w-[360px]">
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: EASE }}
                  className="absolute inset-0 flex flex-col justify-center rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm md:p-7"
                >
                  <span className="font-mono text-[11px] tracking-[0.16em] text-accent">
                    0{step + 1}
                  </span>
                  <h3 className="mt-2 text-[22px] font-bold leading-tight md:text-[26px]">
                    {active.title}
                  </h3>
                  <p className="mt-2.5 text-[14.5px] leading-6 text-muted-foreground">
                    {active.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              className="flex flex-row justify-center gap-2.5 pb-1 md:flex-col md:pb-0"
              role="tablist"
              aria-label="Steps"
            >
              {STEPS.map((s, n) => (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={n === step}
                  aria-label={s.title}
                  onClick={() => go(n)}
                  className="how-dot"
                  data-active={n === step}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col items-center gap-2 md:mt-10">
          <Link
            to="/practice"
            className="btn btn-primary px-8 py-3.5 text-[16px]"
          >
            See which one is yours <ArrowRight className="size-4" />
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Free · 5 practices · No card
          </p>
        </div>
      </div>
    </div>
  );
}
