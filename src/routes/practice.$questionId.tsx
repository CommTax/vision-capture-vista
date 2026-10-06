import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Keyboard, Mic } from "lucide-react";
import { AppShell, useHydrated } from "@/components/app-shell";
import { FreePractice } from "@/components/free-practice";
import { AnalysisView, ComparePanel } from "@/components/analysis-view";
import { Recorder } from "@/components/recorder";
import { AICoach } from "@/components/ai-coach";
import { type Analysis, normalizeBackendAnalysis } from "@/lib/analysis";
import {
  buildTrialUploadForm,
  uploadTrialResponse,
  analyzeTrial,
  buildPaidUploadForm,
  uploadPaidResponse,
  analyzePaidResponse,
} from "@/lib/backend-api";
import { DIMENSIONS, QUESTIONS, modeName, type Dimension, type Question } from "@/lib/data";
import { EVAL_FOCUS, toScenario } from "@/lib/scenarios";
import { cap } from "@/components/analysis-view";
import { FreeCounter, FreeResult, Conversion, LeadCapture } from "@/components/plan-gate";
import { canSubmit, hasLead, isFree, recordSubmission, useEntitlement } from "@/lib/entitlements";
import { addResponse, getState, setState, uid, useStore, type ResponseRecord } from "@/lib/store";

