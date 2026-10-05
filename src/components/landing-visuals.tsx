import { useEffect, useState } from "react";
import type { ProblemTransformation } from "@/content/types";

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
    const on = (e: MediaQueryListEvent) => setR(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
}

function useCycle(count: number, ms: number) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) { setI(count - 1); return; }
    const t = setTimeout(() => setI((p) => (p + 1) % count), ms);
    return () => clearTimeout(t);
  }, [i, reduced, count, ms]);
  return i;
}


/** Rotating hero word: soft vertical crossfade, no typing effect. */
export function RotatingWord({ words }: { words: string[] }) {
  const i = useCycle(words.length, 2400);
  const reduced = useReducedMotion();
  const w = reduced ? words[0]! : words[i % words.length]!;
  return (
    <span className="relative inline-grid overflow-hidden align-bottom" aria-live="off">
      {words.map((x) => <span key={x} aria-hidden className="invisible col-start-1 row-start-1">{x}</span>)}
      <span key={w} className="word-rise col-start-1 row-start-1 text-primary">{w}</span>
      <span className="sr-only">{words.join(", ")}</span>
    </span>
  );
}

/** Animated visual for each transformation pair. */
function PairVisual({ index, after }: { index: number; after: boolean }) {
  const t = "all 800ms cubic-bezier(.32,.72,0,1)";
  const bar = (w: string, hi = false, extra: React.CSSProperties = {}) => ({ width: w, transition: t, ...extra, className: `h-3 rounded-full ${hi ? "bg-primary" : "bg-muted-foreground/35"}` });
  switch (index % 4) {
    case 0: // rambling → concise: many bars compress to two
      return <div className="w-full space-y-2">{[92, 84, 96, 70, 88, 60].map((w, i) => { const b = bar(after ? (i < 2 ? `${[70, 45][i]}%` : "0%") : `${w}%`, after && i === 0, { opacity: after && i >= 2 ? 0 : 1 }); return <div key={i} className={b.className} style={{ width: b.width, transition: b.transition, opacity: b.opacity }} />; })}</div>;
    case 1: { // scattered → structured
      const pos = [[8, 60], [62, 10], [30, 80], [70, 70]];
      return <div className="relative h-28 w-full">{["Point", "Reason", "Example", "Close"].map((l, i) => (
        <span key={l} className={`absolute rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${i === 0 && after ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
          style={{ left: after ? `${i * 25}%` : `${pos[i]![0]}%`, top: after ? "40%" : `${pos[i]![1]}%`, transition: t }}>{l}</span>))}</div>;
    }
    case 2: // unclear → precise: blur to sharp
      return <p className="font-display text-[clamp(18px,3vw,28px)] font-bold leading-snug" style={{ filter: after ? "none" : "blur(3px)", opacity: after ? 1 : 0.6, transition: t }}>{after ? "Cut onboarding from 9 days to 4." : "We kind of improved things a lot."}</p>;
    default: // forgettable → memorable: one point rises
      return <div className="flex w-full items-end gap-2 h-24">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`flex-1 rounded-md ${i === 2 && after ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ height: i === 2 && after ? "100%" : "35%", transition: t }} />)}</div>;
  }
}

/** "The real problem" reel: the four transformations play inside the video frame, then the closing line. */
export function TransformationReel({ pairs, video, closing }: { pairs: ProblemTransformation[]; video: string; closing: React.ReactNode }) {
  const frames = pairs.length * 2 + 1; // before/after per pair, then end frame
  const f = useCycle(frames, 1500);
  const end = f === frames - 1;
  const idx = Math.floor(f / 2);
  const after = f % 2 === 1;
  const pair = pairs[Math.min(idx, pairs.length - 1)]!;
  return (
    <div className="relative mt-10 aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border sm:aspect-video lg:aspect-auto lg:h-[min(82vh,860px)] lg:min-h-[560px]">
      <video src={video} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/90" />
      <div className="absolute inset-x-0 top-0 flex gap-1 p-4 md:p-6" aria-hidden>
        {pairs.map((p, i) => <span key={p.from} className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i < idx || end || (i === idx && after) ? "bg-primary" : "bg-border"}`} />)}
      </div>
      <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-14" aria-live="off">
        {end ? (
          <p key="end" className="rise max-w-xl font-display text-[clamp(26px,4vw,44px)] font-bold leading-tight">{closing}</p>
        ) : (
          <div key={idx} className="rise grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.16em] text-muted-foreground transition-all duration-500" style={{ textDecoration: after ? "line-through" : "none", opacity: after ? 0.5 : 1 }}>{pair.from}</div>
              <div className="font-mono text-[11px] text-primary">{String(idx + 1).padStart(2, "0")}</div>
              <div className="mt-2 font-display text-[clamp(32px,5vw,60px)] font-bold leading-none transition-all duration-500" style={{ opacity: after ? 1 : 0.15 }}><span className="text-primary">↓ </span>{pair.to}</div>
            </div>
            <div className="glass rounded-2xl p-5"><PairVisual index={idx} after={after} /></div>
          </div>
        )}
      </div>
      <span className="sr-only">{pairs.map((p) => `${p.from} to ${p.to}`).join(", ")}</span>
    </div>
  );
}
