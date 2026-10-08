import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { DIMENSIONS, DRILLS, PATTERNS } from "@/lib/data";
import { ChevronDown } from "lucide-react";

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ScoreBar({ label, value, prev }: { label: string; value: number; prev?: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-primary">
          {prev !== undefined && <span className="mr-1 text-muted-foreground">{prev} →</span>}
          {value}
        </span>
      </div>
      <div className="bar relative">
        {prev !== undefined && (
          <span
            className="absolute inset-y-0 left-0 !bg-muted-foreground/40"
            style={{ width: `${prev}%` }}
          />
        )}
        <span
          className="relative"
          style={{ width: `${value}%`, opacity: prev !== undefined ? 0.8 : 1 }}
        />
      </div>
    </div>
  );
}

export function PatternShift({ pattern, size = "lg" }: { pattern: string; size?: "lg" | "sm" }) {
  const p = PATTERNS[pattern] ?? PATTERNS.scatterer;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={`font-mono text-muted-foreground line-through ${
          size === "lg" ? "text-[14px]" : "text-[11px]"
        }`}
      >
        {p.short}
      </span>
      <span className="text-primary">→</span>
      <span
        className={`clip-in font-display font-bold tracking-tight ${
          size === "lg" ? "text-[clamp(28px,4vw,40px)]" : "text-[18px]"
        }`}
      >
        {p.to}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Dimension card — used in the Analytics tab
// ──────────────────────────────────────────────────────────────
function DimensionCard({
  dimension,
  score,
  open,
  onClick,
}: {
  dimension: string;
  score: number;
  open: boolean;
  onClick: () => void;
}) {
  const tone =
    score >= 70 ? "text-success" : score >= 50 ? "text-primary" : "text-destructive";
  const barColor =
    score >= 70 ? "rgb(74,222,128)" : score >= 50 ? "#a99bff" : "#f87171";

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5"
      style={{
        background: open
          ? "linear-gradient(160deg, rgba(139,127,255,0.16) 0%, rgba(26,16,51,0.4) 50%, rgba(11,13,20,0.85) 100%)"
          : "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 55%, rgba(11,13,20,0.6) 100%)",
        borderColor: open ? "rgba(139,127,255,0.45)" : "rgba(255,255,255,0.06)",
        boxShadow: open ? "0 22px 60px -22px rgba(139,127,255,0.4)" : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {dimension}
        </span>
        <span className={`font-display text-[22px] font-bold leading-none ${tone}`}>
          {score}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: barColor }}
        />
      </div>
    </button>
  );
}