export const Route = createFileRoute("/practice/$questionId")({
  validateSearch: z.object({ s: z.string().optional(), retry: z.string().optional(), f: z.enum(DIMENSIONS).optional(), ctx: z.string().optional() }),
  head: () => ({ meta: [{ title: "Practice session — TheUnspoken" }, { name: "description", content: "Respond out loud or in writing, then see what got lost." }, { property: "og:title", content: "Practice session — TheUnspoken" }, { property: "og:description", content: "A distraction-free response practice session." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SessionRoute,
});

function SessionRoute() {
  const { questionId } = Route.useParams();
  const { s, retry, f, ctx } = Route.useSearch();
  const ent = useEntitlement();
  const hydrated = useHydrated();
  const level = useStore((st) => st.profile?.level ?? "Mid career");
  if (!hydrated) return <div className="min-h-screen" />;
  if (ent.free && questionId !== "custom") {
    const base = QUESTIONS.find((x) => x.id === questionId) ?? QUESTIONS[0];
    const sc = toScenario(base, level);
    const q: Question = { ...base, context: sc.context, difficulty: sc.difficulty, seconds: sc.time_limit };
    return <FreePractice key={`${questionId}|${retry ?? ""}`} q={q} level={level} initial={loadChain(retry)} />;
  }
  // Remount on question / retry change so session state never leaks between questions.
  return <AppShell allowGuest><Session key={`${questionId}|${s ?? ""}|${retry ?? ""}`} questionId={questionId} situation={s} retry={retry} focus={f} ctx={ctx} /></AppShell>;
}

function loadChain(id?: string): ResponseRecord[] {
  if (!id) return [];
  const all = getState().responses;
  const r = all.find((x) => x.id === id);
  if (!r) return [];
  const root = r.parent_id ?? r.id;
  return all.filter((x) => x.id === root || x.parent_id === root).sort((a, b) => a.attempt - b.attempt);
}

function Session({ questionId, situation, retry, focus, ctx }: { questionId: string; situation?: string; retry?: string; focus?: Dimension; ctx?: string }) {
  const navigate = useNavigate();
  const level = useStore((st) => st.profile?.level ?? "Mid career");
  const q: Question = useMemo(() => {
    if (questionId === "custom") return { id: "custom", mode: "custom", text: `${situation ?? "Your scenario"} — what would you say?`, context: ctx ?? "Custom scenario", difficulty: "Medium", seconds: 90 };
    const base = QUESTIONS.find((x) => x.id === questionId) ?? QUESTIONS[0];
    const sc = toScenario(base, level); // level-aware context, difficulty and time
    return { ...base, context: sc.context, difficulty: sc.difficulty, seconds: sc.time_limit };
  }, [questionId, situation, ctx, level]);

  const [attempts, setAttempts] = useState<ResponseRecord[]>(() => loadChain(retry));
  const [phase, setPhase] = useState<"respond" | "analyzing" | "lead" | "result">("respond");
  const [view, setView] = useState(0); // index of attempt being viewed
  const [compareWith, setCompareWith] = useState(0);
  const [kind, setKind] = useState<"voice" | "text">("text");
  const [text, setText] = useState("");
  const [showTimer, setShowTimer] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [lastDrillId, setLastDrillId] = useState<string | null>(null);
  const ent = useEntitlement();
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

  async function analyze(
    transcript: string,
    duration: number,
    type: "voice" | "text",
    audioUrl?: string,
    audioBlob?: Blob | null,
  ) {
    if (!canSubmit(getState())) return;

    setError("");
    setPhase("analyzing");

    try {
      const currentState = getState();
      const free = isFree(currentState);
      const profile = (currentState.profile ?? {}) as {
        email?: string;
        name?: string;
        mobile?: string;
        phone?: string;
        level?: string;
        stage?: string;
      };

      const email = profile.email;
      if (!email) {
        throw new Error(
          "Please sign in before submitting your response.",
        );
      }

      // -------------------------------------------------------------
      // 1. Upload response → backend returns { drill_id }
      // -------------------------------------------------------------

      const questionSlot = String(attempts.length + 1);

      let drill_id: string;

      if (free) {
        const form = buildTrialUploadForm({
          text: type === "text" ? transcript : undefined,
          audio: type === "voice" && audioBlob ? audioBlob : undefined,
          mode: q.mode,
          question_slot: questionSlot,
          question_type: q.mode,
          question_prompt: q.text,
          duration_seconds: duration || 0,
        });

        const uploaded = await uploadTrialResponse(form);
        drill_id = uploaded.drill_id;
      } else {
        const form = buildPaidUploadForm({
          text: type === "text" ? transcript : undefined,
          audio: type === "voice" && audioBlob ? audioBlob : undefined,
          mode: q.mode,
          question_slot: questionSlot,
          question_type: q.mode,
          question_prompt: q.text,
          duration_seconds: duration || 0,
        });

        const uploaded = await uploadPaidResponse(form);
        drill_id = uploaded.drill_id;
      }

      if (!drill_id) {
        throw new Error(
          "The server did not return a drill id for this response.",
        );
      }

      // -------------------------------------------------------------
      // 2. Remember the drill id so LeadCapture can POST it later.
      //    Actual capture happens after the user fills in name/email/phone.
      // -------------------------------------------------------------
      setLastDrillId(drill_id);

      // -------------------------------------------------------------
      // 3. Ask the backend to analyze the stored response
      // -------------------------------------------------------------

      const backendRaw = free
        ? await analyzeTrial({ drill_id })
        : await analyzePaidResponse({ drill_id });

      const a: Analysis = normalizeBackendAnalysis(backendRaw);

      // -------------------------------------------------------------
      // 4. Persist locally for the existing UI (unchanged behaviour)
      // -------------------------------------------------------------

      const rec: ResponseRecord = {
        id: uid(),
        question_id: q.id,
        question: q.text,
        mode: q.mode,
        response_type: type,
        transcript,
        audio_url: audioUrl,
        duration: a.duration || duration,
        created_at: new Date().toISOString(),
        attempt: attempts.length + 1,
        parent_id: attempts[0]?.id,
        analysis: a,
      };

      const wasFree = isFree(getState());

      addResponse(rec);
      recordSubmission();

      if (wasFree) {
        setState((s) => ({
          ...s,
          freeResponseIds: [...(s.freeResponseIds ?? []), rec.id],
        }));
      }

      const next = [...attempts, rec];
      setAttempts(next);
      setView(next.length - 1);
      setCompareWith(Math.max(0, next.length - 2));

      setText("");
      setStartedAt(null);
      setElapsed(0);

      setPhase(
        isFree(getState()) && !hasLead() ? "lead" : "result",
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("[practice] response analysis failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't analyze that response. Please try again.",
      );
      setPhase("respond");
    }
  }

  const retryNow = (prefill: boolean) => {
    setText(prefill && last ? last.transcript : "");
    setStartedAt(null); setElapsed(0);
    setPhase("respond");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const another = async () => {
    if (q.mode === "custom") { navigate({ to: "/practice" }); return; }
    const seen = new Set(getState().responses.map((r) => r.question_id));
    const all = QUESTIONS.filter((x) => x.mode === q.mode && x.id !== q.id);
    const unseen = all.filter((x) => !seen.has(x.id));
    let n = unseen[Math.floor(Math.random() * unseen.length)];
    if (!n) {
      // Topic finished: ask AI for a new question (saved to the database), else reuse one.
      const { isSignedIn } = await import("@/lib/cloud-sync");
      if (isSignedIn()) {
        const { generateQuestion } = await import("@/lib/questions.functions");
        const g = await generateQuestion({ data: { mode: q.mode as never, avoid: all.map((x) => x.text).slice(0, 60) } }).catch(() => null);
        if (g) { const { addQuestions } = await import("@/lib/content-loader"); addQuestions([g as Question]); n = g as Question; }
      }
    }
    n = n ?? all[Math.floor(Math.random() * all.length)] ?? QUESTIONS[0];
    navigate({ to: "/practice/$questionId", params: { questionId: n.id }, search: {} });
  };

  const mmss = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
        <Link to="/practice" className="hover:text-foreground">← Practice</Link>
        <span className="text-primary">{modeName(q.mode).toUpperCase()}</span><span>{q.context}</span><span>{q.difficulty}</span><span>~{q.seconds}s recommended</span>
        <span>Attempt {attempts.length + (phase === "result" || phase === "lead" ? 0 : 1)}</span>
        <span className="ml-auto"><FreeCounter /></span>
      </div>

     {phase === "lead" && <LeadCapture drill_id={lastDrillId ?? undefined} onDone={() => setPhase("result")} />}

      {phase === "respond" && !ent.canSubmit && <Conversion />}

      {(phase === "analyzing" || (phase === "respond" && ent.canSubmit)) && (
        <div className="glass glass-float rise p-6 md:p-10">
          <div className="eyebrow mb-3">Question</div>
          <h1 className="text-balance text-[clamp(26px,4vw,40px)] font-bold leading-tight">{q.text}</h1>
          {focus && <div className="mt-4 rounded-2xl border border-primary/30 p-4 text-[13px]"><span className="eyebrow !text-primary">Focus: {focus}</span><div className="mt-1 text-muted-foreground">We will look closely at: {EVAL_FOCUS[focus].join(" · ")}</div></div>}
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
                  <Recorder key={attempts.length} max={Math.max(60, q.seconds + 30)} onDone={(r) => analyze(r.transcript, r.duration, "voice", r.audioUrl, r.audioBlob)} />
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
            {ent.canSubmit && <div className="flex flex-wrap gap-3"><button className="btn btn-primary" onClick={() => retryNow(false)}>Try Again</button><button className="btn btn-ghost" onClick={another}>Another question</button></div>}
          </div>

          {attempts.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-1">View</span>
              {attempts.map((a, i) => <button key={a.id} className="chip" data-active={view === i} onClick={() => { setView(i); if (compareWith >= i) setCompareWith(Math.max(0, i - 1)); }}>Attempt {i + 1} · {a.analysis.overall}</button>)}
            </div>
          )}

          {ent.free && attempts.length > 1 && view > 0 && (
            <div className="glass p-5 text-[14px]"><span className="eyebrow mr-2">Attempt {view} → {view + 1}</span>Overall {attempts[view - 1].analysis.overall} → {viewed.analysis.overall} · Main point {attempts[view - 1].analysis.main_point_delay}s → {viewed.analysis.main_point_delay}s</div>
          )}
          {!ent.free && attempts.length > 1 && view > 0 && (
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

          {!ent.free && <AICoach r={viewed} level={level} />}
          {focus && viewed.analysis.dimensions[focus] && (
            <div className="glass mb-6 p-6"><div className="eyebrow mb-2 !text-primary">Focus check · {cap(focus)} {viewed.analysis.scores[focus]}</div><p className="text-[15px]">{viewed.analysis.dimensions[focus].happened}</p>{viewed.analysis.dimensions[focus].evidence && <p className="mt-1 text-[13px] italic text-muted-foreground">{viewed.analysis.dimensions[focus].evidence}</p>}<p className="mt-2 text-[13px]"><span className="text-muted-foreground">Try this: </span>{viewed.analysis.dimensions[focus].tryThis}</p></div>
          )}
          {ent.free ? <FreeResult a={viewed.analysis} transcript={viewed.transcript} /> : <AnalysisView a={viewed.analysis} transcript={viewed.transcript} onRetry={() => retryNow(false)} />}
          {viewed.audio_url && <audio controls src={viewed.audio_url} className="w-full" />}
          {!ent.canSubmit && <Conversion />}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {ent.canSubmit && <><button className="btn btn-primary" onClick={() => retryNow(false)}>Try Again</button>
            <button className="btn btn-ghost" onClick={() => retryNow(true)}>Edit my answer</button></>}
            <Link to="/responses/$responseId" params={{ responseId: viewed.id }} className="btn btn-ghost">Saved to My Responses</Link>
          </div>
        </div>
      )}
    </div>
  );
}
