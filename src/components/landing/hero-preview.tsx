import { motion, useReducedMotion } from "framer-motion";
import { Mic, Sparkles } from "lucide-react";

const TRANSCRIPT_WORDS = [
  "So", "basically", "I", "worked", "on", "a", "few", "things,", "and", "um,",
  "mostly", "backend,", "but", "also", "some", "other", "stuff…",
];

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * Hero right-side visual: a live-typing transcript simulation
 * with a score chip and a "what got lost" callout. Loops every
 * ~8s. Respects prefers-reduced-motion.
 */
export function HeroPreview() {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-12 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,127,255,0.35), transparent 70%)",
        }}
      />

      <motion.div
        className="relative glass-float overflow-hidden rounded-3xl p-5 md:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative grid size-7 place-items-center rounded-full bg-destructive/15">
              <span
                className={`size-2 rounded-full bg-destructive ${
                  reduced ? "" : "animate-pulse"
                }`}
              />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Recording · 00:12
            </span>
          </div>
          <Mic className="size-4 text-muted-foreground" />
        </div>

        {/* Transcript — word-by-word reveal, loops */}
        <div className="mt-5 min-h-[72px] text-[15px] leading-6">
          {reduced ? (
            <span className="text-foreground/85">{TRANSCRIPT_WORDS.join(" ")}</span>
          ) : (
            TRANSCRIPT_WORDS.map((w, i) => (
              <motion.span
                key={`${i}-${w}`}
                className="inline-block whitespace-pre text-foreground/85"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 8,
                  times: [
                    i / TRANSCRIPT_WORDS.length,
                    (i + 1) / TRANSCRIPT_WORDS.length,
                    0.88,
                    1,
                  ],
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {w}{" "}
              </motion.span>
            ))
          )}
        </div>

        {/* Divider */}
        <div className="mt-4 h-px bg-border" />

        {/* Score row */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Structure
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <CountUp from={0} to={42} duration={1.6} reduced={!!reduced} />
              <span className="text-[12px] text-destructive">Low</span>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Time to point
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <CountUp from={0} to={23} duration={1.6} reduced={!!reduced} suffix="s" />
              <span className="text-[12px] text-destructive">Late</span>
            </div>
          </div>
        </div>

        {/* What got lost */}
        <motion.div
          className="mt-5 flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4, ease: EASE }}
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-destructive">
              What got lost
            </div>
            <p className="mt-1 text-[13px] leading-5 text-foreground/90">
              Your point arrived at second 38. The role you want never came up.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function CountUp({
  from,
  to,
  duration,
  suffix = "",
  reduced,
}: {
  from: number;
  to: number;
  duration: number;
  suffix?: string;
  reduced: boolean;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration, reduced]);

  return (
    <span className="font-display text-[24px] font-bold leading-none">
      {value}
      {suffix}
    </span>
  );
}
