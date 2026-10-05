import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PatternCardSection } from "@/components/free-practice";
import { Locked } from "@/components/plan-gate";
import { useEntitlement } from "@/lib/entitlements";
import { cap } from "@/components/analysis-view";
import { DRILLS, PATTERNS, modeName, type Dimension } from "@/lib/data";
import { currentPattern, skillStats } from "@/lib/insights";
import { streak, useStore, type ResponseRecord } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Your next practice — TheUnspoken" }, { name: "description", content: "What to practice now, why, and how your responses are changing." }, { property: "og:title", content: "Your next practice — TheUnspoken" }, { property: "og:description", content: "Your personal practice cockpit." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AppShell><Dashboard /></AppShell>,
});

// Focus-specific coaching copy. Picked by the user's weakest recent dimension.
const FOCUS: Record<Dimension, { goal: string; why: string; chain: string[]; move: string; drills: string[] }> = {
  impact: { goal: "make your answers more specific, memorable, and outcome-focused", why: "Your recent responses are generally clear, but they often lose impact because the outcome isn't specific enough.", chain: ["Point", "Evidence", "Result"], move: "Make the point → prove it → show the result.", drills: ["result-first", "exec-summary", "specific"] },
  structure: { goal: "put your ideas in a clear order the listener can follow", why: "Your recent responses have useful ideas, but they arrive in an order that's hard to follow.", chain: ["Point", "Reason", "Example"], move: "Say the answer → give one reason → show one example.", drills: ["three-steps", "five-sec", "one-sentence"] },
  clarity: { goal: "make the main idea easy to hear the first time", why: "Your recent responses often bury the main idea under qualifiers and side notes.", chain: ["Point", "Explain", "Confirm"], move: "Say it plainly → explain once → stop.", drills: ["one-sentence", "five-sec", "specific"] },
  conciseness: { goal: "say the same thing with less", why: "Your recent responses keep going after the point is already clear.", chain: ["Point", "Proof", "Stop"], move: "Make the point → back it once → end there.", drills: ["cut-30", "one-sentence", "exec-summary"] },
  relevance: { goal: "answer the question that was actually asked", why: "Your recent responses sometimes drift away from what the question asked.", chain: ["Question", "Answer", "Link back"], move: "Repeat the ask → answer it → tie back.", drills: ["five-sec", "three-steps", "exec-summary"] },
  delivery: { goal: "make your strongest line sound like it matters", why: "Your recent responses have good content, but the delivery flattens the key moments.", chain: ["Pause", "Point", "Emphasis"], move: "Slow down → land the point → stress the result.", drills: ["result-first", "one-sentence", "five-sec"] },
  confidence: { goal: "commit to your answer without hedging", why: "Your recent responses soften strong points with “I think” and “maybe”.", chain: ["Claim", "Evidence", "Own it"], move: "State it → prove it → don't take it back.", drills: ["five-sec", "specific", "result-first"] },
  memorability: { goal: "leave the listener with one line they'll remember", why: "Your recent responses are correct, but nothing in them stands out afterwards.", chain: ["Hook", "Story", "Takeaway"], move: "Open with the change → tell it briefly → end on one line.", drills: ["one-sentence", "result-first", "specific"] },
};

const CHALLENGES = [{ id: "pre-2", t: "Explain a difficult project decision in 45 seconds." }, { id: "evd-1", t: "Tell your manager about a project delay without sounding defensive." }];

const DECLINE_NOTE: Partial<Record<Dimension, string>> = {
  conciseness: "Your recent responses became longer.",
  relevance: "Recent answers drifted further from the question.",
  structure: "Your main point is arriving later.",
  impact: "Outcomes are less specific than before.",
  clarity: "More qualifiers are creeping in.",
};

function insight(r: ResponseRecord, prev?: ResponseRecord) {
  if (prev) {
    const a = prev.analysis.main_point_delay, b = r.analysis.main_point_delay;
    if (a - b >= 3) return `Your main point moved from ${Math.round(a)} seconds to ${Math.round(b)} seconds.`;
    const d = r.analysis.scores.structure - prev.analysis.scores.structure;
    if (d) return `Structure ${d > 0 ? "rose" : "fell"} ${Math.abs(d)} points from the previous attempt.`;
  }
  return r.analysis.summary;
}

