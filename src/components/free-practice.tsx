import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Keyboard, Mic, X } from "lucide-react";
import { Recorder } from "@/components/recorder";
import { LeadCapture } from "@/components/plan-gate";
import { ShareCard } from "@/components/share-card";
import { analyzeResponse, type Analysis } from "@/lib/analysis";
import { PATTERNS, type Dimension, type Question } from "@/lib/data";
import { FREE_FOCUS } from "@/lib/scenarios";
import { canSubmit, hasLead, recordSubmission, useEntitlement } from "@/lib/entitlements";
import { addResponse, getState, setState, uid, type ResponseRecord } from "@/lib/store";

/* Free Practice Trial experience: start → respond → (contact) → pattern → what got lost → new shape → retry → compare → keep practising. */

type Phase = "start" | "respond" | "listening" | "contact" | "result";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] as const } };
const LABEL: Partial<Record<Dimension, string>> = { structure: "Structure", delivery: "Delivery", conciseness: "Conciseness", impact: "Impact", clarity: "Clarity" };
const SHOWN: Dimension[] = ["structure", "delivery", "conciseness", "impact"];

function Eyebrow({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" }) {
  return <div className={`font-mono text-[11px] tracking-[0.16em] ${tone === "accent" ? "text-accent" : "text-muted-foreground"}`}>{children}</div>;
}

/** Lowest available score = biggest opportunity (read from the analysis, never computed). */
function opportunity(a: Analysis) {
  const avail = SHOWN.filter((d) => typeof a.scores[d] === "number");
  const sorted = [...avail].sort((x, y) => a.scores[x] - a.scores[y]);
  return { main: sorted[0] ?? "structure", rest: sorted.slice(1, 3), best: sorted[sorted.length - 1] };
}

export function FreePracticeExperience({ q, level, initial }: { q: Question; level: string; initial: ResponseRecord[] }) {
  const ent = useEntitlement();
  const [attempts, setAttempts] = useState<ResponseRecord[]>(initial);
  const [phase, setPhase] = useState<Phase>(initial.length ? "result" : "start");
  const [focus, setFocus] = useState<Dimension | null | undefined>(undefined);
  const [kind, setKind] = useState<"voice" | "text">("voice");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const last = attempts[attempts.length - 1];
  const prev = attempts.length > 1 ? attempts[attempts.length - 2] : undefined;
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });

  async function submit(transcript: string, duration: number, type: "voice" | "text", audioUrl?: string) {
    if (!canSubmit(getState())) return;
    setError(""); setPhase("listening"); top();
    const started = Date.now();
    try {
      const a: Analysis = await analyzeResponse({ question: q.text, transcript, mode: q.mode, level, durationSec: duration || undefined, responseType: type });
      const rec: ResponseRecord = { id: uid(), question_id: q.id, question: q.text, mode: q.mode, response_type: type, transcript, audio_url: audioUrl, duration: a.duration, created_at: new Date().toISOString(), attempt: attempts.length + 1, parent_id: attempts[0]?.id, analysis: a };
      addResponse(rec);
      recordSubmission(); // only a successfully analysed submission consumes a free attempt
      setState((s) => ({ ...s, freeResponseIds: [...(s.freeResponseIds ?? []), rec.id] }));
      setAttempts((xs) => [...xs, rec]); setText("");
      await new Promise((r) => setTimeout(r, Math.max(0, 1600 - (Date.now() - started))));
      setPhase(hasLead() ? "result" : "contact");
    } catch {
      setError("We couldn't read that response. Please try again."); setPhase("respond");
    }
  }

  function retry() {
    if (last) setFocus(opportunity(last.analysis).main);
    setPhase("start"); top();
  }

  return (
    <div className="paper relative z-10 min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[880px] items-center justify-between gap-4 px-5">
          <Link to="/" className="font-mono text-[13px] font-semibold tracking-[0.22em]">UNSPOKEN</Link>
          <nav className="hidden items-center gap-6 text-[14px] sm:flex">
            <button onClick={() => { if (phase === "result") retry(); }} className={phase !== "result" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}>Practice</button>
            <button disabled={!last} onClick={() => { if (last && phase !== "result") setPhase("result"); top(); }} className={phase === "result" ? "text-foreground" : "text-muted-foreground disabled:opacity-40"}>Your Pattern</button>
          </nav>
          <div className="flex items-center gap-3">
            {ent.free && <span className="font-mono text-[12px] text-muted-foreground">Trial · {ent.remaining} left</span>}
            <Link to="/practice" aria-label="Leave practice" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-5 pb-28 pt-10 md:pt-16">
        <AnimatePresence mode="wait">
          {phase === "start" && (ent.canSubmit ? (
            <motion.div key="start" {...fade}>
              <FreePracticeStart q={q} focus={focus} setFocus={setFocus} retryOf={last} onStart={() => { setPhase("respond"); top(); }} />
            </motion.div>
          ) : <motion.div key="done" {...fade}><FreePracticeConversion a={last?.analysis} final /></motion.div>)}

          {phase === "respond" && (
            <motion.div key="respond" {...fade}>
              <FreePracticeRespond q={q} kind={kind} setKind={setKind} text={text} setText={setText} error={error} attemptKey={attempts.length} onBack={() => setPhase("start")} onSubmit={submit} />
            </motion.div>
          )}

          {phase === "listening" && (
            <motion.div key="listen" {...fade} className="py-32 text-center" role="status">
              <div className="mx-auto flex h-12 items-end justify-center gap-1.5">{[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="w-1.5 rounded-full bg-accent" animate={{ height: [10, 44, 10] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.12 }} />)}</div>
              <p className="mt-6 font-display text-[22px]">Listening to what got through…</p>
            </motion.div>
          )}

          {phase === "contact" && (
            <motion.div key="contact" {...fade} className="mx-auto max-w-[480px]">
              <LeadCapture eyebrow="Your response is in" title="One moment. Let's show you what got through." body="We'll use your response to show the communication pattern behind it." submit="Show my pattern" onDone={() => { setPhase("result"); window.scrollTo({ top: 0 }); }} />
            </motion.div>
          )}

          {phase === "result" && last && (
            <motion.div key={`result-${last.id}`} {...fade}>
              <FreePracticeResult a={last.analysis} prev={prev?.analysis} onRetry={retry} canRetry={ent.canSubmit} remaining={ent.remaining} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
/** Kept for existing imports. */
export const FreePractice = FreePracticeExperience;

function FreePracticeStart({ q, focus, setFocus, retryOf, onStart }: { q: Question; focus: Dimension | null | undefined; setFocus: (f: Dimension | null | undefined) => void; retryOf?: ResponseRecord; onStart: () => void }) {
  return (
    <div className="space-y-12">
      {retryOf ? (
        <div className="rounded-2xl bg-accent-soft p-6">
          <Eyebrow tone="accent">TRY THE SAME QUESTION AGAIN</Eyebrow>
          <p className="mt-3 text-[14px] text-muted-foreground">This time, focus on</p>
          <div className="font-display text-[28px] font-bold tracking-tight">{(focus && LABEL[focus]) ?? "Structure"}</div>
          <p className="mt-2 text-[16px] leading-relaxed">“{retryOf.analysis.retry_instruction}”</p>
        </div>
      ) : null}
      <section>
        {!retryOf && <Eyebrow tone="accent">PRACTICE A REAL MOMENT</Eyebrow>}
        <h1 className="mt-3 text-balance font-display text-[clamp(30px,5.4vw,52px)] font-bold leading-[1.06] tracking-tight">“{q.text}”</h1>
        <p className="mt-5 font-mono text-[13px] text-muted-foreground">{q.difficulty} · ~{q.seconds} sec</p>
      </section>
      <section>
        <h2 className="font-display text-[18px] font-bold">What do you want to work on?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {FREE_FOCUS.map((f) => {
            const on = focus === f.skill && focus !== undefined;
            return <button key={f.label} aria-pressed={on} data-active={on} onClick={() => setFocus(on ? undefined : f.skill)} className="chip !px-4 !py-2 !text-[14px]">{f.label}</button>;
          })}
        </div>
      </section>
      <div className="sticky bottom-4 sm:static">
        <button className="btn btn-accent w-full px-7 py-3.5 text-[15px] shadow-lg sm:w-auto sm:shadow-none" onClick={onStart}>Start responding <ArrowRight className="size-4" /></button>
      </div>
    </div>
  );
}

function FreePracticeRespond({ q, kind, setKind, text, setText, error, attemptKey, onBack, onSubmit }: { q: Question; kind: "voice" | "text"; setKind: (k: "voice" | "text") => void; text: string; setText: (s: string) => void; error: string; attemptKey: number; onBack: () => void; onSubmit: (t: string, d: number, type: "voice" | "text", url?: string) => void }) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-8">
      <button onClick={onBack} className="text-[13px] text-muted-foreground hover:text-foreground">← Back</button>
      <p className="text-balance font-display text-[clamp(20px,3vw,26px)] font-bold leading-snug">“{q.text}”</p>
      <section className="surface p-6 md:p-10">
        <div className="text-center">
          <p className="font-display text-[22px] font-bold">Take your time.</p>
          <p className="text-[15px] text-muted-foreground">Say it naturally.</p>
        </div>
        <div className="mx-auto my-6 flex w-fit gap-1 rounded-full border border-border p-1">
          <button className="chip !border-0 flex items-center gap-2" data-active={kind === "voice"} onClick={() => setKind("voice")}><Mic className="size-4" />Speak</button>
          <button className="chip !border-0 flex items-center gap-2" data-active={kind === "text"} onClick={() => setKind("text")}><Keyboard className="size-4" />Type</button>
        </div>
        {kind === "voice" ? (
          <Recorder key={attemptKey} max={Math.max(60, q.seconds)} stopLabel="Finish response" submitLabel="Submit response" onDone={(r) => onSubmit(r.transcript, r.duration, "voice", r.audioUrl)} />
        ) : (
          <div className="space-y-3">
            <textarea autoFocus className="field min-h-52 text-[16px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write it the way you would say it out loud…" />
            <div className="flex items-center justify-between gap-3"><span className="font-mono text-[12px] text-muted-foreground">{words} words</span>
              <button className="btn btn-accent" disabled={words < 5} onClick={() => onSubmit(text, 0, "text")}>Submit response</button></div>
          </div>
        )}
        {error && <p className="mt-4 text-center text-[13px] text-destructive">{error}</p>}
      </section>
    </div>
  );
}

function Step({ i, children }: { i: number; children: React.ReactNode }) {
  return <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.14, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>{children}</motion.section>;
}

function FreePracticeResult({ a, prev, onRetry, canRetry, remaining }: { a: Analysis; prev?: Analysis; onRetry: () => void; canRetry: boolean; remaining: number }) {
  const p = PATTERNS[a.primary_pattern] ?? PATTERNS.scatterer;
  const lost = a.main_point_delay > 3 ? `Your main point only arrived after ${a.main_point_delay} seconds.` : (a.what_got_lost.why[0] ?? a.summary);
  const land = a.what_got_lost.makeItLand[0] ?? a.retry_instruction;
  const opp = opportunity(a);
  const shape = a.example_structure || a.retry_instruction;
  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div className="space-y-20">
      {prev && <Step i={0}><FreePracticeCompare a={a} prev={prev} /></Step>}

      <Step i={1}>
        <div className="flex items-center justify-between"><Eyebrow tone="accent">YOUR COMMUNICATION PATTERN</Eyebrow><span className="font-mono text-[11px] text-muted-foreground">{date}</span></div>
        <h1 className="mt-5 text-balance font-display text-[clamp(44px,9vw,84px)] font-bold uppercase leading-[0.95] tracking-tight">{p.title}</h1>
        <p className="mt-6 max-w-[30ch] text-balance font-display text-[clamp(20px,2.8vw,28px)] italic leading-snug text-muted-foreground">“{p.line}”</p>
        <p className="mt-8 max-w-[58ch] text-[16px] leading-relaxed">{p.explain}</p>
      </Step>

      <Step i={2}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="bg-coral-soft p-7 md:p-10">
            <Eyebrow>WHAT GOT LOST</Eyebrow>
            <p className="mt-3 text-balance font-display text-[clamp(24px,3.8vw,36px)] font-bold leading-tight">{lost}</p>
          </div>
          <div className="grid border-t border-border md:grid-cols-2">
            <div className="p-7 md:border-r md:border-border"><Eyebrow>WHAT YOU INTENDED</Eyebrow><p className="mt-2 text-[16px] leading-relaxed">{a.what_got_lost.intended}</p></div>
            <div className="border-t border-border p-7 md:border-t-0"><Eyebrow>WHAT YOUR LISTENER MAY HEAR</Eyebrow><p className="mt-2 font-display text-[19px] italic leading-snug">“{a.what_got_lost.heard.replace(/^[“"]+|[”"]+$/g, "")}”</p></div>
          </div>
          <div className="border-t border-border bg-accent-soft p-7 md:p-10">
            <Eyebrow tone="accent">MAKE IT LAND</Eyebrow>
            <p className="mt-3 text-balance font-display text-[clamp(22px,3vw,28px)] font-bold leading-snug">{land}</p>
          </div>
        </div>
      </Step>

      <Step i={3}>
        <Eyebrow>YOUR BIGGEST OPPORTUNITY</Eyebrow>
        <div className="mt-4 flex items-end gap-5">
          <div className="font-display text-[clamp(36px,6vw,56px)] font-bold uppercase leading-none tracking-tight">{LABEL[opp.main]}</div>
          <div className="font-mono text-[28px] text-accent">{a.scores[opp.main]}</div>
        </div>
        {opp.best && opp.best !== opp.main && <p className="mt-4 max-w-[52ch] text-[16px] text-muted-foreground">Your {LABEL[opp.best]?.toLowerCase()} is working. The bigger opportunity is your {LABEL[opp.main]?.toLowerCase()}.</p>}
        <div className="mt-6 flex gap-8 font-mono text-[13px]">
          {opp.rest.map((d) => <div key={d}><span className="text-muted-foreground">{LABEL[d]}</span> <b className="ml-1">{a.scores[d]}</b></div>)}
        </div>
      </Step>

      <Step i={4}>
        <div className="rounded-2xl bg-primary p-8 text-primary-foreground md:p-12">
          <h2 className="font-display text-[clamp(34px,6vw,56px)] font-bold uppercase leading-[0.95] tracking-tight">Same question.<br />New shape.</h2>
          <p className="mt-6 max-w-[44ch] whitespace-pre-line text-[17px] leading-relaxed opacity-90">{shape}</p>
          <p className="mt-2 font-mono text-[11px] tracking-[0.14em] opacity-60">EXAMPLE STRUCTURE</p>
          {canRetry ? <>
            <button className="btn btn-accent mt-8 px-7 py-3.5 text-[15px]" onClick={onRetry}>Try again <ArrowRight className="size-4" /></button>
            <p className="mt-3 text-[13px] opacity-70">Your next response will be compared with this one. · {remaining} free practice{remaining === 1 ? "" : "s"} remaining</p>
          </> : <p className="mt-8 text-[15px] opacity-80">You've built the insight. Keep the practice going.</p>}
        </div>
      </Step>

      <Step i={5}><FreePracticeConversion a={a} final={!canRetry} /></Step>

      <Step i={6}><Reflection /></Step>

      <Step i={7}><ShareSection a={a} lost={lost} focus={LABEL[opp.main] ?? "Structure"} /></Step>
    </div>
  );
}

function FreePracticeCompare({ a, prev }: { a: Analysis; prev: Analysis }) {
  const rows = [
    { k: "Structure", b: String(prev.scores.structure), n: String(a.scores.structure) },
    { k: "Main point", b: `${prev.main_point_delay}s`, n: `${a.main_point_delay}s` },
    { k: "Pattern", b: PATTERNS[prev.primary_pattern]?.short ?? "—", n: PATTERNS[a.primary_pattern]?.short ?? "—" },
  ];
  const changed = a.strengths[0] ?? a.summary;
  return (
    <div className="rounded-2xl border border-border bg-green-soft p-7 md:p-10">
      <h2 className="font-display text-[clamp(28px,5vw,44px)] font-bold uppercase leading-[0.95] tracking-tight">Same question.<br />Different response.</h2>
      <div className="mt-8 divide-y divide-border">
        {rows.map((r) => <div key={r.k} className="flex flex-wrap items-baseline justify-between gap-2 py-3"><span className="font-mono text-[12px] tracking-[0.12em] text-muted-foreground">{r.k.toUpperCase()}</span><span className="font-display text-[20px] font-bold">{r.b} <span className="text-muted-foreground">→</span> {r.n}</span></div>)}
      </div>
      <div className="mt-6"><Eyebrow>WHAT CHANGED</Eyebrow><p className="mt-2 text-[16px] leading-relaxed">{changed}</p></div>
    </div>
  );
}

function FreePracticeConversion({ a, final }: { a?: Analysis; final?: boolean }) {
  const p = a ? PATTERNS[a.primary_pattern] : undefined;
  const skill = a ? LABEL[opportunity(a).main] : undefined;
  const benefits = [
    ["KEEP PRACTISING", "Repeat real moments until the old pattern becomes easier to break."],
    ["SEE WHAT CHANGES", "Track your responses and see whether the pattern is actually shifting."],
    ["PRACTICE WHAT MATTERS", "Work on structure, clarity, impact, delivery and the situations you face."],
  ];
  return (
    <div className="border-t border-border pt-16">
      <h2 className="font-display text-[clamp(32px,5.6vw,52px)] font-bold uppercase leading-[0.95] tracking-tight">{final ? <>You've built the insight.<br />Keep the practice going.</> : <>You've seen the pattern.<br />Now change it.</>}</h2>
      <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">One response can reveal the pattern. Real change comes from practising it again and again.</p>
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {benefits.map(([t, d]) => <div key={t} className="bg-card p-6"><div className="font-mono text-[11px] tracking-[0.14em] text-accent">{t}</div><p className="mt-2 text-[15px] leading-relaxed">{d}</p></div>)}
      </div>
      <div className="mt-10 rounded-2xl border border-border bg-card p-7">
        {p && <><p className="text-[14px] text-muted-foreground">You found your pattern:</p><p className="font-display text-[22px] font-bold">“{p.title}”</p></>}
        <p className="mt-4 font-display text-[18px]">Ready to work on it?</p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <Link to="/plans" className="btn btn-accent px-7 py-3.5 text-[15px]">Keep practising <ArrowRight className="size-4" /></Link>
          <Link to="/plans" className="text-[14px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Explore Practice Pass</Link>
        </div>
        {skill && <p className="mt-4 text-[13px] text-muted-foreground">Build on this response with targeted practice for {skill}.</p>}
      </div>
    </div>
  );
}

const REFLECT_KEY = "unspoken-free-reflection";
function Reflection() {
  const [v, setV] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setV(localStorage.getItem(REFLECT_KEY) ?? ""); }, []);
  return (
    <div className="max-w-[520px]">
      <Eyebrow>ONE LINE FOR YOURSELF</Eyebrow>
      <div className="mt-3 flex gap-2">
        <input className="field" value={v} onChange={(e) => { setV(e.target.value); setSaved(false); }} placeholder="I will…" />
        <button className="btn btn-ghost shrink-0" disabled={!v.trim()} onClick={() => { localStorage.setItem(REFLECT_KEY, v.trim()); setSaved(true); }}>{saved ? "Saved" : "Save"}</button>
      </div>
    </div>
  );
}

function ShareSection({ a, lost, focus }: { a: Analysis; lost: string; focus: string }) {
  const [card, setCard] = useState(false);
  const p = PATTERNS[a.primary_pattern] ?? PATTERNS.scatterer;
  return (
    <div className="border-t border-border pt-10 text-center">
      <p className="text-[15px] text-muted-foreground">Share your pattern — a square card for LinkedIn, Instagram or WhatsApp.</p>
      {!card ? <button className="btn btn-ghost btn-sm mt-4" onClick={() => setCard(true)}>Create my card</button>
        : <div className="mt-6"><ShareCard data={{ title: p.title, line: p.line, lost, focus }} /></div>}
    </div>
  );
}
