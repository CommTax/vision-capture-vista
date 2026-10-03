import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ScoreBar } from "@/components/analysis-view";
import { analyzeResponse, type Analysis } from "@/lib/analysis";
import { DRILLS } from "@/lib/data";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/drills/$drillId")({
  head: () => ({ meta: [{ title: "Drill — Cadence" }, { name: "description", content: "A focused communication drill with instant feedback." }, { property: "og:title", content: "Drill — Cadence" }, { property: "og:description", content: "Practice one skill, get feedback, retry." }] }),
  component: () => <AppShell><DrillPage /></AppShell>,
});

function DrillPage() {
  const { drillId } = Route.useParams();
  const d = DRILLS.find((x) => x.id === drillId) ?? DRILLS[0];
  const level = useStore((s) => s.profile?.level ?? "Mid career");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Analysis[]>([]);
  const last = results[results.length - 1];

  async function submit() {
    setBusy(true);
    const a = await analyzeResponse({ question: d.prompt, transcript: text, mode: "everyday", level, responseType: "text" });
    setResults((r) => [...r, a]); setBusy(false);
    setState((s) => ({ ...s, drillsDone: s.drillsDone.includes(d.id) ? s.drillsDone : [...s.drillsDone, d.id] }));
  }
  const feedback = (a: Analysis) => {
    if (d.id === "five-sec" || d.id === "result-first") return a.main_point_delay <= 5 ? `Main point landed at ${a.main_point_delay}s. That's the target.` : `Main point landed at ${a.main_point_delay}s — move it into your first sentence.`;
    if (d.id === "cut-30") return a.word_count <= 50 ? `${a.word_count} words. Tight.` : `${a.word_count} words — cut ${a.word_count - 50} more.`;
    if (d.id === "one-sentence") return a.sentence_count === 1 ? "One sentence. Done." : `${a.sentence_count} sentences — compress to one.`;
    return a.dimensions[d.skill].happened + " " + a.dimensions[d.skill].tryThis;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/drills" className="font-mono text-[12px] text-muted-foreground">← Drills</Link>
      <div className="glass glass-float rise p-7 md:p-9">
        <div className="eyebrow !text-primary">{d.skill} · {d.minutes} min</div>
        <h1 className="mt-2 text-[34px] font-bold">{d.name}</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div><div className="eyebrow mb-1">Objective</div><p className="text-[15px]">{d.objective}</p></div>
          <div><div className="eyebrow mb-1">Example</div><p className="text-[15px] text-muted-foreground">{d.example}</p></div>
        </div>
        <div className="mt-6 rounded-2xl border border-border p-4"><div className="eyebrow mb-1">Your prompt</div><p className="font-display text-[18px] font-bold">{d.prompt}</p></div>
        <textarea className="field mt-5 min-h-36" value={text} onChange={(e) => setText(e.target.value)} placeholder="Your response…" />
        <div className="mt-2 font-mono text-[12px] text-muted-foreground">{text.trim().split(/\s+/).filter(Boolean).length} words</div>
        <button className="btn btn-primary mt-4" disabled={busy || text.trim().split(/\s+/).length < 3} onClick={submit}>{busy ? "Analyzing…" : results.length ? "Retry" : "Get feedback"}</button>
      </div>
      {last && (
        <div className="glass rise p-7">
          <div className="eyebrow mb-3">Feedback · attempt {results.length}</div>
          <p className="font-display text-[20px] font-bold">{feedback(last)}</p>
          <div className="mt-5"><ScoreBar label={d.skill.toUpperCase()} value={last.scores[d.skill]} prev={results.length > 1 ? results[results.length - 2].scores[d.skill] : undefined} /></div>
          <p className="mt-4 text-[13px] text-muted-foreground">Edit your response above and retry to beat your score.</p>
        </div>
      )}
    </div>
  );
}
