import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { FreeCounter } from "@/components/plan-gate";
import { useEntitlement } from "@/lib/entitlements";
import { cap } from "@/components/analysis-view";
import { MODES, type Dimension, type ModeId } from "@/lib/data";
import { allScenarios, buildCustomScenario, CATEGORY_BLURB, categoryName, recommendPractice, type Scenario } from "@/lib/scenarios";
import { getState, setState, useStore } from "@/lib/store";
import { ContactDetails } from "@/components/contact-details";
import { signupFree } from "@/lib/backend-api";
import { setFreeSession } from "@/lib/backend-auth";
import { fetchScenarios } from "@/lib/questions-api";const VISIBLE_COUNT = 2;
import { RefreshCw } from "lucide-react";

const MODE_IDS = ["interview", "conversation", "presentation", "group", "sales", "everyday", "custom"] as const;

export const Route = createFileRoute("/practice/")({
  validateSearch: (s: Record<string, unknown>): { mode?: ModeId } => (MODE_IDS as readonly string[]).includes(s.mode as string) ? { mode: s.mode as ModeId } : {},
  head: () => ({ meta: [{ title: "Practice — TheUnspoken" }, { name: "description", content: "Choose a real situation. Practice your response. See what gets lost." }, { property: "og:title", content: "Practice — TheUnspoken" }, { property: "og:description", content: "Practice what you need to say next." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AppShell allowGuest><Practice /></AppShell>,
});

const VISIBLE_COUNT = 2;

function ScenarioCard({
  s,
  focus,
  recommended,
  onShuffle,
}: {
  s: Scenario;
  focus?: Dimension;
  recommended?: boolean;
  onShuffle?: () => void;
}) {
  return (
    <div className={`glass flex flex-col p-5 transition hover:bg-glass-strong ${recommended ? "border-primary/50" : ""}`}>
      {recommended && <div className="eyebrow mb-2 !text-primary">Recommended for you</div>}
      <Link
        to="/practice/$questionId"
        params={{ questionId: s.scenario_id }}
        search={focus ? { f: focus } : {}}
        className="block"
      >
        <div className="font-display text-[17px] font-bold leading-snug">{s.title}</div>
        <div className="mt-1 text-[13px] text-muted-foreground">{s.context}</div>
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
        <span className="text-muted-foreground">
          FOCUS:{" "}
          <span className="text-foreground">
            {s.target_skills.map(cap).join(" + ")}
          </span>
        </span>
        <span className="flex items-center gap-3 text-muted-foreground">
          {s.difficulty} · {s.time_limit}s
          {onShuffle && (
            <button
              type="button"
              onClick={onShuffle}
              aria-label="Shuffle this question"
              title="Shuffle this question"
              className="grid size-6 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
            >
              <RefreshCw className="size-3" />
            </button>
          )}
          <Link
            to="/practice/$questionId"
            params={{ questionId: s.scenario_id }}
            search={focus ? { f: focus } : {}}
            className="text-primary"
          >
            Start →
          </Link>
        </span>
      </div>
    </div>
  );
}

function CustomCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass flex flex-col p-5 text-left transition hover:bg-glass-strong"
    >
      <div className="eyebrow mb-2 !text-primary">Custom</div>
      <div className="font-display text-[17px] font-bold leading-snug">
        Practice your own situation
      </div>
      <div className="mt-1 text-[13px] text-muted-foreground">
        Describe any real moment — we'll build the scenario.
      </div>
      <div className="mt-4 flex items-center justify-end font-mono text-[11px]">
        <span className="text-primary">Start →</span>
      </div>
    </button>
  );
}

function Practice() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined" &&
      !!localStorage.getItem("unspoken-session-token");
    setHasToken(token);
  }, []);

  const rs = useStore((s) => s.responses);
  const level = useStore((s) => s.profile?.level ?? "Mid career");
  const navigate = useNavigate();
  const rec = recommendPractice(rs, level);
  const all = allScenarios(level);
  const recScenario = rec
    ? all.find((s) => s.scenario_id === rec.recommended_scenario_id)
    : undefined;
  const initialMode = Route.useSearch().mode;
  const [mode, setMode] = useState<ModeId | null>(initialMode ?? null);
  const [custom, setCustom] = useState("");

  // Pool of scenarios for the selected mode (fetched from the backend).
  const [pool, setPool] = useState<Scenario[]>([]);
  const [librarySource, setLibrarySource] = useState<"backend" | "fallback">(
    "fallback",
  );
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Which scenario is currently shown in each of the 4 slots.
  const [slots, setSlots] = useState<Scenario[]>([]);

  // Full catalog for the selected mode (fallback when the pool is small).
  const [allForMode, setAllForMode] = useState<Scenario[]>([]);

  useEffect(() => {
    if (!mode || mode === "custom") {
      setPool([]);
      setSlots([]);
      setAllForMode([]);
      return;
    }

    let cancelled = false;
    setLibraryLoading(true);

    void fetchScenarios({ mode, level })
      .then(({ scenarios, source }) => {
        if (cancelled) return;
        setPool(scenarios);
        setAllForMode(scenarios);
        setSlots(scenarios.slice(0, VISIBLE_COUNT));
        setLibrarySource(source);
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, level]);

  // Swap the scenario in one slot for a different one from the pool.
  // Falls back to a local list if the pool is too small.
  function shuffleSlot(index: number) {
    const current = slots[index];
    const used = new Set(slots.map((s) => s.scenario_id));

    let candidates = pool.filter(
      (s) => !used.has(s.scenario_id) && s.scenario_id !== current?.scenario_id,
    );

    // If the pool is exhausted, allow reusing anything except the current slot.
    if (candidates.length === 0) {
      candidates = pool.filter((s) => s.scenario_id !== current?.scenario_id);
    }

    // If the pool has only one item, fall back to the full local list.
    if (candidates.length === 0) {
      const localPool = allScenarios(level).filter((s) => s.category === mode);
      candidates = localPool.filter(
        (s) => s.scenario_id !== current?.scenario_id,
      );
    }

    if (candidates.length === 0) return;

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const next = [...slots];
    next[index] = pick;
    setSlots(next);
  }

  const ent = useEntitlement();
  const preview =
    custom.trim().length > 8 ? buildCustomScenario(custom, level) : null;

  if (hasToken === null) return <div className="min-h-screen" />;

  if (!hasToken) {
    return (
      <div className="grid min-h-screen place-items-center px-5 py-10">
        <ContactDetails
          eyebrow="Try TheUnspoken"
          title="Let's set up your practice"
          body="Enter your details — we'll save your responses and pattern as you go."
          submit="Start practising"
          consent
          onDone={() => {
            const p = getState().profile;
            if (!p?.email || !p?.phone) return;
            const mobile = p.phone_country_code
              ? `${p.phone_country_code} ${p.phone}`
              : p.phone;
            void signupFree({
              name: p.name ?? "",
              email: p.email,
              mobile,
              stage: p.level ?? undefined,
            })
              .then((res) => {
                if (res.session_token) setFreeSession(res.session_token);
                setState((s) => ({
                  ...s,
                  profile: {
                    name: p.name ?? "Friend",
                    email: p.email ?? "",
                    phone: p.phone,
                    phone_country_code: p.phone_country_code,
                    goal: "",
                    struggle: "",
                    experience: "",
                    level: p.level ?? "Mid career",
                    onboarded: false,
                    plan: "free",
                  },
                }));
                setHasToken(true);
              })
              .catch((err) => {
                console.warn("[practice] signupFree failed:", err);
                setHasToken(true);
              });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <PageHead eyebrow="Practice" title="What do you need to say next?" />
        <p className="-mt-6 text-[15px] text-muted-foreground">
          Choose a real situation. Practice your response. See what gets lost.
        </p>
        <div className="mt-2">
          <FreeCounter />
        </div>
      </div>

      {!rec && !ent.free && rs.length > 0 && (
        <p className="glass p-5 text-[14px] text-muted-foreground">
          Keep practicing to build enough evidence for a personalized
          recommendation.
        </p>
      )}

      {/* 1. Next practice */}
      {rec && recScenario && (
        <section className="glass glass-float rise grid gap-8 border-primary/40 p-7 md:grid-cols-12 md:p-9">
          <div className="md:col-span-7">
            <div className="eyebrow mb-3 !text-primary">Your next practice</div>
            <h2 className="text-[clamp(24px,3vw,34px)] font-bold leading-tight">
              {recScenario.title}
            </h2>
            <div className="mt-2 text-[14px] text-muted-foreground">
              {recScenario.context} · {level}
            </div>
            <Link
              to="/practice/$questionId"
              params={{ questionId: recScenario.scenario_id }}
              search={{ f: rec.current_focus }}
              className="btn btn-primary mt-7 px-6 py-3 text-[15px]"
            >
              Start practice →
            </Link>
          </div>
          <div className="space-y-4 md:col-span-5">
            <div>
              <div className="eyebrow mb-1">Why this one</div>
              <p className="text-[15px] leading-6">
                {rec.supporting_evidence ?? rec.reason}
              </p>
              {rec.supporting_evidence && (
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {rec.reason}
                </p>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4 font-mono text-[12px]">
              <div>
                <dt className="text-muted-foreground">Focus</dt>
                <dd className="mt-1 text-primary">{cap(rec.current_focus)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Difficulty</dt>
                <dd className="mt-1">{recScenario.difficulty}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Time</dt>
                <dd className="mt-1">{recScenario.time_limit} sec</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {/* 3. Categories */}
      <section>
        <h2 className="text-[22px] font-bold">Practice a situation</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode((c) => (c === m.id ? null : m.id))}
              className={`glass p-4 text-left transition ${
                mode === m.id
                  ? "border-primary/60 bg-primary/10"
                  : "hover:bg-glass-strong"
              }`}
            >
              <div className="font-display text-[16px] font-bold">{m.name}</div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {CATEGORY_BLURB[m.id] ?? m.blurb}
              </p>
            </button>
          ))}
        </div>

        {/* 4. Library for the chosen category */}
        {mode === "custom" && ent.free && (
          <div className="glass mt-5 p-6 text-[14px]">
            <div className="eyebrow mb-1">Custom practice</div>
            Build a practice around your own upcoming situation.{" "}
            <Link to="/plans" className="text-primary">
              Unlock custom practice →
            </Link>
          </div>
        )}
        {mode === "custom" && !ent.free && (
          <form
            className="glass mt-5 space-y-4 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!preview) return;
              navigate({
                to: "/practice/$questionId",
                params: { questionId: "custom" },
                search: {
                  s: custom.trim(),
                  ctx: preview.context,
                  f: preview.evaluation_focus[0],
                },
              });
            }}
          >
            <div>
              <div className="eyebrow mb-1">Custom practice</div>
              <label className="font-display text-[20px] font-bold">
                What situation do you need to practice?
              </label>
            </div>
            <textarea
              className="field min-h-28"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="I'm asking my manager for a promotion after taking on additional responsibilities."
            />
            {preview && (
              <dl className="grid gap-3 rounded-2xl border border-border p-4 text-[13px] sm:grid-cols-3">
                <div>
                  <dt className="eyebrow">Audience</dt>
                  <dd className="mt-1">{preview.audience}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Objective</dt>
                  <dd className="mt-1">{preview.objective}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Evaluation focus</dt>
                  <dd className="mt-1">
                    {preview.evaluation_focus.map(cap).join(" + ")}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Context</dt>
                  <dd className="mt-1">{preview.context}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Difficulty</dt>
                  <dd className="mt-1">{preview.difficulty}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Time limit</dt>
                  <dd className="mt-1">{preview.time_limit} sec</dd>
                </div>
              </dl>
            )}
            <button className="btn btn-primary" disabled={!preview}>
              Create practice →
            </button>
          </form>
        )}

        {libraryLoading && mode && mode !== "custom" && (
          <div className="glass mt-5 p-6 text-center text-[14px] text-muted-foreground">
            Loading {categoryName(mode)} questions…
          </div>
        )}

        {!libraryLoading && mode && mode !== "custom" && slots.length > 0 && (
          <div className="mt-5">
            <div className="eyebrow mb-3">
              {categoryName(mode)}
              {librarySource === "fallback" && (
                <span className="ml-2 text-[11px] normal-case tracking-normal text-muted-foreground">
                  (offline list)
                </span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {slots.map((s, i) => (
                <ScenarioCard
                  key={`${s.scenario_id}-${i}`}
                  s={s}
                  recommended={s.scenario_id === recScenario?.scenario_id}
                  onShuffle={() => shuffleSlot(i)}
                />
              ))}
              <CustomCard
                onClick={() =>
                  navigate({
                    to: "/practice/$questionId",
                    params: { questionId: "custom" },
                    search: { s: "Custom situation", ctx: "Custom scenario" },
                  })
                }
              />
            </div>
          </div>
        )}

        {!libraryLoading && mode && mode !== "custom" && slots.length === 0 && (
          <div className="glass mt-5 p-6 text-center text-[14px] text-muted-foreground">
            No questions in this mode yet.
          </div>
        )}

        {!mode && !rec && (
          <div className="mt-5">
            <div className="eyebrow mb-3">Start anywhere</div>
            <div className="grid gap-3 md:grid-cols-2">
              {all
                .filter((s) => s.category === "interview")
                .map((s) => (
                  <ScenarioCard key={s.scenario_id} s={s} />
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
