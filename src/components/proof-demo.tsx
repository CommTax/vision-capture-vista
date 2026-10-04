import { useEffect, useState } from "react";
import type { DemoAttempt, ProofDemo } from "@/content/types";

// Phases: 0 idle · 1 attempt 01 builds · 2 transition + attempt 02 · 3 proof · 4 hold
const PHASE_MS = [500, 3000, 2000, 1400, 5200];
const LAST = PHASE_MS.length - 1;

function useReducedMotion() {
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

const ease = "cubic-bezier(.32,.72,0,1)";

function Flow({ a, on, slow }: { a: DemoAttempt; on: boolean; slow: boolean }) {
  const step = slow ? 420 : 160;
  return (
    <div className="mt-5 flex items-center gap-1.5" aria-hidden>
      {a.responseSequence.map((seg, i) => {
        const delay = on ? `${i * step}ms` : "0ms";
        const base = { opacity: on ? 1 : 0, transform: on ? "none" : "scaleX(0.6)", transformOrigin: "left", transition: `opacity 500ms ease ${delay}, transform 600ms ${ease} ${delay}` };
        if (slow && !seg.main) return <span key={seg.label} className="h-8 flex-1 rounded-md border border-border bg-secondary/60" style={base} />;
        return (
          <span
            key={seg.label}
            className={`flex h-8 items-center justify-center rounded-md border px-2 font-mono text-[10px] uppercase tracking-[0.12em] ${seg.main ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground"} ${slow ? "shrink-0" : seg.main ? "flex-[1.6]" : "flex-1"}`}
            style={base}
          >
            {seg.label}
          </span>
        );
      })}
    </div>
  );
}

function Attempt({ a, on, slow, showTime }: { a: DemoAttempt; on: boolean; slow: boolean; showTime: boolean }) {
  return (
    <div className="transition-opacity duration-500" style={{ opacity: on ? 1 : 0.2 }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground">{String(a.attemptNumber).padStart(2, "0")}</div>
          <div className={`mt-1 font-mono text-[11px] uppercase tracking-[0.14em] ${slow ? "text-muted-foreground" : "text-primary"}`}>{a.patternLabels.join(" · ")}</div>
        </div>
        <div className="text-right transition-all duration-500" style={{ opacity: showTime ? 1 : 0, transform: showTime ? "none" : "translateY(4px)" }}>
          <div className={`font-display text-[28px] font-bold leading-none ${slow ? "text-muted-foreground" : "text-primary"}`}>{a.mainPointDelay}s</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Main point</div>
        </div>
      </div>
      <Flow a={a} on={on} slow={slow} />
    </div>
  );
}

function Metric({ label, before, after, show }: { label: string; before: number; after: number; show: boolean }) {
  return (
    <div className="transition-all duration-700" style={{ opacity: show ? 1 : 0, transform: show ? "none" : "translateY(6px)" }}>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-[15px]"><span className="text-muted-foreground">{before}</span> → <span className="font-semibold text-primary">{after}</span></div>
    </div>
  );
}

/** Data-driven retry proof. Accepts real comparison data with the same shape. */
export function ProofDemoCard({ title, demo }: { title: string; demo: ProofDemo }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) { setPhase(LAST); return; }
    const t = setTimeout(() => setPhase((p) => (p >= LAST ? 0 : p + 1)), PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  const { before, after } = demo;
  const proof = phase >= 3;

  return (
    <div className="glass glass-float p-6 md:p-8" aria-label={`${title} ${before.patternLabels.join(" ")}: main point at ${before.mainPointDelay}s. ${after.patternLabels.join(" ")}: main point at ${after.mainPointDelay}s.`}>
      <div className="font-display text-[20px] font-bold leading-tight md:text-[22px]">{title}</div>
      <p className="mt-1 text-[13px] text-muted-foreground">See what changes when you try again.</p>

      <div className="mt-6 rounded-2xl border border-border p-4 md:p-5">
        <Attempt a={before} on={phase >= 1} slow showTime={phase >= 2} />
        <div className="my-4 flex items-center gap-3 transition-opacity duration-500" style={{ opacity: phase >= 2 ? 1 : 0.2 }} aria-hidden>
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Try again →</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <Attempt a={after} on={phase >= 2} slow={false} showTime={phase >= 3} />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="font-display text-[clamp(44px,6vw,64px)] font-bold leading-none tracking-tight transition-all duration-700" style={{ opacity: proof ? 1 : 0.15, transform: proof ? "none" : "translateY(8px)" }}>
          <span className="text-muted-foreground">{before.mainPointDelay}s</span> <span className="text-primary">→ {after.mainPointDelay}s</span>
        </div>
        <div className="flex gap-8">
          <Metric label="Structure" before={before.structureScore} after={after.structureScore} show={phase >= 4} />
          <Metric label="Conciseness" before={before.concisenessScore} after={after.concisenessScore} show={phase >= 4} />
        </div>
      </div>
    </div>
  );
}
