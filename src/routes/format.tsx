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
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-primary">
                      ⏱ {d.timeBudget}s budget
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Technique card — matches your SkillCard pattern:
   glass, hover lift, corner glow, tag row.
   ───────────────────────────────────────────────────────────── */
function TechniqueCard({
  t,
  categories,
}: {
  t: Technique;
  categories: BitesCategory[];
}) {
  const cat = categories.find((c) => c.id === t.category);
  return (
    <article className="glass group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border p-5 transition duration-300 hover:-translate-y-0.5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full opacity-35 transition-opacity duration-500 group-hover:opacity-70"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,127,255,0.5), transparent)",
          filter: "blur(12px)",
        }}
      />
      <div className="relative flex items-center gap-2">
        <span className="eyebrow !text-primary">
          {cat?.label ?? "Technique"}
        </span>
      </div>
      <h3 className="relative mt-2 font-display text-[18px] font-bold">
        {t.title}
      </h3>
      <p className="relative mt-1 text-[13.5px] italic text-primary">
        &ldquo;{t.hook}&rdquo;
      </p>
      <p className="relative mt-2 text-[13.5px] leading-6 text-muted-foreground">
        {t.brief}
      </p>

      <details className="relative mt-3 text-[13.5px]">
        <summary className="cursor-pointer select-none font-semibold text-foreground">
          Read lesson
        </summary>
        <div className="mt-3 space-y-3">
          <p>
            <b>What:</b> {t.what}
          </p>
          <p>
            <b>Why:</b> {t.why}
          </p>
          <div>
            <b>How:</b>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              {t.how.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          </div>
          {t.exampleWeak && (
            <p className="rounded border-l-2 border-destructive/60 bg-destructive/10 p-2">
              <b>Weak:</b> {t.exampleWeak}
            </p>
          )}
          {t.exampleStrong && (
            <p className="rounded border-l-2 border-success/60 bg-success/10 p-2">
              <b>Strong:</b> {t.exampleStrong}
            </p>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            Best for: {t.bestFor}
          </p>
        </div>
      </details>

      {t.tags.length > 0 && (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {t.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-primary/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────
   Paid gate — matches your plans page tone.
   ───────────────────────────────────────────────────────────── */
function PaidGate() {
  return (
    <div className="py-16">
      <div className="glass glass-float mx-auto max-w-2xl p-10 text-center">
        <div className="eyebrow mb-3 !text-primary">Paid feature</div>
        <h1 className="font-display text-[32px] font-bold leading-tight">
          Pillars of Communication
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-6 text-muted-foreground">
          Unlock the four pillars — 16 techniques, worked examples, and 20
          targeted drills. Available on the Practice and Sprint plans.
        </p>
        <Link to="/plans" className="btn btn-primary mt-8">
          Upgrade your plan →
        </Link>
      </div>
    </div>
  );
}
