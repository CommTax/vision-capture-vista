// src/content/pillars-drills-fallback.ts

export interface FormatDrill {
  id: string;
  title: string;
  desc: string;
  activity: string;
  timeBudget: number; // seconds
  active: boolean;
}

export interface FormatDrillCategory {
  category: string;
  icon: string;
  drills: FormatDrill[];
}

export const FALLBACK_FORMAT_DRILLS: FormatDrillCategory[] = [
  {
    category: "Rambling Reduction",
    icon: "scissors",
    drills: [
      { id: "headline", title: "Headline Drill", desc: "State your main point in one sentence — before you say anything else. Under 15 words.", activity: "Headline Drill", timeBudget: 45, active: true },
      { id: "filler-elimination", title: "Filler Elimination", desc: "Speak for 30 seconds on any topic. Zero fillers.", activity: "Filler Elimination", timeBudget: 45, active: true },
      { id: "one-idea-only", title: "One Idea Only", desc: "Answer with exactly one idea. No tangents.", activity: "One Idea Only", timeBudget: 45, active: true },
      { id: "compression-ladder", title: "Compression Ladder", desc: "Answer the same question in 60, then 30, then 15 seconds. Same core point.", activity: "Compression Ladder", timeBudget: 90, active: true },
      { id: "relevance-cut", title: "Relevance Cut", desc: "Mark each sentence KEEP, SUPPORT, or CUT — then re-record.", activity: "Relevance Cut", timeBudget: 90, active: true },
      { id: "destination-check", title: "Destination Check", desc: "Type the one line you want to end on. Then record.", activity: "Destination Check", timeBudget: 45, active: true },
    ],
  },
  {
    category: "Structure Preparation",
    icon: "layout-grid",
    drills: [
      { id: "structure-pso", title: "Structure Drill (PSO)", desc: "Answer using Problem → Solution → Outcome. One sentence each.", activity: "Structure Drill (PSO)", timeBudget: 90, active: true },
      { id: "frame-drill", title: "Frame Drill", desc: "Type a 3-word outline before the mic activates.", activity: "Frame Drill", timeBudget: 45, active: true },
      { id: "signpost-drill", title: "Signpost Drill", desc: "Use explicit sequence markers — \"First... Second... Finally...\"", activity: "Signpost Drill", timeBudget: 90, active: true },
      { id: "point-ranking", title: "Point-Ranking Drill", desc: "Rank 3 points by importance before recording.", activity: "Point-Ranking Drill", timeBudget: 90, active: true },
      { id: "template-ladder", title: "Template Ladder", desc: "Answer the same prompt using PRE, SAR, and PSO.", activity: "Template Ladder", timeBudget: 90, active: true },
    ],
  },
  {
    category: "Precision & Impact",
    icon: "target",
    drills: [
      { id: "time-to-point", title: "Time-to-Point", desc: "Deliver your key recommendation in under 5 seconds.", activity: "Time-to-Point", timeBudget: 45, active: true },
      { id: "specificity-swap", title: "Specificity Swap", desc: "Replace one vague phrase with a real number, name, or example.", activity: "Specificity Swap", timeBudget: 45, active: true },
      { id: "close-strong", title: "Close Strong", desc: "End by restating your headline point in different words.", activity: "Close Strong", timeBudget: 90, active: true },
      { id: "claim-example", title: "Claim → Example", desc: "One claim. One specific instance that proves it.", activity: "Claim → Example", timeBudget: 90, active: true },
      { id: "contrast-frame-drill", title: "Contrast Frame", desc: "Frame as before/after.", activity: "Contrast Frame", timeBudget: 90, active: true },
      { id: "jargon-swap", title: "Jargon Swap", desc: "Re-record one jargon phrase in plain language.", activity: "Jargon Swap", timeBudget: 45, active: true },
    ],
  },
  {
    category: "Delivery & Orator Training",
    icon: "mic",
    drills: [
      { id: "pause-training", title: "Pause Training", desc: "One deliberate 1–2 second pause after your key line.", activity: "Pause Training", timeBudget: 90, active: true },
      { id: "vocal-variety-drill", title: "Vocal Variety Drill", desc: "Same sentence 3 times — flat, slower with emphasis, rising pitch.", activity: "Vocal Variety Drill", timeBudget: 90, active: true },
      { id: "breathing-reset", title: "Breathing Reset", desc: "One visible breath before you start speaking.", activity: "Breathing Reset", timeBudget: 45, active: true },
      { id: "anchor-focus", title: "Anchor Focus", desc: "Keep your eyes on the on-screen anchor point.", activity: "Anchor Focus", timeBudget: 90, active: true },
    ],
  },
];
