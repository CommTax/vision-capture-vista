import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";

/* "How Unspoken works": one product canvas that transforms through six stages.
   Desktop: scroll-driven sticky canvas. Mobile / reduced motion: vertical story of the same canvas. */

const STAGES = ["Practice", "Respond", "See", "Fix", "Retry", "Change"] as const;
const QUESTION = "Should remote work be the default for knowledge workers?";
const OPENING = "I understand why we're considering this approach, and there are a lot of angles — collaboration, hiring, how teams have changed…";
const POINT = "So my view is: remote by default, with two anchor days.";
const EASE = [0.32, 0.72, 0, 1] as const;

function Waveform({ live, bars = 40, height = 120, tone = "accent" }: { live: boolean; bars?: number; height?: number; tone?: "accent" | "muted" }) {
  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const base = 0.25 + 0.6 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21));
        return (
          <motion.span key={i} className={`w-[4px] rounded-full ${tone === "accent" ? "bg-accent" : "bg-muted-foreground/30"}`}
            initial={{ height: height * 0.1 }}
            animate={live ? { height: [height * base * 0.4, height * base, height * base * 0.55] } : { height: height * base * 0.35 }}
            transition={live ? { duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } : { duration: 0.6, ease: EASE }} />
        );
      })}
    </div>
  );
}

function Timer({ run, to }: { run: boolean; to: number }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!run) return; setS(0);
    const id = setInterval(() => setS((x) => (x >= to ? x : x + 1)), 420);
    return () => clearInterval(id);
  }, [run, to]);
  return <span className="font-mono text-[13px] tabular-nums">00:{String(s).padStart(2, "0")}</span>;
}

function Typed({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(run ? 0 : text.length);
  useEffect(() => {
    if (!run) { setN(text.length); return; }
    setN(0); const id = setInterval(() => setN((x) => (x >= text.length ? x : x + 2)), 40);
    return () => clearInterval(id);
  }, [run, text]);
  return <>{text.slice(0, n)}</>;
}

const Eyebrow = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "coral" | "green" }) => (
  <div className={`font-mono text-[11px] tracking-[0.16em] ${tone === "accent" ? "text-accent" : tone === "coral" ? "text-[#C2513A]" : tone === "green" ? "text-[#2E7D4F]" : "text-muted-foreground"}`}>{children}</div>
);

const enter = { initial: { opacity: 0, y: 18, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -14, scale: 0.98 }, transition: { duration: 0.55, ease: EASE } };

