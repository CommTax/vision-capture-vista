import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Keyboard, Mic } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AnalysisView, ComparePanel } from "@/components/analysis-view";
import { Recorder } from "@/components/recorder";
import { AICoach } from "@/components/ai-coach";
import { analyzeResponse, type Analysis } from "@/lib/analysis";
import { QUESTIONS, modeName, type Question } from "@/lib/data";
import { addResponse, getState, uid, useStore, type ResponseRecord } from "@/lib/store";

export const Route = createFileRoute("/practice/$questionId")({
  validateSearch: z.object({ s: z.string().optional(), retry: z.string().optional() }),
  head: () => ({ meta: [{ title: "Practice session — Cadence" }, { name: "description", content: "Respond out loud or in writing, then see what got lost." }, { property: "og:title", content: "Practice session — Cadence" }, { property: "og:description", content: "A distraction-free response practice session." }] }),
  component: SessionRoute,
});

function SessionRoute() {
  const { questionId } = Route.useParams();
  const { s, retry } = Route.useSearch();
  // Remount on question / retry change so session state never leaks between questions.
  return <AppShell><Session key={`${questionId}|${s ?? ""}|${retry ?? ""}`} questionId={questionId} situation={s} retry={retry} /></AppShell>;
}

function loadChain(id?: string): ResponseRecord[] {
  if (!id) return [];
  const all = getState().responses;
  const r = all.find((x) => x.id === id);
  if (!r) return [];
  const root = r.parent_id ?? r.id;
  return all.filter((x) => x.id === root || x.parent_id === root).sort((a, b) => a.attempt - b.attempt);
}

