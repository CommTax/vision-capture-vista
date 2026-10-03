// Drill recommendations derived from skill insights. Ready for real analysis data:
// swap buildSkillInsights() for a server read; this ranking stays the same.
import { DRILLS, type Dimension, type Drill } from "./data";
import type { ResponseRecord } from "./store";
import { buildSkillInsights, type SkillInsight } from "./skills";

export type Recommendation = {
  skill: Dimension;
  current_score: number | null;
  previous_score: number | null;
  change: number | null;
  evidence: string | null;
  recurring_gap: string | null;
  drill_id: string;
  drill: Drill;
  reason: string;
  expected_behavior_change: string;
  success_chain: string[];
};

const EXPECTED: Record<Dimension, { change: string; chain: string[]; why: string }> = {
  impact: { change: "State the result first. Then explain the evidence.", chain: ["Result", "Evidence", "Why it mattered"], why: "Improving Impact is likely to strengthen how quickly your answers communicate value." },
  structure: { change: "Put your answer in the first sentence, then support it.", chain: ["Point", "Reason", "Example"], why: "Clearer structure makes every other skill easier for the listener to notice." },
  clarity: { change: "Say the main idea in one plain sentence.", chain: ["One line", "Explain", "Stop"], why: "If the core idea is clear, the details have something to attach to." },
  conciseness: { change: "Make the point, back it once, and stop.", chain: ["Point", "Proof", "Stop"], why: "Shorter answers keep the main point from being diluted." },
  relevance: { change: "Answer the question asked, with concrete specifics.", chain: ["Ask", "Answer", "Specific proof"], why: "Specific, on-question answers are easier to trust." },
  delivery: { change: "Say the same message without filler.", chain: ["Pause", "Point", "No filler"], why: "Removing filler lets your strongest lines land without interruption." },
  confidence: { change: "State your position without hedging.", chain: ["Claim", "Evidence", "Own it"], why: "Direct statements make your answer sound decided." },
  memorability: { change: "Close with one specific takeaway.", chain: ["Hook", "Story", "Takeaway"], why: "A clear closing line is what the listener carries out of the room." },
};

const DRILL_FOR: Record<Dimension, string> = {
  structure: "five-sec", clarity: "one-sentence", conciseness: "cut-30", relevance: "specific",
  impact: "result-first", delivery: "filler", confidence: "three-steps", memorability: "exec-summary",
};

/** Leverage: room to grow, plus extra weight for a recent decline. Not just "lowest score". */
const leverage = (x: SkillInsight) => (x.score === null ? -1 : (100 - x.score) + Math.max(0, -(x.change ?? 0)) * 1.5);

function toRec(x: SkillInsight): Recommendation {
  const drill = DRILLS.find((d) => d.id === DRILL_FOR[x.skill]) ?? x.recommended_drill;
  const e = EXPECTED[x.skill];
  return {
    skill: x.skill, current_score: x.score, previous_score: x.previous_score, change: x.change,
    evidence: x.evidence[0] ?? null, recurring_gap: x.recurring_gap, drill_id: drill.id, drill,
    reason: e.why, expected_behavior_change: e.change, success_chain: e.chain,
  };
}

export function buildRecommendations(rs: ResponseRecord[]) {
  const ranked = buildSkillInsights(rs).filter((x) => x.score !== null).sort((a, b) => leverage(b) - leverage(a)).map(toRec);
  return { next: ranked[0] ?? null, more: ranked.slice(1, 4) };
}
