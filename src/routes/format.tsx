// src/routes/format.tsx
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  PILLARS,
  BITES_CATEGORIES,
  getTechniquesForPillar,
} from '@/content/pillars';
import { DRILLS_LIBRARY } from '@/content/drills';

export const Route = createFileRoute('/format')({
  component: FormatPage,
});

/* ─────────────────────────────────────────────────────────────
   🔌 PLAN GATE — swap this out for your real hook.
   ─────────────────────────────────────────────────────────────
   Most likely candidates in your repo:
     • import { useSession } from '@/hooks/useSession';
     • import { useAuth }    from '@/integrations/supabase/...';
     • import { useUser }    from '@/hooks/useUser';

   Then replace the body below with something like:

       const { user, plan, isLoading } = useSession();
       return { plan, isLoading };

   Paid plans in CommTax: 'sprint' and 'pass'.
   ───────────────────────────────────────────────────────────── */
function usePlan() {
  // TODO: replace with your real hook.
  return { plan: 'pass' as 'free' | 'sprint' | 'pass', isLoading: false };
}

const isPaidPlan = (p: string) => p === 'sprint' || p === 'pass';

function FormatPage() {
  const { plan, isLoading } = usePlan();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!isPaidPlan(plan)) return <PaidGate />;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.14em] text-amber-700 font-semibold mb-2">
          Format Section
        </div>
        <h1 className="text-3xl font-serif mb-2">Pillars of Communication</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          The four foundations CommTax trains. Each pillar holds techniques, worked
          examples, and drills you can run right now.
        </p>
        <div className="mt-4">
          <Link
            to="/skills"
            className="text-xs font-semibold uppercase tracking-widest text-amber-700 hover:underline"
          >
            ← Back to Skills
          </Link>
        </div>
      </header>

      {PILLARS.map((pillar) => {
        const techniques = getTechniquesForPillar(pillar.id);
        return (
          <section key={pillar.id} id={pillar.id} className="mb-14 scroll-mt-20">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-[11px] uppercase tracking-[0.14em] text-amber-700 font-semibold">
                Pillar {pillar.number}
              </span>
              <h2 className="text-2xl font-serif">{pillar.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{pillar.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {techniques.map((t) => (
                <article
                  key={t.id}
                  className="rounded-xl border bg-card p-5 hover:shadow-md transition"
                >
                  <div className="text-[11px] uppercase tracking-widest text-amber-700 font-semibold mb-1">
                    {BITES_CATEGORIES[t.category].label}
                  </div>
                  <h3 className="text-lg font-serif mb-1">{t.title}</h3>
                  <p className="italic text-sm text-amber-800 mb-2">“{t.hook}”</p>
                  <p className="text-sm mb-3">{t.brief}</p>

                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium select-none">
                      Read lesson
                    </summary>
                    <div className="mt-3 space-y-3">
                      <p><strong>What:</strong> {t.what}</p>
                      <p><strong>Why:</strong> {t.why}</p>
                      <div>
                        <strong>How:</strong>
                        <ol className="list-decimal pl-5 mt-1 space-y-1">
                          {t.how.map((h, i) => <li key={i}>{h}</li>)}
                        </ol>
                      </div>
                      {t.exampleWeak && (
                        <p className="bg-red-50 border-l-2 border-red-400 p-2 rounded">
                          <strong>Weak:</strong> {t.exampleWeak}
                        </p>
                      )}
                      {t.exampleStrong && (
                        <p className="bg-green-50 border-l-2 border-green-500 p-2 rounded">
                          <strong>Strong:</strong> {t.exampleStrong}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        <strong>Best for:</strong> {t.bestFor}
                      </p>
                      {t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {t.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 text-amber-800 bg-amber-50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-16">
        <h2 className="text-2xl font-serif mb-2">Practice Drills</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Short, targeted exercises that fix the exact pattern holding you back.
        </p>

        {DRILLS_LIBRARY.map((cat) => (
          <div key={cat.category} className="mb-8">
            <h3 className="text-lg font-medium mb-3">{cat.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cat.drills.map((d) => (
                /* 🔌 DRILL LINK
                   Matches your existing `drills.$drillId.tsx` route.
                   If your param is named differently (e.g. `slug`),
                   change `drillId` in both places below. */
                <Link
                  key={d.id}
                  to="/drills/$drillId"
                  params={{ drillId: d.id }}
                  className="rounded-lg border p-4 hover:shadow-md hover:border-amber-300 transition block"
                >
                  <h4 className="font-medium">{d.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{d.desc}</p>
                  <p className="text-xs text-amber-700 font-semibold mt-2">
                    ⏱ {d.timeBudget}s budget
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

function PaidGate() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="text-[11px] uppercase tracking-[0.14em] text-amber-700 font-semibold mb-3">
        Paid feature
      </div>
      <h1 className="text-3xl font-serif mb-3">Pillars of Communication</h1>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        Unlock the four pillars — 16 techniques, worked examples, and 20 targeted
        drills. Available on Sprint and Practice plans.
      </p>
      <Link
        to="/plans"
        className="inline-flex items-center rounded-full bg-amber-600 hover:bg-amber-700 transition px-6 py-3 text-white font-medium"
      >
        Upgrade your plan →
      </Link>
    </main>
  );
}
