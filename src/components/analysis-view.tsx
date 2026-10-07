import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { DIMENSIONS, DRILLS, PATTERNS } from "@/lib/data";
import { ChevronDown } from "lucide-react";

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ScoreBar({ label, value, prev }: { label: string; value: number; prev?: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]"><span className="text-muted-foreground">{label}</span><span className="font-mono text-primary">{prev !== undefined && <span className="mr-1 text-muted-foreground">{prev} →</span>}{value}</span></div>
      <div className="bar relative">
        {prev !== undefined && <span className="absolute inset-y-0 left-0 !bg-muted-foreground/40" style={{ width: `${prev}%` }} />}
        <span className="relative" style={{ width: `${value}%`, opacity: prev !== undefined ? 0.8 : 1 }} />
      </div>
    </div>
  );
}

export function PatternShift({ pattern, size = "lg" }: { pattern: string; size?: "lg" | "sm" }) {
  const p = PATTERNS[pattern] ?? PATTERNS.scatterer;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`font-mono text-muted-foreground line-through ${size === "lg" ? "text-[14px]" : "text-[11px]"}`}>{p.short}</span>
      <span className="text-primary">→</span>
      <span className={`clip-in font-display font-bold tracking-tight ${size === "lg" ? "text-[clamp(28px,4vw,40px)]" : "text-[18px]"}`}>{p.to}</span>
    </div>
  );
}

