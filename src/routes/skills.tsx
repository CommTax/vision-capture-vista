import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Locked } from "@/components/plan-gate";
import { AppShell, PageHead } from "@/components/app-shell";
import { cap, Spark } from "@/components/analysis-view";
import { useStore } from "@/lib/store";
import { useEntitlement } from "@/lib/entitlements";
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
    <button onClick={onOpen} className={`glass flex flex-col p-5 text-left transition hover:bg-glass-strong ${open ? "border-primary/60" : ""}`}>
      <div className="flex items-start justify-between gap-2"><div className="font-display text-[16px] font-bold">{cap(x.skill)}</div><Status s={x.status} /></div>
      <div className="mt-2 flex items-baseline gap-2"><span className="font-display text-[30px] font-bold">{x.score ?? "—"}</span><Delta c={x.change} /></div>
      <p className="mt-2 flex-1 text-[13px] leading-5 text-muted-foreground">{x.evidence[0] ?? NO_EVIDENCE}</p>
      <div className="mt-4 text-[12px]"><span className="text-muted-foreground">Practice: </span><span className="text-primary">{x.recommended_drill.name} →</span></div>
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
            <div className="text-[14px] font-medium">“{x.strongest_example.question}”</div>
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
  const rs = useStore((s) => s.responses);
  const xs = buildSkillInsights(rs);
  const focus = pickFocus(xs);
  const [sel, setSel] = useState<string | null>(null);
  const { free } = useEntitlement();
  const selected = xs.find((x) => x.skill === sel);
  const scored = xs.filter((x) => x.score !== null);
  const strongest = [...scored].sort((a, b) => b.score! - a.score!)[0];
  const improving = [...scored].filter((x) => (x.change ?? 0) > 0 && x !== strongest && x !== focus).sort((a, b) => b.change! - a.change!)[0];
  const slipping = [...scored].filter((x) => (x.change ?? 0) < 0 && x !== focus).sort((a, b) => a.change! - b.change!)[0];
  const toggle = (d: string) => setSel((c) => (c === d ? null : d));

  return (
    <div className="space-y-8">
      <PageHead eyebrow="Your skills" title="Communication Skills" />
      <p className="-mt-6 text-[15px] text-muted-foreground">See what is improving, what is slipping, and what to practice next.</p>

      {!focus ? (
        <div className="glass p-8"><p className="text-[15px]">{NO_EVIDENCE} <Link to="/practice" className="text-primary">Answer a question</Link> to see your skills.</p></div>
      ) : (
        <>
          {/* Focus + profile */}
          <div className="grid gap-6 lg:grid-cols-12">
            <section className={`glass glass-float border-primary/40 p-7 md:p-8 ${free ? "lg:col-span-12" : "lg:col-span-7"}`}>
              <div className="eyebrow mb-3 !text-primary">Current focus</div>
              <div className="font-display text-[40px] font-bold leading-none">{cap(focus.skill)} <span className="text-primary">· {focus.score}</span></div>
              <p className="mt-4 text-[16px] font-medium leading-7">{focus.evidence[0] ?? NO_EVIDENCE}</p>
              {focus.recurring_gap && <p className="mt-2 text-[14px] leading-6 text-muted-foreground">What still gets lost: {focus.recurring_gap}</p>}
              {free ? <Link to="/plans" className="btn btn-primary mt-6">Unlock next practice</Link> : <Link to="/drills/$drillId" params={{ drillId: focus.recommended_drill.id }} className="btn btn-primary mt-6">Practice next → {focus.recommended_drill.name}</Link>}
            </section>
            {!free && <section className="glass p-7 lg:col-span-5">
              <div className="eyebrow mb-4">Your communication profile</div>
              <dl className="space-y-3 text-[14px]">
                {([["Strongest", strongest], ["Improving", improving], ["Current focus", focus], ["Needs attention", slipping]] as const).map(([l, x]) => (
                  <div key={l} className="flex justify-between gap-3 border-b border-border pb-3 last:border-0"><dt className="text-muted-foreground">{l}</dt><dd className="font-mono">{x ? <>{cap(x.skill)} · {x.score} {l !== "Strongest" && l !== "Current focus" && <Delta c={x.change} />}</> : "—"}</dd></div>
                ))}
              </dl>
              <div className="eyebrow mt-5 mb-1">What to practice now</div>
              <p className="text-[14px]">{focus.recommended_drill.objective}</p>
              <Link to="/practice" className="mt-3 inline-block text-[13px] text-primary">Start practice →</Link>
            </section>}
          </div>

          {free ? <Locked feature="skills" title="Your complete skill profile" body="Unlock every skill score, response-level evidence, strongest examples, recommended drills, and progress over time." cta="Unlock skill insights" /> : <>
          {/* Core */}
          <section>
            <h2 className="text-[20px] font-bold">Core communication skills</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Select a skill to see the evidence behind it.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{xs.filter((x) => CORE.includes(x.skill)).map((x) => <SkillCard key={x.skill} x={x} open={sel === x.skill} onOpen={() => toggle(x.skill)} />)}</div>
          </section>
          {selected && CORE.includes(selected.skill) && <Locked feature="skills" title={`Full ${cap(selected.skill)} breakdown`} body="Recurring patterns, response-level evidence, strongest and weakest examples, detailed changes and recommended drills." cta="Unlock full breakdown"><Detail x={selected} /></Locked>}

          {/* Outcomes */}
          <section>
            <h2 className="text-[20px] font-bold">Communication outcomes</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {xs.filter((x) => OUTCOMES.includes(x.skill)).map((x) => <SkillCard key={x.skill} x={x} open={sel === x.skill} onOpen={() => toggle(x.skill)} />)}
              <div className="glass flex flex-col p-5"><div className="font-display text-[16px] font-bold">Influence</div><p className="mt-2 text-[13px] leading-5 text-muted-foreground">Built from impact, relevance and confidence. Not scored on its own.</p></div>
            </div>
          </section>
          {selected && OUTCOMES.includes(selected.skill) && <Locked feature="skills" title={`Full ${cap(selected.skill)} breakdown`} body="Recurring patterns, response-level evidence, strongest and weakest examples, detailed changes and recommended drills." cta="Unlock full breakdown"><Detail x={selected} /></Locked>}

          {/* Trend */}
          <Locked feature="skills" title="See how every skill is changing" body="Full skill history across your responses, response by response." cta="Unlock full breakdown">
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
          </Locked>
          </>}
        </>
      )}
    </div>
  );
}
