import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Keyboard, Mic, RotateCcw, Target } from "lucide-react";

/** Controlled demo data — same shape a real response/analysis could fill later. */
const DEMO = {
  category: "High-stakes conversation",
  task: "Tell your manager you disagree with the proposed approach.",
  first: "I understand why we're considering this approach. There are a few things we should probably think about first, like the timeline and the handoffs…",
  second: "I recommend we keep the current approach. It reduces handoff risk, and the timeline stays intact.",
  lost: {
    headline: "Your recommendation came too late.",
    detail: "The background was useful, but your main point appeared after the listener had already formed the context.",
    why: ["Main point appeared late", "Too much setup before the recommendation"],
  },
  fix: { title: "Lead with your recommendation.", line: "Say the point first. Then explain why." },
  result: { before: 23, after: 5, from: "Scattered", to: "Direct" },
};

// 0 practice · 1 recording · 2 listening · 3 what got lost · 4 one thing to fix · 5 retry recording · 6 listening · 7 improved
const AUTO: Record<number, number> = { 0: 1400, 1: 3600, 2: 1600, 3: 2200, 5: 3000, 6: 1300 };
const ease = [0.22, 1, 0.36, 1] as const;
const enter = { initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -6, scale: 0.98 }, transition: { duration: 0.45, ease } };

function Wave({ live }: { live: boolean }) {
  return (
    <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span key={i} className="w-[3px] rounded-full bg-primary/70"
          animate={{ height: live ? ["20%", `${35 + ((i * 37) % 60)}%`, "25%"] : "14%" }}
          transition={live ? { duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }} />
      ))}
    </div>
  );
}

function useTimer(run: boolean, target: number) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!run) return; setS(0);
    const id = setInterval(() => setS((x) => (x < target ? x + 1 : x)), 3000 / target);
    return () => clearInterval(id);
  }, [run, target]);
  return `00:${String(s).padStart(2, "0")}`;
}

/** Homepage "How Unspoken works": one connected, playable practice session. */
export function HowItWorksDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [p, setP] = useState(0);
  const [typed, setTyped] = useState(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (reduced || !visible) return;
    const ms = AUTO[p] ?? (p === 4 ? 6000 : p === 7 ? 6000 : 0);
    const t = setTimeout(() => setP((x) => (x === 7 ? 0 : x + 1)), ms);
    return () => clearTimeout(t);
  }, [p, visible, reduced]);

  const phase = reduced ? 7 : p;
  const retry = phase >= 5;
  const recording = phase === 1 || phase === 5;
  const listening = phase === 2 || phase === 6;
  const timer = useTimer(recording, phase === 5 ? 9 : 18);
  const restart = () => { setTyped(false); setP(5); };

  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-[1.05fr_1fr] md:gap-5">
      {/* LEFT — practice a real moment */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-9">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{DEMO.category}</div>
        <p className="mt-3 font-display text-[clamp(21px,2.4vw,30px)] font-bold leading-snug">{DEMO.task}</p>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-[13px] font-medium">Your response {retry && <span className="ml-1 text-muted-foreground">· Attempt 02</span>}</span>
          <button type="button" onClick={() => setTyped((t) => !t)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-all duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <Keyboard className="h-3.5 w-3.5" aria-hidden /> {typed ? "Use voice" : "Type instead"}
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-background/40 p-4">
          {typed ? (
            <textarea aria-label="Your response" defaultValue={retry ? DEMO.second : DEMO.first} rows={4} className="w-full resize-none bg-transparent text-[14px] leading-6 outline-none" />
          ) : (
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${recording ? "border-primary bg-primary/15" : "border-border"}`}>
                <Mic className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <Wave live={recording && !reduced} />
              <div className="w-[76px] shrink-0 text-right">
                <div className="font-mono text-[13px] tabular-nums">{recording ? timer : retry ? "00:09" : phase === 0 ? "00:00" : "00:18"}</div>
                <div className="text-[11px] text-muted-foreground">{recording ? "Recording..." : listening ? "Listening..." : phase === 0 ? "Ready" : "Submitted"}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 min-h-[84px] text-[14px] leading-6">
          <AnimatePresence mode="wait">
            {phase >= 1 && !typed && (
              <motion.p key={retry ? "b" : "a"} {...enter} className={retry ? "" : "text-muted-foreground"}>“{retry ? DEMO.second : DEMO.first}”</motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT — what got lost → fix → say it again */}
      <div className="flex min-h-[460px] flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:p-9" aria-live="polite">
        <AnimatePresence mode="wait">
          {phase <= 2 && (
            <motion.div key="wait" {...enter} className="flex flex-1 flex-col justify-center text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">What got lost</div>
              <p className="mt-3 text-[14px] text-muted-foreground">{phase === 2 ? "Listening for your main point…" : "Speak, then see what got lost."}</p>
            </motion.div>
          )}

          {(phase === 3 || phase === 4) && (
            <motion.div key="lost" {...enter} className="flex flex-1 flex-col">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">What got lost</div>
              <p className="mt-2 font-display text-[22px] font-bold leading-snug md:text-[26px]">{DEMO.lost.headline}</p>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{DEMO.lost.detail}</p>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Why</div>
              <ul className="mt-2 space-y-1.5 text-[14px]">
                {DEMO.lost.why.map((w) => <li key={w} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />{w}</li>)}
              </ul>
              <AnimatePresence>
                {phase === 4 && (
                  <motion.div {...enter} className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-5">
                    <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary"><Target className="h-3.5 w-3.5" aria-hidden /> One thing to fix</div>
                    <p className="mt-2 font-display text-[19px] font-bold">{DEMO.fix.title}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{DEMO.fix.line}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {phase === 4 && (
                <motion.div {...enter} transition={{ ...enter.transition, delay: 0.25 }} className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                  <button type="button" onClick={restart} className="btn btn-primary btn-sm min-h-11"><RotateCcw className="h-4 w-4" aria-hidden /> Say it again</button>
                  <span className="text-[13px] text-muted-foreground">Same moment. One change.</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {(phase === 5 || phase === 6) && (
            <motion.div key="again" {...enter} className="flex flex-1 flex-col justify-center text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Say it again</div>
              <p className="mt-3 text-[14px] text-muted-foreground">Same moment. One change.</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Focus · {DEMO.fix.title}</p>
            </motion.div>
          )}

          {phase === 7 && (
            <motion.div key="result" {...enter} className="flex flex-1 flex-col">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Main point</div>
              <div className="mt-3 flex items-baseline gap-3 font-display text-[clamp(40px,5vw,60px)] font-bold leading-none">
                <span className="text-muted-foreground">{DEMO.result.before}s</span>
                <ArrowRight className="h-6 w-6 self-center text-muted-foreground" aria-hidden />
                <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease }} className="text-primary">{DEMO.result.after}s</motion.span>
              </div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 font-mono text-[13px] uppercase tracking-[0.16em]">
                <span className="text-muted-foreground line-through decoration-muted-foreground/50">{DEMO.result.from}</span> <span className="text-muted-foreground">→</span> <span className="text-primary">{DEMO.result.to}</span>
              </motion.p>
              <p className="mt-auto pt-6 text-[13px] text-muted-foreground">See what changes when you try again.</p>
              <button type="button" onClick={() => setP(0)} className="mt-3 inline-flex min-h-9 w-fit items-center gap-1.5 text-[12px] text-muted-foreground transition-all duration-200 hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Replay</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
