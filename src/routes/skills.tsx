import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { cap, Spark } from "@/components/analysis-view";
import { usePaidDashboard } from "@/lib/paid-dashboard";
import { buildSkillInsights, CORE, OUTCOMES, pickFocus, SKILL_MEANING, type SkillInsight, type SkillStatus } from "@/lib/skills";

export const Route = createFileRoute("/skills")({
  head: () => ({ meta: [{ title: "Communication Skills — TheUnspoken" }, { name: "description", content: "See what is improving, what is slipping, and what to practice next." }, { property: "og:title", content: "Communication Skills — TheUnspoken" }, { property: "og:description", content: "What you're good at, what's holding you back, and what to practice next." }] }),
  component: () => <AppShell><Skills /></AppShell>,
});

const NO_EVIDENCE = "Not enough recent evidence yet.";

const STATUS_TONE: Record<SkillStatus, string> = {
  Strong: "text-success border-success/40", Improving: "text-success border-success/40", Stable: "text-muted-foreground border-border",
  Developing: "text-primary border-primary/40", "Needs attention": "text-destructive border-destructive/40", "No data": "text-muted-foreground border-border",
};

function Delta({ c }: { c: number | null }) {
  if (c === null) return <span className="font-mono text-[12px] text-muted-foreground">—</span>;
  if (c === 0) return <span className="font-mono text-[12px] text-muted-foreground">±0</span>;
  return <span className={`font-mono text-[12px] ${c > 0 ? "text-success" : "text-destructive"}`}>{c > 0 ? "▲" : "▼"}{Math.abs(c)}</span>;
}

