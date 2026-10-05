// Single home for fallback content. Only the data provider imports this file.
import type { DrillTeaser, FAQItem, HomepageContent, PracticeMoment, PricingPlan } from "./types";

export const FALLBACK_MOMENTS: PracticeMoment[] = [
  { id: "interview", name: "Interview", description: "Behavioral questions, difficult projects, leadership stories.", category: "interview", icon: "briefcase", common: true, active: true },
  { id: "high-stakes", name: "High-stakes conversation", description: "Disagree, give feedback, handle sensitive moments.", category: "conversation", icon: "message", active: true },
  { id: "presentation", name: "Presentation", description: "Recommendations and concise executive explanations.", category: "presentation", icon: "presentation", active: true },
  { id: "leadership", name: "Leadership", description: "Executive updates, ambiguity, difficult decisions.", category: "everyday", icon: "crown", active: true },
  { id: "persuasion", name: "Persuasion", description: "Influence stakeholders and get buy-in.", category: "sales", icon: "handshake", active: true },
  { id: "custom", name: "Custom", description: "Practice any situation.", category: "custom", icon: "sparkles", active: true },
];

export const FALLBACK_HOMEPAGE: HomepageContent = {
  hero: {
    eyebrow: "Practice for moments that matter.",
    headline: "Stop losing opportunities to",
    headlineAccent: "rambling",
    rotatingWords: ["Rambling", "Scattered", "Unclear", "Forgettable"],
    body: "Practice the moment. See what got lost. Say it again.",
    audience: "For job seekers, managers and students.",
    cta: "Try TheUnspoken Free",
    ctaSignedIn: "Start Practicing",
    mobileHeadline: "Practice for moments that matter.",
    mobileBody: "Practice a real response. See what got lost. Fix one thing. Try again.",
  },
  proof: {
    title: "Same moment. Better response.",
    demo: {
      question: "Tell me about a difficult project.",
      whatGotLost: "The decision you actually made.",
      caption: "Same moment. Different response.",
      before: { attemptNumber: 1, patternLabels: ["SCATTERED", "RAMBLING"], mainPointDelay: 23, structureScore: 42, concisenessScore: 55,
        responseSequence: [{ label: "Context", at: 0 }, { label: "Background", at: 6 }, { label: "More context", at: 11 }, { label: "Explanation", at: 17 }, { label: "Main point", at: 23, main: true }] },
      after: { attemptNumber: 2, patternLabels: ["STRUCTURED", "CONCISE"], mainPointDelay: 5, structureScore: 68, concisenessScore: 73,
        responseSequence: [{ label: "Main point", at: 5, main: true }, { label: "Reason", at: 12 }, { label: "Example", at: 20 }] },
    },
    before: "SCATTERED · RAMBLING",
    after: "STRUCTURED · CONCISE",
    mainPoint: { metric: "Time to main point", before: 23, after: 5, unit: "seconds", direction: "down-is-better" },
    metrics: [
      { metric: "Structure", before: 42, after: 68, direction: "up" },
      { metric: "Conciseness", before: 55, after: 73, direction: "up" },
    ],
  },
  transformations: [
    { from: "RAMBLING", to: "CONCISE" },
    { from: "SCATTERED", to: "STRUCTURED" },
    { from: "UNCLEAR", to: "PRECISE" },
    { from: "FORGETTABLE", to: "MEMORABLE" },
  ],
  howItWorks: [
    { step: 1, title: "Practice", shortTitle: "Choose a real moment." },
    { step: 2, title: "See", shortTitle: "See what got lost." },
    { step: 3, title: "Fix", shortTitle: "Work on one thing." },
    { step: 4, title: "Retry", shortTitle: "Try it again." },
  ],
  feedback: {
    whatYouSaid: "“I started by explaining the background...”",
    whatGotLost: "The decision you actually made.",
    why: "Your main point appeared too late.",
    tryThis: "Lead with the decision.",
  },
  comparison: {
    before: { label: "Attempt 01", patternLabel: "SCATTERED", structure: 42, mainPointSeconds: 23 },
    after: { label: "Attempt 02", patternLabel: "STRUCTURED", structure: 68, mainPointSeconds: 5 },
    caption: "Same person. Same moment. Different response.",
  },
  pattern: {
    primaryPattern: { code: "SCATTERED", label: "Scattered", description: "Several useful ideas compete for attention." },
    secondaryPattern: { code: "OVER_EXPLAINING", label: "Over-explaining" },
    strength: { code: "RELEVANCE", label: "Relevance" },
    currentFocus: { code: "STRUCTURE", label: "Structure" },
    nextMove: "Make the point → put the ideas in order → stop.",
  },
  contact: {
    email: "info@theunspoken.co.in",
    heading: "Have a question or want a callback?",
    intro: "Have a question, need help, or want to talk about TheUnspoken?",
  },
};

