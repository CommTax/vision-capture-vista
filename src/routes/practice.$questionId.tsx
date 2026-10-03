import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Keyboard, Mic } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AnalysisView, ComparePanel } from "@/components/analysis-view";
import { Recorder } from "@/components/recorder";
import { analyzeResponse, type Analysis } from "@/lib/analysis";
import { QUESTIONS, modeName, type Question } from "@/lib/data";
import { addResponse, getState, uid, useStore, type ResponseRecord } from "@/lib/store";

export const Route = createFileRoute("/practice/$questionId")({
  validateSearch: z.object({ s: z.string().optional(), retry: z.string().optional() }),
  head: () => ({ meta: [{ title: "Practice session — Cadence" }, { name: "description", content: "Respond out loud or in writing, then see what got lost." }, { property: "og:title", content: "Practice session — Cadence" }, { property: "og:description", content: "A distraction-free response practice session." }] }),
  component: () => <AppShell><Session /></AppShell>,
});

function Session() {
  const { questionId } = Route.useParams();
  const { s, retry } = Route.useSearch();
  const navigate = useNavigate();
  const level = useStore((st) => st.profile?.level ?? "Mid career");
  const q: Question = useMemo(() => {
    if (questionId === "custom") return { id: "custom", mode: "custom", text: `Situation: ${s ?? "Your scenario"}. What would you say?`, context: "Custom scenario", difficulty: "Medium", seconds: 90 };
    return QUESTIONS.find((x) => x.id === questionId) ?? QUESTIONS[0];
  }, [questionId, s]);

  const [attempts, setAttempts] = useState<ResponseRecord[]>(() => {
    const prev = retry ? getState().responses.find((r) => r.id === retry) : undefined;
    return prev ? [prev] : [];
  });
  const [phase, setPhase] = useState<"respond" | "analyzing" | "result">(retry ? "respond" : "respond");
  const [kind, setKind] = useState<"voice" | "text">("text");
  const [text, setText] = useState("");
  const [timer, setTimer] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const last = attempts[attempts.length - 1];
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  async function analyze(transcript: string, duration: number, type: "voice" | "text", audioUrl?: string) {
    setPhase("analyzing");
    const a: Analysis = await analyzeResponse({ question: q.text, transcript, mode: q.mode, level, durationSec: duration || undefined, responseType: type });
    const rec: ResponseRecord = { id: uid(), question_id: q.id, question: q.text, mode: q.mode, response_type: type, transcript, audio_url: audioUrl, duration: a.duration, created_at: new Date().toISOString(), attempt: attempts.length + 1, parent_id: attempts[0]?.id, analysis: a };
    addResponse(rec);
    setAttempts((x) => [...x, rec]);
    setText(""); setStartedAt(null);
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const another = () => {
    const pool = QUESTIONS.filter((x) => x.mode === q.mode && x.id !== q.id);
    const n = pool[Math.floor(Math.random() * pool.length)] ?? QUESTIONS[0];
    setAttempts([]); setPhase("respond");
    navigate({ to: "/practice/$questionId", params: { questionId: n.id }, search: {} });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
        <Link to="/practice" className="hover:text-foreground">← Practice</Link>
        <span className="text-primary">{modeName(q.mode).toUpperCase()}</span><span>{q.context}</span><span>{q.difficulty}</span><span>~{q.seconds}s recommended</span>
        {attempts.length > 0 && <span>Attempt {attempts.length + (phase === "respond" ? 1 : 0)}</span>}
      </div>

      {phase !== "result" && (
        <div className="glass glass-float rise p-6 md:p-10">
          <div className="eyebrow mb-3">Question</div>
          <h1 className="text-balance text-[clamp(26px,4vw,40px)] font-bold leading-tight">{q.text}</h1>
          {last && phase === "respond" && <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-[14px]"><span className="eyebrow mr-2 !text-primary">Focus</span>{last.analysis.retry_instruction}</div>}
          <p className="mt-6 text-[15px] text-muted-foreground">What would you say?</p>

          {phase === "analyzing" ? (
            <div className="py-16 text-center"><div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /><div className="text-muted-foreground">Reading the shape of your response…</div></div>
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
                    <textarea className="field min-h-56 text-[16px] leading-relaxed" autoFocus value={text} placeholder="Start with your main point…" onChange={(e) => { if (!startedAt) setStartedAt(Date.now()); setText(e.target.value); }} />
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground">
                      <span className="font-mono">{words} words · {text.length} chars{timer && startedAt ? ` · ${Math.round((Date.now() - startedAt) / 1000)}s` : ""}</span>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={timer} onChange={(e) => setTimer(e.target.checked)} />Show timer</label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className="btn btn-primary" disabled={words < 5} onClick={() => analyze(text, 0, "text")}>Analyze My Response</button>
                      <button className="btn btn-ghost" onClick={another}>Try Another Question</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {phase === "result" && last && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><div className="eyebrow mb-1">Attempt {attempts.length} · analysis</div><h1 className="text-[24px] font-bold">{q.text}</h1></div>
            <div className="flex gap-3"><button className="btn btn-primary" onClick={() => setPhase("respond")}>Try Again</button><button className="btn btn-ghost" onClick={another}>Another question</button></div>
          </div>
          {attempts.length > 1 && <ComparePanel a1={attempts[0].analysis} a2={last.analysis} />}
          <AnalysisView a={last.analysis} transcript={last.transcript} />
          <div className="flex justify-center gap-3 pt-4"><button className="btn btn-primary" onClick={() => setPhase("respond")}>Try Again</button><Link to="/dashboard" className="btn btn-ghost">Back to dashboard</Link></div>
        </div>
      )}
    </div>
  );
}
