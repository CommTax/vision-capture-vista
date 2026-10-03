export type ModeId = "interview" | "conversation" | "presentation" | "group" | "sales" | "everyday" | "custom";

export type Question = { id: string; mode: ModeId; text: string; context: string; difficulty: "Easy" | "Medium" | "Hard"; seconds: number; intended?: string };

export const DIMENSIONS = ["structure", "clarity", "conciseness", "relevance", "impact", "delivery", "confidence", "memorability"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const MODES: { id: ModeId; name: string; blurb: string; tag: string }[] = [
  { id: "interview", name: "Interview", blurb: "Tell me about yourself, failures, leadership, conflict.", tag: "Most practiced" },
  { id: "conversation", name: "High-stakes conversation", blurb: "Promotion asks, salary, disagreeing with your manager.", tag: "Career" },
  { id: "presentation", name: "Presentation", blurb: "Openings, recommendations, explaining data.", tag: "Speaking" },
  { id: "group", name: "Group discussion", blurb: "A topic, a timer, your take.", tag: "Timed" },
  { id: "sales", name: "Sales & persuasion", blurb: "Pitches, objections, influencing stakeholders.", tag: "Influence" },
  { id: "everyday", name: "Professional communication", blurb: "Status updates, delays, escalations.", tag: "Daily" },
  { id: "custom", name: "Custom practice", blurb: "Describe any situation — we'll build the scenario.", tag: "Your call" },
];

export const LEVELS = ["Fresher", "Early career", "Mid career", "Senior / Leadership"] as const;

const q = (id: string, mode: ModeId, text: string, context: string, difficulty: Question["difficulty"], seconds: number): Question => ({ id, mode, text, context, difficulty, seconds });

export const QUESTIONS: Question[] = [
  q("int-1", "interview", "Tell me about yourself.", "Opening of a first-round interview", "Medium", 90),
  q("int-2", "interview", "Why should we hire you?", "Final round with the hiring manager", "Medium", 60),
  q("int-3", "interview", "Tell me about a difficult stakeholder situation.", "Behavioral round — stakeholder management", "Hard", 120),
  q("int-4", "interview", "Tell me about a time you failed.", "Behavioral round", "Hard", 90),
  q("int-5", "interview", "Why are you leaving your current company?", "Recruiter screen", "Medium", 60),
  q("int-6", "interview", "How do you lead a team through ambiguity?", "Executive interview", "Hard", 120),
  q("con-1", "conversation", "Ask your manager for a promotion.", "1:1 meeting, you've led two major launches this year", "Hard", 90),
  q("con-2", "conversation", "Your offer is 15% below market. Negotiate.", "Call with the recruiter", "Hard", 90),
  q("con-3", "conversation", "Tell a peer their work is slowing the team down.", "Private conversation", "Hard", 90),
  q("con-4", "conversation", "Say no to a VP's urgent request.", "Your team is at capacity", "Medium", 60),
  q("pre-1", "presentation", "Open your quarterly review presentation.", "Leadership audience, 10 minute slot", "Medium", 60),
  q("pre-2", "presentation", "Recommend one of two vendors to leadership.", "Decision meeting", "Hard", 90),
  q("pre-3", "presentation", "Explain why conversion dropped 12% last month.", "Data readout to product leads", "Hard", 90),
  q("grp-1", "group", "Should remote work be the default for knowledge workers?", "Group discussion, you speak second", "Medium", 60),
  q("grp-2", "group", "Will AI create more jobs than it removes?", "Group discussion opener", "Medium", 60),
  q("sal-1", "sales", "Pitch your product to a skeptical CFO.", "First meeting, 2 minutes", "Hard", 90),
  q("sal-2", "sales", "The customer says: 'It's too expensive.' Respond.", "Late-stage deal", "Medium", 60),
  q("sal-3", "sales", "Convince a stakeholder to fund your idea.", "Hallway conversation", "Medium", 60),
  q("evd-1", "everyday", "Tell your manager the project is two weeks late.", "Without sounding defensive", "Medium", 45),
  q("evd-2", "everyday", "Give leadership a 30-second status update.", "Weekly sync", "Easy", 30),
  q("evd-3", "everyday", "Explain a mistake you made to your team.", "Team standup", "Medium", 60),
];

export const PATTERNS: Record<string, { name: string; short: string; desc: string; to: string }> = {
  rambler: { name: "The Rambler", short: "RAMBLING", desc: "Too much detail before the point.", to: "CONCISE" },
  scatterer: { name: "The Scatterer", short: "SCATTERED", desc: "Several ideas without a clear order.", to: "STRUCTURED" },
  underseller: { name: "The Under-Seller", short: "UNDERSOLD", desc: "Good work, but weak impact.", to: "IMPACTFUL" },
  vague: { name: "The Vague Responder", short: "VAGUE", desc: "Broad claims without evidence.", to: "PRECISE" },
  context: { name: "The Context Builder", short: "SLOW START", desc: "Too much setup before answering.", to: "DIRECT" },
  datadumper: { name: "The Data Dumper", short: "DATA-HEAVY", desc: "Facts without a clear message.", to: "FOCUSED" },
  safe: { name: "The Safe Answer", short: "FORGETTABLE", desc: "Correct, but not distinctive.", to: "MEMORABLE" },
  flat: { name: "The Flat Delivery", short: "FLAT", desc: "Good content, little emphasis.", to: "CONFIDENT" },
  overexplainer: { name: "The Over-Explainer", short: "OVER-EXPLAINED", desc: "Keeps adding after the answer is clear.", to: "CRISP" },
  structured: { name: "The Clear Communicator", short: "STRUCTURED", desc: "Point first, support second, close strong.", to: "MEMORABLE" },
};

export type Drill = { id: string; name: string; objective: string; example: string; prompt: string; skill: Dimension; minutes: number };

export const DRILLS: Drill[] = [
  { id: "five-sec", name: "5-Second Main Point", objective: "State your answer in the first sentence.", example: "“I'd pick Vendor B — it's 20% cheaper and ships a month sooner.”", prompt: "Why do you want this job? Answer with your main point in the first sentence.", skill: "structure", minutes: 2 },
  { id: "cut-30", name: "Cut 30 Words", objective: "Say the same thing with fewer words.", example: "“Due to the fact that” → “Because”.", prompt: "Explain your current role in under 50 words.", skill: "conciseness", minutes: 3 },
  { id: "three-steps", name: "Answer in 3 Steps", objective: "Point → Reason → Example.", example: "“Yes. Because X. For example, last quarter…”", prompt: "Should your team adopt a four-day work week? Use point, reason, example.", skill: "structure", minutes: 3 },
  { id: "result-first", name: "Give the Result First", objective: "Lead with the outcome, then the story.", example: "“We cut churn by 18%. Here's how…”", prompt: "Describe a project you're proud of — start with the result.", skill: "impact", minutes: 3 },
  { id: "one-sentence", name: "One-Sentence Summary", objective: "Compress the whole message into one line.", example: "“The launch slipped two weeks because of a vendor delay; we're back on track.”", prompt: "Summarise your last week of work in one sentence.", skill: "clarity", minutes: 2 },
  { id: "specific", name: "Make It Specific", objective: "Replace broad claims with numbers, names and outcomes.", example: "“I improved things” → “I cut review time from 5 days to 2.”", prompt: "What is your biggest professional strength? Prove it with one specific.", skill: "relevance", minutes: 3 },
  { id: "exec-summary", name: "Executive Summary Challenge", objective: "Brief a busy executive in 30 seconds.", example: "Situation · Recommendation · Ask.", prompt: "Brief your CEO on a risk to your biggest project in 30 seconds.", skill: "memorability", minutes: 3 },
];

export const GOALS = ["Job Interview", "Promotion", "Presentation", "Leadership Communication", "Group Discussion", "Sales / Client Conversation", "General Communication", "Something Else"];
export const STRUGGLES = ["I ramble", "I lose my structure", "I struggle to get to the point", "I sound uncertain", "I don't know how to make my answers impactful", "I over-explain", "I struggle to think on the spot", "I'm not sure"];
export const EXPERIENCE = ["Student", "Fresher", "1–5 years", "5–15 years", "15+ years"];

export const BADGES = [
  { id: "first-rep", name: "First Rep", desc: "Completed your first response" },
  { id: "streak-3", name: "3-Day Streak", desc: "Practiced three days in a row" },
  { id: "first-improve", name: "First Improvement", desc: "Beat an earlier attempt" },
  { id: "point-made", name: "Point Made", desc: "Main point within 5 seconds" },
  { id: "structure", name: "Structure Builder", desc: "Structure score above 70" },
  { id: "clear", name: "Clear Communicator", desc: "Clarity score above 80" },
  { id: "exec", name: "Executive Mode", desc: "Complete the Executive Summary drill" },
];

export const modeName = (m: ModeId) => MODES.find((x) => x.id === m)?.name ?? m;
