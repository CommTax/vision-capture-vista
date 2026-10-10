// Question feed adapter.
//
// Fetches from the public /api/questions endpoint and maps the response
// onto the frontend's existing Scenario shape so ScenarioCard renders
// without any changes.
//
// Deterministic per user: the user's email (from the JWT) is passed as
// a `seed` param so the backend returns the same questions in the same
// order every time. Results are cached per session per (mode, role).
//
// Falls back to the local allScenarios() list if the fetch fails.

import { getQuestions, type QuestionCard } from "./backend-api";
import { allScenarios, EVAL_FOCUS, type Scenario } from "./scenarios";
import type { Dimension, ModeId } from "./data";

const VALID_DIMENSIONS: Dimension[] = [
  "structure", "clarity", "conciseness", "relevance",
  "impact", "delivery", "confidence", "memorability",
];

const VALID_MODES: ModeId[] = [
  "interview", "conversation", "presentation", "group",
  "sales", "everyday", "custom",
];

function cleanSkills(arr: string[]): Dimension[] {
  return arr.filter((s): s is Dimension =>
    VALID_DIMENSIONS.includes(s as Dimension),
  );
}

function cleanMode(m: string): ModeId {
  return (VALID_MODES as string[]).includes(m) ? (m as ModeId) : "interview";
}

function cleanDifficulty(d: string): Scenario["difficulty"] {
  const v = (d || "medium").toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "hard") return "Hard";
  return "Medium";
}

/**
 * Read the user's email (JWT `sub` claim) for use as the question seed.
 * Returns null for guests → backend falls back to RANDOM().
 */
function getSessionSeed(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("unspoken-session-token");
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function cardToScenario(q: QuestionCard): Scenario {
  const skills = cleanSkills(q.focus);
  return {
    scenario_id: q.id,
    category: cleanMode(q.mode),
    title: q.title,
    context: q.context || q.category || q.mode,
    difficulty: cleanDifficulty(q.difficulty),
    experience_level: "any",
    time_limit: q.seconds || 60,
    target_skills: skills,
    recommended_when: skills,
    prompt: q.title,
    evaluation_focus: skills.flatMap((s) => EVAL_FOCUS[s] ?? []).slice(0, 4),
  };
}

export async function fetchScenarios(params: {
  mode: string;
  category?: string;
  role?: string;
  level: string;
}): Promise<{ scenarios: Scenario[]; source: "backend" | "fallback" }> {
  const seed = getSessionSeed();
  const cacheKey = `unspoken-questions-${params.mode}-${params.role ?? ""}`;

  // 1. Cache hit — same session, same mode/role → same questions.
  //    Prevents refetches on re-mount (route changes, tab switches).
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Scenario[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { scenarios: parsed, source: "backend" };
        }
      } catch {
        // corrupt cache — fall through to network fetch
      }
    }
  }

  // 2. Network fetch with deterministic seed.
  try {
    const res = await getQuestions({
      mode: params.mode,
      category: params.category,
      role: params.role,
      limit: 30,
      seed: seed ?? undefined,
    });
    const scenarios = (res.questions ?? []).map(cardToScenario);
    if (scenarios.length > 0) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, JSON.stringify(scenarios));
      }
      return { scenarios, source: "backend" };
    }
  } catch (err) {
    console.warn("[questions-api] backend fetch failed, falling back:", err);
  }

  // 3. Fallback: local list, filtered by mode.
  const local = allScenarios(params.level).filter(
    (s) => s.category === params.mode,
  );
  return { scenarios: local, source: "fallback" };
}
