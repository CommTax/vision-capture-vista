import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// Script — the "response" being recorded.
// Words flagged `filler` get a coral underline as they land.
// ─────────────────────────────────────────────────────────────
type ScriptWord = { text: string; filler?: boolean };

const SCRIPT: ScriptWord[] = [
  { text: "So" },
  { text: "basically", filler: true },
  { text: "I've" },
  { text: "worked" },
  { text: "on" },
  { text: "a" },
  { text: "few" },
  { text: "things," },
  { text: "and" },
  { text: "um,", filler: true },
  { text: "mostly" },
  { text: "backend," },
  { text: "but" },
  { text: "also" },
  { text: "some" },
  { text: "other" },
  { text: "stuff,", filler: true },
  { text: "and" },
  { text: "I" },
  { text: "think" },
  { text: "what" },
  { text: "drives" },
  { text: "me" },
  { text: "is" },
  { text: "learning…" },
];

// Loop timings (ms)
const T_START = 400;
const T_WORD = 320;
const T_AFTER_LAST = 1400;
const T_CYCLE_RESTART = 1000;

// Total runtime ≈ 40s across ~25 words → ~1.6s of "recording" per word.
const SECONDS_PER_WORD = 1.6;

// Coral (matches the destructive accent in the rest of the product).
const CORAL = "rgb(249, 115, 111)";
const BRONZE = "rgb(180, 120, 90)";

export function HeroPreview() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState<number>(reduced ? SCRIPT.length : 0);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let tid: number | undefined;

    const run = () => {
      if (cancelled) return;
      setVisible(0);
      let i = 0;
      const step = () => {
        if (cancelled) return;
        i += 1;
        setVisible(i);
        if (i < SCRIPT.length) {
          tid = window.setTimeout(step, T_WORD);
        } else {
          tid = window.setTimeout(() => {
            tid = window.setTimeout(run, T_CYCLE_RESTART);
          }, T_AFTER_LAST);
        }
      };
      tid = window.setTimeout(step, T_START);
    };

    run();
    return () => {
      cancelled = true;
      if (tid) window.clearTimeout(tid);
    };
  }, [reduced]);

  const seconds = Math.min(36, Math.round(visible * SECONDS_PER_WORD));
  const timer = formatTime(seconds);
  const listening = seconds < 20;
  const status = listening
    ? "Listening for your point…"
    : "Still waiting for your point…";

  // Pattern chips fade in once we're past ~30s of "recording".
  const showPatterns = visible >= 19;
  // "Analysis pending" appears for the last beat, then the loop restarts.
  const showScores = visible >= SCRIPT.length - 1;

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* Ambient glow behind the card */}
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
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Header: REC dot + timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative grid size-7 place-items-center rounded-full bg-destructive/15">
              <span
                className={`size-2 rounded-full bg-destructive ${
                  reduced ? "" : "animate-pulse"
                }`}
              />
            </span>
            <span className="rounded-md bg-destructive/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-destructive">
              Recording
            </span>
          </div>
          <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] tabular-nums text-foreground/80">
            {timer}
          </span>
        </div>

        {/* Waveform — lit bars track progress */}
        <div className="mt-4 flex h-9 items-center gap-[3px]" aria-hidden>
          {Array.from({ length: 34 }, (_, i) => {
            const seed = Math.abs(Math.sin(i * 0.83) * 20) + 4;
            const active = i < (visible / SCRIPT.length) * 34;
            return (
              <span
                key={i}
                className="rounded-full transition-colors duration-200"
                style={{
                  width: 3,
                  height: seed,
                  background: active ? BRONZE : "rgba(180, 120, 90, 0.35)",
                }}
              />
            );
          })}
        </div>

        {/* Transcript: types word by word. Fillers get a coral underline. */}
        <div className="mt-5 min-h-[80px] text-[15px] leading-7">
          {SCRIPT.slice(0, visible).map((w, i) => (
            <motion.span
              key={`${i}-${w.text}`}
              className="mr-1 inline-block text-foreground/85"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={
                w.filler
                  ? { borderBottom: `1.5px solid ${CORAL}`, paddingBottom: 1 }
                  : undefined
              }
            >
              {w.text}
            </motion.span>
          ))}
          {!reduced && visible < SCRIPT.length && (
            <span
              className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-foreground/60 align-middle"
              aria-hidden
            />
          )}
        </div>

        {/* Pattern chips — appear near the end in dark red */}
        <div className="mt-4 flex min-h-[24px] flex-wrap gap-1.5">
          {showPatterns &&
            [
              { label: "Rambling", delay: 0 },
              { label: "Scattered", delay: 0.35 },
            ].map((p) => (
              <motion.span
                key={p.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: p.delay, ease: "easeOut" }}
                className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
                style={{
                  borderColor: "rgba(248, 113, 113, 0.35)",
                  background: "rgba(248, 113, 113, 0.10)",
                  color: "rgb(248, 113, 113)",
                }}
              >
                {p.label}
              </motion.span>
            ))}
        </div>

        {/* Divider */}
        <div className="mt-4 h-px bg-border" />

        {/* Status line — flips at 20s */}
        <div className="mt-3 flex items-center gap-2">
          <span className="grid size-4 place-items-center">
            <span
              className="size-2 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground"
              style={{ animationDuration: "1.4s" }}
              aria-hidden
            />
          </span>
          <span className="text-[13px] text-muted-foreground">{status}</span>
        </div>

        {/* Final beat: "analysis pending" — never shows the verdict */}
        {showScores && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 flex items-center justify-between border-t border-border pt-3"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Analysis pending…
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Running
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
