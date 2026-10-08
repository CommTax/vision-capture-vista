import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AnalysisView, ComparePanel } from "@/components/analysis-view";
import { modeName } from "@/lib/data";
import { usePaidDashboard } from "@/lib/paid-dashboard";
import { normalizeBackendAnalysis } from "@/lib/analysis";
import { toAudioUrl } from "@/lib/r2";
import type { ResponseRecord } from "@/lib/store";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://unspoken-backend-nqvl.onrender.com";

export const Route = createFileRoute("/responses/$responseId")({
  head: () => ({
    meta: [
      { title: "Response analysis — TheUnspoken" },
      { name: "description", content: "Detailed analysis of a practiced response." },
      { property: "og:title", content: "Response analysis — TheUnspoken" },
      { property: "og:description", content: "Pattern, what got lost, and how to improve." },
    ],
  }),
  component: () => <AppShell><Detail /></AppShell>,
});

function Detail() {
  const { responseId } = Route.useParams();

  // ─── All hooks first, unconditionally ───
  const { reps: allReps, loading: listLoading } = usePaidDashboard();
  const [rec, setRec] = useState<ResponseRecord | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Fast path: try to find in the already-loaded list
  useEffect(() => {
    const found = allReps.find((x) => x.id === responseId);
    if (found) {
      setRec(found);
      setFetchFailed(false);
    }
  }, [responseId, allReps]);

  // Slow path: fetch directly from the backend if not in the list
  useEffect(() => {
    if (rec) return;
    if (listLoading) return;

    let cancelled = false;
    (async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("unspoken-session-token")
          : null;
      if (!token) {
        if (!cancelled) setFetchFailed(true);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/paid/reps/${responseId}/analysis`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          if (!cancelled) setFetchFailed(true);
          return;
        }
        const payload = await res.json();
        if (cancelled) return;

        const analysis = normalizeBackendAnalysis(payload.analysis ?? payload);

        const mapped: ResponseRecord = {
          id: payload.drill_id ?? responseId,
          question_id: payload.drill_id ?? responseId,
          question: payload.question || payload.analysis?.question || "",
          mode: "interview",
          response_type: "voice",
          transcript: payload.analysis?.transcribed_text || "",
          audio_url: payload.audio_url ?? undefined,
          duration: payload.duration_seconds || 0,
          created_at: payload.created_at || new Date().toISOString(),
          attempt: 1,
          parent_id: undefined,
          analysis,
        };
        setRec(mapped);
      } catch (err) {
        console.error("[response-detail] fetch failed:", err);
        if (!cancelled) setFetchFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [responseId, rec, listLoading]);

  // ─── Loading ───
  if (!rec && listLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading response…
      </div>
    );
  }

  // ─── Not found ───
  if (!rec && fetchFailed) {
    return (
      <div className="glass p-10 text-center">
        Response not found.{" "}
        <Link to="/responses" className="text-primary">
          Back to responses
        </Link>
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading response…
      </div>
    );
  }

  // ─── Found — render ───
  const parent = rec.parent_id
    ? allReps.find((x) => x.id === rec.parent_id)
    : undefined;

  const level = "Mid career";

  // Compute the persistent, playable audio URL once
  const audioSrc = toAudioUrl(rec.audio_url);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/responses"
            className="font-mono text-[12px] text-muted-foreground"
          >
            ← My Responses
          </Link>
          <div className="eyebrow mt-3">
            {modeName(rec.mode)} · Attempt {rec.attempt} ·{" "}
            {new Date(rec.created_at).toLocaleString()}
          </div>
          <h1 className="mt-1 text-[26px] font-bold">{rec.question}</h1>
        </div>
        {rec.question_id !== "custom" && (
          <Link
            to="/practice/$questionId"
            params={{ questionId: rec.question_id }}
            search={{ retry: parent?.id ?? rec.id }}
            className="btn btn-primary"
          >
            Try Again
          </Link>
        )}
      </div>

{parent && <ComparePanel a1={parent.analysis} a2={rec.analysis} />}

<AnalysisView
  a={rec.analysis}
  transcript={rec.transcript}
  audioUrl={rec.audio_url}
  durationSec={rec.duration}
/>
    </div>
  );
}
