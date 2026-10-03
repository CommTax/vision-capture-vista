// Practice scenario metadata + personalization. Backend-ready: scenario rows and the
// recommendation object mirror planned tables; swap the sources without touching the UI.
import { QUESTIONS, MODES, type Dimension, type ModeId, type Question } from "./data";
import type { ResponseRecord } from "./store";
import { buildSkillInsights, pickFocus } from "./skills";

export type Scenario = {
  scenario_id: string; category: ModeId; title: string; context: string; difficulty: Question["difficulty"];
  experience_level: string[] | "any"; time_limit: number; target_skills: Dimension[];
  recommended_when: Dimension[]; prompt: string; evaluation_focus: string[];
};

export type PracticeRecommendation = { current_focus: Dimension; reason: string; supporting_evidence: string | null; recommended_scenario_id: string };

const SENIOR = ["Senior / Leadership"];

// target_skills per scenario. recommended_when = focuses this scenario is a strong fit for.
const META: Record<string, { skills: Dimension[]; when?: Dimension[]; levels?: string[]; senior?: string }> = {
  "int-1": { skills: ["structure", "memorability"], senior: "Executive panel — they want your leadership arc, not your CV" },
  "int-2": { skills: ["impact", "confidence"], when: ["confidence", "impact"], senior: "Final round with the CEO — what changes because you join?" },
  "int-3": { skills: ["impact", "structure"], when: ["impact", "structure"], senior: "Cross-functional conflict with an executive stakeholder" },
  "int-4": { skills: ["confidence", "clarity"], senior: "A strategic bet you owned that didn't pay off" },
  "int-5": { skills: ["relevance", "conciseness"], when: ["relevance", "conciseness"] },
  "int-6": { skills: ["structure", "confidence"], when: ["structure"], levels: SENIOR },
  "con-1": { skills: ["impact", "confidence"], when: ["confidence", "impact"] },
  "con-2": { skills: ["confidence", "relevance"], when: ["confidence"] },
  "con-3": { skills: ["clarity", "confidence"], when: ["confidence", "clarity"] },
  "con-4": { skills: ["confidence", "conciseness"], when: ["confidence", "conciseness"] },
  "pre-1": { skills: ["memorability", "delivery"], when: ["memorability", "delivery"] },
  "pre-2": { skills: ["structure", "impact"], when: ["structure", "impact"] },
  "pre-3": { skills: ["clarity", "structure"], when: ["clarity", "structure"] },
  "grp-1": { skills: ["structure", "confidence"], when: ["structure"] },
  "grp-2": { skills: ["relevance", "structure"], when: ["relevance"] },
  "sal-1": { skills: ["impact", "conciseness"], when: ["impact", "conciseness"] },
  "sal-2": { skills: ["relevance", "confidence"], when: ["relevance"] },
  "sal-3": { skills: ["impact", "memorability"], when: ["memorability", "impact"] },
  "evd-1": { skills: ["clarity", "confidence"], when: ["clarity", "delivery"] },
  "evd-2": { skills: ["conciseness", "relevance"], when: ["conciseness", "relevance"] },
  "evd-3": { skills: ["clarity", "confidence"], when: ["confidence"] },
  "imp-1": { skills: ["impact", "structure"], when: ["impact"] },
  "imp-2": { skills: ["impact", "clarity"], when: ["impact"], levels: ["Mid career", ...SENIOR] },
  "imp-3": { skills: ["impact", "structure"], when: ["impact"] },
  "imp-4": { skills: ["impact", "confidence"], when: ["impact", "confidence"] },
  "ldr-1": { skills: ["structure", "impact"], when: ["structure"], levels: SENIOR },
  "ldr-2": { skills: ["confidence", "clarity"], when: ["confidence"], levels: SENIOR },
  "ldr-3": { skills: ["impact", "relevance"], when: ["relevance", "impact"], levels: SENIOR },
};

export const EVAL_FOCUS: Record<Dimension, string[]> = {
  impact: ["Is the result stated early?", "Is the outcome specific?", "Is there evidence behind the claim?", "Is the value or consequence clear?"],
  structure: ["Is the main point in the first sentence?", "Do the ideas follow a clear order?", "Is there a clean close?"],
  clarity: ["Can the main idea be repeated back in one line?", "Are qualifiers getting in the way?"],
  conciseness: ["Does the answer stop once the point lands?", "Is there background that doesn't change understanding?"],
  relevance: ["Does it answer the question asked?", "Is every piece of context needed?"],
  delivery: ["Pace and pauses", "Filler words", "Emphasis on the key line"],
  confidence: ["Is the position stated directly?", "Is hedging softening the claim?"],
  memorability: ["Is there one line the listener will remember?", "Does the close reinforce the point?"],
};

