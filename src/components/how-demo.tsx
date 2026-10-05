import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Flag, Mic, RotateCcw, Search, ThumbsUp } from "lucide-react";

const EASE = [0.32, 0.72, 0, 1] as const;
const AUTO_MS = 6000;

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
      className="size-[190px] text-accent/45 md:size-[230px]"
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

function ChooseView() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        <CageArt />
      </div>
      <div className="absolute left-1 top-6 hidden sm:block md:-left-2">
        <OptionChip icon={<Mic className="size-4" />} label="Interview" active />
      </div>
      <div className="absolute bottom-8 right-1 hidden sm:block md:-right-2">
        <OptionChip icon={<ThumbsUp className="size-4 text-emerald-400" />} label="Leadership" />
      </div>

      <div className="relative w-full max-w-[360px] space-y-3">
        <div className="how-float">
          <div className="product-kicker">The moment</div>
          <div className="mt-1.5 flex items-center gap-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-[16px] font-semibold leading-snug">Tell your manager you disagree with the proposed approach.</p>
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

function LostView() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 py-4">
      <div className="how-float">
        <div className="product-kicker !text-accent">Your pattern</div>
        <p className="mt-1.5 font-display text-[24px] font-bold leading-tight tracking-tight">THE LONG RUNWAY</p>
        <p className="mt-1 text-[14px] text-muted-foreground">Your main point arrived late.</p>
      </div>
      <div className="how-float flex items-center gap-2.5 !border-destructive/35">
        <Flag className="size-4 shrink-0 text-destructive" />
        <p className="text-[15px] font-medium">Context first — the decision was easy to miss</p>
      </div>
      <div className="how-float flex items-center gap-2.5 !border-accent/35">
        <Check className="size-4 shrink-0 text-accent" />
        <p className="text-[15px] font-medium">Lead with the decision</p>
      </div>
    </div>
  );
}

function RetryView() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 py-4">
      <div className="how-float grid grid-cols-[64px_1fr] items-center gap-3">
        <span className="text-[13px] text-muted-foreground">Before</span>
        <span className="rounded-lg bg-secondary px-3 py-2 text-[14px] text-muted-foreground line-through decoration-destructive/70">Context first</span>
      </div>
      <div className="how-float grid grid-cols-[64px_1fr] items-center gap-3">
        <span className="text-[13px] text-accent">After</span>
        <span className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-[14px] font-medium">Recommendation first</span>
      </div>
      <div className="how-float flex items-center justify-between">
        <span className="text-[14px] font-medium">Same question. New shape.</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-foreground">
          <RotateCcw className="size-3.5" /> Try again
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  { title: "Choose your moment", body: "Pick a real conversation and what you want to improve.", View: ChooseView },
  { title: "Respond naturally", body: "Speak or type your answer the way you'd say it in the room.", View: RespondView },
  { title: "See what got lost", body: "Your pattern, what your listener heard, and one thing to fix.", View: LostView },
  { title: "Say it again", body: "Retry the same moment and watch what changes.", View: RetryView },
];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
};

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

  return (
    <div className="product-stage py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <h2 className="text-center font-display text-[clamp(32px,4vw,54px)] font-bold leading-[1.04]">How Unspoken works</h2>

        <div className="mt-10 grid items-stretch gap-6 md:mt-14 md:grid-cols-[1.4fr_1fr]">
          {/* Product panel */}
          <div className="how-panel min-h-[440px] md:min-h-[520px]">
            <div className="mx-auto flex h-full max-w-[420px] items-center px-6 py-10 md:px-12">
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
          </div>

          {/* Step explanation + dots */}
          <div className="flex items-center gap-4 md:justify-end">
            <div className="relative min-h-[150px] flex-1 md:max-w-[360px]">
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: EASE }}
                  className="absolute inset-0 flex flex-col justify-center rounded-2xl border border-border bg-card/60 p-7 backdrop-blur-sm md:p-8"
                >
                  <span className="font-mono text-[11px] tracking-[0.16em] text-accent">0{step + 1}</span>
                  <h3 className="mt-2 text-[24px] font-bold leading-tight md:text-[27px]">{active.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-6 text-muted-foreground">{active.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex flex-row justify-center gap-2.5 pb-1 md:flex-col md:pb-0" role="tablist" aria-label="Steps">
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

        <div className="mt-10 flex flex-col items-center gap-6 md:mt-14">
          <Link to="/practice" className="btn btn-primary px-8 py-3.5 text-[16px]">Start Practising <ArrowRight className="size-4" /></Link>
          <h3 className="text-center text-[clamp(22px,2.6vw,30px)] font-semibold">Practice the moments that matter.</h3>
        </div>
      </div>
    </div>
  );
}