/** The body of the canvas for a given stage. `live` enables the running animations. */
function StageBody({ stage, live }: { stage: number; live: boolean }) {
  switch (stage) {
    case 0: return (
      <motion.div key="s0" {...enter} className="flex h-full flex-col justify-center">
        <div className="text-[14px] font-medium">What do you want to work on?</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Structure", "Impact", "Specificity", "Delivery"].map((c, i) => (
            <span key={c} className={`rounded-full border px-4 py-2 text-[14px] ${i === 0 ? "border-accent bg-accent-soft text-accent" : "border-input text-muted-foreground"}`}>{c}</span>
          ))}
        </div>
        <motion.div className="mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[15px] font-medium text-accent-foreground"
          animate={live ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          Start responding <ArrowRight className="size-4" />
        </motion.div>
      </motion.div>
    );
    case 1: return (
      <motion.div key="s1" {...enter} className="flex h-full flex-col items-center justify-center text-center">
        <Waveform live={live} height={150} />
        <div className="mt-6 flex items-center gap-3"><span className="size-2 animate-pulse rounded-full bg-[#E5484D]" /><Timer run={live} to={9} /><span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">RECORDING</span></div>
        <p className="mt-6 max-w-[46ch] text-[15px] italic text-muted-foreground">“<Typed text={OPENING.slice(0, 54) + "…"} run={live} />”</p>
        <div className="mt-8 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Mic className="size-5" /></div>
      </motion.div>
    );
    case 2: return (
      <motion.div key="s2" {...enter} className="flex h-full flex-col">
        <div className="rounded-xl border border-border bg-card px-4 py-2"><Waveform live={false} height={28} bars={64} tone="muted" /></div>
        <div className="mt-8"><Eyebrow tone="coral">WHAT GOT LOST</Eyebrow>
          <p className="mt-2 font-display text-[clamp(22px,3vw,32px)] font-bold leading-tight">Your main point appeared too late.</p></div>
        <div className="mt-6 space-y-3 text-[15px] leading-relaxed">
          <motion.p initial={{ backgroundColor: "rgba(255,240,237,0)" }} animate={{ backgroundColor: "rgba(255,226,219,1)" }} transition={{ delay: 0.5, duration: 0.6 }} className="rounded-lg px-3 py-2">“{OPENING}”</motion.p>
          <div className="flex items-center gap-3 pl-3 font-mono text-[11px] text-muted-foreground"><span className="h-px w-10 bg-border" />23 seconds later</div>
          <motion.p initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="rounded-lg border-l-2 border-accent px-3 py-2 font-medium">“{POINT}”</motion.p>
        </div>
        <div className="mt-auto pt-6"><Eyebrow>WHAT YOUR LISTENER MAY HEAR</Eyebrow><p className="mt-1 text-[15px] italic">“Lots of context. Where is this going?”</p></div>
      </motion.div>
    );
    case 3: return (
      <motion.div key="s3" {...enter} className="flex h-full flex-col justify-center">
        <Eyebrow tone="accent">MAKE IT LAND</Eyebrow>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: EASE }} className="mt-4 font-display text-[clamp(34px,5vw,60px)] font-bold uppercase leading-[0.95] tracking-tight">Lead with<br />the decision.</motion.p>
        <p className="mt-5 max-w-[44ch] text-[16px] text-muted-foreground">Your main point will land sooner when you state the decision first.</p>
      </motion.div>
    );
    case 4: return (
      <motion.div key="s4" {...enter} className="flex h-full flex-col justify-center">
        <p className="font-display text-[clamp(28px,4vw,44px)] font-bold uppercase leading-[0.95] tracking-tight">Same question.<br />New shape.</p>
        <div className="mt-8 rounded-xl bg-accent-soft p-4"><Waveform live={live} height={70} bars={56} /></div>
        <p className="mt-4 text-[15px] font-medium">“<Typed text={POINT} run={live} />”</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-accent-foreground">Try again <ArrowRight className="size-4" /></span>
          <span className="text-[13px] text-muted-foreground">Your next response will be compared with this one.</span>
        </div>
      </motion.div>
    );
    default: return (
      <motion.div key="s5" {...enter} className="flex h-full flex-col justify-center">
        <p className="font-display text-[clamp(26px,3.6vw,40px)] font-bold uppercase leading-[0.95] tracking-tight">Same question.<br />Different response.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-xl border border-border bg-card p-5"><Eyebrow>BEFORE</Eyebrow><div className="mt-1 font-display text-[24px] font-bold">Disjointed</div><div className="mt-1 font-mono text-[13px] text-muted-foreground">Main point · 23s</div></div>
          <ArrowRight className="mx-auto size-5 rotate-90 text-muted-foreground sm:rotate-0" />
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: EASE }} className="rounded-xl border border-[#2E7D4F]/20 bg-green-soft p-5"><Eyebrow tone="green">AFTER</Eyebrow><div className="mt-1 font-display text-[24px] font-bold">Clearer</div><div className="mt-1 font-mono text-[13px] text-[#2E7D4F]">Main point · 7s</div></motion.div>
        </div>
        <p className="mt-6 font-mono text-[11px] text-muted-foreground">Example session</p>
      </motion.div>
    );
  }
}

