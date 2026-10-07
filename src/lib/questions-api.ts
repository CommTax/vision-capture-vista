// Question feed adapter.
//
// Fetches from the public /api/questions endpoint and maps the response
// onto the frontend's existing Scenario shape so ScenarioCard renders
// without any changes.
//
// Falls back to the local allScenarios() list if the fetch fails.

import { getQuestions, type QuestionCard } from "./backend-api";
import { allScenarios, type Scenario } from "./scenarios";
import type { Dimension, ModeId } from "./data";

const VALID_DIMENSIONS: Dimension[] = [
  "structure", "clarity", "conciseness", "relevance",
  "impact", "delivery", "confidence", "memorability",
];

function cleanSkills(arr: string[]): Dimension[] {
  return arr.filter((s): s is Dimension =>
    VALID_DIMENSIONS.includes(s as Dimension),
  );
}

export function cardToScenario(q: QuestionCard): Scenario {
  return {
    scenario_id: q.id,
    category: (q.mode as ModeId) ?? "interview",
    title: q.title,
    context: q.context || q.category || q.mode,
    target_skills: cleanSkills(q.focus),
    difficulty: (q.difficulty as Scenario["difficulty"]) ?? "Medium",
    time_limit: q.seconds,
    // The Scenario type has more fields, but ScenarioCard only uses
    // the ones above. The rest are filled with safe defaults.
    audience: "",
    objective: "",
    evaluation_focus: cleanSkills(q.focus),
    tags: [],
    // Add any remaining required Scenario fields here with defaults.
  } as Scenario;
}

export async function fetchScenarios(params: {
  mode: string;
  category?: string;
  role?: string;
  level: string;
}): Promise<{ scenarios: Scenario[]; source: "backend" | "fallback" }> {
  try {
    const res = await getQuestions({
      mode: params.mode,
      category: params.category,
      role: params.role,
      limit: 30,
    });
    const scenarios = (res.questions ?? []).map(cardToScenario);
    if (scenarios.length > 0) {
      return { scenarios, source: "backend" };
    }
  } catch (err) {
    console.warn("[questions-api] backend fetch failed, falling back:", err);
  }

  // Fallback: local list, filtered by mode.
  const local = allScenarios(params.level).filter(
    (s) => s.category === params.mode,
  );
  return { scenarios: local, source: "fallback" };
}