export function AnalysisView({
  a,
  transcript,
  onRetry,
}: {
  a: Analysis;
  transcript: string;
  onRetry?: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [tab, setTab] = useState<"coaching" | "analytics">("coaching");

  const P = PATTERNS[a.primary_pattern];
  const drill = DRILLS.find((d) => d.id === a.recommended_drill);

  return (
    <div className="space-y-6">
      {/* ───────── TAB SWITCHER ───────── */}
      <div className="flex justify-center">
        <div
          className="inline-flex rounded-full border p-1"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <button
            onClick={() => setTab("coaching")}
            className={`rounded-full px-5 py-2 font-mono text-[12px] uppercase tracking-[0.1em] transition ${
              tab === "coaching"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Coaching
          </button>
          <button
            onClick={() => setTab("analytics")}
            className={`rounded-full px-5 py-2 font-mono text-[12px] uppercase tracking-[0.1em] transition ${
              tab === "analytics"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          COACHING TAB — the narrative
         ═══════════════════════════════════════════════════ */}
      {tab === "coaching" && (
        <>
          {/* 1. HERO RESULT CARD */}
          <section
            className="relative overflow-hidden rounded-3xl p-7 md:p-9"
            style={{
              background:
                "linear-gradient(160deg, rgba(139,127,255,0.14) 0%, rgba(26,16,51,0.4) 45%, rgba(11,13,20,0.9) 100%)",
              border: "1px solid rgba(139,127,255,0.35)",
              boxShadow:
                "0 24px 80px -30px rgba(139,127,255,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(139,127,255,0.45), transparent)",
                filter: "blur(20px)",
              }}
            />

            <div className="relative grid gap-8 md:grid-cols-12 md:items-center">
              {/* Left: score + pattern + summary */}
              <div className="md:col-span-7">
               
<div className="font-display text-[clamp(56px,9vw,88px)] font-bold leading-none tracking-tight">
  {a.overall}
</div>

                <div className="mt-5">
                  <PatternShift pattern={a.primary_pattern} />
                </div>

                <p className="mt-5 max-w-xl text-[16px] leading-7 text-muted-foreground">
                  {a.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2 text-[12px]">
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
                    {P?.name ?? a.primary_pattern}
                  </span>
                  {a.secondary_pattern && a.secondary_pattern !== a.primary_pattern && (
                    <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">
                      Secondary: {PATTERNS[a.secondary_pattern]?.name ?? a.secondary_pattern}
                    </span>
                  )}
                </div>

                {onRetry && (
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button className="btn btn-primary px-6 py-3 text-[15px]" onClick={onRetry}>
                      Try Again →
                    </button>
                    <a href="#what-got-lost" className="btn btn-ghost px-6 py-3 text-[15px]">
                      See what to fix
                    </a>
                  </div>
                )}
              </div>

              {/* Right: compact diagnosis panel */}
              <div className="md:col-span-5">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-5 backdrop-blur-sm">
                  <div className="eyebrow mb-3">Diagnosis</div>
                  <dl className="space-y-3 text-[13px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Primary pattern</dt>
                      <dd className="font-mono text-foreground">{P?.short}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Transition</dt>
                      <dd className="font-mono text-primary">
                        {P?.short} → {P?.to}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Time to point</dt>
                      <dd className="font-mono text-foreground">
                        {a.main_point_delay ? `${a.main_point_delay}s` : "—"}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Words</dt>
                      <dd className="font-mono text-foreground">{a.word_count}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </section>

          {/* 2. WHAT GOT LOST + MAKE IT LAND */}
          <div id="what-got-lost" className="space-y-6">
            <section className="glass p-7 md:p-8">
              <div className="eyebrow mb-5 !text-primary">What got lost</div>

              {/* Act 1 — Intended */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full border border-border bg-background/60 font-mono text-[10px] text-muted-foreground">
                    01
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    What you meant
                  </span>
                </div>
                <p className="mt-3 pl-8 text-[16px] font-medium leading-7 text-foreground">
                  {a.what_got_lost.intended}
                </p>
              </div>

              {/* Connector */}
              <div className="relative my-5 flex items-center gap-3 pl-8">
                <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  but
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
              </div>

              {/* Act 2 — Heard (bubble) */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full border border-destructive/40 bg-destructive/10 font-mono text-[10px] text-destructive">
                    02
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-destructive">
                    What they actually heard
                  </span>
                </div>

                <div className="relative mt-3 pl-8">
                  <div
                    className="relative rounded-2xl border border-destructive/30 bg-destructive/5 p-5"
                    style={{
                      boxShadow: "0 20px 60px -30px rgba(248,113,113,0.4)",
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute -left-2 top-5 size-4 rotate-45 border-b border-l border-destructive/30 bg-destructive/5"
                    />
                    <p className="font-display text-[19px] italic leading-7 text-foreground/90">
                      "{a.what_got_lost.heard}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Act 3 — Why */}
              <div className="mt-7 border-t border-border pt-6">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full border border-border bg-background/60 font-mono text-[10px] text-muted-foreground">
                    03
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Why it got lost
                  </span>
                </div>
                <ul className="mt-4 space-y-3">
                  {a.what_got_lost.why.map((w) => (
                    <li
                      key={w}
                      className="flex gap-3 rounded-2xl border border-border/60 bg-background/30 p-4 text-[14px] leading-6"
                    >
                      <span className="shrink-0 text-primary">·</span>
                      <span className="text-foreground/90">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Make it land — full width below */}
            <section className="glass p-7 md:p-8">
              <div className="eyebrow mb-4 !text-primary">Make it land</div>
              <ol className="grid gap-3 md:grid-cols-3">
                {a.what_got_lost.makeItLand.map((m, i) => (
                  <li
                    key={m}
                    className="flex gap-3 rounded-2xl border border-border/60 bg-background/30 p-4 text-[14px] leading-6"
                  >
                    <span className="shrink-0 font-mono text-primary">0{i + 1}</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5">
                <div className="eyebrow mb-2 !text-primary">One thing to fix</div>
                <p className="text-[15px] leading-6">{a.retry_instruction}</p>
                {onRetry && (
                  <button
                    className="btn btn-primary btn-sm mt-3"
                    onClick={onRetry}
                  >
                    Retry with this focus →
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* 4. ORIGINAL / EXAMPLE / REWORK */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="glass p-6">
              <button
                onClick={() => setTranscriptOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-4 text-left"
                aria-expanded={transcriptOpen}
              >
                <span className="eyebrow">Your original response</span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    transcriptOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {transcriptOpen && (
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
                  {transcript}
                </p>
              )}
              {!transcriptOpen && (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Tap to see what you said.
                </p>
              )}
            </div>

            <div className="glass p-6">
              <div className="eyebrow mb-3 !text-primary">Example structure</div>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                {a.example_structure}
              </p>
              <p className="mt-4 text-[11px] text-muted-foreground">
                An example structure — not the correct answer. Use your own words.
              </p>
            </div>
          </section>

          {a.rework && (
            <section className="glass p-6">
              <div className="eyebrow mb-3 !text-primary">Your words, reworked</div>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{a.rework}</p>
              <p className="mt-4 text-[11px] text-muted-foreground">
                An example of how this could sound — not a script. Use your own words.
              </p>
            </section>
          )}

          {/* 5. RECOMMENDED DRILL */}
          {drill && (
            <section className="glass flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <div className="eyebrow mb-1 !text-primary">Recommended drill</div>
                <div className="font-display text-[20px] font-bold">{drill.name}</div>
                <div className="text-[13px] text-muted-foreground">{drill.objective}</div>
              </div>
              <Link
                to="/drills/$drillId"
                params={{ drillId: drill.id }}
                className="btn btn-primary"
              >
                Start drill →
              </Link>
            </section>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          ANALYTICS TAB — the data
         ═══════════════════════════════════════════════════ */}
      {tab === "analytics" && (
        <>
          {/* Intro */}
          <div className="glass p-5 md:p-6">
            <div className="eyebrow mb-1 !text-primary">Response metrics</div>
            <p className="text-[13px] leading-6 text-muted-foreground">
              The raw data behind your score. Compare against your next attempt to see what changed.
            </p>
          </div>

          {/* Metrics strip */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
              <div key={l as string} className="glass p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {l}
                </div>
                <div className="mt-1 truncate font-display text-[20px] font-bold">{v}</div>
              </div>
            ))}
          </section>

          {/* Eight dimensions */}
          {a.overall > 0 && (
            <section className="glass p-6 md:p-7">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="eyebrow !text-primary">Eight dimensions</div>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Tap a dimension to see what happened and what it means.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DIMENSIONS.map((d) => (
                  <DimensionCard
                    key={d}
                    dimension={d}
                    score={a.dimensions[d]?.score ?? 0}
                    open={open === d}
                    onClick={() => setOpen(open === d ? null : d)}
                  />
                ))}
              </div>

              {open && a.dimensions[open as keyof typeof a.dimensions] && (
                <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-baseline justify-between">
                    <div className="eyebrow !text-primary">{open.toUpperCase()}</div>
                    <button
                      className="text-[12px] text-muted-foreground hover:text-foreground"
                      onClick={() => setOpen(null)}
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 text-[14px] leading-6">
                    <p>
                      <span className="text-muted-foreground">What happened: </span>
                      {a.dimensions[open as keyof typeof a.dimensions].happened}
                    </p>
                    {a.dimensions[open as keyof typeof a.dimensions].evidence && (
                      <p className="text-[13px] italic text-muted-foreground">
                        {a.dimensions[open as keyof typeof a.dimensions].evidence}
                      </p>
                    )}
                    <p>
                      <span className="text-primary">What it means: </span>
                      {a.dimensions[open as keyof typeof a.dimensions].tryThis}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ComparePanel, Spark, verdict — unchanged
// ──────────────────────────────────────────────────────────────

export function ComparePanel({
  a1,
  a2,
  n1 = 1,
  n2 = 2,
}: {
  a1: Analysis;
  a2: Analysis;
  n1?: number;
  n2?: number;
}) {
  const ds = a2.scores.structure - a1.scores.structure;
  return (
    <section className="glass glass-float rise p-6 md:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div className="eyebrow">Attempt comparison</div>
        <span className="text-[11px] text-muted-foreground">retry · same prompt</span>
      </div>
      <div className="grid grid-cols-3 items-center gap-4 text-center text-[13px]">
        <div>
          <div className="mb-2 text-muted-foreground">
            Attempt {String(n1).padStart(2, "0")}
          </div>
          <div className="font-display text-[28px] font-bold">{a1.scores.structure}</div>
          <div className="text-[11px] text-muted-foreground">structure</div>
        </div>
        <div>
          <div className="mb-2 text-muted-foreground">Δ</div>
          <div
            className={`font-display text-[28px] font-bold ${
              ds >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {ds >= 0 ? "+" : ""}
            {ds}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {a1.main_point_delay}s → {a2.main_point_delay}s to point
          </div>
        </div>
        <div>
          <div className="mb-2 text-muted-foreground">
            Attempt {String(n2).padStart(2, "0")}
          </div>
          <div className="font-display text-[28px] font-bold text-primary">
            {a2.scores.structure}
          </div>
          <div className="text-[11px] text-muted-foreground">structure</div>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {DIMENSIONS.map((d) => (
          <ScoreBar key={d} label={cap(d)} value={a2.scores[d]} prev={a1.scores[d]} />
        ))}
      </div>
      <p className="mt-5 text-[14px]">{verdict(a1, a2)}</p>
      <div className="mt-3 flex flex-wrap gap-6 text-[13px] text-muted-foreground">
        <span>
          Word count{" "}
          <b className="font-mono text-foreground">
            {a1.word_count} → {a2.word_count}
          </b>
        </span>
        <span>
          Time to point{" "}
          <b className="font-mono text-foreground">
            {a1.main_point_delay}s → {a2.main_point_delay}s
          </b>
        </span>
        <span>
          Overall{" "}
          <b className="font-mono text-foreground">
            {a1.overall} → {a2.overall}
          </b>
        </span>
        <span>
          Pattern{" "}
          <b className="text-foreground">
            {PATTERNS[a1.primary_pattern]?.short} → {PATTERNS[a2.primary_pattern]?.short}
          </b>
        </span>
      </div>
    </section>
  );
}

export function Spark({ series }: { series: number[] }) {
  if (series.length < 2) return <div className="h-10" />;
  const pts = series
    .map((v, i) => `${(i / (series.length - 1)) * 100},${40 - (v / 100) * 40}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function verdict(a1: Analysis, a2: Analysis) {
  const diffs = DIMENSIONS.map((d) => [d, a2.scores[d] - a1.scores[d]] as const).sort(
    (x, y) => y[1] - x[1]
  );
  const [best, gain] = diffs[0];
  const [worst, loss] = diffs[diffs.length - 1];
  if (gain <= 0)
    return `No gains this time — your ${worst} dropped ${Math.abs(
      loss
    )}. Re-read "One thing to fix" and try once more.`;
  return `Biggest gain: ${best} +${gain}.${
    a2.main_point_delay < a1.main_point_delay
      ? ` You reached your point ${a1.main_point_delay - a2.main_point_delay}s sooner.`
      : ""
  }${loss < 0 ? ` Watch ${worst} (${loss}).` : ""}`;
}
