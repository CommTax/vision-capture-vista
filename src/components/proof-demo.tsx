import { useEffect, useState } from "react";
import type { DemoAttempt, ProofDemo } from "@/content/types";

// Phases: 0 question · 1 attempt 01 · 2 what got lost · 3 attempt 02 · 4 comparison
const PHASE_MS = [1400, 3200, 1800, 2600, 4200];
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

function Timeline({ a, active, total, tone }: { a: DemoAttempt; active: boolean; total: number; tone: "muted" | "primary" }) {
  const mainPct = (a.mainPointDelay / total) * 100;
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {a.responseSequence.map((seg, i) => (
          <span
            key={seg.label}
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-all duration-500 sm:text-[11px] ${
              seg.main
                ? "border-primary/60 bg-primary/15 text-primary"
                : tone === "muted" ? "border-border text-muted-foreground" : "border-border text-foreground/80"
            }`}
            style={{ opacity: active ? 1 : 0.15, transform: active ? "none" : "translateY(4px)", transitionDelay: active ? `${i * (tone === "muted" ? 480 : 260)}ms` : "0ms" }}
          >
            {seg.label}
          </span>
        ))}
      </div>
      <div className="relative mt-3 h-1.5 rounded-full bg-secondary">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${tone === "muted" ? "bg-muted-foreground/40" : "bg-primary/40"}`}
          style={{ width: active ? `${mainPct}%` : "0%", transition: `width ${tone === "muted" ? 2200 : 700}ms cubic-bezier(.32,.72,0,1)` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)] transition-opacity duration-300"
          style={{ left: `${mainPct}%`, opacity: active ? 1 : 0, transitionDelay: active ? `${tone === "muted" ? 2200 : 700}ms` : "0ms" }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>0s</span><span>{total}s</span></div>
    </div>
  );
}

function Delta({ label, before, after, show }: { label: string; before: number; after: number; show: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono"><span className="text-muted-foreground">{before}</span> → <span className="font-semibold text-primary">{after}</span></span>
      </div>
      <div className="relative mt-1.5 h-1 rounded-full bg-secondary">
        <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/40" style={{ width: `${before}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: show ? `${after}%` : `${before}%`, transition: "width 900ms cubic-bezier(.32,.72,0,1) 200ms" }} />
      </div>
    </div>
  );
}

/** Data-driven retry demonstration. Accepts real analysis data with the same shape. */
export function ProofDemoCard({ title, demo }: { title: string; demo: ProofDemo }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) { setPhase(LAST); return; }
    const t = setTimeout(() => setPhase((p) => (p >= LAST ? 0 : p + 1)), PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  const { before, after } = demo;
  const total = Math.max(30, ...[...before.responseSequence, ...after.responseSequence].map((s) => s.at + 4));
  const fade = (on: boolean) => ({ opacity: on ? 1 : 0.25, transition: "opacity 500ms ease" });

  return (
    <div className="glass glass-float p-5 md:p-7" aria-label={`${title} ${before.patternLabels.join(" ")}: main point at ${before.mainPointDelay}s. ${after.patternLabels.join(" ")}: main point at ${after.mainPointDelay}s.`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="eyebrow">{title}</span>
        <div className="flex gap-1" aria-hidden>
          {PHASE_MS.map((_, i) => <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === phase ? "w-4 bg-primary" : "w-1.5 bg-secondary"}`} />)}
        </div>
      </div>

      <div className="rounded-xl border border-border px-4 py-2.5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Same question</div>
        <div className="mt-0.5 font-display text-[15px] font-semibold sm:text-[16px]">“{demo.question}”</div>
      </div>

      <div className="mt-3 rounded-2xl border border-border p-4" style={fade(phase >= 1)}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="eyebrow">Attempt 0{before.attemptNumber}</div>
          <div className="font-mono text-[12px] text-muted-foreground">Main point at <span className="text-foreground">{before.mainPointDelay}s</span></div>
        </div>
        <div className="mt-1 font-display text-[16px] font-bold text-muted-foreground sm:text-[18px]">{before.patternLabels.join(" · ")}</div>
        <Timeline a={before} active={phase >= 1} total={total} tone="muted" />
      </div>

      <div className="my-2 flex items-center gap-3 px-1 text-[13px]" style={fade(phase >= 2)}>
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">What got lost?</span>
        <span className="text-foreground/90">{demo.whatGotLost}</span>
      </div>

      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4" style={fade(phase >= 3)}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="eyebrow !text-primary">Attempt 0{after.attemptNumber}</div>
          <div className="font-mono text-[12px]">Main point at <span className="text-primary">{after.mainPointDelay}s</span></div>
        </div>
        <div className="mt-1 font-display text-[17px] font-bold sm:text-[20px]">{after.patternLabels.join(" · ")}</div>
        <Timeline a={after} active={phase >= 3} total={total} tone="primary" />
      </div>

      <div className="mt-4" style={fade(phase >= 4)}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-medium">{demo.caption}</span>
          <span className="font-display text-[15px] font-bold"><span className="text-muted-foreground">{before.mainPointDelay}s</span> → <span className="text-primary">{after.mainPointDelay}s</span></span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <Delta label="Structure" before={before.structureScore} after={after.structureScore} show={phase >= 4} />
          <Delta label="Conciseness" before={before.concisenessScore} after={after.concisenessScore} show={phase >= 4} />
        </div>
      </div>
    </div>
  );
}
