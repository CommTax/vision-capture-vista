import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Mic, RotateCcw } from "lucide-react";

const EASE = [0.32, 0.72, 0, 1] as const;

function Waveform() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="flex h-16 items-center justify-center gap-1.5" aria-hidden="true">
      {Array.from({ length: 25 }, (_, i) => {
        const height = 14 + Math.abs(Math.sin(i * 0.72) * 34);
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

function PracticeView() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="product-kicker">High-stakes conversation</span>
        <span className="product-status"><span /> Live</span>
      </div>
      <h4 className="mt-5 max-w-[25ch] text-[19px] font-medium leading-snug md:text-[22px]">Tell your manager you disagree with the proposed approach.</h4>
      <div className="my-auto py-6"><Waveform /></div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="font-mono text-[12px] text-muted-foreground">00:18</span>
        <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground"><Mic className="size-4" /></span>
      </div>
    </div>
  );
}

function InsightView() {
  return (
    <div className="flex h-full flex-col">
      <span className="product-kicker">What got lost</span>
      <h4 className="mt-5 text-[22px] font-semibold leading-tight md:text-[25px]">Your recommendation came too late.</h4>
      <div className="my-6 border-l-2 border-accent pl-4 text-[14px] leading-6 text-muted-foreground">
        The context arrived first.<br />The decision was easy to miss.
      </div>
      <div className="mt-auto rounded-lg border border-accent/30 bg-accent/10 p-4">
        <div className="product-kicker !text-accent">One thing to fix</div>
        <p className="mt-2 text-[16px] font-medium">Lead with your recommendation.</p>
      </div>
    </div>
  );
}

function RetryView() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="product-kicker">Second take</span>
        <RotateCcw className="size-4 text-accent" />
      </div>
      <div className="my-auto space-y-4 py-8">
        <div className="grid grid-cols-[62px_1fr] items-center gap-3 text-[13px]">
          <span className="text-muted-foreground">Before</span>
          <span className="rounded-md bg-secondary px-3 py-2 text-muted-foreground line-through decoration-destructive/70">Context first</span>
        </div>
        <div className="grid grid-cols-[62px_1fr] items-center gap-3 text-[13px]">
          <span className="text-accent">After</span>
          <span className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 font-medium">Recommendation first</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-[13px] text-muted-foreground">Same moment. Clearer shape.</span>
        <ArrowRight className="size-4 text-accent" />
      </div>
    </div>
  );
}

const STEPS = [
  { n: "01", title: "Respond naturally", label: "Practice", view: <PracticeView /> },
  { n: "02", title: "See what got lost", label: "Insight", view: <InsightView /> },
  { n: "03", title: "Say it again", label: "Retry", view: <RetryView /> },
];

export function HowItWorksDemo() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="product-stage py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mx-auto max-w-[680px] text-center">
          <div className="product-kicker !text-accent">How Unspoken works</div>
          <h2 className="mt-4 text-balance text-[clamp(32px,4vw,54px)] font-bold leading-[1.04]">Practice. See it. Change it.</h2>
        </div>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.n}
              initial={reducedMotion ? false : { opacity: 0, y: 22 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: EASE }}
              className="product-step"
            >
              <div className="mb-4 flex items-end justify-between px-1">
                <div><span className="product-kicker text-accent">{step.n}</span><h3 className="mt-1 text-[18px] font-medium">{step.title}</h3></div>
                <span className="text-[11px] text-muted-foreground">{step.label}</span>
              </div>
              <div className="product-screen">{step.view}</div>
            </motion.article>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 text-center md:flex-row md:text-left">
          <h3 className="text-[clamp(24px,3vw,34px)] font-semibold">Practice the moments that matter.</h3>
          <Link to="/practice" className="btn btn-primary shrink-0 px-7 py-3.5">Start Practising <ArrowRight className="size-4" /></Link>
        </div>
      </div>
    </div>
  );
}