import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { cap } from "@/components/analysis-view";
import { buildSkillInsights } from "@/lib/skills";
import { scenariosFor } from "@/lib/scenarios";
import { analyzeResponse, type Analysis } from "@/lib/analysis";
import { DRILLS } from "@/lib/data";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/drills/$drillId")({
  head: () => ({ meta: [{ title: "Drill — TheUnspoken" }, { name: "description", content: "A focused communication drill with instant feedback." }, { property: "og:title", content: "Drill — TheUnspoken" }, { property: "og:description", content: "Practice one skill, get feedback, retry." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AppShell><DrillPage /></AppShell>,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "https://unspoken-backend-nqvl.onrender.com";

// ────────────────────────────────────────────────────────────
// Catalog cache — fetched once per session, reused across navigations
// ────────────────────────────────────────────────────────────
type CatalogDrill = {
  id: string;
  name: string;
  bucket: string;
  primary_skill: string;
  secondary_skills: string[];
  objective: string | null;
  reason: string | null;
  success_chain: string[];
  minutes: number;
};

let catalogCache: CatalogDrill[] | null = null;
let catalogPromise: Promise<CatalogDrill[]> | null = null;

function loadCatalog(): Promise<CatalogDrill[]> {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (catalogPromise) return catalogPromise;
  catalogPromise = fetch(`${API_BASE}/api/questions/drills`)
    .then((r) => (r.ok ? r.json() : { drills: [] }))
    .then((d) => {
      catalogCache = d.drills || [];
      return catalogCache;
    })
    .catch(() => {
      catalogCache = [];
      return [];
    });
  return catalogPromise;
}

// ────────────────────────────────────────────────────────────
// Merge local DRILLS + remote catalog into a single lookup
// ────────────────────────────────────────────────────────────
type ResolvedDrill = {
  id: string;
  name: string;
  skill: string;           // lowercased dimension — local DRILLS uses `skill`
  minutes: number;
  objective: string;
  example: string;
  prompt: string;
};

function resolveDrill(drillId: string, catalog: CatalogDrill[]): ResolvedDrill | null {
  // 1. Prefer the local DRILLS array — it has richer fields (example, prompt)
  const local = DRILLS.find((x) => x.id === drillId);
  if (local) {
    return {
      id: local.id,
      name: local.name,
      skill: local.skill,
      minutes: local.minutes,
      objective: local.objective,
      example: local.example,
      prompt: local.prompt,
    };
  }

  // 2. Fall back to the remote catalog — has name/minutes, generic prompt
  const remote = catalog.find((c) => c.id === drillId);
  if (remote) {
    return {
      id: remote.id,
      name: remote.name,
      skill: remote.primary_skill,
      minutes: remote.minutes,
      objective: remote.objective || `Practice ${remote.name}.`,
      example: "",
      prompt: `Try this drill: ${remote.name}.`,
    };
  }

  // 3. Not found anywhere
  return null;
}

function DrillPage() {
  const { drillId } = Route.useParams();

  // ─── ALL HOOKS FIRST ───
  const [catalog, setCatalog] = useState<CatalogDrill[]>(catalogCache ?? []);
  const [catalogLoading, setCatalogLoading] = useState(!catalogCache);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Analysis[]>([]);

  const level = useStore((s) => s.profile?.level ?? "Mid career");
  const saved = useStore((s) => s.drillResults?.[drillId]);
  const rs = useStore((s) => s.responses);

  useEffect(() => {
    let cancelled = false;
    if (catalogCache) return;
    loadCatalog().then((list) => {
      if (cancelled) return;
      setCatalog(list);
      setCatalogLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── NOW derived values ───
  const d = resolveDrill(drillId, catalog);

  const last = results[results.length - 1];
  const baseline = d
    ? buildSkillInsights(rs).find((x) => x.skill === d.skill)?.score ?? null
    : null;
  const real = d ? scenariosFor(d.skill, level)[0] : null;
  const others = d
    ? DRILLS.filter((x) => x.id !== d.id && x.skill !== d.skill).slice(0, 1)
    : [];

  // ─── Loading state ───
  if (catalogLoading) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center text-muted-foreground">
        Loading drill…
      </div>
    );
  }

  // ─── Not found ───
  if (!d) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-20 text-center">
        <p className="text-muted-foreground">
          We couldn't find that drill.
        </p>
        <Link to="/drills" className="btn btn-primary">
          Back to drills →
        </Link>
      </div>
    );
  }

  async function submit() {
    if (!d) return;
    setBusy(true);
    const a = await analyzeResponse({
      question: d.prompt,
      transcript: text,
      mode: "everyday",
      level,
      responseType: "text",
    });
    setResults((r) => [...r, a]);
    setBusy(false);
    setState((s) => {
      const prev = s.drillResults?.[d.id];
      const sc = a.scores[d.skill as keyof typeof a.scores];
      const rec = prev
        ? {
            ...prev,
            last_score: sc,
            last_delay: a.main_point_delay,
            attempts: prev.attempts + 1,
            at: new Date().toISOString(),
          }
        : {
            skill: d.skill,
            first_score: sc,
            last_score: sc,
            first_delay: a.main_point_delay,
            last_delay: a.main_point_delay,
            attempts: 1,
            at: new Date().toISOString(),
          };
      return {
        ...s,
        drillsDone: s.drillsDone.includes(d.id)
          ? s.drillsDone
          : [...s.drillsDone, d.id],
        drillResults: { ...s.drillResults, [d.id]: rec },
      };
    });
  }

  const feedback = (a: Analysis) => {
    if (d.id === "five-sec" || d.id === "result-first")
      return a.main_point_delay <= 5
        ? `Main point landed at ${a.main_point_delay}s. That's the target.`
        : `Main point landed at ${a.main_point_delay}s — move it into your first sentence.`;
    if (d.id === "cut-30")
      return a.word_count <= 50
        ? `${a.word_count} words. Tight.`
        : `${a.word_count} words — cut ${a.word_count - 50} more.`;
    if (d.id === "one-sentence")
      return a.sentence_count === 1
        ? "One sentence. Done."
        : `${a.sentence_count} sentences — compress to one.`;
    const dim = a.dimensions[d.skill as keyof typeof a.dimensions];
    return dim ? dim.happened + " " + dim.tryThis : "";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/drills" className="font-mono text-[12px] text-muted-foreground">
        ← Drills
      </Link>

      <div className="glass glass-float rise p-7 md:p-9">
        <div className="eyebrow !text-primary">
          {d.skill} · {d.minutes} min
        </div>
        <h1 className="mt-2 text-[34px] font-bold">{d.name}</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <div className="eyebrow mb-1">Objective</div>
            <p className="text-[15px]">{d.objective}</p>
          </div>
          {d.example && (
            <div>
              <div className="eyebrow mb-1">Example</div>
              <p className="text-[15px] text-muted-foreground">{d.example}</p>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-border p-4">
          <div className="eyebrow mb-1">Your prompt</div>
          <p className="font-display text-[18px] font-bold">{d.prompt}</p>
        </div>

        <textarea
          className="field mt-5 min-h-36"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your response…"
        />
        <div className="mt-2 font-mono text-[12px] text-muted-foreground">
          {text.trim().split(/\s+/).filter(Boolean).length} words
        </div>
        <button
          className="btn btn-primary mt-4"
          disabled={busy || text.trim().split(/\s+/).length < 3}
          onClick={submit}
        >
          {busy ? "Analyzing…" : results.length ? "Retry" : "Get feedback"}
        </button>
      </div>

      {!last && saved && saved.attempts > 1 && (
        <div className="glass p-6 text-[14px]">
          <div className="eyebrow mb-2">Last time</div>
          {cap(d.skill)}{" "}
          <span className="font-mono">
            {saved.first_score} →{" "}
            <span className="text-primary">{saved.last_score}</span>
          </span>{" "}
          across {saved.attempts} attempts.
        </div>
      )}

      {last &&
        (() => {
          const prev = results.length > 1 ? results[results.length - 2] : null;
          const before = prev
            ? prev.scores[d.skill as keyof typeof prev.scores]
            : baseline;
          const after = last.scores[d.skill as keyof typeof last.scores];
          const delta = before !== null ? after - before : null;
          const changed: string[] = [];
          if (prev) {
            if (prev.main_point_delay - last.main_point_delay >= 2)
              changed.push(
                `Your main point moved from ${Math.round(
                  prev.main_point_delay,
                )}s to ${Math.round(last.main_point_delay)}s.`,
              );
            if (prev.word_count - last.word_count >= 10)
              changed.push(`${prev.word_count - last.word_count} fewer words.`);
            if (last.word_count - prev.word_count >= 10)
              changed.push(
                `${last.word_count - prev.word_count} more words than last time.`,
              );
          }
          return (
            <div className="glass rise p-7">
              <div className="eyebrow mb-3">Attempt {results.length}</div>
              <p className="font-display text-[20px] font-bold">
                {feedback(last)}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border p-4">
                  <div className="eyebrow mb-1">Before</div>
                  {before !== null ? (
                    <>
                      <div className="font-display text-[28px] font-bold text-muted-foreground">
                        {before}
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        {prev ? "previous attempt" : "your recent average"} ·{" "}
                        {cap(d.skill)}
                      </div>
                    </>
                  ) : (
                    <div className="text-[13px] text-muted-foreground">
                      No earlier score yet.
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-primary/40 p-4">
                  <div className="eyebrow mb-1 !text-primary">After</div>
                  <div className="font-display text-[28px] font-bold">
                    {after}
                    {delta !== null && delta !== 0 && (
                      <span
                        className={`ml-2 font-mono text-[14px] ${
                          delta > 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {delta > 0 ? "▲" : "▼"}
                        {Math.abs(delta)}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    this attempt · {cap(d.skill)}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="eyebrow mb-1">What changed</div>
                <p className="text-[14px]">
                  {changed.length
                    ? changed.join(" ")
                    : prev
                    ? "No measurable change in timing or length from the previous attempt."
                    : last.dimensions[d.skill as keyof typeof last.dimensions]
                        ?.happened ?? ""}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() =>
                    document.querySelector("textarea")?.focus()
                  }
                >
                  Try again →
                </button>
                {others[0] && (
                  <Link
                    to="/drills/$drillId"
                    params={{ drillId: others[0].id }}
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setResults([]);
                      setText("");
                    }}
                  >
                    Practice another drill →
                  </Link>
                )}
              </div>

              {real && (
                <div className="mt-7 rounded-2xl border border-primary/30 p-5">
                  <div className="eyebrow mb-2 !text-primary">
                    Now use it in a real situation
                  </div>
                  <div className="font-display text-[17px] font-bold">
                    {real.title}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    FOCUS: {d.skill.toUpperCase()} · {real.time_limit}s
                  </div>
                  <Link
                    to="/practice/$questionId"
                    params={{ questionId: real.scenario_id }}
                    search={{ f: d.skill as never }}
                    className="mt-3 inline-block text-[13px] text-primary"
                  >
                    Practice this →
                  </Link>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}
