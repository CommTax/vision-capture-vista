import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { LEVELS, MODES, QUESTIONS, type ModeId } from "@/lib/data";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/practice/")({
  head: () => ({ meta: [{ title: "Choose your practice — Cadence" }, { name: "description", content: "Pick an interview, conversation, presentation or custom scenario to practice." }, { property: "og:title", content: "Choose your practice — Cadence" }, { property: "og:description", content: "Seven practice modes for real-world communication." }] }),
  component: () => <AppShell><Practice /></AppShell>,
});

function Practice() {
  const [mode, setMode] = useState<ModeId>("interview");
  const [custom, setCustom] = useState("");
  const level = useStore((s) => s.profile?.level ?? "Mid career");
  const navigate = useNavigate();
  const qs = QUESTIONS.filter((q) => q.mode === mode);
  return (
    <>
      <PageHead eyebrow="Choose your practice" title="What do you need to say next?" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`glass p-5 text-left transition ${mode === m.id ? "border-primary/60 bg-primary/10" : "hover:bg-glass-strong"}`}>
            <div className="eyebrow !text-primary">{m.tag}</div>
            <div className="mt-2 font-display text-[18px] font-bold">{m.name}</div>
            <p className="mt-1 text-[13px] text-muted-foreground">{m.blurb}</p>
          </button>
        ))}
      </div>

      {mode === "interview" && (
        <div className="mt-8 flex flex-wrap items-center gap-2"><span className="eyebrow mr-2">Level</span>
          {LEVELS.map((l) => <button key={l} className="chip" data-active={level === l} onClick={() => setState((s) => ({ ...s, profile: s.profile && { ...s.profile, level: l } }))}>{l}</button>)}
        </div>
      )}

      <div className="mt-8">
        {mode === "custom" ? (
          <form className="glass space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) navigate({ to: "/practice/$questionId", params: { questionId: "custom" }, search: { s: custom.trim() } }); }}>
            <label className="font-display text-[20px] font-bold">What situation do you want to practice?</label>
            <textarea className="field min-h-28" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Telling my client we need to push the launch by a month" />
            <button className="btn btn-primary" disabled={!custom.trim()}>Generate my scenario</button>
          </form>
        ) : (
          <div className="grid gap-3">
            {qs.map((q) => (
              <Link key={q.id} to="/practice/$questionId" params={{ questionId: q.id }} className="glass flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-glass-strong">
                <div><div className="font-display text-[17px] font-bold">{q.text}</div><div className="text-[13px] text-muted-foreground">{q.context}</div></div>
                <div className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground"><span>{q.difficulty}</span><span>{q.seconds}s</span><span className="text-primary">Start →</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
