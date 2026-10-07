// Question feed adapter.
//
// Fetches from the public /api/questions endpoint and maps the response
// onto the frontend's existing Scenario shape so ScenarioCard renders
// without any changes.
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
