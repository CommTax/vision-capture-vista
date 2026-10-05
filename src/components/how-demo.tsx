import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

const FIRST = "I understand why we're considering this approach. There are a few things we should probably think about first…";
const SECOND = "I recommend we keep the current approach because it reduces the handoff risk by 30%.";
// phase durations: 0 scenario · 1 speaking · 2 what got lost · 3 fix · 4 retry · 5 payoff hold
const MS = [1600, 3600, 3400, 2800, 3200, 4600];
const TABS = ["Practice", "What got lost", "One thing to fix", "Try again"];

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); setR(m.matches); }, []);
  return r;
}

function Typed({ text, run, ms }: { text: string; run: boolean; ms: number }) {
  const [n, setN] = useState(run ? 0 : text.length);
  useEffect(() => {
    if (!run) { setN(text.length); return; }
    setN(0);
    const words = text.split(" ");
    let i = 0;
    const id = setInterval(() => { i++; setN(words.slice(0, i).join(" ").length); if (i >= words.length) clearInterval(id); }, ms / words.length);
    return () => clearInterval(id);
  }, [text, run, ms]);
  return <>{text.slice(0, n)}{n < text.length && <span className="ml-0.5 inline-block h-[1em] w-px translate-y-[2px] animate-pulse bg-primary" />}</>;
}

const fade = (on: boolean) => `transition-all duration-700 ease-out ${on ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"}`;

/** Homepage "How Unspoken works": one simulated practice session that plays the loop. */
export function HowItWorksDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReduced();
  const [visible, setVisible] = useState(false);
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0.35 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (reduced || !visible) return;
    const t = setTimeout(() => setP((x) => (x + 1) % MS.length), MS[p]);
    return () => clearTimeout(t);
  }, [p, visible, reduced]);

  const phase = reduced ? 5 : p;
  const tab = phase <= 1 ? 0 : phase === 2 ? 1 : phase === 3 ? 2 : 3;
  const retry = phase >= 4;

  return (
    <div ref={ref} className="glass glass-float overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 md:px-7">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /><span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">High-stakes conversation</span></div>
        <span className="font-mono text-[11px] text-muted-foreground">90 sec</span>
      </div>
      <div className="flex gap-1 overflow-hidden border-b border-border px-5 py-2 md:px-7">
        {TABS.map((t, i) => (
          <span key={t} className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] transition-colors duration-500 ${i === tab ? "bg-primary/15 text-primary" : "text-muted-foreground"} ${i !== tab ? "hidden sm:inline" : ""}`}>{t}</span>
        ))}
      </div>

      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        {/* left: scenario + response */}
        <div className="border-b border-border p-6 md:border-b-0 md:border-r md:p-9">
          <p className="font-display text-[clamp(20px,2.4vw,28px)] font-bold leading-snug">Tell your manager you disagree with the proposed approach.</p>
          <div className="mt-6 flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${phase === 1 || phase === 4 ? "border-primary bg-primary/15" : "border-border"}`}><Mic className="h-4 w-4 text-primary" aria-hidden /></span>
            <div className="flex h-6 items-center gap-[3px]" aria-hidden>
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-[3px] rounded-full bg-primary/70 transition-all duration-300" style={{ height: phase === 1 || phase === 4 ? `${30 + ((i * 37) % 70)}%` : "15%" }} />
              ))}
            </div>
            <span className="text-[12px] text-muted-foreground">{phase === 0 ? "Start speaking" : retry ? "Attempt 02" : "Attempt 01"}</span>
          </div>
          <div className="mt-5 min-h-[96px] text-[15px] leading-7">
            {phase >= 1 && !retry && <p className="text-muted-foreground">“<Typed text={FIRST} run={!reduced && phase === 1} ms={3000} />”</p>}
            {retry && <p>“<Typed text={SECOND} run={!reduced && phase === 4} ms={2400} />”</p>}
          </div>
        </div>

        {/* right: analysis states */}
        <div className="grid p-6 md:p-9">
          <div className={`[grid-area:1/1] ${fade(phase <= 1)}`}>
            <div className="eyebrow">Analysis</div>
            <p className="mt-3 text-[14px] text-muted-foreground">Listening for your main point…</p>
          </div>

          <div className={`[grid-area:1/1] ${fade(phase === 2 || phase === 3)}`}>
            <div className="eyebrow !text-primary">What got lost</div>
            <p className="mt-2 font-display text-[22px] font-bold leading-snug md:text-[26px]">Your recommendation came too late.</p>
            <div className="mt-5 eyebrow">Why</div>
            <p className="mt-1 text-[14px] text-muted-foreground">You explained the background before making your point.</p>
            <div className="mt-4">
              <div className="flex gap-1.5">
                <span className="h-2 flex-[3] rounded-full bg-muted-foreground/30" /><span className="h-2 flex-[3] rounded-full bg-muted-foreground/30" /><span className="h-2 flex-[1.4] rounded-full bg-primary" />
              </div>
              <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>0s · Background</span><span className="text-primary">18s · Main point</span></div>
            </div>
            <div className={`mt-6 border-t border-border pt-5 ${fade(phase === 3)}`}>
              <div className="eyebrow !text-primary">One thing to fix</div>
              <p className="mt-1 font-display text-[18px] font-bold">Lead with your recommendation.</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Try this · <span className="text-foreground">Recommendation → Reason → Evidence</span></p>
            </div>
          </div>

          <div className={`[grid-area:1/1] ${fade(retry)}`}>
            <div className="eyebrow !text-primary">Try again</div>
            <p className="mt-2 text-[13px] text-muted-foreground">Same situation. Same goal. New focus.</p>
            <div className={`mt-6 ${fade(phase === 5)}`}>
              <div className="font-display text-[clamp(36px,5vw,56px)] font-bold leading-none">18s <span className="text-muted-foreground">→</span> <span className="text-primary">4s</span></div>
              <p className="mt-2 text-[13px] text-muted-foreground">to main point</p>
              <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.14em]"><span className="text-muted-foreground line-through decoration-muted-foreground/50">Scattered</span> <span className="text-muted-foreground">→</span> <span className="text-primary">Direct</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
