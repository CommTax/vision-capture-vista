// AI analysis abstraction. `analyzeResponse` is provider-agnostic: today it runs a local
// heuristic engine; swap `provider` for a server function calling an AI API later.
import { DIMENSIONS, PATTERNS, type Dimension, type ModeId } from "./data";

export type AnalysisInput = { question: string; transcript: string; mode: ModeId; level: string; durationSec?: number; responseType: "voice" | "text" };

export type DimensionResult = { score: number; happened: string; evidence: string; tryThis: string };

export type Segment = { label: string; start: number; end: number; flag?: string };

export type Analysis = {
  primary_pattern: string;
  secondary_pattern: string;
  scores: Record<Dimension, number>;
  overall: number;
  dimensions: Record<Dimension, DimensionResult>;
  summary: string;
  main_point_delay: number;
  word_count: number;
  sentence_count: number;
  avg_sentence_length: number;
  wpm: number;
  duration: number;
  filler_words: { word: string; count: number }[];
  repeated_words: { word: string; count: number }[];
  pauses?: number;
  long_pauses?: number;
  strengths: string[];
  improvements: string[];
  what_got_lost: { intended: string; heard: string; why: string[]; makeItLand: string[] };
  example_structure: string;
  segments: Segment[];
  recommended_drill: string;
  retry_instruction: string;
};