export const FALLBACK_DRILL_TEASERS: DrillTeaser[] = [
  { id: "five-sec", title: "5-Second Main Point", description: "Get to the answer before the background.", targetSkill: "structure", duration: 2, difficulty: "Easy", active: true },
  { id: "three-steps", title: "Answer in 3 Steps", description: "Turn scattered ideas into a clear sequence.", targetSkill: "structure", duration: 3, difficulty: "Medium", active: true },
  { id: "result-first", title: "Give the Result First", description: "Lead with what changed.", targetSkill: "impact", duration: 3, difficulty: "Medium", active: false },
  { id: "cut-30", title: "Cut 30 Words", description: "Say the same thing with less.", targetSkill: "conciseness", duration: 3, difficulty: "Medium", active: false },
  { id: "specific", title: "Make It Specific", description: "Replace vague claims with evidence.", targetSkill: "relevance", duration: 3, difficulty: "Medium", active: true },
];

export const FALLBACK_PRICING: PricingPlan[] = [
  { id: "free", name: "Free", price: 0, currency: "INR", billingPeriod: "once", features: ["First practices", "Basic analysis", "Your pattern"], cta: "Start Practicing", active: true },
  { id: "practice", name: "Practice", price: 499, currency: "INR", billingPeriod: "month", features: ["Unlimited practice", "Detailed analysis", "Voice + text", "History", "Drills", "Progress"], cta: "Choose Plan", highlighted: true, active: true },
  { id: "sprint", name: "Sprint", price: 1499, currency: "INR", billingPeriod: "program", features: ["Goal-specific practice", "Advanced analysis", "Personalized drills", "Progress report"], cta: "Start Sprint", active: true },
];

export const FALLBACK_FAQ: FAQItem[] = [
  { id: "what", question: "What is TheUnspoken?", answer: "TheUnspoken is a practice platform for important communication moments. You practice a real response, see what got lost, understand why, and try again." },
  { id: "practice", question: "What can I practice?", answer: "You can practice interviews, presentations, leadership communication, difficult conversations, persuasion, professional updates, group discussions, and custom situations." },
  { id: "feedback", question: "How does TheUnspoken give feedback?", answer: "TheUnspoken analyzes what you actually said and identifies specific patterns such as structure, clarity, conciseness, relevance, impact, delivery, confidence, and memorability." },
  { id: "script", question: "Is TheUnspoken writing answers for me?", answer: "No. TheUnspoken is designed around practice rather than giving you a script to memorize. The goal is to help you improve how you communicate your own ideas." },
  { id: "voice", question: "Can I practice with text as well as voice?", answer: "Yes. TheUnspoken supports both text and voice practice where available." },
  { id: "retry", question: "How does retry work?", answer: "After you respond, TheUnspoken identifies what got lost and gives you a specific thing to work on. You then try the same or a similar moment again so you can see whether your response changed." },
  { id: "who", question: "Who is TheUnspoken for?", answer: "TheUnspoken is for anyone who needs to communicate clearly when it matters — from interviews and career conversations to presentations, leadership, persuasion, and difficult workplace conversations." },
  { id: "free", question: "Is there a free version?", answer: "Yes. You can start practicing for free. Paid plans provide more practice, deeper analysis, history, targeted drills, and progress tracking." },
];
