import { useEffect, useState } from "react";
import { getPaidReps, getPaidSession } from "./backend-api";
import { normalizeBackendAnalysis } from "./analysis";
import type { ResponseRecord } from "./store";


export type PaidSession = {
  email?: string;
  name?: string;
  plan?: string;
  sprint?: string;
  track_id?: string;
  current_day?: number;
  total_days?: number;
  role?: string;
  role_family?: string;
  target_industry?: string;
  career_stage?: string;
  profile_completed?: boolean;
  stats?: {
    current_streak?: number;
    longest_streak?: number;
    completed_tasks?: number;
    total_tasks?: number;
    achievements_unlocked?: number;
    achievements_total?: number;
    last_activity_date?: string | null;
  };
  [k: string]: unknown;
};

type State = {
  loading: boolean;
  error: string | null;
  session: PaidSession | null;
  reps: ResponseRecord[];
};

let cache: State | null = null;
const listeners = new Set<() => void>();

function setCache(next: State) {
  cache = next;
  listeners.forEach((l) => l());
}

export function usePaidDashboard(): State {
  const [, force] = useState(0);

  useEffect(() => {
    const rerender = () => force((x) => x + 1);
    listeners.add(rerender);

    if (!cache) {
      void load();
    }

    return () => {
      listeners.delete(rerender);
    };
  }, []);

  return (
    cache ?? {
      loading: true,
      error: null,
      session: null,
      reps: [],
    }
  );
}

async function load() {
  setCache({
    loading: true,
    error: null,
    session: cache?.session ?? null,
    reps: cache?.reps ?? [],
  });

  try {
    const [sessionRes, repsRes] = await Promise.all([
      getPaidSession().catch(() => null),
      getPaidReps(200).catch(() => null),
    ]);

    const session = (sessionRes ?? {}) as PaidSession;
    const rawReps: Array<Record<string, unknown>> =
      (repsRes as { reps?: Array<Record<string, unknown>> })?.reps ?? [];

    const reps: ResponseRecord[] = rawReps.map((r, i) =>
      mapRepToRecord(r, i, rawReps.length),
    );

    setCache({
      loading: false,
      error: null,
      session,
      reps,
    });
  } catch (err) {
    setCache({
      loading: false,
      error: err instanceof Error ? err.message : "Failed to load dashboard",
      session: null,
      reps: [],
    });
  }
}

/**
 * Maps a backend rep entry → local ResponseRecord.
 *
 * Attempt / parent_id:
 *   The backend doesn't currently return retry chains, so every rep is
 *   treated as attempt 1. If that changes, wire it here.
 */
function mapRepToRecord(
  r: Record<string, unknown>,
  index: number,
  total: number,
): ResponseRecord {
  const drill_id = String(r.drill_id ?? `rep-${index}`);
  const question = String(r.question ?? "");
  const mode = (r.question_type as ResponseRecord["mode"]) ?? "interview";
  const transcript = String(r.transcript ?? "");
  const createdAt = String(r.created_at ?? new Date().toISOString());
  const responseType =
    r.mode === "voice" || r.mode === "text" ? (r.mode as "voice" | "text") : "text";

  const analysis = normalizeBackendAnalysis(r);

  return {
    id: drill_id,
    question_id: String(r.question_slot ?? drill_id),
    question,
    mode,
    response_type: responseType,
    transcript,
    audio_url:
      typeof r.audio_url === "string" && r.audio_url.length > 0
        ? r.audio_url
        : undefined,
    duration: Number(
      (r.signals as Record<string, unknown> | undefined)?.duration_seconds ??
        r.duration_seconds ??
        0,
    ),
    created_at: createdAt,
    attempt: Number(r.question_slot ?? 1) || 1,
    parent_id: undefined,
    analysis,
  };
}

export function resetPaidDashboardCache() {
  cache = null;
  listeners.forEach((l) => l());
}
