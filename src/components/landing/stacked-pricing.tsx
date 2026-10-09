import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/services/data-provider";
import type { PricingPlan } from "@/content/types";

/**
 * Scroll-driven stacked pricing cards.
 * Each card sticks to the top of the viewport as the user scrolls,
 * and the next card slides up to cover it. Pure CSS.
 *
 * On desktop (md+), falls back to a 3-column grid — the stack effect
 * is mobile-only because horizontal space is wide enough to show all three.
 */
export function StackedPricing({ plans }: { plans: PricingPlan[] }) {
  return (
    <>
      {/* Desktop — grid */}
      <div className="mt-12 hidden gap-4 md:grid md:grid-cols-3">
        {plans.map((t) => (
          <PlanCard key={t.id} plan={t} />
        ))}
      </div>

      {/* Mobile — sticky stack */}
      <div className="mt-12 md:hidden">
        {plans.map((t, i) => (
          <div
            key={t.id}
            className="sticky"
            style={{
              top: `${64 + i * 12}px`, // stagger so tops peek
              zIndex: i + 1,
            }}
          >
            <div className="pb-4">
              <PlanCard plan={t} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PlanCard({ plan: t }: { plan: PricingPlan }) {
  return (
    <div
      className={`glass relative flex h-full flex-col p-8 ${
        t.highlighted ? "glass-float border-primary/50" : ""
      }`}
    >
      {t.badge && (
        <div className="absolute -top-3 left-6 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
          {t.badge}
        </div>
      )}
      <div className="eyebrow">{t.name}</div>
      <div className="mt-3 font-display text-[40px] font-bold leading-none">
        {formatPrice(t)}
      </div>
      <ul className="mt-7 flex-1 space-y-2.5 text-[14px] text-muted-foreground">
        {t.features.map((x) => (
          <li key={x} className="flex gap-2">
            <span className="text-primary">·</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/signup"
        className={`btn mt-8 w-full ${t.highlighted ? "btn-primary" : "btn-ghost"}`}
      >
        {t.cta}
      </Link>
    </div>
  );
}
