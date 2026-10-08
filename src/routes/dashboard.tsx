import { usePaidDashboard } from "@/lib/paid-dashboard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Instagram, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cap } from "@/components/analysis-view";
import { PATTERNS, modeName, type Dimension } from "@/lib/data";
import { currentPattern, skillStats } from "@/lib/insights";
import { streak, type ResponseRecord } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TheUnspoken" },
      { name: "description", content: "What to practice now, why, and how your responses are changing." },
      { property: "og:title", content: "Dashboard — TheUnspoken" },
      { property: "og:description", content: "Your personal practice cockpit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell><Dashboard /></AppShell>,
});

const FOCUS: Record<Dimension, { goal: string; why: string; chain: string[]; move: string; drills: string[] }> = {
  impact: { goal: "make your answers more specific, memorable, and outcome-focused", why: "Your recent responses are generally clear, but they often lose impact because the outcome isn't specific enough.", chain: ["Point", "Evidence", "Result"], move: "Make the point → prove it → show the result.", drills: ["result-first", "exec-summary", "specific"] },
  structure: { goal: "put your ideas in a clear order the listener can follow", why: "Your recent responses have useful ideas, but they arrive in an order that's hard to follow.", chain: ["Point", "Reason", "Example"], move: "Say the answer → give one reason → show one example.", drills: ["three-steps", "five-sec", "one-sentence"] },
  clarity: { goal: "make the main idea easy to hear the first time", why: "Your recent responses often bury the main idea under qualifiers and side notes.", chain: ["Point", "Explain", "Confirm"], move: "Say it plainly → explain once → stop.", drills: ["one-sentence", "five-sec", "specific"] },
  conciseness: { goal: "say the same thing with less", why: "Your recent responses keep going after the point is already clear.", chain: ["Point", "Proof", "Stop"], move: "Make the point → back it once → end there.", drills: ["cut-30", "one-sentence", "exec-summary"] },
  relevance: { goal: "answer the question that was actually asked", why: "Your recent responses sometimes drift away from what the question asked.", chain: ["Question", "Answer", "Link back"], move: "Repeat the ask → answer it → tie back.", drills: ["five-sec", "three-steps", "exec-summary"] },
  delivery: { goal: "make your strongest line sound like it matters", why: "Your recent responses have good content, but the delivery flattens the key moments.", chain: ["Pause", "Point", "Emphasis"], move: "Slow down → land the point → stress the result.", drills: ["result-first", "one-sentence", "five-sec"] },
  confidence: { goal: "commit to your answer without hedging", why: "Your recent responses soften strong points with \u201CI think\u201D and \u201Cmaybe\u201D.", chain: ["Claim", "Evidence", "Own it"], move: "State it → prove it → don't take it back.", drills: ["five-sec", "specific", "result-first"] },
  memorability: { goal: "leave the listener with one line they'll remember", why: "Your recent responses are correct, but nothing in them stands out afterwards.", chain: ["Hook", "Story", "Takeaway"], move: "Open with the change → tell it briefly → end on one line.", drills: ["one-sentence", "result-first", "specific"] },
};

const CHALLENGES = [
  { id: "pre-2", t: "Explain a difficult project decision in 45 seconds." },
  { id: "evd-1", t: "Tell your manager about a project delay without sounding defensive." },
];

const DECLINE_NOTE: Partial<Record<Dimension, string>> = {
  conciseness: "Your recent responses became longer.",
  relevance: "Recent answers drifted further from the question.",
  structure: "Your main point is arriving later.",
  impact: "Outcomes are less specific than before.",
  clarity: "More qualifiers are creeping in.",
};

function insight(r: ResponseRecord, prev?: ResponseRecord) {
  if (prev) {
    const a = prev.analysis.main_point_delay, b = r.analysis.main_point_delay;
    if (a - b >= 3) return `Your main point moved from ${Math.round(a)} seconds to ${Math.round(b)} seconds.`;
    const d = r.analysis.scores.structure - prev.analysis.scores.structure;
    if (d) return `Structure ${d > 0 ? "rose" : "fell"} ${Math.abs(d)} points from the previous attempt.`;
  }
  return r.analysis.summary;
}

