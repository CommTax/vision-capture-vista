// Typed content models. Shapes are backend-ready: a future provider returns the same types.
import type { ModeId } from "@/lib/data";

export type IconKey = "briefcase" | "trending" | "message" | "presentation" | "crown" | "handshake" | "sparkles";

/** One row of chips under a practice moment card on the landing page. */
export interface PracticeMomentChipRow {
  /** Small label above the row, e.g. "Role specific". */
  label: string;
  /** The chips themselves. */
  items: string[];
  /** Optional trailing chip, e.g. "+12 more". Rendered distinctly. */
  moreLabel?: string;
}

export interface PracticeMoment {
  id: string;
  name: string;
  description: string;
  /** Practice category the moment opens in. */
  category: ModeId;
  icon: IconKey;
  common?: boolean;
  active: boolean;
  /** Optional chip rows shown on the landing card (2 rows max on desktop). */
  chipRows?: PracticeMomentChipRow[];
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
  /** Short flag on the card, e.g. "Best for upcoming interviews". */
  badge?: string;
  active: boolean;
}

export interface FAQItem { id: string; question: string; answer: string }

export interface ContactInfo { email: string; heading: string; intro: string }

export interface HeroContent { eyebrow: string; headline: string; headlineAccent: string; body: string; mobileHeadline: string; mobileBody: string; rotatingWords: string[]; audience: string; cta: string; ctaSignedIn: string }

export interface ResponseSegment { label: string; /** Seconds into the response. */ at: number; main?: boolean }
export interface DemoAttempt { attemptNumber: number; patternLabels: string[]; mainPointDelay: number; structureScore: number; concisenessScore: number; responseSequence: ResponseSegment[] }
export interface ProofDemo { question: string; whatGotLost: string; caption: string; before: DemoAttempt; after: DemoAttempt }

export interface ProofContent { demo: ProofDemo; title: string; metrics: Metric[]; mainPoint: Metric; before: string; after: string }

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
