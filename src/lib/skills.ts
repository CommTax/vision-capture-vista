// Skill insights derived only from analyzed responses. Shape is backend-ready:
// replace buildSkillInsights() with a server read without touching the UI.
import { DIMENSIONS, DRILLS, type Dimension, type Drill } from "./data";
import type { ResponseRecord } from "./store";

export type SkillStatus = "Strong" | "Improving" | "Stable" | "Developing" | "Needs attention" | "No data";
export type SkillExample = { response_id: string; question: string; score: number; note: string; excerpt: string };

export type SkillInsight = {
  skill: Dimension;
  score: number | null;
  previous_score: number | null;
  change: number | null;
  status: SkillStatus;
  evidence: string[];              // real observations from recent responses
  strongest_example: SkillExample | null;
  recurring_gap: string | null;
  recommended_drill: Drill;
  series: number[];
};

export const SKILL_MEANING: Record<Dimension, string> = {
  structure: "Whether your answer has a clear order: point first, support second, a clean close.",
  clarity: "Whether the listener can understand the main idea the first time they hear it.",
  conciseness: "Whether you say what's needed — and stop once the point has landed.",
  relevance: "Whether the answer stays on the question that was actually asked.",
  impact: "Whether your answer makes the consequence, value or outcome clear.",
  delivery: "Pace, rhythm and emphasis — how the words sound, not just what they say.",
  confidence: "Whether you state your position directly instead of hedging it.",
  memorability: "Whether the listener walks away with one line they'll remember.",
};

export const CORE: Dimension[] = ["structure", "clarity", "conciseness", "relevance", "impact", "delivery", "confidence"];
export const OUTCOMES: Dimension[] = ["memorability"];

const DRILL_FOR: Record<Dimension, string> = {
  structure: "five-sec", clarity: "one-sentence", conciseness: "cut-30", relevance: "specific",
  impact: "result-first", delivery: "three-steps", confidence: "five-sec", memorability: "exec-summary",
};

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

function status(score: number | null, change: number | null): SkillStatus {
  if (score === null) return "No data";
  if (change !== null && change <= -5) return "Needs attention";
  if (score < 60) return change !== null && change > 0 ? "Developing" : "Needs attention";
  if (score >= 78 && (change ?? 0) >= 0) return "Strong";
  if (change !== null && change >= 5) return "Improving";
  return "Stable";
}

export function buildSkillInsights(rs: ResponseRecord[]): SkillInsight[] {
  const chron = [...rs].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const half = Math.max(1, Math.floor(chron.length / 2));
  const recent = chron.slice(-half), earlier = chron.length >= 2 ? chron.slice(0, chron.length - half) : [];
  return DIMENSIONS.map((d) => {
    const score = avg(recent.map((r) => r.analysis.scores[d]));
    const previous_score = earlier.length ? avg(earlier.map((r) => r.analysis.scores[d])) : null;
    const change = score !== null && previous_score !== null ? score - previous_score : null;
    const evidence = [...recent].reverse().map((r) => r.analysis.dimensions[d]?.happened).filter((x): x is string => !!x)
      .filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
    const best = chron.reduce<ResponseRecord | null>((b, r) => (!b || r.analysis.scores[d] > b.analysis.scores[d] ? r : b), null);
    const strongest_example = best ? { response_id: best.id, question: best.question, score: best.analysis.scores[d], note: best.analysis.dimensions[d]?.happened ?? "", excerpt: best.analysis.dimensions[d]?.evidence ?? "" } : null;
    const tries: Record<string, number> = {};
    chron.filter((r) => r.analysis.scores[d] < 70).forEach((r) => { const t = r.analysis.dimensions[d]?.tryThis; if (t) tries[t] = (tries[t] || 0) + 1; });
    const recurring_gap = Object.entries(tries).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const recommended_drill = DRILLS.find((x) => x.id === DRILL_FOR[d]) ?? DRILLS[0];
    return { skill: d, score, previous_score, change, status: status(score, change), evidence, strongest_example, recurring_gap, recommended_drill, series: chron.map((r) => r.analysis.scores[d]) };
  });
}

/** Focus = lowest-scoring core skill, ties broken by the biggest decline. */
export function pickFocus(xs: SkillInsight[]) {
  return [...xs].filter((x) => x.score !== null && CORE.includes(x.skill)).sort((a, b) => (a.score! - b.score!) || ((a.change ?? 0) - (b.change ?? 0)))[0];
}
