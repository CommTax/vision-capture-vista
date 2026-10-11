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
import { fetchScenarios } from "@/lib/questions-api";
import {
  RefreshCw,
  Briefcase,
  MessageSquareWarning,
  Presentation,
  Users,
  Megaphone,
  Crown,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { RoleSelectorCard } from "@/components/role-selector-card";

const MODE_IDS = ["interview", "conversation", "everyday", "custom"] as const;
const VISIBLE_COUNT = 2;
const API_BASE = import.meta.env.VITE_API_URL ?? "https://unspoken-backend-nqvl.onrender.com";

// Per-category icon. Each category gets its own visual anchor.
const CATEGORY_ICON: Record<string, LucideIcon> = {
  interview:    Briefcase,
  conversation: MessageSquareWarning,
  presentation: Presentation,
  group:        Users,
  sales:        Megaphone,
  everyday:     Crown,
  custom:       Sparkles,
};

export const Route = createFileRoute("/practice/")({
  validateSearch: (s: Record<string, unknown>): { mode?: ModeId } => (MODE_IDS as readonly string[]).includes(s.mode as string) ? { mode: s.mode as ModeId } : {},
  head: () => ({ meta: [{ title: "Practice — TheUnspoken" }, { name: "description", content: "Choose a real situation. Practice your response. See what gets lost." }, { property: "og:title", content: "Practice — TheUnspoken" }, { property: "og:description", content: "Practice what you need to say next." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AppShell allowGuest><Practice /></AppShell>,
});

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

// ─────────────────────────────────────────────────────────────
// Custom situation modal — opens when the user clicks the
// Custom card. Lets them describe their own moment before
// navigating to the practice session.
// ─────────────────────────────────────────────────────────────

function CustomSituationModal({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (situation: string) => void;
}) {
  const [text, setText] = useState("");

  // Reset the textarea whenever the modal opens so it doesn't
  // remember the previous attempt.
  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const ready = text.trim().length >= 8;

  // Escape closes the modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-situation-title"
    >
      <div
        className="glass glass-float w-full max-w-lg p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="eyebrow !text-primary mb-2">Your situation</div>
        <h3
          id="custom-situation-title"
          className="font-display text-[22px] font-bold mb-4 leading-tight"
        >
          What's the moment you want to practise?
        </h3>

        <textarea
          className="field min-h-32"
          placeholder="e.g. I need to tell my manager the deadline is slipping, without sounding like I'm blaming the team."
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          maxLength={500}
        />

        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Be specific — the more context, the better the feedback.</span>
          <span className="font-mono">{text.length} / 500</span>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            disabled={!ready}
            onClick={() => {
              onStart(text.trim());
            }}
          >
            Start practising →
          </button>
        </div>

        {!ready && text.length > 0 && (
          <p className="mt-3 text-center text-[12px] text-muted-foreground">
            Add a bit more detail — at least 8 characters.
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryTile({
  id,
  name,
  blurb,
  active,
  onClick,
}: {
  id: string;
  name: string;
  blurb: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = CATEGORY_ICON[id] ?? Sparkles;

  return (
    <button
      onClick={onClick}
      className="group relative flex w-[75vw] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl p-4 text-left transition duration-300 hover:-translate-y-0.5 sm:w-auto sm:max-w-none"
      style={{
        background: active
          ? "linear-gradient(160deg, rgba(139,127,255,0.16) 0%, rgba(26,16,51,0.4) 50%, rgba(11,13,20,0.85) 100%)"
          : "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 55%, rgba(11,13,20,0.6) 100%)",
        border: active
          ? "1px solid rgba(139,127,255,0.45)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: active
          ? "0 22px 60px -22px rgba(139,127,255,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 12px 30px -22px rgba(0,0,0,0.6)",
      }}
    >
      {/* Corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,127,255,0.5), transparent)",
          filter: "blur(12px)",
          opacity: active ? 0.9 : 0.35,
        }}
      />

      {/* Icon + title on one row */}
      <div className="relative flex items-center gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg transition-colors duration-300"
          style={{
            background: active ? "rgba(139,127,255,0.18)" : "rgba(255,255,255,0.05)",
            border: active
              ? "1px solid rgba(139,127,255,0.4)"
              : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Icon
            className="size-4 transition-colors duration-300"
            style={{ color: active ? "#a99bff" : "#8a8f9a" }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16px] font-bold leading-tight">
            {name}
          </div>
        </div>
        {active && (
          <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
            Active
          </span>
        )}
      </div>

      {/* Blurb */}
      <p className="relative mt-3 text-[12.5px] leading-5 text-muted-foreground">
        {blurb}
      </p>

      {/* Bottom hint */}
      <div className="relative mt-5 flex items-center justify-between">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-300"
          style={active ? { color: "#a99bff" } : undefined}
        >
          {active ? "Selected" : "Tap to start"}
        </span>
        <span
          className="text-[13px] text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5"
          style={active ? { color: "#a99bff" } : undefined}
          aria-hidden
        >
          →
        </span>
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

  // ── Custom situation modal state ──
  const [customOpen, setCustomOpen] = useState(false);

  // Role + swap state for interview practice
  const [selectedRole, setSelectedRole] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("unspoken-practice-role");
  });

  // ── Role lock state ──
  // Lock the role selector once a role has been chosen for plans that
  // don't allow switching (free + sprint). Pass users can always switch.
  // A user with no role yet can pick once, even on free/sprint.
  const hasRole = !!selectedRole && !selectedRole.startsWith("__");

  const [swapRemaining, setSwapRemaining] = useState<number | null>(null);

  // Pool of scenarios for the selected mode (fetched from the backend).
  const [pool, setPool] = useState<Scenario[]>([]);
  const [librarySource, setLibrarySource] = useState<"backend" | "fallback">(
    "fallback",
  );
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Which scenario is currently shown in each visible slot.
  const [slots, setSlots] = useState<Scenario[]>([]);

  // Persist selected role to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedRole && !selectedRole.startsWith("__")) {
      localStorage.setItem("unspoken-practice-role", selectedRole);
    }
  }, [selectedRole]);

  // Fetch scenarios whenever mode / level / role changes
  useEffect(() => {
    if (!mode || mode === "custom") {
      setPool([]);
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLibraryLoading(true);

    void fetchScenarios({
      mode,
      level,
      role:
        mode === "interview" && selectedRole && !selectedRole.startsWith("__")
          ? selectedRole
          : undefined,
    })
      .then(({ scenarios, source }) => {
        if (cancelled) return;
        setPool(scenarios);
        setSlots(scenarios.slice(0, VISIBLE_COUNT));
        setLibrarySource(source);
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, level, selectedRole]);

  // Load swap-status whenever mode / role changes
  useEffect(() => {
    if (!mode || mode === "custom") {
      setSwapRemaining(null);
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("unspoken-session-token")
        : null;
    if (!token) {
      setSwapRemaining(null);
      return;
    }
    const roleParam =
      mode === "interview" && selectedRole && !selectedRole.startsWith("__")
        ? selectedRole
        : "";
    fetch(
      `${API_BASE}/api/paid/swap-status?mode=${mode}&role_name=${encodeURIComponent(roleParam)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.remaining !== null && d.remaining !== undefined)
          setSwapRemaining(d.remaining);
      })
      .catch(() => {});
  }, [mode, selectedRole]);

  // Swap the scenario in one slot for a different one from the pool.
  // Asks the backend for permission first (free swap cap).
  async function shuffleSlot(index: number) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("unspoken-session-token")
        : null;

    if (token && mode) {
      const roleParam =
        mode === "interview" && selectedRole && !selectedRole.startsWith("__")
          ? selectedRole
          : "";
      const res = await fetch(`${API_BASE}/api/paid/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode, role_name: roleParam }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(
          err?.detail?.message ??
            "You've seen all free questions for this role. Upgrade to continue.",
        );
        return;
      }
      const data = await res.json();
      if (data.remaining !== null && data.remaining !== undefined)
        setSwapRemaining(data.remaining);
    }

    const current = slots[index];
    const used = new Set(slots.map((s) => s.scenario_id));

    let candidates = pool.filter(
      (s) => !used.has(s.scenario_id) && s.scenario_id !== current?.scenario_id,
    );

    if (candidates.length === 0) {
      candidates = pool.filter((s) => s.scenario_id !== current?.scenario_id);
    }

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

            const contact = {
              name: p.name ?? "",
              email: p.email,
              phone: p.phone,
              phone_country_code: p.phone_country_code ?? "",
            };

            void signupFree({
              name: contact.name,
              email: contact.email,
              mobile,
              stage: p.level ?? undefined,
            })
              .then((res) => {
                // Hard-fail if the backend didn't return a token. Silent
                // success here is what caused the "signed up but no session"
                // state the user hit.
                if (!res?.session_token || typeof res.session_token !== "string") {
                  throw new Error(
                    "Signup succeeded but no session token was returned.",
                  );
                }

                // Pass the contact object through, so `setFreeSession` takes
                // the "same user" branch and doesn't wipe the profile we just
                // saved.
                setFreeSession(res.session_token, contact);

                // Mirror the profile into the store (this is what AppShell
                // reads to decide whether the user is onboarded).
                setState((s) => ({
                  ...s,
                  profile: {
                    name: contact.name || "Friend",
                    email: contact.email,
                    phone: contact.phone,
                    phone_country_code: contact.phone_country_code,
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
                const message = err instanceof Error ? err.message : String(err);

                // Paid users need the OTP flow, not the free signup.
                if (/paid plan|sign in with OTP/i.test(message)) {
                  navigate({ to: "/signup", search: { mode: "signin" } });
                  return;
                }

                // Do NOT unlock the UI. Show the user a real error and let
                // them retry. The old code let them through with no session,
                // which then 403'd on the first upload.
                alert(
                  "We couldn't finish setting up your practice. Please check your connection and try again.",
                );
              });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <PageHead eyebrow="" title="Choose a real situation" />
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
        <h2 className="text-[22px] font-bold flex items-baseline justify-between">
          Practice a situation
          <span className="font-mono text-[11px] text-muted-foreground font-normal sm:hidden">
            Swipe →
          </span>
        </h2>

        <div className="mt-4 -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {MODES.filter((m) =>
            (["interview", "conversation", "everyday", "custom"] as const).includes(m.id as never)
          ).map((m) => (
            <CategoryTile
              key={m.id}
              id={m.id}
              name={m.name}
              blurb={CATEGORY_BLURB[m.id] ?? m.blurb}
              active={mode === m.id}
              onClick={() => setMode((c) => (c === m.id ? null : m.id))}
            />
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
            {mode === "interview" && (
              <div className="mb-4">
                <RoleSelectorCard
                  selected={selectedRole}
                  isPaid={!ent.free && ent.state !== "SPRINT_PAID"}
                  locked={hasRole && (ent.free || ent.state === "SPRINT_PAID")}
                  lockMessage={
                    ent.state === "SPRINT_PAID"
                      ? "Your role is locked for the Sprint. Upgrade to Practice Pass to switch any time."
                      : "Your role is locked on free practice. Upgrade to switch any time."
                  }
                  onChange={setSelectedRole}
                />
              </div>
            )}

            <div className="eyebrow mb-3">
              {categoryName(mode)}
              {selectedRole && mode === "interview" && (
                <span className="ml-2 text-[11px] normal-case tracking-normal text-muted-foreground">
                  · {selectedRole}
                </span>
              )}
              {swapRemaining !== null && (
                <span className="ml-2 text-[11px] normal-case tracking-normal text-muted-foreground">
                  · {swapRemaining} swap{swapRemaining === 1 ? "" : "s"} left
                </span>
              )}
              {librarySource === "fallback" && (
                <span className="ml-2 text-[11px] normal-case tracking-normal text-muted-foreground">
                  (offline list)
                </span>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {slots.map((s, i) => (
                <ScenarioCard
                  key={`${s.scenario_id}-${i}`}
                  s={s}
                  recommended={s.scenario_id === recScenario?.scenario_id}
                  onShuffle={() => shuffleSlot(i)}
                />
              ))}
              <CustomCard onClick={() => setCustomOpen(true)} />
            </div>
          </div>
        )}

        {!libraryLoading && mode && mode !== "custom" && slots.length === 0 && (
          <div className="glass mt-5 p-6 text-center text-[14px] text-muted-foreground">
            No questions in this mode yet.
          </div>
        )}
      </section>

      {/* ── Custom situation modal ── */}
      <CustomSituationModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onStart={(situation) => {
          setCustomOpen(false);
          navigate({
            to: "/practice/$questionId",
            params: { questionId: "custom" },
            search: {
              s: situation,
              ctx:
                situation.length > 60
                  ? situation.slice(0, 60).trimEnd() + "…"
                  : situation,
            },
          });
        }}
      />
    </div>
  );
}