/** The persistent product frame: question header compacts after stage 0, body transforms. */
function Canvas({ stage, live, className = "" }: { stage: number; live: boolean; className?: string }) {
  const compact = stage > 0;
  return (
    <div className={`paper flex flex-col overflow-hidden rounded-[20px] border border-border bg-background shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3 md:px-8">
        <span className="font-mono text-[11px] font-semibold tracking-[0.22em]">UNSPOKEN</span>
        <span className="font-mono text-[11px] text-muted-foreground">{stage >= 4 ? "Attempt 2" : "Attempt 1"}</span>
      </div>
      <div className="flex flex-1 flex-col px-5 py-6 md:px-12 md:py-10">
        <motion.div layout transition={{ duration: 0.6, ease: EASE }}>
          <div className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">HIGH-STAKES · 90 SEC</div>
          <motion.h3 layout="position" className={`mt-2 font-display font-bold uppercase leading-[1] tracking-tight transition-[font-size] duration-500 ${compact ? "text-[clamp(15px,1.6vw,18px)]" : "text-[clamp(26px,4.2vw,52px)]"}`}>{QUESTION}</motion.h3>
        </motion.div>
        <div className="relative mt-6 flex-1">
          <AnimatePresence mode="wait">{<StageBody stage={stage} live={live} />}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StageIndicator({ stage }: { stage: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-[12px]">
      {STAGES.map((s, i) => (
        <span key={s} className={`transition-colors duration-300 ${i === stage ? "text-foreground" : "text-muted-foreground/60"}`}>
          <span className={i === stage ? "text-primary" : ""}>0{i + 1}</span> {s}
        </span>
      ))}
    </div>
  );
}

function ScrollStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const cuts = [0.2, 0.4, 0.6, 0.75, 0.9];
    const s = cuts.filter((c) => v >= c).length;
    setStage((p) => (p === s ? p : s));
  });
  return (
    <div ref={ref} className="relative h-[600vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-6 py-10">
        <StageIndicator stage={stage} />
        <Canvas stage={stage} live className="h-[min(700px,78vh)] w-[min(1000px,82vw)]" />
      </div>
    </div>
  );
}

function StackedStory({ animate }: { animate: boolean }) {
  return (
    <div className="space-y-10">
      {STAGES.map((s, i) => (
        <div key={s} className="flex min-h-[78vh] flex-col justify-center">
          <div className="mb-3 font-mono text-[12px] text-muted-foreground"><span className="text-primary">0{i + 1}</span> {s}</div>
          <InViewCanvas stage={i} animate={animate} />
        </div>
      ))}
    </div>
  );
}

function InViewCanvas({ stage, animate }: { stage: number; animate: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(!animate);
  useEffect(() => {
    if (!animate || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.45 });
    io.observe(ref.current); return () => io.disconnect();
  }, [animate]);
  return <div ref={ref}>{seen ? <Canvas stage={stage} live={animate} className="min-h-[520px]" /> : <div className="min-h-[520px] rounded-[20px] border border-border" />}</div>;
}

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const f = () => setD(m.matches); f(); m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return d;
}

export function HowItWorksDemo() {
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  return (
    <div>
      <div className="mx-auto max-w-[1200px] px-5 text-center md:px-8">
        <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">HOW UNSPOKEN WORKS</div>
        <h2 className="mx-auto mt-4 max-w-[18ch] text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]">Practice a real moment. See what got lost.</h2>
        <p className="mt-3 text-[15px] text-muted-foreground md:text-[17px]">Say it again. See what changes.</p>
      </div>
      <div className="mt-10 px-5 md:px-8">
        {desktop && !reduce ? <ScrollStory /> : <div className="mx-auto max-w-[680px]"><StackedStory animate={!reduce} /></div>}
      </div>
      <div className="mx-auto mt-16 max-w-[700px] px-5 text-center">
        <h3 className="text-[clamp(26px,3.2vw,40px)] font-bold leading-tight">Practice the moments that matter.</h3>
        <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">Your next interview.<br />Your next presentation.<br />Your next difficult conversation.</p>
        <p className="mt-4 text-[16px] font-medium">Practice it before it matters.</p>
        <Link to="/practice" className="btn btn-primary mt-7 px-7 py-3.5">Start practising <ArrowRight className="size-4" /></Link>
      </div>
    </div>
  );
}