// ────────────────────────────────────────────────────────────
// Pull dynamic focus copy from the user's latest analyzed drill.
// Reads from the same Analysis fields used by the response page.
// ────────────────────────────────────────────────────────────
function dynamicFocus(
  rs: ResponseRecord[],
  dimension: Dimension,
): { why?: string; chain?: string[] } | null {
  // Latest drill with real scores
  const latest = rs.find((r) => r.analysis && r.analysis.overall > 0);
  if (!latest) return null;

  const a = latest.analysis;

  // "Why" line — the LLM's single most-actionable change
  const why: string | undefined =
    a.retry_instruction ||
    a.dimensions?.[dimension]?.tryThis ||
    a.summary ||
    undefined;

  // Chain chips — parse from the LLM's example structure
  const chain: string[] | undefined = (() => {
    const raw = a.example_structure;
    if (!raw || typeof raw !== "string") return undefined;

    // Split on arrows, bullets, newlines, or numbered list markers
    const parts = raw
      .split(/\s*[→•·]\s*|\s*\n\s*|\s*\d+\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    return parts.length >= 2 ? parts.slice(0, 3) : undefined;
  })();

  return { why, chain };
}

// ────────────────────────────────────────────────────────────
// Share helpers
// ────────────────────────────────────────────────────────────
function buildShareText(name: string, patternName: string, patternDesc: string, url: string) {
  return `${name ? name + "'s" : "My"} communication pattern: ${patternName}.\n\n"${patternDesc}"\n\nWhat's yours? ${url}`;
}

function shareToWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
}

async function shareToInstagram(text: string) {
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ text });
      return;
    } catch {
      // cancelled
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard. Paste it into your Instagram story.");
  } catch {
    alert("Copy this text for your Instagram story:\n\n" + text);
  }
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
}