const FILLERS = ["um", "uh", "like", "basically", "actually", "you know", "kind of", "sort of", "i mean", "literally", "just", "so yeah"];
const STOP = new Set("the a an and or but to of in on for with at by from is was were be been are i we it that this my our as so they he she you me us them have had has do did not then there their".split(" "));
const RESULT_WORDS = /(turned|resolved|built|led |won|helped|successfully|managed to|result|outcome|so that|which led|increased|reduced|saved|delivered|improved|cut|grew|launched|achieved|recommend|i'd pick|my answer|the point|in short|i believe|i think we should|%|\d)/i;

const clamp = (n: number) => Math.max(18, Math.min(96, Math.round(n)));

export async function analyzeResponse(input: AnalysisInput): Promise<Analysis> {
  await new Promise((r) => setTimeout(r, 1400)); // simulate model latency
  return heuristicProvider(input);
}

export function heuristicProvider({ question, transcript, durationSec, responseType }: AnalysisInput): Analysis {
  const text = transcript.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const sc = Math.max(1, sentences.length);
  const avgLen = Math.round(wc / sc);
  const duration = durationSec && durationSec > 0 ? durationSec : Math.round(wc / 2.4);
  const wpm = duration ? Math.round((wc / duration) * 60) : 0;
  const lower = ` ${text.toLowerCase()} `;

  const filler_words = FILLERS.map((f) => ({ word: f, count: (lower.match(new RegExp(`[^a-z]${f}[^a-z]`, "g")) || []).length })).filter((f) => f.count > 0).sort((a, b) => b.count - a.count);
  const fillerCount = filler_words.reduce((s, f) => s + f.count, 0);

  const freq: Record<string, number> = {};
  words.forEach((w) => { const k = w.toLowerCase().replace(/[^a-z']/g, ""); if (k.length > 3 && !STOP.has(k)) freq[k] = (freq[k] || 0) + 1; });
  const repeated_words = Object.entries(freq).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([word, count]) => ({ word, count }));

  // main point = first sentence carrying a result / position signal
  let mpIdx = sentences.findIndex((s) => RESULT_WORDS.test(s));
  if (mpIdx < 0) mpIdx = sentences.length - 1;
  const wordsBefore = sentences.slice(0, mpIdx).join(" ").split(/\s+/).filter(Boolean).length;
  const secPerWord = wc ? duration / wc : 0.4;
  const mainDelay = Math.round(wordsBefore * secPerWord);
  const mpRatio = wc ? wordsBefore / wc : 1;
  const specifics = (text.match(/\d+|%|\$|₹/g) || []).length;
  const hedges = (lower.match(/\b(maybe|i guess|probably|i think|hopefully|sort of|kind of|not sure)\b/g) || []).length;
  const hasClose = sentences.length > 1 && RESULT_WORDS.test(sentences[sentences.length - 1]);

  const s: Record<Dimension, number> = {
    structure: clamp(88 - mpRatio * 70 - (sc > 9 ? 10 : 0) + (hasClose ? 6 : 0)),
    clarity: clamp(86 - Math.max(0, avgLen - 18) * 2 - fillerCount * 3),
    conciseness: clamp(92 - Math.max(0, wc - 140) * 0.3 - repeated_words.length * 5 - fillerCount * 2),
    relevance: clamp(60 + Math.min(24, overlap(question, text) * 6) + (wc > 25 ? 6 : -10)),
    impact: clamp(46 + specifics * 7 + (hasClose ? 10 : 0)),
    delivery: clamp(responseType === "voice" ? 80 - Math.abs(wpm - 145) * 0.4 - fillerCount * 3 : 72 - fillerCount * 3),
    confidence: clamp(84 - hedges * 8 - fillerCount * 2),
    memorability: clamp(48 + specifics * 5 + (hasClose ? 12 : 0) - (wc > 220 ? 10 : 0)),
  };
  if (wc < 12) DIMENSIONS.forEach((d) => (s[d] = clamp(s[d] - 25)));
  const overall = Math.round(DIMENSIONS.reduce((a, d) => a + s[d], 0) / DIMENSIONS.length);

  // patterns
  const cands: [string, number][] = [
    ["context", mpRatio * 100],
    ["rambler", wc > 160 ? 70 + (wc - 160) / 4 : wc / 4],
    ["scatterer", sc > 6 && !hasClose ? 65 + sc : 30],
    ["vague", specifics === 0 ? 62 : 20],
    ["underseller", specifics > 0 && !hasClose ? 55 : 25],
    ["overexplainer", mpIdx < sc - 4 ? 60 + (sc - mpIdx) * 2 : 20],
    ["flat", hedges > 2 ? 58 : 15],
    ["datadumper", specifics > 6 ? 70 : 10],
    ["safe", 40],
  ];
  cands.sort((a, b) => b[1] - a[1]);
  const strong = overall >= 74 && mpRatio < 0.2;
  const primary = strong ? "structured" : cands[0][0];
  const secondary = strong ? cands[0][0] : cands[1][0];

  const sorted = [...DIMENSIONS].sort((a, b) => s[b] - s[a]);
  const first = sentences[0] ?? "";
  const mp = sentences[mpIdx] ?? first;

  const dim = (d: Dimension): DimensionResult => {
    const lib: Record<Dimension, [string, string, string]> = {
      structure: [mpRatio > 0.3 ? "Your main point appears after several supporting details." : "Your answer leads with its point — listeners know where you're going.", `Main point lands at sentence ${mpIdx + 1} of ${sc}.`, "Lead with the answer → explain why → give evidence → close with the result."],
      clarity: [avgLen > 22 ? "Long sentences make the listener hold too much at once." : "Sentences are easy to follow.", `Average sentence: ${avgLen} words.`, "Keep sentences under 20 words. One idea per sentence."],
      conciseness: [wc > 160 ? "Useful content, but more words than the point needs." : "You kept it tight.", `${wc} words${repeated_words[0] ? `, “${repeated_words[0].word}” repeated ${repeated_words[0].count}×` : ""}.`, "Cut background that doesn't change the listener's understanding."],
      relevance: ["How directly the answer addresses the question asked.", `Question: “${question}”`, "Echo the question's key word in your first sentence."],
      impact: [specifics ? "You included concrete specifics." : "The result isn't quantified, so it's easy to forget.", specifics ? `${specifics} specific numbers or figures.` : "No numbers, names or measurable outcomes.", "Add one number: time saved, % change, people affected."],
      delivery: [responseType === "voice" ? `Pace of ${wpm} wpm${wpm > 170 ? " feels rushed" : wpm < 110 ? " feels slow" : " is comfortable"}.` : "Written flow and rhythm.", `${fillerCount} filler words.`, "Pause instead of filling silence."],
      confidence: [hedges ? "Hedging language softens your position." : "You state things plainly.", hedges ? `${hedges} hedges (“I think”, “maybe”…).` : "No hedges detected.", "Replace “I think we could” with “I recommend”."],
      memorability: [hasClose ? "You close on a result — it sticks." : "The ending trails off, so nothing anchors the answer.", `Last line: “${truncate(sentences[sc - 1] ?? "", 80)}”`, "End with one line the listener could repeat."],
    };
    const [happened, evidence, tryThis] = lib[d];
    return { score: s[d], happened, evidence, tryThis };
  };
  const dimensions = Object.fromEntries(DIMENSIONS.map((d) => [d, dim(d)])) as Record<Dimension, DimensionResult>;

  const why: string[] = [];
  if (mpRatio > 0.3) why.push("Main point appeared too late");
  if (wordsBefore > 40) why.push("Too much background up front");
  if (!specifics) why.push("Result was not specific");
  if (!hasClose) why.push("The ending didn't land the message");
  if (fillerCount > 3) why.push("Filler words diluted key moments");
  if (!why.length) why.push("Very little — a supporting detail could be sharper");

  // segments
  const segs: Segment[] = [];
  let t = 0;
  const add = (label: string, n: number, flag?: string) => { if (n <= 0) return; const d = Math.max(1, Math.round(n * secPerWord)); segs.push({ label, start: t, end: t + d, flag }); t += d; };
  const restWords = wc - wordsBefore;
  add("Context", wordsBefore, wordsBefore > 40 ? "Too long before the point" : undefined);
  add("Main point", Math.min(restWords, (mp.split(/\s+/).length)));
  const remaining = Math.max(0, restWords - mp.split(/\s+/).length);
  add("Details", Math.round(remaining * 0.55), repeated_words.length ? "Repetition here" : undefined);
  add("Example", Math.round(remaining * 0.25), !specifics ? "Lacks specifics" : undefined);
  add(hasClose ? "Result" : "Trail-off", Math.round(remaining * 0.2), hasClose ? undefined : "No clear close");

  const strengths = sorted.slice(0, 3).map((d) => strengthLine(d));
  const improvements = sorted.slice(-3).reverse().map((d) => dimensions[d].tryThis);
  const weakest = sorted[sorted.length - 1];
  const drillMap: Record<Dimension, string> = { structure: "five-sec", clarity: "one-sentence", conciseness: "cut-30", relevance: "specific", impact: "result-first", delivery: "cut-30", confidence: "three-steps", memorability: "exec-summary" };

  const P = PATTERNS[primary];
  return {
    primary_pattern: primary, secondary_pattern: secondary, scores: s, overall, dimensions,
    summary: strong ? "Clear and well-ordered. Your point arrives early and the close reinforces it." : `${P.desc} ${mpRatio > 0.3 ? "Useful content is there, but your main point appears late and ideas compete for attention." : "The core is there — sharpening one dimension will change how it lands."}`,
    main_point_delay: mainDelay, word_count: wc, sentence_count: sc, avg_sentence_length: avgLen, wpm, duration,
    filler_words, repeated_words,
    pauses: responseType === "voice" ? Math.round(sc * 1.4) : undefined,
    long_pauses: responseType === "voice" ? Math.max(0, Math.round(sc / 4)) : undefined,
    strengths, improvements,
    what_got_lost: {
      intended: `“${truncate(mp, 140)}”`,
      heard: mpRatio > 0.3 ? "“Several things happened, there was some background, and eventually it worked out.”" : `“${truncate(first, 110)}” — then a lot of supporting detail.`,
      why,
      makeItLand: ["Open with your point in one sentence", "Give the single most relevant reason", "Prove it with one specific example", "Close with the result — and a number"],
    },
    example_structure: `1. Point: ${truncate(mp, 90)}\n2. Why: the one reason that matters most to this listener.\n3. Evidence: one concrete example with a number.\n4. Close: restate the result in a single memorable line.`,
    segments: segs,
    recommended_drill: drillMap[weakest],
    retry_instruction: mpRatio > 0.3 ? "Try again — say your main point in the first 5 seconds." : `Try again — focus on ${weakest}: ${dimensions[weakest].tryThis}`,
  };
}

function overlap(a: string, b: string) {
  const ka = new Set(a.toLowerCase().match(/[a-z]{4,}/g) || []);
  return (b.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => ka.has(w)).length;
}
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; }
function strengthLine(d: Dimension) {
  return ({ structure: "Clear order — the listener can follow your path", clarity: "Easy-to-follow sentences", conciseness: "Economical with words", relevance: "Stayed on the question asked", impact: "Concrete, measurable specifics", delivery: "Comfortable rhythm", confidence: "Direct, unhedged language", memorability: "A close that sticks" } as const)[d];
}

// ---------------------------------------------------------------
// Backend → local Analysis adapter
//
// The Render backend's /api/trial/analyze and /api/paid/analyze return a
// nested shape:
//
//   {
//     transcribed_text,
//     signals:  { word_count, words_per_minute, duration_seconds,
//                 filler_words: { total, percentage, breakdown },
//                 sentences: { average_length, longest, total },
//                 main_point_delay_seconds, signal_to_noise_ratio,
//                 vocabulary: { unique, total, richness } },
//     metrics:  { filler_discipline, point_first, concreteness,
//                 overall_score,            // 0–10 scale
//                 focus_score, focus_note,
//                 structure_score, structure_note,
//                 delivery_score, delivery_note },
//     diagnosis:{ pattern_name, pattern_description, pattern_id,
//                 confidence, evidence: [{ text, role }],
//                 intent, listener_question, why_this_matters },
//     gap:      { what_got_lost, unspoken_gap },
//     coaching: { one_thing_to_change, recommended_structure[],
//                 what_worked },
//     before_after_rewrite: { executive_version },
//     drill_id, user_id, is_trial
//   }
//
// This maps that onto the frontend's `Analysis` type so the report UI
// keeps working unchanged. Fields the backend doesn't provide are
// derived where possible, otherwise defaulted — never `undefined`.
// ---------------------------------------------------------------
export function normalizeBackendAnalysis(raw: unknown): Analysis {
  const b = (raw ?? {}) as Record<string, any>;

  const signals = (b.signals ?? {}) as Record<string, any>;
  const metrics = (b.metrics ?? {}) as Record<string, any>;
  const diagnosis = (b.diagnosis ?? {}) as Record<string, any>;
  const gap = (b.gap ?? {}) as Record<string, any>;
  const coaching = (b.coaching ?? {}) as Record<string, any>;
  const rewrite = (b.before_after_rewrite ?? b.before_after ?? {}) as Record<string, any>;

  // ---------- safe helpers ----------
  const num = (v: unknown, fallback = 0): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;

  const strArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];

  // ---------- scores ----------
  // Backend provides:
  //   metrics.structure_score    0–100  → structure  (fallback: point_first)
  //   metrics.delivery_score     0–100  → delivery   (fallback: filler_discipline)
  //   metrics.focus_score        0–100  → relevance
  //   metrics.concreteness       0–100  → impact
  // Anything else (clarity, conciseness, confidence, memorability) is
  // derived from what we do have, so nothing sits at 0.
  const structureScore =
    num(metrics.structure_score) || num(metrics.point_first) || 50;

  const deliveryScore =
    num(metrics.delivery_score) || num(metrics.filler_discipline) || 50;

  const relevanceScore = num(metrics.focus_score) || 50;
  const impactScore = num(metrics.concreteness) || 50;

  const clarityScore = Math.round((structureScore + deliveryScore) / 2);

  const longestSentence = num(signals.sentences?.longest);
  const concisenessScore = Math.round(
    Math.max(0, Math.min(100, 100 - Math.max(0, longestSentence - 12) * 3)),
  );

  const confidenceScore = Math.round(deliveryScore);
  const memorabilityScore = Math.round(impactScore);

  const scores: Record<Dimension, number> = {
    structure: Math.round(structureScore),
    clarity: clarityScore,
    conciseness: concisenessScore,
    relevance: Math.round(relevanceScore),
    impact: Math.round(impactScore),
    delivery: Math.round(deliveryScore),
    confidence: confidenceScore,
    memorability: memorabilityScore,
  };

  // Backend's overall_score is 0–10. Normalize to 0–100.
  const rawOverall = num(metrics.overall_score);
  const overall = Math.round(
    rawOverall <= 10 ? rawOverall * 10 : rawOverall,
  );

  // ---------- evidence text (shared) ----------
  const evidenceText = Array.isArray(diagnosis.evidence)
    ? diagnosis.evidence
        .map((e: Record<string, any>) => str(e?.text))
        .filter(Boolean)
        .join(" · ")
    : "";

  // ---------- dimensions ----------
  const dim = (
    score: number,
    happened: string,
    evidence: string,
    tryThis: string,
  ): DimensionResult => ({ score, happened, evidence, tryThis });

  const oneThingToChange =
    str(coaching.one_thing_to_change) ||
    "Lead with a direct answer, then support it with one concrete example.";

  const dimensions: Record<Dimension, DimensionResult> = {
    structure: dim(
      scores.structure,
      str(metrics.structure_note) ||
        "How well the response is organized around the question asked.",
      evidenceText,
      oneThingToChange,
    ),
    clarity: dim(
      scores.clarity,
      "How easy the response is to follow.",
      evidenceText,
      "Keep sentences short. One idea per sentence.",
    ),
    conciseness: dim(
      scores.conciseness,
      `Average sentence: ${num(signals.sentences?.average_length)} words.`,
      evidenceText,
      "Cut anything that doesn't change the listener's understanding.",
    ),
    relevance: dim(
      scores.relevance,
      str(metrics.focus_note) ||
        "How directly the response addresses the question asked.",
      evidenceText,
      "Echo the question's key word in your first sentence.",
    ),
    impact: dim(
      scores.impact,
      "How concrete and memorable the response is.",
      evidenceText,
      "Add one number, name, or measurable outcome.",
    ),
    delivery: dim(
      scores.delivery,
      str(metrics.delivery_note) ||
        "Pace, rhythm, and filler-word discipline.",
      `${num(signals.filler_words?.total)} filler words · ${num(
        signals.words_per_minute,
      )} wpm.`,
      "Pause instead of filling silence.",
    ),
    confidence: dim(
      scores.confidence,
      "How directly you state your position.",
      evidenceText,
      "Replace hedging language with a plain statement.",
    ),
    memorability: dim(
      scores.memorability,
      "Whether the response gives the listener something to hold on to.",
      evidenceText,
      "End with one line the listener could repeat.",
    ),
  };

  // ---------- filler words ----------
  const fillerBreakdown =
    signals.filler_words?.breakdown &&
    typeof signals.filler_words.breakdown === "object"
      ? (signals.filler_words.breakdown as Record<string, unknown>)
      : {};

  const filler_words = Object.entries(fillerBreakdown)
    .map(([word, count]) => ({ word, count: num(count) }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  const repeated_words: { word: string; count: number }[] = [];

  // ---------- what got lost ----------
  const whyList = [
    str(diagnosis.why_this_matters),
    str(gap.unspoken_gap),
  ].filter(Boolean);

  const what_got_lost = {
    intended: str(diagnosis.intent),
    heard:
      str(diagnosis.listener_question) ||
      str(gap.what_got_lost) ||
      "—",
    why: whyList.length > 0 ? whyList : ["—"],
    makeItLand: strArray(coaching.recommended_structure),
  };

  // ---------- strengths / improvements ----------
  const strengths = [
    str(coaching.what_worked),
    num(metrics.filler_discipline) > 0
      ? `Filler discipline: ${num(metrics.filler_discipline)}/100.`
      : "",
  ].filter(Boolean);

  const improvements = [
    str(coaching.one_thing_to_change),
    str(metrics.focus_note),
    str(metrics.structure_note),
  ].filter(Boolean);

  // ---------- example structure ----------
  const example_structure =
    Array.isArray(coaching.recommended_structure) &&
    coaching.recommended_structure.length > 0
      ? coaching.recommended_structure
          .map((s: unknown, i: number) => `${i + 1}. ${str(s)}`)
          .join("\n")
      : str(rewrite.executive_version);

  return {
    primary_pattern:
      str(diagnosis.pattern_name) ||
      str(b.primary_pattern) ||
      "structured",
    secondary_pattern: str(b.secondary_pattern) || "",

    scores,
    overall,
    dimensions,

    summary:
      str(diagnosis.pattern_description) ||
      str(diagnosis.why_this_matters) ||
      str(b.summary),

    main_point_delay: num(signals.main_point_delay_seconds),
    word_count: num(signals.word_count),
    sentence_count: num(signals.sentences?.total),
    avg_sentence_length: num(signals.sentences?.average_length),
    wpm: num(signals.words_per_minute),
    duration: num(signals.duration_seconds),

    filler_words,
    repeated_words,
    pauses: undefined,
    long_pauses: undefined,

    strengths,
    improvements,

    what_got_lost,

    example_structure:
      example_structure ||
      str(rewrite.executive_version) ||
      "",

    segments: [],

    recommended_drill: "",

    retry_instruction:
      str(coaching.one_thing_to_change) ||
      "Try again — lead with a direct answer.",
  };
}