export function AnalysisView({ a, transcript, onRetry }: { a: Analysis; transcript: string; onRetry?: () => void }) {
  const [open, setOpen] = useState<string | null>("structure");
  const P = PATTERNS[a.primary_pattern];
  const drill = DRILLS.find((d) => d.id === a.recommended_drill);
  return (
    <div className="space-y-6">
      {/* Pattern */}
      <section className="glass glass-float rise p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="eyebrow mb-4">Your response pattern</div>
            <PatternShift pattern={a.primary_pattern} />
            <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">{a.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">{P?.name ?? a.primary_pattern}</span>
              {a.secondary_pattern && a.secondary_pattern !== a.primary_pattern && (
                <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">Secondary: {PATTERNS[a.secondary_pattern]?.name ?? a.secondary_pattern}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="eyebrow">Overall</div>
            <div className="font-display text-[44px] font-bold">{a.overall}</div>
            <div className="text-[12px] text-muted-foreground">supporting metric</div>
          </div>
        </div>
      </section>

      {/* What got lost */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="glass p-7 lg:col-span-7">
          <div className="eyebrow mb-4">What got lost</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><div className="mb-1 text-[12px] text-muted-foreground">Your intended message</div><p className="font-display text-[18px] font-bold leading-snug">{a.what_got_lost.intended}</p></div>
            <div><div className="mb-1 text-[12px] text-muted-foreground">What the listener may have heard</div><p className="text-[16px] leading-snug text-muted-foreground">{a.what_got_lost.heard}</p></div>
          </div>
          <div className="mt-6 text-[12px] text-muted-foreground">Why it got lost</div>
          <div className="mt-2 space-y-1.5 text-[14px]">{a.what_got_lost.why.map((w) => <div key={w} className="flex gap-2"><span className="text-primary">·</span>{w}</div>)}</div>
        </div>
        <div className="glass p-7 lg:col-span-5">
          <div className="eyebrow mb-4 text-primary">Make it land</div>
          <ol className="space-y-3">{a.what_got_lost.makeItLand.map((m, i) => <li key={m} className="flex gap-3 text-[14px]"><span className="font-mono text-primary">0{i + 1}</span>{m}</li>)}</ol>
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-[14px]"><div className="eyebrow mb-1 text-primary">One thing to fix</div>{a.retry_instruction}{onRetry && <button className="btn btn-primary btn-sm mt-3 w-full" onClick={onRetry}>Retry with this focus</button>}</div>
        </div>
      </section>

      {/* helped / improve */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="glass p-6"><div className="eyebrow mb-3">What helped</div>{a.strengths.map((s) => <div key={s} className="flex gap-2 py-1 text-[14px]"><span className="text-success">+</span>{s}</div>)}</div>
        <div className="glass p-6"><div className="eyebrow mb-3">What to improve</div>{a.improvements.map((s) => <div key={s} className="flex gap-2 py-1 text-[14px]"><span className="text-primary">→</span>{s}</div>)}</div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Time to point", a.main_point_delay ? `${a.main_point_delay}s` : "—"],
          ["Words", a.word_count],
          ["Words / min", a.wpm || "—"],
          ["Filler words", a.filler_words.reduce((x, f) => x + f.count, 0)],
          ["Sentences", a.sentence_count],
          ["Avg sentence", `${a.avg_sentence_length} words`],
          ["Pauses", a.pauses ?? "—"],
          ["Repeated", a.repeated_words.map((r) => r.word).join(", ") || "None"],
        ].map(([l, v]) => (
          <div key={l as string} className="glass p-4"><div className="eyebrow">{l}</div><div className="mt-1 truncate font-display text-[22px] font-bold">{v}</div></div>
        ))}
      </section>

      {/* Dimensions — hidden when the answer was too short to diagnose */}
      {a.overall > 0 && (
        <section className="glass p-6 md:p-7">
          <div className="eyebrow mb-1">Eight dimensions</div>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Tap any dimension to see what happened, the evidence, and what it means.
          </p>
          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
            {DIMENSIONS.map((d) => {
              const r = a.dimensions[d];
              const isOpen = open === d;
              return (
                <div key={d} className="border-b border-border py-3">
                  <button
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setOpen(isOpen ? null : d)}
                    aria-expanded={isOpen}
                  >
                    <ScoreBar label={d.toUpperCase()} value={r.score} />
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-3 space-y-2 text-[13px]">
                      <p><span className="text-muted-foreground">What happened: </span>{r.happened}</p>
                      <p><span className="text-muted-foreground">Evidence: </span>{r.evidence}</p>
                      <p><span className="text-primary">What it means: </span>{r.tryThis}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Original vs example vs rework */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="glass p-6">
          <div className="eyebrow mb-3">Your original</div>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">{transcript}</p>
        </div>
        <div className="glass p-6">
          <div className="eyebrow mb-3 text-primary">Example structure</div>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{a.example_structure}</p>
          <p className="mt-4 text-[11px] text-muted-foreground">An example structure — not the correct answer. Use your own words.</p>
        </div>
      </section>

      {a.rework && (
        <section className="glass p-6">
          <div className="eyebrow mb-3 text-primary">Your words, reworked</div>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{a.rework}</p>
          <p className="mt-4 text-[11px] text-muted-foreground">
            An example of how this could sound — not a script. Use your own words.
          </p>
        </section>
      )}

      {drill && (
        <section className="glass flex flex-wrap items-center justify-between gap-4 p-6">
          <div><div className="eyebrow mb-1">Recommended drill</div><div className="font-display text-[20px] font-bold">{drill.name}</div><div className="text-[13px] text-muted-foreground">{drill.objective}</div></div>
          <Link to="/drills/$drillId" params={{ drillId: drill.id }} className="btn btn-ghost">Start drill</Link>
        </section>
      )}
    </div>
  );
}

export function ComparePanel({ a1, a2, n1 = 1, n2 = 2 }: { a1: Analysis; a2: Analysis; n1?: number; n2?: number }) {
  const ds = a2.scores.structure - a1.scores.structure;
  return (
    <section className="glass glass-float rise p-6 md:p-7">
      <div className="mb-6 flex items-center justify-between"><div className="eyebrow">Attempt comparison</div><span className="text-[11px] text-muted-foreground">retry · same prompt</span></div>
      <div className="grid grid-cols-3 items-center gap-4 text-center text-[13px]">
        <div><div className="mb-2 text-muted-foreground">Attempt {String(n1).padStart(2, "0")}</div><div className="font-display text-[28px] font-bold">{a1.scores.structure}</div><div className="text-[11px] text-muted-foreground">structure</div></div>
        <div><div className="mb-2 text-muted-foreground">Δ</div><div className={`font-display text-[28px] font-bold ${ds >= 0 ? "text-primary" : "text-destructive"}`}>{ds >= 0 ? "+" : ""}{ds}</div><div className="text-[11px] text-muted-foreground">{a1.main_point_delay}s → {a2.main_point_delay}s to point</div></div>
        <div><div className="mb-2 text-muted-foreground">Attempt {String(n2).padStart(2, "0")}</div><div className="font-display text-[28px] font-bold text-primary">{a2.scores.structure}</div><div className="text-[11px] text-muted-foreground">structure</div></div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {DIMENSIONS.map((d) => <ScoreBar key={d} label={cap(d)} value={a2.scores[d]} prev={a1.scores[d]} />)}
      </div>
      <p className="mt-5 text-[14px]">{verdict(a1, a2)}</p>
      <div className="mt-3 flex flex-wrap gap-6 text-[13px] text-muted-foreground">
        <span>Word count <b className="font-mono text-foreground">{a1.word_count} → {a2.word_count}</b></span>
        <span>Time to point <b className="font-mono text-foreground">{a1.main_point_delay}s → {a2.main_point_delay}s</b></span>
        <span>Overall <b className="font-mono text-foreground">{a1.overall} → {a2.overall}</b></span>
        <span>Pattern <b className="text-foreground">{PATTERNS[a1.primary_pattern]?.short} → {PATTERNS[a2.primary_pattern]?.short}</b></span>
      </div>
    </section>
  );
}

export function Spark({ series }: { series: number[] }) {
  if (series.length < 2) return <div className="h-10" />;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${40 - (v / 100) * 40}`).join(" ");
  return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full"><polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}


function verdict(a1: Analysis, a2: Analysis) {
  const diffs = DIMENSIONS.map((d) => [d, a2.scores[d] - a1.scores[d]] as const).sort((x, y) => y[1] - x[1]);
  const [best, gain] = diffs[0];
  const [worst, loss] = diffs[diffs.length - 1];
  if (gain <= 0) return `No gains this time — your ${worst} dropped ${Math.abs(loss)}. Re-read "One thing to fix" and try once more.`;
  return `Biggest gain: ${best} +${gain}.${a2.main_point_delay < a1.main_point_delay ? ` You reached your point ${a1.main_point_delay - a2.main_point_delay}s sooner.` : ""}${loss < 0 ? ` Watch ${worst} (${loss}).` : ""}`;
}