export const GOALS: { label: string; hint: string; skill: Dimension }[] = [
  { label: "Get to the point", hint: "Lead with the answer.", skill: "relevance" },
  { label: "Build stronger structure", hint: "Organize your thinking clearly.", skill: "structure" },
  { label: "Be more specific", hint: "Use evidence, numbers and outcomes.", skill: "clarity" },
  { label: "Increase impact", hint: "Make the result unmistakable.", skill: "impact" },
  { label: "Sound more confident", hint: "State your position directly.", skill: "confidence" },
  { label: "Improve delivery", hint: "Control pace, pauses and filler words.", skill: "delivery" },
];

export const CATEGORY_BLURB: Partial<Record<ModeId, string>> = {
  interview: "Tell me about yourself, failures, leadership, conflict.",
  conversation: "Promotion asks, salary, disagreement, difficult conversations.",
  presentation: "Openings, recommendations, explaining data.",
  group: "Take a position, support it, respond under time pressure.",
  sales: "Pitches, objections, influencing stakeholders.",
  everyday: "Status updates, delays, escalations.",
  custom: "Describe any situation and cadence creates the scenario.",
};

export function toScenario(q: Question, level: string): Scenario {
  const m = META[q.id] ?? { skills: ["structure"] as Dimension[] };
  const senior = level === "Senior / Leadership" && m.senior;
  const hard = level === "Senior / Leadership" && q.difficulty === "Medium" && !!m.senior;
  return {
    scenario_id: q.id, category: q.mode, title: q.text, context: senior ? m.senior! : q.context,
    difficulty: hard ? "Hard" : q.difficulty, experience_level: m.levels ?? "any", time_limit: senior ? Math.max(q.seconds, 120) : q.seconds,
    target_skills: m.skills, recommended_when: m.when ?? [], prompt: q.text, evaluation_focus: m.skills.flatMap((s) => EVAL_FOCUS[s]).slice(0, 4),
  };
}

export function allScenarios(level: string) {
  return QUESTIONS.map((q) => toScenario(q, level)).filter((s) => s.experience_level === "any" || s.experience_level.includes(level));
}

export const scenariosFor = (skill: Dimension, level: string) =>
  allScenarios(level).filter((s) => s.recommended_when.includes(skill)).sort((a, b) => b.target_skills.indexOf(skill) === 0 ? 1 : -1);

/** null when there isn't enough history to personalize honestly. */
export function recommendPractice(rs: ResponseRecord[], level: string): PracticeRecommendation | null {
  if (rs.length < 2) return null;
  const focus = pickFocus(buildSkillInsights(rs));
  if (!focus) return null;
  const done = new Set(rs.slice(0, 3).map((r) => r.question_id));
  const pick = scenariosFor(focus.skill, level).find((s) => !done.has(s.scenario_id)) ?? scenariosFor(focus.skill, level)[0];
  if (!pick) return null;
  return { current_focus: focus.skill, reason: `This scenario naturally exercises ${focus.skill}, your current focus (${focus.score}).`, supporting_evidence: focus.evidence[0] ?? null, recommended_scenario_id: pick.scenario_id };
}

export const categoryName = (m: ModeId) => MODES.find((x) => x.id === m)?.name ?? m;

/** Builds a structured scenario from a free-text situation (local heuristic; swap for a server call later). */
export function buildCustomScenario(text: string, level: string) {
  const t = text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const audience = has("ceo", "vp", "executive", "leadership", "board") ? "Senior leadership" : has("manager", "boss", "lead") ? "Your manager" : has("client", "customer") ? "A client" : has("interview", "recruiter", "hiring") ? "An interviewer" : has("team", "peer", "colleague") ? "Your team" : "The other person";
  const skills: Dimension[] = has("promotion", "raise", "salary", "ask") ? ["impact", "confidence"] : has("disagree", "no ", "push back", "conflict", "feedback") ? ["confidence", "clarity"] : has("pitch", "convince", "sell", "fund") ? ["impact", "memorability"] : has("update", "delay", "late", "explain", "status") ? ["structure", "conciseness"] : ["structure", "impact"];
  const hard = level === "Senior / Leadership" || has("promotion", "salary", "negotiat", "disagree", "executive", "board", "fire", "layoff");
  return {
    context: `${audience} · ${level}`, audience,
    objective: skills[0] === "confidence" ? "State your position and hold it." : skills[0] === "structure" ? "Make the situation easy to follow in one pass." : "Make the value of what you're asking for unmistakable.",
    difficulty: (hard ? "Hard" : "Medium") as Question["difficulty"], time_limit: hard ? 120 : 90, evaluation_focus: skills,
  };
}
