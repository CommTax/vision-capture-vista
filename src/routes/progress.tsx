import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Locked } from "@/components/plan-gate";
import { AppShell, PageHead } from "@/components/app-shell";
import { cap } from "@/components/analysis-view";
import { BADGES, DIMENSIONS, PATTERNS, type Dimension } from "@/lib/data";
import { currentPattern } from "@/lib/insights";
import { buildRecommendations } from "@/lib/recommendations";
import { streak, useStore, type ResponseRecord } from "@/lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Cadence" },
      { name: "description", content: "See how your communication is changing through practice." },
      { property: "og:title", content: "Progress — Cadence" },
      { property: "og:description", content: "See how your communication is changing through practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell><Progress /></AppShell>,
});

type Period = "7" | "30" | "all";
const PERIODS: [Period, string][] = [["7", "7 days"], ["30", "30 days"], ["all", "All time"]];

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const chronOf = (rs: ResponseRecord[]) => [...rs].sort((a, b) => a.created_at.localeCompare(b.created_at));

const CRITICAL = /\b(but|after|slow|fast|too|more words|without|vague|filler|hedg|late|repeat|no |not|missing|buried|lacks?)/i;

type Change = { d: Dimension; prev: number; cur: number; delta: number; note: string | null };

function periodChanges(list: ResponseRecord[]): Change[] | null {
  if (list.length < 2) return null;
  const half = Math.floor(list.length / 2);
  const earlier = list.slice(0, half), recent = list.slice(half);
  return DIMENSIONS.map((d) => {
    const prev = avg(earlier.map((r) => r.analysis.scores[d]));
    const cur = avg(recent.map((r) => r.analysis.scores[d]));
    const delta = cur - prev;
    // Evidence: for a decline use the weakest recent response; for a gain the strongest. Never invented.
    const sorted = [...recent].sort((a, b) => a.analysis.scores[d] - b.analysis.scores[d]);
    const src = delta < 0 ? sorted[0] : sorted[sorted.length - 1];
    // Only use a note when it agrees with the direction: a low score explaining a decline, a high one a gain.
    const sc = src?.analysis.scores[d] ?? 0;
    const raw = src?.analysis.dimensions[d]?.happened ?? null;
    const critical = !!raw && CRITICAL.test(raw);
    const ok = delta < 0 ? sc < 65 && critical : sc >= 70 && !critical;
    const note = ok ? raw : delta < 0 ? "The recent score is lower. There is not enough evidence yet to say why." : null;
    return { d, prev, cur, delta, note };
  });
}

function rootOf(r: ResponseRecord, rs: ResponseRecord[]) {
  let cur = r;
  for (let i = 0; i < 20 && cur.parent_id; i++) { const p = rs.find((x) => x.id === cur.parent_id); if (!p) break; cur = p; }
  return cur;
}

function bestChain(rs: ResponseRecord[]) {
  const groups: Record<string, ResponseRecord[]> = {};
  rs.forEach((r) => { const k = rootOf(r, rs).id; (groups[k] ||= []).push(r); });
  return Object.values(groups).filter((g) => g.length >= 2)
    .map((g) => { const c = [...g].sort((a, b) => a.attempt - b.attempt); return { first: c[0], last: c[c.length - 1], count: c.length, gain: c[c.length - 1].analysis.overall - c[0].analysis.overall }; })
    .sort((a, b) => b.gain - a.gain)[0] ?? null;
}

function Arrow({ v }: { v: number }) {
  if (v === 0) return <span className="font-mono text-[13px] text-muted-foreground">±0</span>;
  return <span className={`font-mono text-[13px] ${v > 0 ? "text-success" : "text-destructive"}`}>{v > 0 ? "↑" : "↓"}{Math.abs(v)}</span>;
}

function TimeChart({ pts }: { pts: { s: number; label: string }[] }) {
  const max = Math.max(10, ...pts.map((p) => p.s));
  const W = 100, H = 40;
  const xy = pts.map((p, i) => [pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W, H - 4 - (p.s / max) * (H - 8)] as const);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-36 w-full">
        <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.2" fill="var(--primary)" />)}
      </svg>
      <div className="mt-2 flex justify-between gap-2 font-mono text-[10px] text-muted-foreground">
        {pts.map((p, i) => <span key={i} className="text-center">{p.label}<br />{p.s}s</span>)}
      </div>
    </div>
  );
}

