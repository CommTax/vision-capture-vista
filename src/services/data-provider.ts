// Content/data access layer. UI reads through these getters only.
// Today every getter returns the local fallback. To add a backend later, give a getter a
// `remote` source and pass it through `withFallback` — UI components stay unchanged.
import { DRILLS, type Drill } from "@/lib/data";
import { getState, type ResponseRecord, type State } from "@/lib/store";
import { FALLBACK_DRILL_TEASERS, FALLBACK_FAQ, FALLBACK_HOMEPAGE, FALLBACK_MOMENTS, FALLBACK_PRICING } from "@/content/fallback";
import type { DrillTeaser, FAQItem, HomepageContent, PracticeMoment, PricingPlan } from "@/content/types";

/** Use backend data when present and valid; otherwise the fallback. Never overrides valid values. */
export function withFallback<T>(remote: T | null | undefined, fallback: T): T {
  if (remote === null || remote === undefined) return fallback;
  if (Array.isArray(remote) && remote.length === 0) return fallback;
  return remote;
}

/** Async variant for a future backend fetch: request failures resolve to the fallback. */
export async function fetchWithFallback<T>(load: () => Promise<T | null | undefined>, fallback: T): Promise<T> {
  try { return withFallback(await load(), fallback); } catch { return fallback; }
}

export const dataProvider = {
  getPracticeMoments: (): PracticeMoment[] => withFallback<PracticeMoment[]>(null, FALLBACK_MOMENTS).filter((m) => m.active),
  getHomepageContent: (): HomepageContent => withFallback<HomepageContent>(null, FALLBACK_HOMEPAGE),
  getPricingPlans: (): PricingPlan[] => withFallback<PricingPlan[]>(null, FALLBACK_PRICING).filter((p) => p.active),
  getFaq: (): FAQItem[] => withFallback<FAQItem[]>(null, FALLBACK_FAQ),
  getDrillTeasers: (): DrillTeaser[] => withFallback<DrillTeaser[]>(null, FALLBACK_DRILL_TEASERS).filter((d) => d.active),
  getDrills: (): Drill[] => DRILLS,
  // User data currently lives in the browser store; a backend provider replaces these reads.
  getUserResponses: (): ResponseRecord[] => getState().responses,
  getProgress: (): Pick<State, "practiceDays" | "drillsDone" | "drillResults"> => {
    const s = getState();
    return { practiceDays: s.practiceDays, drillsDone: s.drillsDone, drillResults: s.drillResults };
  },
};

export function formatPrice(p: PricingPlan): string {
  const amount = `₹${p.price.toLocaleString("en-IN")}`;
  return p.billingPeriod === "month" ? `${amount}/mo` : amount;
}
