import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHead } from "@/components/app-shell";
import { cap, Spark } from "@/components/analysis-view";
import { DRILLS } from "@/lib/data";
import { skillStats } from "@/lib/insights";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/skills")({
  head: () => ({ meta: [{ title: "Communication Skills — Cadence" }, { name: "description", content: "Your level, trend and evidence across eight communication skills." }, { property: "og:title", content: "Communication Skills — Cadence" }, { property: "og:description", content: "Track structure, clarity, impact and more." }] }),
  component: () => <AppShell><Skills /></AppShell>,
});

function Skills() {
  const rs = useStore((s) => s.responses);
  const stats = skillStats(rs);
  return (
    <>
      <PageHead eyebrow="Eight dimensions" title="Communication Skills" />
      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((s) => {
          const drill = DRILLS.find((d) => d.skill === s.d);
          return (
            <div key={s.d} className="glass p-6">
              <div className="flex items-start justify-between"><div><div className="eyebrow">{s.d}</div><div className="mt-1 font-display text-[40px] font-bold">{s.current || "—"}</div></div><span className={`font-mono text-[13px] ${s.trend >= 0 ? "text-success" : "text-destructive"}`}>{s.trend >= 0 ? "▲" : "▼"} {Math.abs(s.trend)}</span></div>
              <div className="bar my-3"><span style={{ width: `${s.current}%` }} /></div>
              <Spark series={s.series} />
              {s.evidence && <p className="mt-3 text-[13px] text-muted-foreground">Recent evidence: {s.evidence}</p>}
              {drill && <Link to="/drills/$drillId" params={{ drillId: drill.id }} className="mt-4 inline-block text-[13px] text-primary">Exercise: {drill.name} →</Link>}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[12px] text-muted-foreground">{cap("influence")} is measured through impact and confidence scores.</p>
    </>
  );
}
