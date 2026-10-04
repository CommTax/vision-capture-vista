// Single home for fallback content. Only the data provider imports this file.
import type { DrillTeaser, FAQItem, HomepageContent, PracticeMoment, PricingPlan } from "./types";

export const FALLBACK_MOMENTS: PracticeMoment[] = [
  { id: "interview", name: "Interview", description: "Tell me about a difficult project.", category: "interview", icon: "briefcase", common: true, active: true },
  { id: "career", name: "Career", description: "Why are you ready for the next level?", category: "conversation", icon: "trending", active: true },
  { id: "high-stakes", name: "High-stakes conversation", description: "Tell your manager you disagree.", category: "conversation", icon: "message", active: true },
  { id: "presentation", name: "Presentation", description: "Explain your recommendation in 60 seconds.", category: "presentation", icon: "presentation", active: true },
  { id: "leadership", name: "Leadership", description: "Give an executive update.", category: "everyday", icon: "crown", active: true },
  { id: "persuasion", name: "Persuasion", description: "Get a skeptical stakeholder to support your idea.", category: "sales", icon: "handshake", active: true },
  { id: "custom", name: "Custom", description: "Practice any situation you have coming up.", category: "custom", icon: "sparkles", active: true },
];

export const FALLBACK_HOMEPAGE: HomepageContent = {
  hero: {
    eyebrow: "Practice for moments that matter.",
    headline: "Say what you mean.",
    headlineAccent: "Make it land.",
    body: "Practice the answers, conversations, and high-stakes moments that matter — then see exactly what gets lost in your response.",
    mobileHeadline: "Practice for moments that matter.",
    mobileBody: "Practice a real response. See what got lost. Fix one thing. Try again.",
  },
  proof: {
    title: "Same moment. Better response.",
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
    { from: "UNCONVINCING", to: "PERSUASIVE" },
  ],
  howItWorks: [
    { step: 1, title: "Choose a real situation", shortTitle: "Choose a moment" },
    { step: 2, title: "Give your response", shortTitle: "Give your response" },
    { step: 3, title: "See what got lost", shortTitle: "See what got lost" },
    { step: 4, title: "Fix one thing", shortTitle: "Fix one thing" },
    { step: 5, title: "Try again", shortTitle: "Try again" },
  ],
  feedback: {
    whatYouSaid: "“I started by explaining the background...”",
    whatGotLost: "The decision you actually made.",
    why: "Your main point appeared after 23 seconds of context.",
    tryThis: "Lead with the decision. Then explain why.",
  },
  comparison: {
    before: { label: "Attempt 01", patternLabel: "SCATTERED", structure: 42, mainPointSeconds: 23 },
    after: { label: "Attempt 02", patternLabel: "STRUCTURED", structure: 68, mainPointSeconds: 5 },
    caption: "Same person. Same moment. Different response.",
  },
  pattern: {
    primaryPattern: { code: "SCATTERED", label: "Scattered", description: "Several useful ideas, but they compete for attention." },
    secondaryPattern: { code: "OVER_EXPLAINING", label: "Over-explaining" },
    strength: { code: "RELEVANCE", label: "Relevance" },
    currentFocus: { code: "STRUCTURE", label: "Structure" },
    nextMove: "Make the point → put the ideas in order → stop.",
  },
  contact: {
    email: "info@theunspoken.co.in",
    heading: "Have a question or want a callback?",
    intro: "Have a question, need help, or want to talk about Unspoken?",
  },
};

export const FALLBACK_DRILL_TEASERS: DrillTeaser[] = [
  { id: "five-sec", title: "5-Second Main Point", description: "Get to your answer before the background.", targetSkill: "structure", duration: 2, difficulty: "Easy", active: true },
  { id: "three-steps", title: "Answer in 3 Steps", description: "Turn scattered ideas into a clear sequence.", targetSkill: "structure", duration: 3, difficulty: "Medium", active: true },
  { id: "result-first", title: "Give the Result First", description: "Lead with what changed.", targetSkill: "impact", duration: 3, difficulty: "Medium", active: true },
  { id: "cut-30", title: "Cut 30 Words", description: "Say the same thing with less.", targetSkill: "conciseness", duration: 3, difficulty: "Medium", active: true },
  { id: "specific", title: "Make It Specific", description: "Replace vague claims with evidence.", targetSkill: "relevance", duration: 3, difficulty: "Medium", active: true },
];

export const FALLBACK_PRICING: PricingPlan[] = [
  { id: "free", name: "Free", price: 0, currency: "INR", billingPeriod: "once", features: ["First practice sessions", "Basic response analysis", "Primary response pattern", "Limited history"], cta: "Start Practicing", active: true },
  { id: "practice", name: "Practice Pass", price: 499, currency: "INR", billingPeriod: "month", features: ["Unlimited practice", "Detailed analysis", "Voice + text", "Response history", "Targeted drills", "Progress tracking"], cta: "Choose Plan", highlighted: true, active: true },
  { id: "sprint", name: "Sprint", price: 1499, currency: "INR", billingPeriod: "program", features: ["Goal-specific practice program", "Advanced analysis", "Interview preparation", "High-stakes scenarios", "Personalized drills", "Progress report"], cta: "Start Sprint", active: true },
];

export const FALLBACK_FAQ: FAQItem[] = [
  { id: "what", question: "What is Unspoken?", answer: "Unspoken is a practice platform for important communication moments. You practice a real response, see what got lost, understand why, and try again." },
  { id: "practice", question: "What can I practice?", answer: "You can practice interviews, presentations, leadership communication, difficult conversations, persuasion, professional updates, group discussions, and custom situations." },
  { id: "feedback", question: "How does Unspoken give feedback?", answer: "Unspoken analyzes what you actually said and identifies specific patterns such as structure, clarity, conciseness, relevance, impact, delivery, confidence, and memorability." },
  { id: "script", question: "Is Unspoken writing answers for me?", answer: "No. Unspoken is designed around practice rather than giving you a script to memorize. The goal is to help you improve how you communicate your own ideas." },
  { id: "voice", question: "Can I practice with text as well as voice?", answer: "Yes. Unspoken supports both text and voice practice where available." },
  { id: "retry", question: "How does the retry work?", answer: "After you respond, Unspoken identifies what got lost and gives you a specific thing to work on. You then try the same or a similar moment again so you can see whether your response changed." },
  { id: "who", question: "Who is Unspoken for?", answer: "Unspoken is for anyone who needs to communicate clearly when it matters — from interviews and career conversations to presentations, leadership, persuasion, and difficult workplace conversations." },
  { id: "free", question: "Is there a free version?", answer: "Yes. You can start practicing for free. Paid plans provide more practice, deeper analysis, history, targeted drills, and progress tracking." },
];