function Progress() {
  const rs = useStore((s) => s.responses);
  const days = useStore((s) => s.practiceDays);
  const drills = useStore((s) => s.drillsDone);
  const [period, setPeriod] = useState<Period>("30");

  const all = chronOf(rs);
  const cutoff = period === "all" ? 0 : Date.now() - Number(period) * 864e5;
  const list = all.filter((r) => new Date(r.created_at).getTime() >= cutoff);
  const changes = periodChanges(list);
  const ranked = changes ? [...changes].sort((a, b) => b.delta - a.delta) : [];
  const strongest = ranked[0]?.delta > 0 ? ranked[0] : null;
  const opportunity = ranked.length && ranked[ranked.length - 1].delta < 0 ? ranked[ranked.length - 1] : null;
  const { next } = buildRecommendations(rs);
  const pat = currentPattern(rs);
  const chain = bestChain(rs);
  const st = streak(days);

  const timed = list.filter((r) => typeof r.analysis.main_point_delay === "number" && r.analysis.main_point_delay >= 0);
  const t0 = timed[0]?.analysis.main_point_delay, t1 = timed[timed.length - 1]?.analysis.main_point_delay;

  const earned: Record<string, boolean> = {
    "first-rep": rs.length > 0,
    "streak-3": st >= 3,
    "first-improve": rs.some((r) => { const p = rs.find((x) => x.id === r.parent_id); return !!p && r.analysis.overall > p.analysis.overall; }),
    "point-made": rs.some((r) => r.analysis.main_point_delay <= 5),
    structure: rs.some((r) => r.analysis.scores.structure > 70),
    clear: rs.some((r) => r.analysis.scores.clarity > 80),
    exec: drills.includes("exec-summary"),
  };

  const changedItems: { t: string; d: string }[] = [];
  if (timed.length >= 2 && t1 < t0) changedItems.push({ t: "Earlier point", d: `Your main point moved from ${t0} seconds into the response to ${t1} seconds.` });
  if (timed.length >= 2 && t1 > t0) changedItems.push({ t: "Later point", d: `Your main point moved from ${t0} seconds into the response to ${t1} seconds.` });
  changes?.filter((c) => Math.abs(c.delta) >= 5).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3)
    .forEach((c) => changedItems.push({ t: `${cap(c.d)} ${c.delta > 0 ? "up" : "down"}`, d: `${cap(c.d)} moved from ${c.prev} to ${c.cur} across the selected period.${c.note ? ` ${c.note}` : ""}` }));

  const few = list.length === 2;

  return (
    <>
      <PageHead eyebrow="Over time" title="Progress">
        <div className="flex gap-1 rounded-full border border-border p-1">
          {PERIODS.map(([k, l]) => (
            <button key={k} onClick={() => setPeriod(k)} className={`rounded-full px-3 py-1 font-mono text-[12px] ${period === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
      </PageHead>
      <p className="-mt-6 mb-8 text-muted-foreground">See how your communication is changing through practice.</p>

      {/* 1. Summary */}
      <section className="glass p-7">
        <div className="eyebrow mb-5">Your progress</div>
        {!changes ? <p className="text-muted-foreground">Not enough recent practice data yet. Answer at least two questions in this period to see a change.</p> : (
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-[12px] text-muted-foreground">Your strongest change</div>
              {strongest ? <><div className="mt-1 font-display text-[18px] font-bold">{cap(strongest.d)}</div><div className="font-mono text-[22px]">{strongest.prev} → {strongest.cur} · <span className="text-success">+{strongest.delta}</span></div>{strongest.note && <p className="mt-2 text-[13px] text-muted-foreground">{strongest.note}</p>}</> : <p className="mt-1 text-[14px]">No skill improved in this period.</p>}
            </div>
            <div>
              <div className="text-[12px] text-muted-foreground">Your biggest opportunity</div>
              {opportunity ? <><div className="mt-1 font-display text-[18px] font-bold">{cap(opportunity.d)}</div><div className="font-mono text-[22px]">{opportunity.prev} → {opportunity.cur} · <span className="text-destructive">−{Math.abs(opportunity.delta)}</span></div>{opportunity.note && <p className="mt-2 text-[13px] text-muted-foreground">{opportunity.note}</p>}</> : <p className="mt-1 text-[14px]">No skill declined in this period.</p>}
            </div>
            <div>
              <div className="text-[12px] text-muted-foreground">What to practice next</div>
              {next ? <><div className="mt-1 font-display text-[18px] font-bold">{cap(next.skill)}</div><div className="mt-1 font-mono text-[13px] text-primary">{next.success_chain.join(" → ")}</div><Link to="/drills/$drillId" params={{ drillId: next.drill_id }} className="btn btn-primary mt-3 inline-flex">Practice now →</Link></> : <p className="mt-1 text-[14px]">Not enough data yet.</p>}
            </div>
          </div>
        )}
        {few && <p className="mt-5 font-mono text-[11px] text-muted-foreground">Based on only two responses in this period — treat as early signal.</p>}
      </section>

      {/* 2. What's changing */}
      <section className="mt-6 glass p-7">
        <div className="eyebrow mb-1">What's changing</div>
        <p className="mb-5 text-[13px] text-muted-foreground">Earlier half of the period vs. recent half · {list.length} response{list.length === 1 ? "" : "s"}</p>
        {!changes ? <p className="text-muted-foreground">Not enough data yet.</p> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {changes.map((c) => (
              <div key={c.d} className="rounded-2xl border border-border p-4">
                <div className="flex items-baseline justify-between"><span className="font-display font-bold">{cap(c.d)}</span><span className="font-mono text-[14px]">{c.prev} → <b>{c.cur}</b> <Arrow v={c.delta} /></span></div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {Math.abs(c.delta) < 3 ? "Holding steady." : c.note ?? "Not enough evidence yet to explain this change."}
                  {c.delta <= -5 && few ? " Not enough evidence yet to tell if this is a sustained pattern." : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Time to main point */}
      <section className="mt-6 glass p-7">
        <div className="eyebrow mb-4">Time to main point</div>
        {timed.length < 2 ? <p className="text-muted-foreground">Not enough data yet.</p> : (
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="font-display text-[44px] font-bold">{t0}s → {t1}s</div>
              <div className={`font-mono text-[14px] ${t1 < t0 ? "text-success" : t1 > t0 ? "text-destructive" : "text-muted-foreground"}`}>
                {t1 < t0 ? `${t0 - t1} seconds faster` : t1 > t0 ? `${t1 - t0} seconds slower` : "No change"}
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">
                {t1 < t0 ? "Your main point is appearing earlier in recent responses." : t1 > t0 ? "Your main point is appearing later in recent responses." : "Your main point is arriving at the same time."}
              </p>
            </div>
            <div>
              <TimeChart pts={timed.map((r, i) => ({ s: r.analysis.main_point_delay, label: `#${i + 1} ${new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` }))} />
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">Lower = faster · each point is one response</p>
            </div>
          </div>
        )}
      </section>

      {/* 4. What changed + one response improved */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="glass p-7">
          <div className="eyebrow mb-4">What changed in your responses</div>
          {changedItems.length === 0 ? <p className="text-muted-foreground">No clear changes measured yet.</p> : (
            <ul className="space-y-4">{changedItems.map((c) => <li key={c.t}><div className="font-display font-bold">{c.t}</div><p className="text-[13px] text-muted-foreground">{c.d}</p></li>)}</ul>
          )}
        </section>
        <section className="glass p-7">
          <div className="eyebrow mb-4">One response, improved</div>
          {!chain ? <p className="text-muted-foreground">Try the same question again to see a direct before-and-after here.</p> : (
            <>
              <div className="font-display text-[17px] font-bold">{chain.first.question}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[13px]">
                {[["Attempt " + chain.first.attempt, chain.first], ["Attempt " + chain.last.attempt, chain.last]].map(([l, r]) => {
                  const x = r as ResponseRecord;
                  return <div key={l as string} className="rounded-xl border border-border p-3"><div className="text-muted-foreground">{l as string}</div>Structure {x.analysis.scores.structure} · Impact {x.analysis.scores.impact}</div>;
                })}
              </div>
              <div className="mt-4 text-[13px]"><span className="text-muted-foreground">Time to main point </span><span className="font-mono">{chain.first.analysis.main_point_delay}s → {chain.last.analysis.main_point_delay}s</span></div>
              <div className="mt-1 text-[13px]"><span className="text-muted-foreground">Overall </span><span className="font-mono">{chain.first.analysis.overall} → {chain.last.analysis.overall}</span> <Arrow v={chain.gain} /></div>
              <Link to="/responses/$responseId" params={{ responseId: chain.last.id }} className="btn btn-ghost mt-4 inline-flex">View comparison →</Link>
            </>
          )}
        </section>
      </div>

      {/* 5 & 6. Pattern + next */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="glass p-7">
          <div className="eyebrow mb-4">Your communication pattern</div>
          {rs.length === 0 ? <p className="text-muted-foreground">Not enough data yet.</p> : (
            <dl className="grid grid-cols-2 gap-4 text-[14px]">
              <div><dt className="text-[12px] text-muted-foreground">Primary pattern</dt><dd className="font-mono">{PATTERNS[pat.primary]?.short} → {PATTERNS[pat.primary]?.to}</dd></div>
              <div><dt className="text-[12px] text-muted-foreground">Secondary pattern</dt><dd className="font-mono">{PATTERNS[pat.secondary]?.short} → {PATTERNS[pat.secondary]?.to}</dd></div>
              <div><dt className="text-[12px] text-muted-foreground">Current focus</dt><dd><Link to="/skills" className="hover:text-primary">{next ? cap(next.skill) : cap(pat.focus)}</Link></dd></div>
              <div><dt className="text-[12px] text-muted-foreground">Next practice</dt><dd>{next ? <Link to="/drills/$drillId" params={{ drillId: next.drill_id }} className="text-primary">{next.drill.name} →</Link> : "—"}</dd></div>
            </dl>
          )}
        </section>
        <section className="glass p-7">
          <div className="eyebrow mb-4">What to practice next</div>
          {!next ? <p className="text-muted-foreground">Not enough data yet.</p> : (
            <>
              <div className="font-display text-[20px] font-bold">{next.drill.name}</div>
              <div className="font-mono text-[12px] text-muted-foreground">{cap(next.skill)} · {next.drill.minutes} min</div>
              <p className="mt-3 text-[14px] text-muted-foreground">{next.expected_behavior_change} {next.reason}</p>
              <Link to="/drills/$drillId" params={{ drillId: next.drill_id }} className="btn btn-primary mt-4 inline-flex">Start drill →</Link>
            </>
          )}
        </section>
      </div>

      {/* 7. Activity */}
      <section className="mt-10">
        <div className="eyebrow mb-3">Practice activity</div>
        <div className="grid grid-cols-3 gap-3">
          {[[`${st} day${st === 1 ? "" : "s"}`, "Current streak"], [rs.length, "Responses"], [drills.length, "Drills completed"]].map(([v, l]) => (
            <div key={l as string} className="rounded-2xl border border-border p-4"><div className="font-display text-[20px] font-bold">{v}</div><div className="text-[12px] text-muted-foreground">{l}</div></div>
          ))}
        </div>
      </section>

      {/* 8. Milestones */}
      <section className="mt-8">
        <div className="eyebrow mb-3">Milestones</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((b) => (
            <div key={b.id} className={`flex items-start gap-2 rounded-xl border border-border px-3 py-2 ${earned[b.id] ? "" : "opacity-45"}`}>
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${earned[b.id] ? "bg-primary" : "border border-muted-foreground"}`} />
              <div><div className="text-[13px] font-semibold">{b.name}</div><div className="text-[11px] text-muted-foreground">{b.desc}</div></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
