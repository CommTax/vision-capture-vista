// Single home for fallback content. Only the data provider imports this file.
import type { DrillTeaser, FAQItem, HomepageContent, PracticeMoment, PricingPlan } from "./types";

// ── Moments — trimmed to 3 for a focused landing page ──
export const FALLBACK_MOMENTS: PracticeMoment[] = [
  {
    id: "interview",
    name: "Interview",
    description: "Walk in with your answers already tested.",
    category: "interview",
    icon: "briefcase",
    common: true,
    active: true,
    stats: "16 roles · 5 question types",
    chips: [
      { label: "Scrum Master",    category: "role" },
      { label: "Product Owner",   category: "role" },
      { label: "Project Manager", category: "role" },
      { label: "Sales Manager",   category: "role" },
      { label: "Situational",     category: "type" },
      { label: "Behavioural",     category: "type" },
      { label: "Functional",      category: "type" },
      { label: "Technical",       category: "type" },
      { label: "Self-awareness",  category: "type" },
    ],
  },
  {
    id: "high-stakes",
    name: "High-stakes conversation",
    description: "Say it honestly. Stay calm.",
    category: "conversation",
    icon: "message",
    active: true,
    stats: "10 situations · 4 common scenarios",
    chips: [
      { label: "Sales pitch",           category: "situation" },
      { label: "Idea buy-in",           category: "situation" },
      { label: "Addressing a crowd",    category: "situation" },
      { label: "Self-presentation",     category: "situation" },
      { label: "Disagree with manager", category: "scenario" },
      { label: "Give hard feedback",    category: "scenario" },
      { label: "Push back on scope",    category: "scenario" },
      { label: "Deliver bad news",      category: "scenario" },
    ],
  },
  {
    id: "custom",
    name: "Your own situation",
    description: "Anything you need to prepare for.",
    category: "custom",
    icon: "sparkles",
    active: true,
    stats: "Anything you need to prepare for",
    chips: [
      { label: "Your exact scenario",               category: "custom" },
      { label: "Your audience",                     category: "custom" },
      { label: "Your words",                        category: "custom" },
      { label: "A difficult performance review",    category: "custom" },
      { label: "A pitch you're not sure about",     category: "custom" },
      { label: "A conversation you've been avoiding", category: "custom" },
    ],
  },
  // Kept in the data but disabled — surfaced only via "practice your own question"
  { id: "presentation", name: "Presentation", description: "Lead with the point.", category: "presentation", icon: "presentation", active: false },
  { id: "leadership", name: "Leadership", description: "Executive updates, ambiguity, difficult decisions.", category: "everyday", icon: "crown", active: false },
  { id: "persuasion", name: "Persuasion", description: "Influence stakeholders and get buy-in.", category: "sales", icon: "handshake", active: false },
];

// ...rest of file unchanged (FALLBACK_HOMEPAGE, FALLBACK_DRILL_TEASERS, FALLBACK_PRICING, FALLBACK_FAQ)
