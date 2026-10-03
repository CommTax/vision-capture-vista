import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { AppShell, PageHead } from "@/components/app-shell";
import { cap, ScoreBar } from "@/components/analysis-view";
import { DRILLS, PATTERNS, modeName } from "@/lib/data";
import { currentPattern, skillStats } from "@/lib/insights";
import { streak, useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Practice — Cadence" }, { name: "description", content: "Today's practice, your current pattern, and your improvement trend." }, { property: "og:title", content: "My Practice — Cadence" }, { property: "og:description", content: "Your communication practice dashboard." }] }),
  component: () => <AppShell><Dashboard /></AppShell>,
});

function Dashboard() {
  const profile = useStore((s) => s.profile)!;
  const rs = useStore((s) => s.responses);
  const days = useStore((s) => s.practiceDays);
  const cp = currentPattern(rs);
  const stats = skillStats(rs);
  const drills = cp.weakest.map((d) => DRILLS.find((x) => x.skill === d) ?? DRILLS[0]).filter((d, i, a) => a.indexOf(d) === i);

  return (
    <>
      <PageHead eyebrow={`Good to see you, ${profile.name}`} title="My Practice"><Link to="/practice" className="btn btn-primary">Start practicing</Link></PageHead>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="glass glass-float p-7 lg:col-span-7">
          <div className="eyebrow mb-4 !text-primary">Today's practice</div>
          <div className="flex flex-wrap gap-6 font-mono text-[13px] text-muted-foreground"><span><b className="text-foreground">2</b> challenges</span><span><b className="text-foreground">5</b> minutes</span><span><b className="text-foreground">1</b> muscle: {cap(cp.focus)}</span></div>
          <div className="mt-6 space-y-3">
            {[{ id: "pre-2", t: "Explain a difficult project decision in 45 seconds." }, { id: "evd-1", t: "Tell your manager about a project delay without sounding defensive." }].map((c, i) => (
              <Link key={c.id} to="/practice/$questionId" params={{ questionId: c.id }} className="flex items-center gap-4 rounded-2xl border border-border p-4 transition hover:bg-glass-strong">
                <span className="font-mono text-primary">0{i + 1}</span><span className="flex-1 text-[15px]">{c.t}</span><span className="text-[13px] text-primary">Start →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="glass p-7 lg:col-span-5">
          <div className="eyebrow mb-4">My current pattern</div>
          <div className="grid grid-cols-2 gap-5">
            <div><div className="text-[12px] text-muted-foreground">Primary</div><div className="font-display text-[20px] font-bold">{PATTERNS[cp.primary].short}</div></div>
            <div><div className="text-[12px] text-muted-foreground">Secondary</div><div className="font-display text-[20px] font-bold">{PATTERNS[cp.secondary].short}</div></div>
            <div><div className="text-[12px] text-muted-foreground">Strength</div><div className="font-display text-[20px] font-bold text-success">{cp.strength.toUpperCase()}</div></div>
            <div><div className="text-[12px] text-muted-foreground">Focus</div><div className="font-display text-[20px] font-bold text-primary">{cp.focus.toUpperCase()}</div></div>
          </div>
          <p className="mt-5 text-[13px] text-muted-foreground">{PATTERNS[cp.primary].name}: {PATTERNS[cp.primary].desc}</p>
        </section>

        <section className="grid grid-cols-3 gap-4 lg:col-span-12">
          <div className="glass p-5"><div className="eyebrow">Streak</div><div className="mt-2 flex items-center gap-2 font-display text-[36px] font-bold"><Flame className="size-6 text-primary" />{streak(days)}</div></div>
          <div className="glass p-5"><div className="eyebrow">Responses</div><div className="mt-2 font-display text-[36px] font-bold">{rs.length}</div></div>
          <div className="glass p-5"><div className="eyebrow">Skills improved</div><div className="mt-2 font-display text-[36px] font-bold">{stats.filter((s) => s.trend > 0).length}</div></div>
        </section>

        <section className="glass p-7 lg:col-span-7">
          <div className="mb-5 flex justify-between"><div className="eyebrow">Improvement trend</div><Link to="/progress" className="text-[12px] text-primary">Full progress →</Link></div>
          {rs.length < 2 ? <p className="text-[14px] text-muted-foreground">Complete two responses to see your trend.</p> : (
            <div className="space-y-4">{stats.slice(0, 5).map((s) => <ScoreBar key={s.d} label={cap(s.d)} value={s.current} prev={s.early} />)}</div>
          )}
        </section>

        <section className="glass p-7 lg:col-span-5">
          <div className="eyebrow mb-4">Recommended drills</div>
          <div className="space-y-3">{drills.map((d) => (
            <Link key={d.id} to="/drills/$drillId" params={{ drillId: d.id }} className="block rounded-2xl border border-border p-4 transition hover:bg-glass-strong"><div className="font-display text-[16px] font-bold">{d.name}</div><div className="text-[13px] text-muted-foreground">{d.objective}</div></Link>
          ))}</div>
        </section>

        <section className="glass p-7 lg:col-span-12">
          <div className="mb-4 flex justify-between"><div className="eyebrow">Recent responses</div><Link to="/responses" className="text-[12px] text-primary">All responses →</Link></div>
          {rs.length === 0 ? <p className="text-[14px] text-muted-foreground">No responses yet. <Link to="/practice" className="text-primary">Start your first rep.</Link></p> : (
            <div className="divide-y divide-border">{rs.slice(0, 4).map((r) => (
              <Link key={r.id} to="/responses/$responseId" params={{ responseId: r.id }} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><div className="text-[15px] font-medium">{r.question}</div><div className="font-mono text-[11px] text-muted-foreground">{modeName(r.mode).toUpperCase()} · Attempt {r.attempt} · {new Date(r.created_at).toLocaleDateString()}</div></div>
                <div className="flex gap-4 font-mono text-[12px]"><span className="text-muted-foreground">STR <b className="text-primary">{r.analysis.scores.structure}</b></span><span className="text-muted-foreground">CLR <b className="text-primary">{r.analysis.scores.clarity}</b></span><span className="text-muted-foreground">IMP <b className="text-primary">{r.analysis.scores.impact}</b></span></div>
              </Link>
            ))}</div>
          )}
        </section>
      </div>
    </>
  );
}
