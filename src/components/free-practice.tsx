import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Keyboard, Mic, Sparkles, X } from "lucide-react";
import { Recorder } from "@/components/recorder";
import { LeadCapture } from "@/components/plan-gate";
import { ShareCard } from "@/components/share-card";
import { analyzeResponse, type Analysis } from "@/lib/analysis";
import { PATTERNS, type Dimension, type Question } from "@/lib/data";
import { FREE_FOCUS } from "@/lib/scenarios";
import { canSubmit, hasLead, recordSubmission, useEntitlement } from "@/lib/entitlements";
import { addResponse, getState, setState, uid, type ResponseRecord } from "@/lib/store";

type Phase = "respond" | "listening" | "contact" | "result";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.35 } };

function Eyebrow({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <div className={`font-mono text-[11px] tracking-[0.14em] ${accent ? "text-accent" : "text-muted-foreground"}`}>{children}</div>;
}

/** Free Practice Trial: one question → respond → contact → diagnosis → retry → continue → share. */
export function FreePractice({ q, level, initial }: { q: Question; level: string; initial: ResponseRecord[] }) {
  const ent = useEntitlement();
  const [attempts, setAttempts] = useState<ResponseRecord[]>(initial);
  const [phase, setPhase] = useState<Phase>(initial.length ? "result" : "respond");
  const [focus, setFocus] = useState<Dimension | null | undefined>(undefined);
  const [kind, setKind] = useState<"voice" | "text">("voice");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  async function submit(transcript: string, duration: number, type: "voice" | "text", audioUrl?: string) {
    if (!canSubmit(getState())) return;
    setError(""); setPhase("listening"); window.scrollTo({ top: 0, behavior: "smooth" });
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

  const last = attempts[attempts.length - 1];
  const prev = attempts.length > 1 ? attempts[attempts.length - 2] : undefined;

  return (
    <div className="paper relative z-10 min-h-screen">
      <header className="mx-auto flex h-16 max-w-[880px] items-center justify-between px-5">
        <Link to="/" className="font-display text-[19px] font-bold tracking-tight">unspoken</Link>
        <div className="flex items-center gap-4">
          {ent.free && <span className="font-mono text-[12px] text-muted-foreground">{ent.remaining} free response{ent.remaining === 1 ? "" : "s"} remaining</span>}
          <Link to="/practice" aria-label="Leave practice" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-6 md:pt-12">
        <AnimatePresence mode="wait">
          {phase === "respond" && (ent.canSubmit ? (
            <motion.div key="respond" {...fade} className="space-y-12">
              {last && <div className="surface flex items-start gap-3 p-4 text-[14px]"><Sparkles className="mt-0.5 size-4 shrink-0 text-accent" /><span><b>This time:</b> {last.analysis.retry_instruction}</span></div>}
              <section>
                <Eyebrow>YOUR QUESTION</Eyebrow>
                <h1 className="mt-4 text-balance font-display text-[clamp(30px,5vw,48px)] font-bold leading-[1.08] tracking-tight">{q.text}</h1>
                <dl className="mt-6 flex gap-8 font-mono text-[12px]">
                  <div><dt className="text-muted-foreground">Difficulty</dt><dd className="mt-1">{q.difficulty}</dd></div>
                  <div><dt className="text-muted-foreground">Time</dt><dd className="mt-1">~{q.seconds} sec</dd></div>
                </dl>
              </section>
              <section>
                <h2 className="font-display text-[18px] font-bold">What do you want to work on?</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {FREE_FOCUS.map((f) => {
                    const on = focus === f.skill;
                    return <button key={f.label} aria-pressed={on} onClick={() => setFocus(on ? undefined : f.skill)} className={`rounded-full border px-4 py-2 text-[14px] transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-input"}`}>{f.label}</button>;
                  })}
                </div>
              </section>
              <section className="surface p-6 md:p-8">
                <div className="mb-6 flex gap-2">
                  <button className="chip flex items-center gap-2" data-active={kind === "voice"} onClick={() => setKind("voice")}><Mic className="size-4" />Speak</button>
                  <button className="chip flex items-center gap-2" data-active={kind === "text"} onClick={() => setKind("text")}><Keyboard className="size-4" />Type instead</button>
                </div>
                {kind === "voice" ? (
                  <Recorder key={attempts.length} max={Math.max(60, q.seconds + 30)} submitLabel="Submit response" onDone={(r) => submit(r.transcript, r.duration, "voice", r.audioUrl)} />
                ) : (
                  <div className="space-y-3">
                    <textarea autoFocus className="field min-h-48 text-[16px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} placeholder="Say it the way you would out loud…" />
                    <div className="flex items-center justify-between gap-3"><span className="font-mono text-[12px] text-muted-foreground">{words} words</span>
                      <button className="btn btn-primary" disabled={words < 5} onClick={() => submit(text, 0, "text")}>Submit response</button></div>
                  </div>
                )}
                {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}
              </section>
            </motion.div>
          ) : <motion.div key="cont" {...fade}><Continue /></motion.div>)}

          {phase === "listening" && (
            <motion.div key="listen" {...fade} className="py-32 text-center" role="status">
              <div className="mx-auto flex h-12 items-end justify-center gap-1.5">{[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="w-1.5 rounded-full bg-accent" animate={{ height: [10, 44, 10] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.12 }} />)}</div>
              <p className="mt-6 font-display text-[20px]">Listening to your response…</p>
            </motion.div>
          )}

          {phase === "contact" && (
            <motion.div key="contact" {...fade} className="mx-auto max-w-[520px]">
              <LeadCapture eyebrow="Your response is ready" title="Before we show you what your response revealed" body="" submit="Show my result" onDone={() => { setPhase("result"); window.scrollTo({ top: 0 }); }} />
            </motion.div>
          )}

          {phase === "result" && last && (
            <motion.div key={`result-${last.id}`} {...fade}>
              <Result a={last.analysis} prev={prev?.analysis} onRetry={() => { setPhase("respond"); window.scrollTo({ top: 0, behavior: "smooth" }); }} canRetry={ent.canSubmit} remaining={ent.remaining} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Result({ a, prev, onRetry, canRetry, remaining }: { a: Analysis; prev?: Analysis; onRetry: () => void; canRetry: boolean; remaining: number }) {
  const [card, setCard] = useState(false);
  const p = PATTERNS[a.primary_pattern] ?? PATTERNS.scatterer;
  const lost = a.main_point_delay > 3 ? `Your main point only arrived after ${a.main_point_delay} seconds.` : (a.what_got_lost.why[0] ?? a.summary);
  const land = a.what_got_lost.makeItLand[0] ?? a.retry_instruction;
  const improve = a.improvements[0] ?? a.retry_instruction;
  const metrics: { label: string; v: number; was?: number }[] = [
    { label: "Structure", v: a.scores.structure, was: prev?.scores.structure },
    { label: "Delivery", v: a.scores.delivery, was: prev?.scores.delivery },
    { label: "Conciseness", v: a.scores.conciseness, was: prev?.scores.conciseness },
    { label: "Impact", v: a.scores.impact, was: prev?.scores.impact },
  ].filter((m) => typeof m.v === "number");
  const Step = ({ i, children }: { i: number; children: React.ReactNode }) => <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12, duration: 0.45 }}>{children}</motion.section>;

  return (
    <div className="space-y-14">
      {prev && (
        <Step i={0}><div className="surface p-5">
          <Eyebrow>COMPARED WITH YOUR LAST RESPONSE</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[14px]">
            <span>Main point <b>{prev.main_point_delay}s → {a.main_point_delay}s</b></span>
            <span>Pattern <b>{PATTERNS[prev.primary_pattern]?.short} → {PATTERNS[a.primary_pattern]?.short}</b></span>
          </div>
        </div></Step>
      )}

      <Step i={1}>
        <Eyebrow accent>YOUR PATTERN</Eyebrow>
        <h1 className="mt-4 text-balance font-display text-[clamp(38px,7vw,64px)] font-bold leading-[1.02] tracking-tight">{p.title}</h1>
        <p className="mt-5 max-w-[34ch] font-display text-[clamp(20px,2.6vw,26px)] italic leading-snug text-muted-foreground">“{p.line}”</p>
        <div className="mt-8 max-w-[60ch]"><Eyebrow>WHAT'S HAPPENING</Eyebrow><p className="mt-2 text-[16px] leading-relaxed">{p.explain}</p></div>
      </Step>

      <Step i={2}>
        <div className="rounded-[22px] bg-primary p-7 text-primary-foreground md:p-10">
          <div className="font-mono text-[11px] tracking-[0.14em] text-accent">WHAT GOT LOST</div>
          <p className="mt-3 text-balance font-display text-[clamp(24px,3.6vw,34px)] font-bold leading-tight">{lost}</p>
        </div>
      </Step>

      <Step i={3}>
        <Eyebrow>WHAT YOUR LISTENER MAY HEAR</Eyebrow>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-dashed border-input p-6"><div className="text-[12px] text-muted-foreground">What you intended</div><p className="mt-2 text-[16px]">{a.what_got_lost.intended}</p></div>
          <blockquote className="surface border-l-4 !border-l-accent p-6"><div className="text-[12px] text-muted-foreground">What may have landed</div><p className="mt-2 font-display text-[19px] italic leading-snug">“{a.what_got_lost.heard}”</p></blockquote>
        </div>
      </Step>

      <Step i={4}>
        <Eyebrow accent>MAKE IT LAND</Eyebrow>
        <p className="mt-3 text-balance font-display text-[clamp(22px,3vw,28px)] font-bold leading-snug">{land}</p>
      </Step>

      <Step i={5}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-border bg-border sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-card p-4">
              <div className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">{m.label.toUpperCase()}</div>
              <div className="mt-1 font-display text-[26px] font-bold">{m.v}{typeof m.was === "number" && <span className="ml-2 text-[13px] font-normal text-muted-foreground">was {m.was}</span>}</div>
            </div>
          ))}
        </div>
      </Step>

      <Step i={6}>
        <div className="surface p-7 md:p-9">
          <Eyebrow>ONE THING TO IMPROVE</Eyebrow>
          <p className="mt-3 font-display text-[22px] font-bold">{improve}</p>
          <p className="mt-2 text-[15px] text-muted-foreground">{a.retry_instruction}</p>
          <div className="mt-8 border-t border-border pt-8">
            {canRetry ? <>
              <h2 className="font-display text-[26px] font-bold">Same question. New response.</h2>
              <p className="mt-1 text-[15px] text-muted-foreground">Now try it again with one thing changed.</p>
              <button className="btn btn-primary mt-5 px-6 py-3 text-[15px]" onClick={onRetry}>Try Again <ArrowRight className="size-4" /></button>
              <p className="mt-3 text-[13px] text-muted-foreground">Your next response will be compared with this one. · {remaining} free response{remaining === 1 ? "" : "s"} remaining</p>
            </> : <p className="text-[15px] text-muted-foreground">You've used your free responses.</p>}
          </div>
        </div>
      </Step>

      <Step i={7}><Continue /></Step>

      <Step i={8}>
        <div className="text-center">
          <h2 className="font-display text-[26px] font-bold">Your pattern, captured.</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">Turn your result into a card you can save or share.</p>
          {!card ? <button className="btn btn-ghost mt-5" onClick={() => setCard(true)}>Create my card</button>
            : <div className="mt-6"><ShareCard data={{ title: p.title, line: p.line, lost, focus: a.retry_instruction }} /></div>}
        </div>
      </Step>
    </div>
  );
}

function Continue() {
  return (
    <div className="rounded-[22px] border border-border bg-secondary p-7 md:p-10">
      <h2 className="font-display text-[clamp(24px,3.4vw,32px)] font-bold">Keep practising the pattern</h2>
      <p className="mt-2 font-display text-[18px] italic text-muted-foreground">One response shows you the pattern. Repetition changes it.</p>
      <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed">Continue with unlimited practice, deeper analysis, targeted drills, response comparisons, and progress over time.</p>
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <Link to="/plans" className="btn btn-primary px-6 py-3">Continue with Practice Pass</Link>
        <Link to="/plans" className="text-[14px] text-muted-foreground hover:text-foreground">Explore Sprint →</Link>
      </div>
    </div>
  );
}
