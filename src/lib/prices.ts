// Single price table (amounts in paise). The server reads amounts from here — never from the client.
export type PlanKey = "practice-monthly" | "sprint-7d" | "sprint-14d" | "sprint-28d" | "sprint-3m";

export const PRICES: Record<PlanKey, { product: "practice" | "sprint"; label: string; amount_paise: number; days: number }> = {
  "practice-monthly": { product: "practice", label: "Practice Pass · 1 month", amount_paise: 49900, days: 30 },
  "sprint-7d": { product: "sprint", label: "Sprint · 7 days", amount_paise: 49900, days: 7 },
  "sprint-14d": { product: "sprint", label: "Sprint · 14 days", amount_paise: 79900, days: 14 },
  "sprint-28d": { product: "sprint", label: "Sprint · 28 days", amount_paise: 149900, days: 28 },
  "sprint-3m": { product: "sprint", label: "Sprint · 3 months", amount_paise: 299700, days: 90 },
};

export const PLAN_KEYS = Object.keys(PRICES) as [PlanKey, ...PlanKey[]];
