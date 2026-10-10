import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { cap } from "@/components/analysis-view";
import { DRILLS } from "@/lib/data";
import { buildRecommendations } from "@/lib/recommendations";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/drills/")({
  head: () => ({
    meta: [
      { title: "Drills — TheUnspoken" },
      { name: "description", content: "See what gets lost. Practice one thing. Try again." },
      { property: "og:title", content: "Drills — TheUnspoken" },
      { property: "og:description", content: "See what gets lost. Practice one thing. Try again." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell><Drills /></AppShell>,
});

const NO_DATA = "We need a little more practice data before we can personalize this recommendation.";
const API_BASE = import.meta.env.VITE_API_URL ?? "https://unspoken-backend-nqvl.onrender.com";

type RecommendedDrill = {
  dimension: string;
  score: number;
  evidence: string;
  drill_id: string;
  drill_name: string;
  minutes: number;
};

function RecCard({ r }: { r: RecommendedDrill }) {
  return (
    <div className="glass flex flex-col p-6">
      <div className="font-mono text-[11px] uppercase text-muted-foreground">
        {r.dimension} · {r.minutes} min
      </div>
      <div className="mt-2 font-display text-[19px] font-bold">{r.drill_name}</div>
      <p className="mt-2 flex-1 text-[13px] leading-5 text-muted-foreground">
        {r.evidence || NO_DATA}
      </p>
      <Link
        to="/drills/$drillId"
        params={{ drillId: r.drill_id }}
        className="mt-4 text-[13px] text-primary"
      >
        Practice →
      </Link>
    </div>
  );
}

function Drills() {
  const rs = useStore((s) => s.responses);
  const done = useStore((s) => s.drillsDone);
  const results = useStore((s) => s.drillResults) ?? {};
  const { next } = buildRecommendations(rs);

  // Recommended drills from backend
  const [recommended, setRecommended] = useState<RecommendedDrill[]>([]);
  const [recLoading, setRecLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("unspoken-session-token")
        : null;
    if (!token) {
      setRecLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/api/paid/recommended-drills`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { recommended: [] }))
      .then((d) => {
        if (cancelled) return;
        setRecommended(d.recommended || []);
      })
      .catch(() => {
        if (!cancelled) setRecommended([]);
      })
      .finally(() => {
        if (!cancelled) setRecLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const completed = DRILLS.filter((d) => done.includes(d.id));

  return (
    <div className="space-y-10">
      <div>
        <PageHead eyebrow="" title="Drills" />
      </div>

      {/* 1. Next drill */}
      {next ? (
        <section className="glass glass-float rise border-primary/40 p-7 md:p-9">
          <div className="eyebrow mb-3 !text-primary">Your next drill</div>
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <h2 className="text-[clamp(28px,3.4vw,40px)] font-bold leading-tight">
                {next.drill.name}
              </h2>
              <div className="mt-1 font-mono text-[12px] uppercase text-muted-foreground">
                {next.skill} · {next.drill.minutes} min
              </div>
              <p className="mt-5 text-[17px] font-medium leading-7">
                {next.evidence ?? NO_DATA}
              </p>
              <Link
                to="/drills/$drillId"
                params={{ drillId: next.drill_id }}
                className="btn btn-primary mt-7 px-6 py-3 text-[15px]"
              >
                Start drill →
              </Link>
            </div>
            <div className="space-y-5 md:col-span-5">
              <div>
                <div className="eyebrow mb-1">Your goal</div>
                <p className="text-[15px]">{next.expected_behavior_change}</p>
              </div>
              <div>
                <div className="eyebrow mb-2">Success looks like</div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em]">
                  {next.success_chain.map((c, i) => (
                    <span key={c} className="flex items-center gap-2">
                      {i > 0 && <span className="text-primary">→</span>}
                      <span className="rounded-full border border-primary/40 px-3 py-1">
                        {c}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Why this drill? — Recommended reason FIRST */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="eyebrow mb-2">Why this drill?</div>
            <div className="font-display text-[18px] font-bold">
              {cap(next.skill)} · {next.current_score}
              {next.change !== null && next.change !== 0 && (
                <span
                  className={`ml-2 font-mono text-[13px] ${
                    next.change > 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {next.change > 0 ? "▲" : "▼"}
                  {Math.abs(next.change)}
                </span>
              )}
            </div>
            <p className="mt-2 text-[14px]">
              <span className="text-muted-foreground">Recommended because: </span>
              {next.reason}
            </p>
          </div>
        </section>
      ) : (
        <section className="glass p-8">
          <div className="eyebrow mb-2 !text-primary">Your next drill</div>
          <p className="text-[15px]">{NO_DATA}</p>
          <Link to="/practice" className="btn btn-primary mt-5">
            Answer a question →
          </Link>
        </section>
      )}

      {/* 3. Recommended — from backend, 2 cards based on weakest dims */}
      <section>
        <h2 className="text-[22px] font-bold">Recommended for you</h2>

        {recLoading ? (
          <div className="glass mt-4 p-6 text-center text-[14px] text-muted-foreground">
            Loading recommendations…
          </div>
        ) : recommended.length === 0 ? (
          <div className="glass mt-4 p-6 text-center text-[14px] text-muted-foreground">
            Complete a practice response to get personalized drill recommendations.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {recommended.map((r) => (
              <RecCard key={r.drill_id} r={r} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Daily drills note — eyebrow removed, content preserved */}
      <section className="glass p-7">
        <h2 className="text-[20px] font-bold">
          Your daily drills update as you practice.
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
          Each day, we'll surface a small set of drills tailored to the
          skills your latest responses need most. Complete your next
          practice response to keep them fresh.
        </p>
        <Link to="/practice" className="btn btn-primary mt-5">
          Practice now →
        </Link>
      </section>

      {/* 5. Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-[22px] font-bold">Completed</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {completed.map((d) => {
              const r = results[d.id];
              const improved = r && r.attempts > 1;
              return (
                <div key={d.id} className="glass p-6">
                  <div className="font-mono text-[11px] text-success">
                    ✓ COMPLETED
                  </div>
                  <div className="mt-2 font-display text-[17px] font-bold">
                    {d.name}
                  </div>
                  <div className="font-mono text-[11px] uppercase text-muted-foreground">
                    {d.skill} · {d.minutes} min
                  </div>
                  {improved && (
                    <div className="mt-3 font-mono text-[20px]">
                      {r.first_score} →{" "}
                      <span
                        className={
                          r.last_score >= r.first_score
                            ? "text-primary"
                            : "text-destructive"
                        }
                      >
                        {r.last_score}
                      </span>
                    </div>
                  )}
                  {improved && r.first_delay - r.last_delay >= 2 && (
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Your main point moved from {Math.round(r.first_delay)}{" "}
                      seconds → {Math.round(r.last_delay)} seconds.
                    </p>
                  )}
                  <Link
                    to="/drills/$drillId"
                    params={{ drillId: d.id }}
                    className="mt-4 inline-block text-[13px] text-primary"
                  >
                    {improved ? "View result →" : "Practice again →"}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
