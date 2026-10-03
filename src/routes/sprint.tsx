import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHead } from "@/components/app-shell";
import { Gate } from "@/components/plan-gate";
import { cap } from "@/components/analysis-view";
import { DRILLS, PATTERNS, type Dimension } from "@/lib/data";
import { SPRINT_GOALS, sprintDuration, useEntitlement } from "@/lib/entitlements";
import { buildRecommendations, DRILL_FOR } from "@/lib/recommendations";
import { scenariosFor } from "@/lib/scenarios";
import { useStore, type ResponseRecord } from "@/lib/store";

export const Route = createFileRoute("/sprint")({
  head: () => ({ meta: [{ title: "Your Sprint — Cadence" }, { name: "description", content: "Your goal, focus areas, practice plan and progress report." }, { property: "og:title", content: "Your Sprint — Cadence" }, { property: "og:description", content: "A focused, goal-specific practice program." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AppShell><Gate feature="sprint" title="Start a focused Sprint." body="A goal-specific program with a baseline, a practice plan and a final progress report."><Sprint /></Gate></AppShell>,
});

const PHASES = [
  { n: "Baseline", d: "Understand your current pattern.", at: 0 },
  { n: "Focus", d: "Practice the highest-priority behavior.", at: 0.15 },
  { n: "Application", d: "Apply it to realistic scenarios.", at: 0.4 },
  { n: "Retry", d: "Repeat scenarios and compare.", at: 0.7 },
  { n: "Consolidate", d: "See what changed and what still needs work.", at: 0.88 },
];

const avg = (rs: ResponseRecord[], k: Dimension) => rs.length ? Math.round(rs.reduce((a, r) => a + r.analysis.scores[k], 0) / rs.length) : null;

function Sprint() {
  const { ent } = useEntitlement();
  const level = useStore((s) => s.profile?.level ?? "Mid career");
  const all = useStore((s) => s.responses);
  const sp = ent!.sprint!;
  const g = SPRINT_GOALS.find((x) => x.id === sp.goal) ?? SPRINT_GOALS[0];
  const total = sprintDuration(sp.duration).days;
  const day = Math.min(total, Math.floor((Date.now() - Date.parse(sp.start_date)) / 864e5) + 1);
  const frac = (day - 1) / total;
  const phase = PHASES.reduce((i, p, j) => (frac >= p.at ? j : i), 0);
  const rs = all.filter((r) => r.created_at.slice(0, 10) >= sp.start_date).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const baseline = rs[0];
  const half = Math.ceil(rs.length / 2);
  const early = rs.slice(0, half), late = rs.slice(half);
  const changes = g.focus.map((k) => ({ k, a: avg(early, k), b: late.length ? avg(late, k) : null }));
  const rec = buildRecommendations(rs, g.focus).next;
  const today = rec ? scenariosFor(rec.skill, level)[0] : scenariosFor(g.focus[0], level)[0];
  const drillsDone = useStore((s) => s.drillsDone);
  const best = changes.filter((c) => c.a !== null && c.b !== null).sort((x, y) => (y.b! - y.a!) - (x.b! - x.a!));

  return (
    <div className="space-y-8">
      <PageHead eyebrow={`${g.label} Sprint · day ${day} of ${total}`} title={sp.goal_text || g.goal} />

      <section className="glass p-6">
        <div className="eyebrow mb-4">Program</div>
        <ol className="grid gap-3 md:grid-cols-5">{PHASES.map((p, i) => (
          <li key={p.n} className={`rounded-2xl border p-4 ${i === phase ? "border-primary/50 bg-primary/10" : "border-border"} ${i > phase ? "opacity-60" : ""}`}>
            <div className="font-mono text-[11px] text-muted-foreground">Phase {i + 1}</div><div className="font-display font-bold">{p.n}</div><p className="mt-1 text-[12px] text-muted-foreground">{p.d}</p>
          </li>))}</ol>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="glass glass-float border-primary/40 p-6">
          <div className="eyebrow mb-2 !text-primary">Today's practice</div>
          {!baseline ? <>
            <h2 className="text-[22px] font-bold">Record your baseline</h2>
            <p className="mt-2 text-[14px] text-muted-foreground">Keep practicing to build your baseline. Answer one realistic question so the Sprint can target what you actually do.</p>
          </> : <>
            <h2 className="text-[22px] font-bold">{today?.title}</h2>
            <p className="mt-2 text-[14px] text-muted-foreground">{rec ? `Focus: ${cap(rec.skill)} (${rec.current_score}). ${rec.expected_behavior_change}` : "Not enough recent evidence yet — practice a focus scenario."}</p>
          </>}
          {today && <Link to="/practice/$questionId" params={{ questionId: today.scenario_id }} search={{ f: rec?.skill ?? g.focus[0] }} className="btn btn-primary mt-5">Start practice →</Link>}
        </section>
        <section className="glass p-6">
          <div className="eyebrow mb-2">Baseline</div>
          {baseline ? <>
            <div className="font-display text-[24px] font-bold text-primary">{PATTERNS[baseline.analysis.primary_pattern]?.short ?? baseline.analysis.primary_pattern}</div>
            <p className="mt-1 text-[14px] text-muted-foreground">{baseline.question}</p>
            <p className="mt-2 font-mono text-[12px]">Main point at {baseline.analysis.main_point_delay}s · overall {baseline.analysis.overall}</p>
          </> : <p className="text-[14px] text-muted-foreground">Keep practicing to build your baseline.</p>}
        </section>
      </div>

      <section className="glass p-6">
        <div className="eyebrow mb-4">Focus areas and plan</div>
        <div className="grid gap-3 md:grid-cols-2">{g.focus.map((k, i) => {
          const sc = scenariosFor(k, level)[0]; const dr = DRILLS.find((x) => x.id === DRILL_FOR[k]);
          return <div key={k} className="rounded-2xl border border-border p-4 text-[14px]">
            <div className="font-display font-bold">{i + 1}. {cap(k)}</div>
            {dr && <div className="mt-1"><Link to="/drills/$drillId" params={{ drillId: dr.id }} className="text-primary">Drill: {dr.name}</Link>{drillsDone.includes(dr.id) && <span className="ml-2 font-mono text-[11px] text-muted-foreground">done</span>}</div>}
            {sc && <div><Link to="/practice/$questionId" params={{ questionId: sc.scenario_id }} search={{ f: k }} className="text-muted-foreground hover:text-foreground">Scenario: {sc.title}</Link></div>}
          </div>;
        })}</div>
      </section>

      <section className="glass p-6">
        <div className="eyebrow mb-4">Progress report</div>
        {rs.length < 2 ? <p className="text-[14px] text-muted-foreground">Not enough recent evidence. Complete at least two Sprint practices to compare early and later responses.</p> : <>
          <dl className="grid gap-4 text-[14px] md:grid-cols-3">
            <div><dt className="text-muted-foreground">Starting pattern</dt><dd className="mt-1">{PATTERNS[rs[0].analysis.primary_pattern]?.short ?? rs[0].analysis.primary_pattern}</dd></div>
            <div><dt className="text-muted-foreground">Practices completed</dt><dd className="mt-1">{rs.length} responses · {drillsDone.length} drills</dd></div>
            <div><dt className="text-muted-foreground">Main point</dt><dd className="mt-1">{rs[0].analysis.main_point_delay}s → {rs[rs.length - 1].analysis.main_point_delay}s</dd></div>
          </dl>
          <div className="mt-5 space-y-2">{changes.map((c) => <div key={c.k} className="flex justify-between border-t border-border pt-2 text-[14px]"><span>{cap(c.k)}</span><span className="font-mono">{c.a ?? "—"} → {c.b ?? "—"}{c.a !== null && c.b !== null && <span className={c.b >= c.a ? "text-primary" : "text-destructive"}> {c.b >= c.a ? "▲" : "▼"}{Math.abs(c.b - c.a)}</span>}</span></div>)}</div>
          {best[0] && best[0].b! > best[0].a! && <p className="mt-4 text-[14px]"><span className="text-muted-foreground">Strongest improvement: </span>{cap(best[0].k)}</p>}
          {rec && <p className="mt-1 text-[14px]"><span className="text-muted-foreground">Remaining opportunity: </span>{cap(rec.skill)} — {rec.expected_behavior_change}</p>}
          {rs.length < 4 && <p className="mt-3 text-[12px] text-muted-foreground">Early signal — based on only {rs.length} responses.</p>}
        </>}
      </section>
    </div>
  );
}