function Session({ questionId, situation, retry }: { questionId: string; situation?: string; retry?: string }) {
  const navigate = useNavigate();
  const level = useStore((st) => st.profile?.level ?? "Mid career");
  const q: Question = useMemo(() => {
    if (questionId === "custom") return { id: "custom", mode: "custom", text: `${situation ?? "Your scenario"} — what would you say?`, context: "Custom scenario", difficulty: "Medium", seconds: 90 };
    return QUESTIONS.find((x) => x.id === questionId) ?? QUESTIONS[0];
  }, [questionId, situation]);

  const [attempts, setAttempts] = useState<ResponseRecord[]>(() => loadChain(retry));
  const [phase, setPhase] = useState<"respond" | "analyzing" | "result">("respond");
  const [view, setView] = useState(0); // index of attempt being viewed
  const [compareWith, setCompareWith] = useState(0);
  const [kind, setKind] = useState<"voice" | "text">("text");
  const [text, setText] = useState("");
  const [showTimer, setShowTimer] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  const last = attempts[attempts.length - 1];
  const stored = useStore((st) => st.responses);
  const viewedBase = attempts[view] ?? last;
  const viewed = viewedBase ? stored.find((x) => x.id === viewedBase.id) ?? viewedBase : undefined;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const over = q.seconds && elapsed > q.seconds;

  useEffect(() => {
    if (!startedAt || phase !== "respond") return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(t);
  }, [startedAt, phase]);

  useEffect(() => { if (phase === "respond" && kind === "text") textRef.current?.focus(); }, [phase, kind]);

  async function analyze(transcript: string, duration: number, type: "voice" | "text", audioUrl?: string) {
    setError("");
    setPhase("analyzing");
    try {
      const a: Analysis = await analyzeResponse({ question: q.text, transcript, mode: q.mode, level, durationSec: duration || undefined, responseType: type });
      const rec: ResponseRecord = { id: uid(), question_id: q.id, question: q.text, mode: q.mode, response_type: type, transcript, audio_url: audioUrl, duration: a.duration, created_at: new Date().toISOString(), attempt: attempts.length + 1, parent_id: attempts[0]?.id, analysis: a };
      addResponse(rec);
      const next = [...attempts, rec];
      setAttempts(next);
      setView(next.length - 1);
      setCompareWith(Math.max(0, next.length - 2));
      setText(""); setStartedAt(null); setElapsed(0);
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("We couldn't analyze that response. Please try again.");
      setPhase("respond");
    }
  }

  const retryNow = (prefill: boolean) => {
    setText(prefill && last ? last.transcript : "");
    setStartedAt(null); setElapsed(0);
    setPhase("respond");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const another = () => {
    if (q.mode === "custom") { navigate({ to: "/practice" }); return; }
    const pool = QUESTIONS.filter((x) => x.mode === q.mode && x.id !== q.id);
    const n = pool[Math.floor(Math.random() * pool.length)] ?? QUESTIONS[0];
    navigate({ to: "/practice/$questionId", params: { questionId: n.id }, search: {} });
  };

  const mmss = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
        <Link to="/practice" className="hover:text-foreground">← Practice</Link>
        <span className="text-primary">{modeName(q.mode).toUpperCase()}</span><span>{q.context}</span><span>{q.difficulty}</span><span>~{q.seconds}s recommended</span>
        <span>Attempt {attempts.length + (phase === "result" ? 0 : 1)}</span>
      </div>

      {phase !== "result" && (
        <div className="glass glass-float rise p-6 md:p-10">
          <div className="eyebrow mb-3">Question</div>
          <h1 className="text-balance text-[clamp(26px,4vw,40px)] font-bold leading-tight">{q.text}</h1>
          {last && phase === "respond" && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-[14px]">
              <span><span className="eyebrow mr-2 !text-primary">Focus for attempt {attempts.length + 1}</span>{last.analysis.retry_instruction}</span>
              <button className="text-[12px] text-muted-foreground underline hover:text-foreground" onClick={() => { setView(attempts.length - 1); setPhase("result"); }}>Back to analysis</button>
            </div>
          )}
          <p className="mt-6 text-[15px] text-muted-foreground">What would you say?</p>

          {phase === "analyzing" ? (
            <div className="py-16 text-center" role="status"><div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /><div className="text-muted-foreground">Reading the shape of your response…</div></div>
          ) : (
            <>
              <div className="mt-6 flex gap-2">
                <button className="chip flex items-center gap-2" data-active={kind === "voice"} onClick={() => setKind("voice")}><Mic className="size-4" />Record voice</button>
                <button className="chip flex items-center gap-2" data-active={kind === "text"} onClick={() => setKind("text")}><Keyboard className="size-4" />Type response</button>
              </div>
              <div className="mt-6">
                {kind === "voice" ? (
                  <Recorder key={attempts.length} max={Math.max(60, q.seconds + 30)} onDone={(r) => analyze(r.transcript, r.duration, "voice", r.audioUrl)} />
                ) : (
                  <div className="space-y-3">
                    <textarea ref={textRef} className="field min-h-56 text-[16px] leading-relaxed" value={text} placeholder="Start with your main point…"
                      onChange={(e) => { if (!startedAt && e.target.value) setStartedAt(Date.now()); setText(e.target.value); }}
                      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && words >= 5) analyze(text, 0, "text"); }} />
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground">
                      <span className="font-mono">{words} words · {text.length} chars{showTimer ? <> · <span className={over ? "text-destructive" : ""}>{mmss(elapsed)} / {mmss(q.seconds)}</span></> : null}</span>
                      <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={showTimer} onChange={(e) => setShowTimer(e.target.checked)} />Response timer</label>
                    </div>
                    {words > 0 && words < 5 && <p className="text-[12px] text-muted-foreground">Write at least 5 words to analyze.</p>}
                    {error && <p className="text-[13px] text-destructive">{error}</p>}
                    <div className="flex flex-wrap gap-3">
                      <button className="btn btn-primary" disabled={words < 5} onClick={() => analyze(text, 0, "text")}>Analyze My Response</button>
                      <button className="btn btn-ghost" onClick={another}>Try Another Question</button>
                      {last && <button className="btn btn-ghost" onClick={() => setText(last.transcript)}>Start from my last answer</button>}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {phase === "result" && viewed && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><div className="eyebrow mb-1">Attempt {view + 1} · analysis</div><h1 className="text-[24px] font-bold">{q.text}</h1></div>
            <div className="flex flex-wrap gap-3"><button className="btn btn-primary" onClick={() => retryNow(false)}>Try Again</button><button className="btn btn-ghost" onClick={another}>Another question</button></div>
          </div>

          {attempts.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-1">View</span>
              {attempts.map((a, i) => <button key={a.id} className="chip" data-active={view === i} onClick={() => { setView(i); if (compareWith >= i) setCompareWith(Math.max(0, i - 1)); }}>Attempt {i + 1} · {a.analysis.overall}</button>)}
            </div>
          )}

          {attempts.length > 1 && view > 0 && (
            <>
              {view > 1 && (
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                  Compare attempt {view + 1} with
                  {attempts.slice(0, view).map((a, i) => <button key={a.id} className="chip" data-active={compareWith === i} onClick={() => setCompareWith(i)}>Attempt {i + 1}</button>)}
                </div>
              )}
              <ComparePanel a1={attempts[compareWith].analysis} a2={viewed.analysis} n1={compareWith + 1} n2={view + 1} />
            </>
          )}

          <AICoach r={viewed} level={level} />
          <AnalysisView a={viewed.analysis} transcript={viewed.transcript} onRetry={() => retryNow(false)} />
          {viewed.audio_url && <audio controls src={viewed.audio_url} className="w-full" />}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button className="btn btn-primary" onClick={() => retryNow(false)}>Try Again</button>
            <button className="btn btn-ghost" onClick={() => retryNow(true)}>Edit my answer</button>
            <Link to="/responses/$responseId" params={{ responseId: viewed.id }} className="btn btn-ghost">Saved to My Responses</Link>
          </div>
        </div>
      )}
    </div>
  );
}
