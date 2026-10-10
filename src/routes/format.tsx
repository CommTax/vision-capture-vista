import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { dataProvider } from "@/services/data-provider";
import { techniquesForPillar, isPaidPlan } from "@/lib/pillars";
import { getBackendSession, getPlanHint } from "@/lib/backend-auth";
import type { BitesCategory, Technique } from "@/content/types";

export const Route = createFileRoute("/format")({
  head: () => ({
    meta: [
      { title: "Format Section — Pillars of Communication — TheUnspoken" },
      {
        name: "description",
        content:
          "The four pillars of executive communication: Structure, Conciseness, Tone, Presence — with worked examples and targeted drills.",
      },
      {
        property: "og:title",
        content: "Pillars of Communication — TheUnspoken",
      },
      {
        property: "og:description",
        content:
          "The four foundations of clear, high-stakes communication. Techniques, examples, and drills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <FormatSection />
    </AppShell>
  ),
});

/* ─────────────────────────────────────────────────────────────
   Plan gate — uses your real backend-auth helpers.
   Order of preference:
     1. Cached plan hint (from the last verify-otp) — instant
     2. Live session from /api/auth/session
     3. Fallback: "free" until we know otherwise
   ───────────────────────────────────────────────────────────── */
function usePlan(): { plan: string; loading: boolean } {
  const [plan, setPlan] = useState<string>(() => {
    const hint = getPlanHint();
    return hint?.plan ?? "free";
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getBackendSession().then((session) => {
      if (cancelled) return;
      if (session?.plan) setPlan(session.plan);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { plan, loading };
}

function FormatSection() {
  const { plan, loading } = usePlan();
  const pillars = dataProvider.getPillars();
  const categories = dataProvider.getBitesCategories();
  const techniques = dataProvider.getTechniques();
  const drillCategories = dataProvider.getFormatDrills();

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (!isPaidPlan(plan)) {
    return <PaidGate />;
  }

  return (
    <div className="space-y-12">
      <PageHead eyebrow="Format Section" title="Pillars of Communication">
        <Link to="/skills" className="btn btn-ghost btn-sm">
          ← Back to Skills
        </Link>
      </PageHead>

      <p className="-mt-4 max-w-3xl text-[15px] leading-6 text-muted-foreground">
        The four foundations CommTax trains. Each pillar holds techniques,
        worked examples, and drills you can run right now.
      </p>

      {/* ── Pillar jump nav ── */}
      <nav className="-mt-6 flex flex-wrap gap-2">
        {pillars.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className="rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground"
          >
            {p.number}. {p.title}
          </a>
        ))}
      </nav>

      {/* ── Pillars ── */}
      {pillars.map((pillar) => {
        const items = techniquesForPillar(pillar, techniques);
        if (items.length === 0) return null;
        return (
          <section key={pillar.id} id={pillar.id} className="scroll-mt-24">
            <div className="mb-4 flex items-baseline gap-3">
              <span className="eyebrow !text-primary">
                Pillar {pillar.number}
              </span>
              <h2 className="font-display text-[24px] font-bold">
                {pillar.title}
              </h2>
            </div>
            <p className="-mt-2 mb-5 text-[14px] text-muted-foreground">
              {pillar.description}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((t) => (
                <TechniqueCard key={t.id} t={t} categories={categories} />
              ))}
            </div>
          </section>
        );
      })}

      {/* ── Format Drills ── */}
      <section>
        <h2 className="font-display text-[24px] font-bold">Practice Drills</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Short, targeted exercises that fix the exact pattern holding you back.
        </p>

        {drillCategories.map((cat) => (
          <div key={cat.category} className="mt-8">
            <h3 className="mb-3 text-[16px] font-semibold">{cat.category}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {cat.drills
                .filter((d) => d.active)
                .map((d) => (
                  <Link
                    key={d.id}
                    to="/drills/$drillId"
                    params={{ drillId: d.id }}
                    className="glass block p-5 transition hover:-translate-y-0.5"
                  >
                    <div className="font-display text-[15px] font-bold">
                      {d.title}
                    </div>
                    <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                      {d.desc}
                    </p>
                    <p className="mt-2
