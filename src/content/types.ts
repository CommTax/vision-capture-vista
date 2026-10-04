// Typed content models. Shapes are backend-ready: a future provider returns the same types.
import type { ModeId } from "@/lib/data";

export type IconKey = "briefcase" | "trending" | "message" | "presentation" | "crown" | "handshake" | "sparkles";

export interface PracticeMoment {
  id: string;
  name: string;
  description: string;
  /** Practice category the moment opens in. */
  category: ModeId;
  icon: IconKey;
  common?: boolean;
  active: boolean;
}

export interface Metric {
  metric: string;
  before: number;
  after: number;
  unit?: "seconds" | "score";
  direction: "up" | "down-is-better";
}

export interface PatternRef { code: string; label: string; description?: string }

export interface PatternExample {
  primaryPattern: PatternRef;
  secondaryPattern: PatternRef;
  strength: PatternRef;
  currentFocus: PatternRef;
  nextMove: string;
}

export interface FeedbackExample { whatYouSaid: string; whatGotLost: string; why: string; tryThis: string }

export interface AttemptSummary { label: string; patternLabel: string; structure: number; mainPointSeconds: number }

export interface ComparisonExample { before: AttemptSummary; after: AttemptSummary; caption: string }

export interface ProblemTransformation { from: string; to: string }

export interface HowItWorksStep { step: number; title: string; shortTitle: string }

export interface DrillTeaser {
  id: string;
  title: string;
  description: string;
  targetSkill: string;
  duration: number;
  difficulty: "Easy" | "Medium" | "Hard";
  active: boolean;
}

export interface PricingPlan {
  id: "free" | "practice" | "sprint";
  name: string;
  price: number;
  currency: "INR";
  billingPeriod: "once" | "month" | "program";
  features: string[];
  cta: string;
  highlighted?: boolean;
  active: boolean;
}

export interface FAQItem { id: string; question: string; answer: string }

export interface ContactInfo { email: string; heading: string; intro: string }

export interface HeroContent { eyebrow: string; headline: string; headlineAccent: string; body: string; mobileHeadline: string; mobileBody: string }

export interface ProofContent { title: string; metrics: Metric[]; mainPoint: Metric; before: string; after: string }

export interface HomepageContent {
  hero: HeroContent;
  proof: ProofContent;
  transformations: ProblemTransformation[];
  howItWorks: HowItWorksStep[];
  feedback: FeedbackExample;
  comparison: ComparisonExample;
  pattern: PatternExample;
  contact: ContactInfo;
}
