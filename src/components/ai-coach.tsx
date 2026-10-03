import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCoaching } from "@/lib/coach.functions";
import { DIMENSIONS } from "@/lib/data";
import { setState, type ResponseRecord } from "@/lib/store";

export function AICoach({ r, level }: { r: ResponseRecord; level: string }) {
  const run = useServerFn(getCoaching);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const c = r.coaching;

  async function ask() {
    setBusy(true); setError("");
    const a = r.analysis;
    try {
      const res = await run({ data: {
        question: r.question, transcript: r.transcript, mode: r.mode, level, responseType: r.response_type,
        metrics: { duration: a.duration, wordCount: a.word_count, wpm: a.wpm, mainPointDelay: a.main_point_delay, fillers: a.filler_words.map((f) => `${f.word}×${f.count}`).join(", "), scores: DIMENSIONS.map((d) => `${d} ${a.scores[d]}`).join(", ") },
      } });
      if (res.ok) setState((s) => ({ ...s, responses: s.responses.map((x) => (x.id === r.id ? { ...x, coaching: res.coaching } : x)) }));
      else setError(res.error);
    } catch { setError("Couldn't reach the coach. Check your connection and try again."); }
    setBusy(false);
  }

  if (!c) return (
    <section className="glass glass-float flex flex-wrap items-center justify-between gap-4 border-primary/40 p-6">
      <div className="max-w-lg">
        <div className="eyebrow mb-1 !text-primary">AI interview coach</div>
        <div className="font-display text-[20px] font-bold">Get personal coaching on this {r.response_type === "voice" ? "recording" : "answer"}</div>
        <p className="text-[13px] text-muted-foreground">The coach reads exactly what you said and tells you how an interviewer would hear it.</p>
        {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
      </div>
      <button className="btn btn-primary" disabled={busy} onClick={ask}>{busy ? "Coaching…" : error ? "Try again" : "Get AI coaching"}</button>
    </section>
  );

  return (
    <section className="glass glass-float rise space-y-6 border-primary/40 p-6 md:p-8">
      <div><div className="eyebrow mb-2 !text-primary">AI interview coach</div><h2 className="text-[clamp(22px,3vw,30px)] font-bold">{c.headline}</h2><p className="mt-2 text-[15px] text-muted-foreground">{c.first_impression}</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div><div className="eyebrow mb-2">What worked</div>{c.what_worked.map((w) => <div key={w} className="flex gap-2 py-1 text-[14px]"><span className="text-success">+</span>{w}</div>)}</div>
        <div><div className="eyebrow mb-2">Delivery</div><p className="text-[14px]">{c.delivery_notes}</p></div>
      </div>
      <div><div className="eyebrow mb-3">What to fix</div><div className="space-y-3">{c.what_to_fix.map((f) => (
        <div key={f.issue} className="rounded-2xl border border-border p-4 text-[14px]"><div className="font-medium">{f.issue}</div>{f.quote && <div className="mt-1 font-mono text-[12px] text-muted-foreground">“{f.quote}”</div>}<div className="mt-2"><span className="text-primary">Fix: </span>{f.fix}</div></div>
      ))}</div></div>
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4"><div className="eyebrow mb-1 !text-primary">A stronger opening — in your words</div><p className="text-[15px]">{c.stronger_opening}</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div><div className="eyebrow mb-2">Likely follow-up question</div><p className="font-display text-[17px] font-bold">“{c.interviewer_follow_up}”</p></div>
        <div><div className="eyebrow mb-2">Your next reps</div><ol className="space-y-1 text-[14px]">{c.practice_plan.map((p, i) => <li key={p} className="flex gap-2"><span className="font-mono text-primary">{i + 1}</span>{p}</li>)}</ol></div>
      </div>
      <button className="text-[12px] text-muted-foreground underline" disabled={busy} onClick={ask}>{busy ? "Regenerating…" : "Regenerate coaching"}</button>
      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </section>
  );
}
