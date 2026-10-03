import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { FreeCounter } from "@/components/plan-gate";
import { useEntitlement } from "@/lib/entitlements";
import { cap } from "@/components/analysis-view";
import { LEVELS, MODES, type Dimension, type ModeId } from "@/lib/data";
import { allScenarios, buildCustomScenario, CATEGORY_BLURB, categoryName, GOALS, recommendPractice, scenariosFor, type Scenario } from "@/lib/scenarios";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/practice/")({
  head: () => ({ meta: [{ title: "Practice — Cadence" }, { name: "description", content: "Choose a real situation. Practice your response. See what gets lost." }, { property: "og:title", content: "Practice — Cadence" }, { property: "og:description", content: "Practice what you need to say next." }] }),
  component: () => <AppShell allowGuest><Practice /></AppShell>,
});

function ScenarioCard({ s, level, focus, recommended }: { s: Scenario; level: string; focus?: Dimension; recommended?: boolean }) {
  return (
    <Link to="/practice/$questionId" params={{ questionId: s.scenario_id }} search={focus ? { f: focus } : {}} className={`glass flex flex-col p-5 transition hover:bg-glass-strong ${recommended ? "border-primary/50" : ""}`}>
      {recommended && <div className="eyebrow mb-2 !text-primary">Recommended for you</div>}
      <div className="font-display text-[17px] font-bold leading-snug">{s.title}</div>
      <div className="mt-1 text-[13px] text-muted-foreground">{s.context}{level === "Senior / Leadership" && s.experience_level !== "any" ? "" : ""}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
        <span className="text-muted-foreground">FOCUS: <span className="text-foreground">{s.target_skills.map(cap).join(" + ")}</span></span>
        <span className="text-muted-foreground">{s.difficulty} · {s.time_limit}s <span className="ml-2 text-primary">Start →</span></span>
      </div>
    </Link>
  );
}