function Dashboard() {
  const { session, reps, loading } = usePaidDashboard();
  const profile = {
    name: session?.name ?? "",
    email: session?.email ?? "",
  } as { name: string; email: string };

  // ─── Collapsible state for recent responses ───
  const [responsesOpen, setResponsesOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setResponsesOpen(localStorage.getItem("dashboard-responses-open") === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("dashboard-responses-open", responsesOpen ? "1" : "0");
  }, [responsesOpen]);

  const rs = reps;
  const days = reps.map((r) => r.created_at.slice(0, 10));
  const cp = currentPattern(rs);
  const stats = skillStats(rs);
  const f = FOCUS[cp.focus as Dimension] ?? FOCUS.impact;
  const focus = cap(cp.focus);
  const primary = PATTERNS[cp.primary] ?? PATTERNS.scatterer;
  const byId = new Map(rs.map((r) => [r.id, r]));

  // First name only for the card
  const firstName = (profile.name || "You").trim().split(/\s+/)[0];

  if (loading && rs.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <header className="rise pt-2">
        <div className="eyebrow mb-3">Good to see you, {profile.name}</div>
        <div className="mt-2 flex flex-wrap items-center gap-5">
          <div className="flex gap-5 font-mono text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="size-3.5 text-primary" />
              <b className="text-foreground">{streak(days)}</b> day streak
            </span>
            <span><b className="text-foreground">{rs.length}</b> responses</span>
            <span><b className="text-foreground">{stats.filter((s) => s.trend !== 0).length}</b> skills practiced</span>
          </div>
        </div>
      </header>

      {/* 2. Pattern card */}
      <section
        className="relative overflow-hidden rounded-3xl p-7"
        style={{
          background:
            "linear-gradient(160deg, rgba(139,127,255,0.10) 0%, rgba(26,16,51,0.35) 45%, rgba(11,13,20,0.9) 100%)",
          border: "1px solid rgba(139,127,255,0.35)",
          boxShadow:
            "0 20px 60px -20px rgba(139,127,255,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(139,127,255,0.35), transparent)",
            filter: "blur(8px)",
            pointerEvents: "none",
          }}
        />

        {/* Top row: user name pill on the right */}
        <div className="relative flex items-start justify-end gap-4">
          <div className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
            {firstName}'s pattern
          </div>
        </div>

        {/* Hero: pattern name */}
        <div className="relative mt-4 font-display text-[clamp(30px,5vw,42px)] font-bold leading-[1.05]">
          {primary.name.replace(/^The /, "").toUpperCase()}
        </div>

        {/* Description */}
        <p className="relative mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          {primary.desc}
        </p>

        {/* Metadata row */}
        <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-[12px]">
          <div>
            <div className="text-muted-foreground">Secondary</div>
            <div className="mt-1 font-mono">{(PATTERNS[cp.secondary] ?? primary).short}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Strength</div>
            <div className="mt-1 font-mono text-success">{cp.strength.toUpperCase()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Focus</div>
            <div className="mt-1 font-mono text-primary">{focus}</div>
          </div>
        </div>

        {/* Next move panel */}
        <div className="relative mt-5 rounded-2xl bg-primary/10 p-4">
          <div className="eyebrow !text-primary">Your next move</div>
          <p className="mt-2 font-display text-[16px] font-bold">{f.move}</p>
        </div>

        {/* Share row */}
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <span className="text-[12px] text-muted-foreground">
            Share your pattern:
          </span>
          <button
            onClick={() =>
              shareToWhatsApp(
                buildShareText(firstName, primary.name, primary.desc, "theunspoken.co.in"),
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-[13px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
            title="Share on WhatsApp"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </button>
          <button
            onClick={() =>
              shareToInstagram(
                buildShareText(firstName, primary.name, primary.desc, "theunspoken.co.in"),
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-[13px] font-medium text-pink-300 transition hover:bg-pink-500/20"
            title="Share on Instagram"
          >
            <Instagram className="size-4" />
            Instagram
          </button>
        </div>
      </section>

      {/* 3. Why you're seeing this — dynamic */}
      {rs.length > 0 && rs.some((r) => r.analysis?.overall > 0) ? (
        (() => {
          const dyn = dynamicFocus(rs, cp.focus as Dimension);
          const whyText = dyn?.why || f.why;
          const chainText = dyn?.chain && dyn.chain.length > 0 ? dyn.chain : f.chain;

          return (
            <section className="glass glass-float grid gap-6 border-primary/30 p-7 md:grid-cols-12 md:p-8">
              <div className="md:col-span-7">
                <div className="eyebrow mb-3 !text-primary">Why you're seeing this</div>
                <p className="font-display text-[22px] font-bold leading-snug">{whyText}</p>
                <p className="mt-3 text-[15px] text-muted-foreground">
                  That's why your current focus is <b className="text-primary">{focus}</b>.
                </p>
              </div>
              <div className="flex flex-col justify-center md:col-span-5">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[13px] uppercase tracking-[0.12em]">
                  {chainText.map((c, i) => (
                    <span key={c + i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-primary">→</span>}
                      <span className="rounded-full border border-primary/40 px-3 py-1.5">{c}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-[13px] text-muted-foreground">
                  Practice this pattern in your next response.
                </p>
                <Link
                  to="/drills/$drillId"
                  params={{ drillId: f.drills[0] }}
                  className="btn btn-ghost btn-sm mt-4 self-start"
                >
                  Practice {focus} →
                </Link>
              </div>
            </section>
          );
        })()
      ) : (
        <section className="glass glass-float grid gap-6 border-primary/30 p-7 md:grid-cols-12 md:p-8">
          <div className="md:col-span-7">
            <div className="eyebrow mb-3 !text-primary">Why you're seeing this</div>
            <p className="font-display text-[22px] font-bold leading-snug">
              Once you record your first response, we'll personalize this section for you.
            </p>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              We'll read your response, identify the pattern holding you back,
              and show you exactly what to practice next.
            </p>
          </div>
          <div className="flex flex-col justify-center md:col-span-5">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[13px] uppercase tracking-[0.12em] opacity-50">
              <span className="rounded-full border border-border px-3 py-1.5">You</span>
              <span className="text-primary">→</span>
              <span className="rounded-full border border-border px-3 py-1.5">Response</span>
              <span className="text-primary">→</span>
              <span className="rounded-full border border-border px-3 py-1.5">Pattern</span>
            </div>
            <Link to="/practice" className="btn btn-primary btn-sm mt-6 self-start">
              Record your first response →
            </Link>
          </div>
        </section>
      )}

      {/* 4. Today's 2 challenges */}
      <section className="glass p-7">
        <div className="mb-5 flex items-baseline justify-between">
          <div className="eyebrow !text-primary">Today's 2 challenges</div>
          <span className="font-mono text-[11px] text-muted-foreground">2 challenges · ~5 minutes</span>
        </div>
        <div className="space-y-3">
          {CHALLENGES.map((c, i) => (
            <Link
              key={c.id}
              to="/practice/$questionId"
              params={{ questionId: c.id }}
              className="group flex items-start gap-5 rounded-2xl border border-border p-5 transition hover:border-primary/40 hover:bg-glass-strong"
            >
              <span className="font-mono text-[14px] text-primary">0{i + 1}</span>
              <div className="flex-1">
                <div className="font-display text-[18px] font-bold leading-snug">{c.t}</div>
                <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                  FOCUS: <span className="text-primary">{focus}</span>
                </div>
              </div>
              <span className="text-[13px] text-primary group-hover:translate-x-0.5">Start →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Recent responses — collapsible */}
      <section className="glass p-7">
        <button
          type="button"
          onClick={() => setResponsesOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 text-left"
          aria-expanded={responsesOpen}
          aria-controls="recent-responses-content"
        >
          <div>
            <h2 className="text-[22px] font-bold">Your recent responses</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              See what changed from one attempt to the next.
            </p>
          </div>
          <span
            aria-hidden="true"
            className={`shrink-0 font-mono text-[20px] text-primary transition-transform duration-300 ${
              responsesOpen ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </button>

        <div
          id="recent-responses-content"
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
            responsesOpen ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            {rs.length === 0 ? (
              <p className="text-[14px] text-muted-foreground">
                No responses yet.{" "}
                <Link to="/practice" className="text-primary">Start your first rep.</Link>
              </p>
            ) : (
              <div className="divide-y divide-border">
                {rs.slice(0, 4).map((r) => {
                  const prev = r.parent_id ? byId.get(r.parent_id) : undefined;
                  const from = prev ? PATTERNS[prev.analysis.primary_pattern]?.short : undefined;
                  const to = PATTERNS[r.analysis.primary_pattern]?.short ?? "";
                  return (
                    <Link
                      key={r.id}
                      to="/responses/$responseId"
                      params={{ responseId: r.id }}
                      className="grid gap-2 py-4 md:grid-cols-12 md:items-center"
                    >
                      <div className="md:col-span-6">
                        <div className="text-[15px] font-medium">"{r.question}"</div>
                        <div className="mt-1 text-[13px] text-muted-foreground">{insight(r, prev)}</div>
                      </div>
                      <div className="font-mono text-[12px] md:col-span-3">
                        {from && from !== to ? (
                          <>
                            <span className="text-muted-foreground line-through">{from}</span>{" "}
                            <span className="text-primary">→</span>{" "}
                          </>
                        ) : null}
                        <span>{to}</span>
                        {prev && (
                          <div className="mt-1 text-muted-foreground">
                            Structure {prev.analysis.scores.structure} →{" "}
                            <span className="text-primary">{r.analysis.scores.structure}</span>
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground md:col-span-3 md:text-right">
                        {modeName(r.mode).toUpperCase()} · ATTEMPT {r.attempt}
                        <div className="mt-1">
                          STR {r.analysis.scores.structure} · CLR {r.analysis.scores.clarity} · IMP {r.analysis.scores.impact}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <div className="pt-4">
                  <Link to="/responses" className="text-[13px] text-primary">
                    View all responses →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Changes */}
      <section className="glass p-7">
        <div className="mb-5 flex justify-between">
          <h2 className="text-[22px] font-bold">How your responses are changing</h2>
          <Link to="/progress" className="text-[12px] text-primary">See full progress →</Link>
        </div>
        {rs.length < 2 ? (
          <p className="text-[14px] text-muted-foreground">Complete two responses to see what's changing.</p>
        ) : (
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {stats.slice(0, 5).map((s) => {
              const down = s.trend < 0;
              return (
                <div key={s.d} className="flex items-center gap-4">
                  <div className="w-28 text-[14px]">{cap(s.d)}</div>
                  <div className="font-mono text-[13px]">
                    <span className="text-muted-foreground">{s.early}</span> →{" "}
                    <span className={down ? "text-destructive" : "text-foreground"}>{s.current}</span>
                  </div>
                  <div className={`font-mono text-[12px] ${down ? "text-destructive" : s.trend > 0 ? "text-success" : "text-muted-foreground"}`}>
                    {down ? `↓ ${-s.trend}` : s.trend > 0 ? `↑ ${s.trend}` : "no change"}
                  </div>
                  {down && DECLINE_NOTE[s.d] && (
                    <div className="hidden flex-1 text-[12px] text-muted-foreground lg:block">
                      {DECLINE_NOTE[s.d]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
