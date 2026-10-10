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
    amount_paise: 99900,             // ₹999
    amount_display: "₹999",
    days: 14,
  },
  pass: {
    product: "practice",
    label: "Practice Pass",
    description: "Ongoing practice. New patterns, drills, and coaching.",
    days: null,
    variants: {
      monthly: {
        amount_paise: 249900,        // ₹2,499
        amount_display: "₹2,499",
        per_month_display: "₹2,499 / month",
        note: "Cancel anytime",
      },
      annual: {
        amount_paise: 2398800,       // ₹1,999 × 12 = ₹23,988
        amount_display: "₹23,988",
        per_month_display: "₹1,999 / month · billed ₹23,988 yearly",
        note: "Save ₹6,000 vs monthly",
      },
    },
  },
};

export const PLAN_KEYS = Object.keys(PRICES) as [PlanKey, ...PlanKey[]];
