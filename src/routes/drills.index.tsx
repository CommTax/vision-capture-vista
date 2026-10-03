import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHead } from "@/components/app-shell";
import { DRILLS } from "@/lib/data";
import { currentPattern } from "@/lib/insights";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/drills/")({
  head: () => ({ meta: [{ title: "Targeted Drills — Cadence" }, { name: "description", content: "Short drills that fix the specific thing holding you back." }, { property: "og:title", content: "Targeted Drills — Cadence" }, { property: "og:description", content: "Practice one communication muscle at a time." }] }),
  component: () => <AppShell><Drills /></AppShell>,
});

function Drills() {
  const rs = useStore((s) => s.responses);
  const done = useStore((s) => s.drillsDone);
  const cp = currentPattern(rs);
  const focus = ["Get to the point", "Build stronger structure", "Reduce filler words"];
  return (
    <>
      <PageHead eyebrow="Targeted practice" title="Drills" />
      <div className="glass mb-8 p-6"><div className="eyebrow mb-3 !text-primary">Your current focus</div><ol className="flex flex-wrap gap-6">{focus.map((f, i) => <li key={f} className="font-display text-[17px] font-bold"><span className="mr-2 font-mono text-[13px] text-primary">{i + 1}</span>{f}</li>)}</ol><p className="mt-3 text-[13px] text-muted-foreground">Weakest right now: {cp.weakest.join(", ")}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DRILLS.map((d) => (
          <Link key={d.id} to="/drills/$drillId" params={{ drillId: d.id }} className={`glass p-6 transition hover:bg-glass-strong ${cp.weakest.includes(d.skill) ? "border-primary/40" : ""}`}>
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground"><span className="uppercase">{d.skill}</span><span>{d.minutes} min{done.includes(d.id) ? " · done" : ""}</span></div>
            <div className="mt-3 font-display text-[19px] font-bold">{d.name}</div>
            <p className="mt-1 text-[13px] text-muted-foreground">{d.objective}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
