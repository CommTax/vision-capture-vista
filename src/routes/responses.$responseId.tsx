import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AnalysisView, ComparePanel } from "@/components/analysis-view";
import { modeName } from "@/lib/data";
import { AICoach } from "@/components/ai-coach";
import { usePaidDashboard } from "@/lib/paid-dashboard";
import { normalizeBackendAnalysis } from "@/lib/analysis";
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
  const [fetchError, setFetchError] = useState(false);

  // If the drill isn't in the reps list yet, fetch it directly
  useEffect(() => {
    // Already have it from the list?
    const found = allReps.find((x) => x.id === responseId);
    if (found) {
      setRec(found);
      return;
    }

    // Otherwise, try to fetch the single drill from the backend.
    let cancelled = false;
    (async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("unspoken-session-token")
          : null;
      if (!token) {
        if (!cancelled) setFetchError(true);
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/paid/reps/${responseId}/analysis`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          if (!cancelled) setFetchError(true);
          return;
        }
        const payload = await res.json();
        if (cancelled) return;

        // Build a ResponseRecord from the backend shape
        const analysis = normalizeBackendAnalysis(
          payload.analysis ?? payload,
        );
        setRec({
          id: payload.drill_id ?? responseId,
          question_id: payload.drill_id ?? responseId,
          question: payload.question || "",
          mode: (payload.analysis?.mode as ResponseRecord["mode"]) ?? "interview",
          response_type: "voice",
          transcript: payload.analysis?.transcribed_text || "",
          audio_url: undefined,
          duration: payload.duration_seconds || 0,
          created_at: payload.created_at || new Date().toISOString(),
          attempt: 1,
          parent_id: undefined,
          analysis,
        });
      } catch (err) {
        console.error("[response-detail] fetch failed:", err);
        if (!cancelled) setFetchError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [responseId, allReps]);

  // ─── Loading state ───
  if (!rec && listLoading && allReps.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading response…
      </div>
    );
  }

  // ─── Not found ───
  if (!rec) {
    return (
      <div className="glass p-10 text-center">
        Response not found.{" "}
        <Link to="/responses" className="text-primary">
          Back to responses
        </Link>
      </div>
    );
  }

  // Find the parent attempt for the compare panel
  const parent = rec.parent_id
    ? allReps.find((x) => x.id === rec.parent_id)
    : undefined;

  const level = "Mid career";

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

      {rec.audio_url?.startsWith("http") && (
        <audio controls src={rec.audio_url} className="w-full" />
      )}

      {parent && <ComparePanel a1={parent.analysis} a2={rec.analysis} />}

      <AICoach r={rec} level={level} />

      <AnalysisView a={rec.analysis} transcript={rec.transcript} />
    </div>
  );
}
