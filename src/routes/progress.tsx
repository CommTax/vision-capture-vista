import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHead } from "@/components/app-shell";
import { cap, ScoreBar } from "@/components/analysis-view";
import { BADGES } from "@/lib/data";
import { skillStats } from "@/lib/insights";
import { streak, useStore } from "@/lib/store";
import { Spark } from "./skills";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — Cadence" }, { name: "description", content: "Streaks, milestones and how your communication is improving." }, { property: "og:title", content: "Progress — Cadence" }, { property: "og:description", content: "See your improvement over time." }] }),
  component: () => <AppShell><Progress /></AppShell>,
});

function Progress() {
  const rs = useStore((s) => s.responses);
  const days = useStore((s) => s.practiceDays);
  const drills = useStore((s) => s.drillsDone);
  const stats = skillStats(rs);
  const st = streak(days);
  const earned: Record<string, boolean> = {
    "first-rep": rs.length > 0,
    "streak-3": st >= 3,
    "first-improve": rs.some((r) => { const p = rs.find((x) => x.id === r.parent_id); return p && r.analysis.overall > p.analysis.overall; }),
    "point-made": rs.some((r) => r.analysis.main_point_delay <= 5),
    structure: rs.some((r) => r.analysis.scores.structure > 70),
    clear: rs.some((r) => r.analysis.scores.clarity > 80),
    exec: drills.includes("exec-summary"),
  };
  const ttp = [...rs].reverse().map((r) => 100 - Math.min(100, r.analysis.main_point_delay * 3));
  return (
    <>
      <PageHead eyebrow="Over time" title="Progress" />
      <div className="grid gap-4 md:grid-cols-4">
        {[["Practice streak", `${st} days`], ["Responses", rs.length], ["Skills improved", stats.filter((s) => s.trend > 0).length], ["Drills done", drills.length]].map(([l, v]) => (
          <div key={l as string} className="glass p-5"><div className="eyebrow">{l}</div><div className="mt-2 font-display text-[32px] font-bold">{v}</div></div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass p-7"><div className="eyebrow mb-5">First → latest</div><div className="space-y-4">{stats.map((s) => <ScoreBar key={s.d} label={cap(s.d)} value={s.current} prev={s.early} />)}</div></div>
        <div className="glass p-7"><div className="eyebrow mb-2">Getting to the point faster</div><p className="mb-4 text-[13px] text-muted-foreground">Higher is faster. Each point is one response.</p><Spark series={ttp} /></div>
      </div>
      <div className="mt-6 glass p-7">
        <div className="eyebrow mb-5">Milestones</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((b) => (
            <div key={b.id} className={`rounded-2xl border p-4 ${earned[b.id] ? "border-primary/50 bg-primary/10" : "border-border opacity-50"}`}>
              <div className="font-display text-[16px] font-bold">{b.name}</div><div className="text-[12px] text-muted-foreground">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