function Dashboard() {
  const profile = useStore((s) => s.profile)!;
  const rs = useStore((s) => s.responses);
  const days = useStore((s) => s.practiceDays);
  const cp = currentPattern(rs);
  const stats = skillStats(rs);
  const f = FOCUS[cp.focus as Dimension] ?? FOCUS.impact;
  const focus = cap(cp.focus);
  const drills = f.drills.map((id) => DRILLS.find((d) => d.id === id)).filter(Boolean) as typeof DRILLS;
  const primary = PATTERNS[cp.primary] ?? PATTERNS.scatterer;
  const byId = new Map(rs.map((r) => [r.id, r]));
  const { free } = useEntitlement();

  return (
    <div className="space-y-6">
      {/* 1. Next practice */}
      <header className="rise pt-2">
        <div className="eyebrow mb-3">Good to see you, {profile.name}</div>
        <h1 className="text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.05]">Your next practice</h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted-foreground">Your current focus is <span className="text-primary">{focus}</span>. Today's practice is designed to help you {f.goal}.</p>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <Link to="/practice/$questionId" params={{ questionId: CHALLENGES[0].id }} className="btn btn-primary px-6 py-3 text-[15px]">Start today's practice →</Link>
          <div className="flex gap-5 font-mono text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><Flame className="size-3.5 text-primary" /><b className="text-foreground">{streak(days)}</b> day streak</span>
            <span><b className="text-foreground">{rs.length}</b> responses</span>
            <span><b className="text-foreground">{stats.filter((s) => s.trend !== 0).length}</b> skills practiced</span>
          </div>
        </div>
      </header>

      {rs[0] && <section id="my-card" className="paper rounded-[24px] px-5 pb-8"><PatternCardSection a={[...rs].sort((x, y) => y.created_at.localeCompare(x.created_at))[0].analysis} /></section>}


      {free ? (
        <>
          <section className="glass flex flex-col p-7">
            <div className="eyebrow mb-4">Your current pattern</div>
            <div className="font-display text-[26px] font-bold leading-tight">{primary.name.replace(/^The /, "").toUpperCase()}</div>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{primary.desc}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-[12px]">
              <div><div className="text-muted-foreground">Secondary</div><div className="mt-1 font-mono">{(PATTERNS[cp.secondary] ?? primary).short}</div></div>
              <div><div className="text-muted-foreground">Strength</div><div className="mt-1 font-mono text-success">{cp.strength.toUpperCase()}</div></div>
              <div><div className="text-muted-foreground">Focus</div><div className="mt-1 font-mono text-primary">{focus.toUpperCase()}</div></div>
            </div>
            <div className="mt-5 rounded-2xl bg-primary/10 p-4">
              <div className="eyebrow !text-primary">Your next move</div>
              <p className="mt-2 font-display text-[16px] font-bold">{f.move}</p>
            </div>
          </section>
          <Locked feature="history" title="Continue your personal practice path" body="Unlock targeted challenges, response history, recommendations, and change tracking based on your answers." cta="Unlock your dashboard" />
        </>
      ) : <>

      {/* 2. Why */}
      <section className="glass glass-float grid gap-6 border-primary/30 p-7 md:grid-cols-12 md:p-8">
        <div className="md:col-span-7">
          <div className="eyebrow mb-3 !text-primary">Why you're seeing this</div>
          <p className="font-display text-[22px] font-bold leading-snug">{f.why}</p>
          <p className="mt-3 text-[15px] text-muted-foreground">That's why your current focus is <b className="text-primary">{focus.toUpperCase()}</b>.</p>
        </div>
        <div className="flex flex-col justify-center md:col-span-5">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[13px] uppercase tracking-[0.12em]">
            {f.chain.map((c, i) => <span key={c} className="flex items-center gap-2">{i > 0 && <span className="text-primary">→</span>}<span className="rounded-full border border-primary/40 px-3 py-1.5">{c}</span></span>)}
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">Practice this pattern in your next response.</p>
          {drills[0] && <Link to="/drills/$drillId" params={{ drillId: drills[0].id }} className="btn btn-ghost btn-sm mt-4 self-start">Practice {focus} →</Link>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 3. Today's challenges */}
        <section className="glass p-7 lg:col-span-7">
          <div className="mb-5 flex items-baseline justify-between"><div className="eyebrow !text-primary">Today's 2 challenges</div><span className="font-mono text-[11px] text-muted-foreground">2 challenges · ~5 minutes</span></div>
          <div className="space-y-3">
            {CHALLENGES.map((c, i) => (
              <Link key={c.id} to="/practice/$questionId" params={{ questionId: c.id }} className="group flex items-start gap-5 rounded-2xl border border-border p-5 transition hover:border-primary/40 hover:bg-glass-strong">
                <span className="font-mono text-[14px] text-primary">0{i + 1}</span>
                <div className="flex-1"><div className="font-display text-[18px] font-bold leading-snug">{c.t}</div><div className="mt-2 font-mono text-[11px] text-muted-foreground">FOCUS: <span className="text-primary">{focus.toUpperCase()}</span></div></div>
                <span className="text-[13px] text-primary group-hover:translate-x-0.5">Start →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Pattern diagnosis */}
        <section className="glass flex flex-col p-7 lg:col-span-5">
          <div className="eyebrow mb-4">Your current pattern</div>
          <div className="font-display text-[26px] font-bold leading-tight">{primary.name.replace(/^The /, "").toUpperCase()}</div>
          <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{primary.desc}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-[12px]">
            <div><div className="text-muted-foreground">Secondary</div><div className="mt-1 font-mono">{(PATTERNS[cp.secondary] ?? primary).short}</div></div>
            <div><div className="text-muted-foreground">Strength</div><div className="mt-1 font-mono text-success">{cp.strength.toUpperCase()}</div></div>
            <div><div className="text-muted-foreground">Focus</div><div className="mt-1 font-mono text-primary">{focus.toUpperCase()}</div></div>
          </div>
          <div className="mt-5 rounded-2xl bg-primary/10 p-4">
            <div className="eyebrow !text-primary">Your next move</div>
            <p className="mt-2 font-display text-[16px] font-bold">{f.move}</p>
          </div>
          <Link to="/practice/$questionId" params={{ questionId: CHALLENGES[0].id }} className="mt-4 text-[13px] text-primary">Practice this →</Link>
        </section>
      </div>

      {/* 6. Drills */}
      <section>
        <h2 className="text-[24px] font-bold">Practice your weak spots</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">Short exercises built around your current pattern.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{drills.map((d) => (
          <div key={d.id} className="glass flex flex-col p-6"><div className="font-display text-[17px] font-bold">{d.name}</div><p className="mt-2 flex-1 text-[13px] text-muted-foreground">“{d.objective}”</p><Link to="/drills/$drillId" params={{ drillId: d.id }} className="btn btn-ghost btn-sm mt-5 self-start">Practice →</Link></div>
        ))}
        </div>
      </section>

      {/* 7. Recent responses */}
      <section className="glass p-7">
        <div className="mb-1 flex justify-between"><h2 className="text-[22px] font-bold">Your recent responses</h2><Link to="/responses" className="text-[12px] text-primary">All responses →</Link></div>
        <p className="mb-4 text-[14px] text-muted-foreground">See what changed from one attempt to the next.</p>
        {rs.length === 0 ? <p className="text-[14px] text-muted-foreground">No responses yet. <Link to="/practice" className="text-primary">Start your first rep.</Link></p> : (
          <div className="divide-y divide-border">{rs.slice(0, 4).map((r) => {
            const prev = r.parent_id ? byId.get(r.parent_id) : undefined;
            const from = prev ? PATTERNS[prev.analysis.primary_pattern]?.short : undefined;
            const to = PATTERNS[r.analysis.primary_pattern]?.short ?? "";
            return (
              <Link key={r.id} to="/responses/$responseId" params={{ responseId: r.id }} className="grid gap-2 py-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-6"><div className="text-[15px] font-medium">“{r.question}”</div><div className="mt-1 text-[13px] text-muted-foreground">{insight(r, prev)}</div></div>
                <div className="font-mono text-[12px] md:col-span-3">{from && from !== to ? <><span className="text-muted-foreground line-through">{from}</span> <span className="text-primary">→</span> </> : null}<span>{to}</span>{prev && <div className="mt-1 text-muted-foreground">Structure {prev.analysis.scores.structure} → <span className="text-primary">{r.analysis.scores.structure}</span></div>}</div>
                <div className="font-mono text-[11px] text-muted-foreground md:col-span-3 md:text-right">{modeName(r.mode).toUpperCase()} · ATTEMPT {r.attempt}<div className="mt-1">STR {r.analysis.scores.structure} · CLR {r.analysis.scores.clarity} · IMP {r.analysis.scores.impact}</div></div>
              </Link>
            );
          })}</div>
        )}
      </section>

      {/* 5. Changes */}
      <section className="glass p-7">
        <div className="mb-5 flex justify-between"><h2 className="text-[22px] font-bold">How your responses are changing</h2><Link to="/progress" className="text-[12px] text-primary">See full progress →</Link></div>
        {rs.length < 2 ? <p className="text-[14px] text-muted-foreground">Complete two responses to see what's changing.</p> : (
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">{stats.slice(0, 5).map((s) => {
            const down = s.trend < 0;
            return (
              <div key={s.d} className="flex items-center gap-4">
                <div className="w-28 text-[14px]">{cap(s.d)}</div>
                <div className="font-mono text-[13px]"><span className="text-muted-foreground">{s.early}</span> → <span className={down ? "text-destructive" : "text-foreground"}>{s.current}</span></div>
                <div className={`font-mono text-[12px] ${down ? "text-destructive" : s.trend > 0 ? "text-success" : "text-muted-foreground"}`}>{down ? `↓ ${-s.trend}` : s.trend > 0 ? `↑ ${s.trend}` : "no change"}</div>
                {down && DECLINE_NOTE[s.d] && <div className="hidden flex-1 text-[12px] text-muted-foreground lg:block">{DECLINE_NOTE[s.d]}</div>}
              </div>
            );
          })}</div>
        )}
      </section>
      </>}
    </div>
  );
}
