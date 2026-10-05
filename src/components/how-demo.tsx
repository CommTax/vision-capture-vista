import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Keyboard, Mic } from "lucide-react";

/* "How Unspoken works": three alternating steps, each led by a large product UI mock. Scenario-neutral by design. */

const EASE = [0.32, 0.72, 0, 1] as const;
const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.7, ease: EASE } };

const Eyebrow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`font-mono text-[11px] tracking-[0.16em] text-muted-foreground ${className}`}>{children}</div>
);

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...reveal} whileHover={{ y: -4 }} className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_1px_2px_rgb(23_24_28/4%),0_30px_60px_-30px_rgb(23_24_28/22%)]">
      <div className="flex items-center gap-1.5 border-b border-border px-5 py-3">
        {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-muted" />)}
        <span className="ml-3 font-mono text-[10px] font-semibold tracking-[0.22em]">UNSPOKEN</span>
      </div>
      <div className="p-6 md:p-10">{children}</div>
    </motion.div>
  );
}

function ChooseUI() {
  const cats = ["Interview", "Leadership", "Presentation", "High-stakes conversation", "Persuasion"];
  const focus = ["Structure", "Clarity", "Impact", "Specificity", "Delivery"];
  return (
    <Frame>
      <Eyebrow>PRACTICE</Eyebrow>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {cats.map((c, i) => (
          <div key={c} className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-[15px] transition ${i === 1 ? "border-accent bg-accent-soft font-medium text-accent" : "border-border hover:border-input"} ${i === 4 ? "sm:col-span-2" : ""}`}>
            {c}{i === 1 && <span className="size-2 rounded-full bg-accent" />}
          </div>
        ))}
      </div>
      <div className="mt-8 text-[15px] font-medium">What do you want to work on?</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {focus.map((f, i) => <span key={f} className={`rounded-full border px-4 py-2 text-[14px] ${i === 0 ? "border-accent bg-accent-soft text-accent" : "border-input text-muted-foreground"}`}>{f}</span>)}
      </div>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-accent-foreground">Start responding <ArrowRight className="size-4" /></div>
    </Frame>
  );
}

function Waveform() {
  return (
    <div className="flex h-24 items-center justify-center gap-[3px]">
      {Array.from({ length: 44 }).map((_, i) => {
        const b = 0.25 + 0.65 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21));
        return <motion.span key={i} className="w-[4px] rounded-full bg-accent" animate={{ height: [96 * b * 0.45, 96 * b, 96 * b * 0.6] }} transition={{ duration: 1 + (i % 5) * 0.15, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }} />;
      })}
    </div>
  );
}

function Timer() {
  const [s, setS] = useState(14);
  useEffect(() => { const id = setInterval(() => setS((x) => (x >= 59 ? 14 : x + 1)), 1000); return () => clearInterval(id); }, []);
  return <span className="font-mono text-[14px] tabular-nums">00:{String(s).padStart(2, "0")}</span>;
}

function RespondUI() {
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <Eyebrow>YOUR RESPONSE</Eyebrow>
        <div className="flex gap-1 rounded-full border border-border p-1 text-[13px]">
          <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-accent"><Mic className="size-3.5" />Speak</span>
          <span className="flex items-center gap-1.5 px-3 py-1 text-muted-foreground"><Keyboard className="size-3.5" />Type</span>
        </div>
      </div>
      <div className="mt-8 rounded-2xl bg-background p-6"><Waveform /></div>
      <div className="mt-5 flex items-center justify-center gap-3"><span className="size-2 animate-pulse rounded-full bg-destructive" /><Timer /><Eyebrow>RECORDING</Eyebrow></div>
      <div className="mt-6 rounded-xl border border-dashed border-input px-4 py-3 text-[14px] text-muted-foreground">
        <span className="text-foreground">“So the way I see it…</span> <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-block h-4 w-px translate-y-0.5 bg-foreground" />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <span className="rounded-full border border-input px-5 py-2.5 text-[14px]">Pause</span>
        <span className="rounded-full bg-primary px-5 py-2.5 text-[14px] text-primary-foreground">Finish response</span>
      </div>
    </Frame>
  );
}

function InsightUI() {
  return (
    <Frame>
      <Eyebrow className="!text-accent">YOUR PATTERN</Eyebrow>
      <div className="mt-3 font-display text-[clamp(28px,3.6vw,42px)] font-bold uppercase leading-[0.95] tracking-tight">Disjointed<br />Feature Drop</div>
      <p className="mt-4 max-w-[36ch] text-[16px] italic text-muted-foreground">“You have good things to say — they arrive as pieces, not a story.”</p>
      <motion.div initial={{ backgroundColor: "var(--card)" }} whileInView={{ backgroundColor: "var(--coral-soft)" }} viewport={{ once: true, amount: 0.6 }} transition={{ delay: 0.4, duration: 0.8 }} className="mt-8 rounded-2xl border border-border p-6">
        <Eyebrow>WHAT GOT LOST</Eyebrow>
        <p className="mt-2 font-display text-[clamp(22px,2.6vw,28px)] font-bold leading-tight">Your main point wasn't easy to find.</p>
      </motion.div>
      <div className="mt-3 rounded-2xl bg-accent-soft p-6">
        <Eyebrow className="!text-accent">MAKE IT LAND</Eyebrow>
        <p className="mt-2 text-[18px] font-medium">Lead with the point. Then support it.</p>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-accent-foreground">Try again <ArrowRight className="size-4" /></div>
    </Frame>
  );
}

const STEPS = [
  { n: "01", t: "Choose what to practise", d: "Pick a situation and the thing you want to improve.", ui: <ChooseUI /> },
  { n: "02", t: "Respond naturally", d: "Speak or type. Unspoken looks at what you actually said.", ui: <RespondUI /> },
  { n: "03", t: "See what got lost", d: "Get one clear insight. Change it. Try again.", ui: <InsightUI /> },
];

export function HowItWorksDemo() {
  return (
    <div className="paper py-20 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="text-center">
          <Eyebrow>HOW UNSPOKEN WORKS</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-[20ch] text-balance text-[clamp(30px,4vw,52px)] font-bold leading-[1.05]">Practice a real moment. See what got lost.</h2>
          <p className="mt-3 text-[15px] text-muted-foreground md:text-[17px]">Say it again. See what changes.</p>
        </div>

        <div className="mt-16 space-y-24 md:mt-24 md:space-y-36">
          {STEPS.map((s, i) => (
            <div key={s.n} className="grid items-center gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
              <motion.div {...reveal} className={i % 2 === 1 ? "md:order-2" : ""}>
                <div className="font-mono text-[14px] text-accent">{s.n}</div>
                <h3 className="mt-3 text-[clamp(26px,3vw,38px)] font-bold leading-tight">{s.t}</h3>
                <p className="mt-3 max-w-[32ch] text-[16px] leading-relaxed text-muted-foreground">{s.d}</p>
              </motion.div>
              <div className={i % 2 === 1 ? "md:order-1" : ""}>{s.ui}</div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-28 max-w-[640px] text-center">
          <div className="font-mono text-[12px] tracking-[0.16em] text-muted-foreground">PRACTICE → SEE → CHANGE → REPEAT</div>
          <h3 className="mt-5 text-[clamp(26px,3.2vw,40px)] font-bold leading-tight">Practice the moments that matter.</h3>
          <p className="mt-3 text-[16px] text-muted-foreground">Your next interview. Your next presentation. Your next difficult conversation.</p>
          <Link to="/practice" className="btn btn-accent mt-7 px-7 py-3.5">Start Practising <ArrowRight className="size-4" /></Link>
        </div>
      </div>
    </div>
  );
}
