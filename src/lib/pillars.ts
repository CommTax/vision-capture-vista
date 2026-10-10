// src/lib/pillars.ts
import type { Pillar, Technique, BitesCategoryId } from "@/content/types";

export function techniquesForPillar(
  pillar: Pillar,
  all: Technique[],
): Technique[] {
  return all.filter((t) => pillar.categories.includes(t.category));
}

export function techniquesForCategory(
  cat: BitesCategoryId,
  all: Technique[],
): Technique[] {
  return all.filter((t) => t.category === cat);
}

/**
 * CommTax paid plans. Backend has been observed returning:
 *   "sprint", "practice"                    (canonical)
 *   "Sprint", "SPRINT", " practice "        (case / whitespace drift)
 * Normalise before comparing so a stray capital doesn't gate a paying user.
 */
export function isPaidPlan(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = String(plan).toLowerCase().trim();
  return p === "practice" || p === "sprint";
}