function Status({ s }: { s: SkillStatus }) {
  return <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${STATUS_TONE[s]}`}>{s}</span>;
}

function SkillCard({ x, open, onOpen }: { x: SkillInsight; open: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-0.5 ${
        open ? "border-primary/45" : "border-border"
      }`}
      style={{
        background: open
          ? "linear-gradient(160deg, rgba(139,127,255,0.16) 0%, rgba(26,16,51,0.4) 50%, rgba(11,13,20,0.85) 100%)"
          : undefined,
      }}
    >
      {/* Corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full transition-opacity duration-500"
        style={{
          background: "radial-gradient(closest-side, rgba(139,127,255,0.5), transparent)",
          filter: "blur(12px)",
          opacity: open ? 0.9 : 0.35,
        }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="font-display text-[16px] font-bold">{cap(x.skill)}</div>
        <Status s={x.status} />
      </div>

      <div className="relative mt-2 flex items-baseline gap-2">
        <span className="font-display text-[30px] font-bold">{x.score ?? "—"}</span>
        <Delta c={x.change} />
      </div>

      <p className="relative mt-2 flex-1 text-[13px] leading-5 text-muted-foreground">
        {x.evidence[0] ?? NO_EVIDENCE}
      </p>

      <div className="relative mt-4 flex items-center justify-between font-mono text-[11px]">
        <span className="text-muted-foreground">Practice: <span className="text-primary">{x.recommended_drill.name}</span></span>
        <span className="text-primary transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>→</span>
      </div>
    </button>
  );
}

function Detail({ x }: { x: SkillInsight }) {
  return (
    <section className="glass glass-float rise grid gap-8 p-7 md:grid-cols-12 md:p-8">
      <div className="md:col-span-7 space-y-6">
        <div><div className="flex items-center gap-3"><h2 className="text-[28px] font-bold">{cap(x.skill)}</h2><Status s={x.status} /></div><div className="mt-1 font-mono text-[14px]">{x.score ?? "—"} <Delta c={x.change} />{x.previous_score !== null && <span className="ml-2 text-muted-foreground">from {x.previous_score}</span>}</div></div>
        <div><div className="eyebrow mb-2">What this means</div><p className="text-[14px] leading-6">{SKILL_MEANING[x.skill]}</p></div>
        <div><div className="eyebrow mb-2">What we saw</div>{x.evidence.length ? <ul className="space-y-2">{x.evidence.map((e) => <li key={e} className="flex gap-2 text-[14px] leading-6"><span className="text-primary">·</span>{e}</li>)}</ul> : <p className="text-[14px] text-muted-foreground">{NO_EVIDENCE}</p>}</div>
        <div><div className="eyebrow mb-2">What still gets lost</div><p className="text-[14px] leading-6">{x.recurring_gap ?? <span className="text-muted-foreground">No recurring gap in your recent responses.</span>}</p></div>
      </div>
      <div className="md:col-span-5 space-y-5">
        <div className="rounded-2xl border border-border p-5">
          <div className="eyebrow mb-2">Your strongest example</div>
          {x.strongest_example ? <Link to="/responses/$responseId" params={{ responseId: x.strongest_example.response_id }} className="block">
            <div className="text-[14px] font-medium">"{x.strongest_example.question}"</div>
            <div className="mt-1 font-mono text-[12px] text-primary">{cap(x.skill)} {x.strongest_example.score}</div>
            {x.strongest_example.excerpt && <p className="mt-2 text-[13px] italic text-muted-foreground">{x.strongest_example.excerpt}</p>}
          </Link> : <p className="text-[13px] text-muted-foreground">{NO_EVIDENCE}</p>}
        </div>
        <div className="rounded-2xl bg-primary/10 p-5">
          <div className="eyebrow mb-2 !text-primary">Practice this next</div>
          <div className="font-display text-[18px] font-bold">{x.recommended_drill.name}</div>
          <p className="mt-1 text-[13px] text-muted-foreground"><b className="text-foreground">Goal:</b> {x.recommended_drill.objective}</p>
          <div className="mt-4 flex gap-2"><Link to="/drills/$drillId" params={{ drillId: x.recommended_drill.id }} className="btn btn-primary btn-sm">Try it →</Link><Link to="/practice" className="btn btn-ghost btn-sm">Try again</Link></div>
        </div>
      </div>
    </section>
  );
}

function Skills() {
  // ─── ALL HOOKS FIRST, UNCONDITIONALLY ───
  const { reps: rs, loading } = usePaidDashboard();
  const [sel, setSel] = useState<string | null>(null);

  // ─── Derived values ───
  const xs = buildSkillInsights(rs);
  const focus = pickFocus(xs);
  const selected = xs.find((x) => x.skill === sel);
  const scored = xs.filter((x) => x.score !== null);
  const strongest = [...scored].sort((a, b) => b.score! - a.score!)[0];
  const improving = [...scored].filter((x) => (x.change ?? 0) > 0 && x !== strongest && x !== focus).sort((a, b) => b.change! - a.change!)[0];
  const slipping = [...scored].filter((x) => (x.change ?? 0) < 0 && x !== focus).sort((a, b) => a.change! - b.change!)[0];
  const toggle = (d: string) => setSel((c) => (c === d ? null : d));

  // ─── Early return AFTER all hooks ───
  if (loading && rs.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading your skills…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-[15px] text-muted-foreground">
        See what is improving, what is slipping, and what to practice next.
      </p>

      {!focus ? (
        <div className="glass p-8"><p className="text-[15px]">{NO_EVIDENCE} <Link to="/practice" className="text-primary">Answer a question</Link> to see your skills.</p></div>
      ) : (
        <>
          {/* Focus + profile */}
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="glass glass-float border-primary/40 p-7 md:p-8 lg:col-span-7">
              <div className="eyebrow mb-3 !text-primary">Current focus</div>
              <div className="font-display text-[40px] font-bold leading-none">{cap(focus.skill)} <span className="text-primary">· {focus.score}</span></div>
              <p className="mt-4 text-[16px] font-medium leading-7">{focus.evidence[0] ?? NO_EVIDENCE}</p>
              {focus.recurring_gap && <p className="mt-2 text-[14px] leading-6 text-muted-foreground">What still gets lost: {focus.recurring_gap}</p>}
              <Link to="/drills/$drillId" params={{ drillId: focus.recommended_drill.id }} className="btn btn-primary mt-6">Practice next → {focus.recommended_drill.name}</Link>
            </section>

            {/* ─── Communication profile card — theme-safe colors ─── */}
            <section className="glass glass-float border-primary/40 p-7 lg:col-span-5">
              <div className="eyebrow mb-4 !text-primary">
                Your communication profile
              </div>

              <div className="space-y-3">
                {(
                  [
                    ["Strongest", strongest],
                    ["Improving", improving],
                    ["Current focus", focus],
                    ["Needs attention", slipping],
                  ] as const
                ).map(([l, x]) => {
                  const isHero = l === "Strongest" || l === "Current focus";
                  return (
                    <div
                      key={l}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                        isHero
                          ? "border-primary/40 bg-primary/10"
                          : "border-border bg-background/40"
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] uppercase tracking-[0.12em] ${
                          isHero ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {l}
                      </span>
                      <span className="font-mono text-[13px] text-foreground">
                        {x ? (
                          <>
                            {cap(x.skill)} · {x.score}
                            {l !== "Strongest" && l !== "Current focus" && (
                              <Delta c={x.change} />
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/practice"
                className="mt-5 inline-block text-[13px] text-primary"
              >
                Start practice →
              </Link>
            </section>
          </div>

          {/* Core — mobile carousel */}
          <section>
            <h2 className="text-[20px] font-bold flex items-baseline justify-between">
              Core communication skills
              <span className="font-mono text-[11px] text-muted-foreground font-normal sm:hidden">
                Swipe →
              </span>
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Select a skill to see the evidence behind it.</p>

            <div className="mt-4 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
              {xs.filter((x) => CORE.includes(x.skill)).map((x) => (
                <div key={x.skill} className="w-[70vw] max-w-[260px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                  <SkillCard x={x} open={sel === x.skill} onOpen={() => toggle(x.skill)} />
                </div>
              ))}
            </div>
          </section>
          {selected && CORE.includes(selected.skill) && <Detail x={selected} />}

          {/* Outcomes — mobile carousel */}
          <section>
            <h2 className="text-[20px] font-bold">Communication outcomes</h2>
            <div className="mt-4 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
              {xs.filter((x) => OUTCOMES.includes(x.skill)).map((x) => (
                <div key={x.skill} className="w-[70vw] max-w-[260px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                  <SkillCard x={x} open={sel === x.skill} onOpen={() => toggle(x.skill)} />
                </div>
              ))}
              <div className="glass flex w-[70vw] max-w-[260px] shrink-0 snap-start flex-col p-5 sm:w-auto sm:max-w-none">
                <div className="font-display text-[16px] font-bold">Influence</div>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                  Built from impact, relevance and confidence. Not scored on its own.
                </p>
              </div>
            </div>
          </section>
          {selected && OUTCOMES.includes(selected.skill) && <Detail x={selected} />}

          {/* Trend */}
          <section className="glass p-7">
            <h2 className="text-[20px] font-bold">How your skills are changing</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Each line is one skill across your last {rs.length} responses, oldest to newest.</p>
            {rs.length < 2 ? <p className="mt-4 text-[14px] text-muted-foreground">{NO_EVIDENCE}</p> : (
              <div className="mt-5 grid gap-x-8 gap-y-3 md:grid-cols-2">{xs.map((x) => (
                <button key={x.skill} onClick={() => toggle(x.skill)} className="grid grid-cols-[110px_1fr_70px] items-center gap-4 text-left">
                  <span className="text-[14px]">{cap(x.skill)}</span><Spark series={x.series} /><span className="text-right font-mono text-[13px]">{x.score} <Delta c={x.change} /></span>
                </button>
              ))}</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