function Practice() {
  const rs = useStore((s) => s.responses);
  const level = useStore((s) => s.profile?.level ?? "Mid career");
  const navigate = useNavigate();
  const rec = recommendPractice(rs, level);
  const all = allScenarios(level);
  const recScenario = rec ? all.find((s) => s.scenario_id === rec.recommended_scenario_id) : undefined;
  const [goal, setGoal] = useState<Dimension | null>(null);
  const [mode, setMode] = useState<ModeId | null>(null);
  const [custom, setCustom] = useState("");
  const activeFocus = goal ?? rec?.current_focus ?? null;
  const adaptive = activeFocus ? scenariosFor(activeFocus, level).filter((s) => s.scenario_id !== recScenario?.scenario_id).slice(0, 4) : [];
  const library = mode && mode !== "custom" ? all.filter((s) => s.category === mode) : [];
  const ent = useEntitlement();
  const preview = custom.trim().length > 8 ? buildCustomScenario(custom, level) : null;

  return (
    <div className="space-y-10">
      <div><PageHead eyebrow="Practice" title="What do you need to say next?" /><p className="-mt-6 text-[15px] text-muted-foreground">Choose a real situation. Practice your response. See what gets lost.</p><div className="mt-2"><FreeCounter /></div></div>
      {!rec && !ent.free && rs.length > 0 && <p className="glass p-5 text-[14px] text-muted-foreground">Keep practicing to build enough evidence for a personalized recommendation.</p>}

      {/* 1. Next practice */}
      {rec && recScenario && (
        <section className="glass glass-float rise grid gap-8 border-primary/40 p-7 md:grid-cols-12 md:p-9">
          <div className="md:col-span-7">
            <div className="eyebrow mb-3 !text-primary">Your next practice</div>
            <h2 className="text-[clamp(24px,3vw,34px)] font-bold leading-tight">{recScenario.title}</h2>
            <div className="mt-2 text-[14px] text-muted-foreground">{recScenario.context} · {level}</div>
            <Link to="/practice/$questionId" params={{ questionId: recScenario.scenario_id }} search={{ f: rec.current_focus }} className="btn btn-primary mt-7 px-6 py-3 text-[15px]">Start practice →</Link>
          </div>
          <div className="space-y-4 md:col-span-5">
            <div><div className="eyebrow mb-1">Why this one</div><p className="text-[15px] leading-6">{rec.supporting_evidence ?? rec.reason}</p>{rec.supporting_evidence && <p className="mt-1 text-[13px] text-muted-foreground">{rec.reason}</p>}</div>
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4 font-mono text-[12px]">
              <div><dt className="text-muted-foreground">Focus</dt><dd className="mt-1 text-primary">{cap(rec.current_focus)}</dd></div>
              <div><dt className="text-muted-foreground">Difficulty</dt><dd className="mt-1">{recScenario.difficulty}</dd></div>
              <div><dt className="text-muted-foreground">Time</dt><dd className="mt-1">{recScenario.time_limit} sec</dd></div>
            </dl>
          </div>
        </section>
      )}

      {/* 2. Goal selector */}
      <section>
        <h2 className="text-[22px] font-bold">What do you want to work on?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GOALS.map((g) => (
            <button key={g.label} onClick={() => setGoal((c) => (c === g.skill ? null : g.skill))} className={`glass p-4 text-left transition ${goal === g.skill ? "border-primary/60 bg-primary/10" : "hover:bg-glass-strong"}`}>
              <div className="font-display text-[16px] font-bold">{g.label}</div><div className="text-[13px] text-muted-foreground">{g.hint}</div>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2"><span className="eyebrow mr-2">Experience level</span>
          {LEVELS.map((l) => <button key={l} className="chip" data-active={level === l} onClick={() => setState((s) => ({ ...s, profile: s.profile && { ...s.profile, level: l } }))}>{l}</button>)}
        </div>
        {activeFocus && adaptive.length > 0 && (
          <div className="mt-6">
            <div className="eyebrow mb-3">{goal ? "Scenarios that train" : "Your current focus"}: <span className="!text-primary text-primary">{cap(activeFocus)}</span></div>
            <div className="grid gap-3 md:grid-cols-2">{adaptive.map((s) => <ScenarioCard key={s.scenario_id} s={s} level={level} focus={activeFocus} />)}</div>
          </div>
        )}
      </section>

      {/* 3. Categories */}
      <section>
        <h2 className="text-[22px] font-bold">Practice a situation</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode((c) => (c === m.id ? null : m.id))} className={`glass p-4 text-left transition ${mode === m.id ? "border-primary/60 bg-primary/10" : "hover:bg-glass-strong"}`}>
              <div className="font-display text-[16px] font-bold">{m.name}</div><p className="mt-1 text-[12px] text-muted-foreground">{CATEGORY_BLURB[m.id] ?? m.blurb}</p>
            </button>
          ))}
        </div>

        {/* 4. Library for the chosen category */}
        {mode === "custom" && ent.free && (
          <div className="glass mt-5 p-6 text-[14px]"><div className="eyebrow mb-1">Custom practice</div>Build your own scenario with Practice or Sprint. <Link to="/plans" className="text-primary">See plans →</Link></div>
        )}
        {mode === "custom" && !ent.free && (
          <form className="glass mt-5 space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); if (!preview) return; navigate({ to: "/practice/$questionId", params: { questionId: "custom" }, search: { s: custom.trim(), ctx: preview.context, f: preview.evaluation_focus[0] } }); }}>
            <div><div className="eyebrow mb-1">Custom practice</div><label className="font-display text-[20px] font-bold">What situation do you need to practice?</label></div>
            <textarea className="field min-h-28" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="I'm asking my manager for a promotion after taking on additional responsibilities." />
            {preview && (
              <dl className="grid gap-3 rounded-2xl border border-border p-4 text-[13px] sm:grid-cols-3">
                <div><dt className="eyebrow">Audience</dt><dd className="mt-1">{preview.audience}</dd></div>
                <div><dt className="eyebrow">Objective</dt><dd className="mt-1">{preview.objective}</dd></div>
                <div><dt className="eyebrow">Evaluation focus</dt><dd className="mt-1">{preview.evaluation_focus.map(cap).join(" + ")}</dd></div>
                <div><dt className="eyebrow">Context</dt><dd className="mt-1">{preview.context}</dd></div>
                <div><dt className="eyebrow">Difficulty</dt><dd className="mt-1">{preview.difficulty}</dd></div>
                <div><dt className="eyebrow">Time limit</dt><dd className="mt-1">{preview.time_limit} sec</dd></div>
              </dl>
            )}
            <button className="btn btn-primary" disabled={!preview}>Create practice →</button>
          </form>
        )}
        {library.length > 0 && (
          <div className="mt-5"><div className="eyebrow mb-3">{categoryName(mode!)}</div>
            <div className="grid gap-3 md:grid-cols-2">{library.map((s) => <ScenarioCard key={s.scenario_id} s={s} level={level} recommended={s.scenario_id === recScenario?.scenario_id} />)}</div>
          </div>
        )}
        {!mode && !rec && (
          <div className="mt-5"><div className="eyebrow mb-3">Start anywhere</div>
            <div className="grid gap-3 md:grid-cols-2">{all.filter((s) => s.category === "interview").map((s) => <ScenarioCard key={s.scenario_id} s={s} level={level} />)}</div>
          </div>
        )}
      </section>
    </div>
  );
}
