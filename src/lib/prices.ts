// Price table for display only. The backend (app/config.py) is the
// source of truth for what's actually charged. Keep these in sync.
export type PlanKey = "sprint" | "pass";
export type PassBilling = "annual" | "monthly";

export type PlanDisplay = {
  product: "sprint" | "practice";
  label: string;
  description: string;
  days: number | null;
  /** Used by Sprint (single price). */
  amount_paise?: number;
  amount_display?: string;
  /** Used by Pass (billed monthly or annually). */
  variants?: Record<PassBilling, {
    amount_paise: number;
    amount_display: string;
    per_month_display?: string;
    note?: string;
  }>;
};

export const PRICES: Record<PlanKey, PlanDisplay> = {
  sprint: {
    product: "sprint",
    label: "Sprint",
    description: "14-day focused practice. Daily reps with a clear goal.",
    amount_paise: 100,               // ₹1
    amount_display: "₹1",
    days: 14,
  },
  pass: {
    product: "practice",
    label: "Practice Pass",
    description: "Ongoing practice. New patterns, drills, and coaching.",
    days: null,
    variants: {
      monthly: {
        amount_paise: 300,           // ₹3
        amount_display: "₹3",
        per_month_display: "₹3 / month",
        note: "Cancel anytime",
      },
      annual: {
        amount_paise: 2400,          // ₹2 × 12
        amount_display: "₹24",
        per_month_display: "₹2 / month · billed ₹24 yearly",
        note: "Save ₹12 vs monthly",
      },
    },
  },
};

export const PLAN_KEYS = Object.keys(PRICES) as [PlanKey, ...PlanKey[]];
