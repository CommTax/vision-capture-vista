import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { DIMENSIONS, MODES, PATTERNS, modeName } from "@/lib/data";
import { usePaidDashboard } from "@/lib/paid-dashboard";

export const Route = createFileRoute("/responses/")({
  head: () => ({
    meta: [
      { title: "My Responses — TheUnspoken" },
      { name: "description", content: "Every response you've practiced, with patterns and scores." },
      { property: "og:title", content: "My Responses — TheUnspoken" },
      { property: "og:description", content: "Your response history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell><Responses /></AppShell>,
});

function Responses() {
  // ─── All hooks first, unconditionally ───
  const { reps: rs, loading } = usePaidDashboard();
  const [mode, setMode] = useState("all");
  const [pattern, setPattern] = useState("all");
  const [skill, setSkill] = useState("structure");
  const [range, setRange] = useState("all");

  // ─── Loading guard AFTER hooks ───
  if (loading && rs.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading your responses…
      </div>
    );
  }

  // ─── Now derived values ───
  const cutoff =
    range === "7" ? Date.now() - 7 * 864e5 :
    range === "30" ? Date.now() - 30 * 864e5 :
    0;

  const filtered = rs.filter(
    (r) =>
      (mode === "all" || r.mode === mode) &&
      (pattern === "all" || r.analysis.primary_pattern === pattern) &&
      new Date(r.created_at).getTime() >= cutoff
  );

  const list = filtered;
  const sel = "field !w-auto !py-2 text-[13px]";

  return (
    <>
      <PageHead eyebrow="History" title="My Responses" />

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          className={sel}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="all">All modes</option>
          {MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          className={sel}
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="all">Any date</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>

        <select
          className={sel}
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          {DIMENSIONS.map((d) => (
            <option key={d} value={d}>
              Highlight: {d}
            </option>
          ))}
        </select>

        <select
          className={sel}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        >
          <option value="all">All patterns</option>
          {Object.entries(PATTERNS).map(([k, p]) => (
            <option key={k} value={k}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="glass p-10 text-center text-muted-foreground">
          No responses match.{" "}
          <Link to="/practice" className="text-primary">
            Practice one now.
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((r) => {
            const parent = r.parent_id
              ? rs.find((x) => x.id === r.parent_id)
              : undefined;
            const delta = parent
              ? r.analysis.overall - parent.analysis.overall
              : null;

            return (
              <div key={r.id} className="glass flex flex-col p-6">
                <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span className="text-primary">
                    {modeName(r.mode).toUpperCase()}
                  </span>
                  <span>
                    {new Date(r.created_at).toLocaleDateString()} ·{" "}
                    {r.duration}s · {r.response_type}
                  </span>
                </div>

                <div className="mt-3 font-display text-[18px] font-bold">
                  "{r.question}"
                </div>

                <div className="mt-2 text-[13px] text-muted-foreground">
                  {PATTERNS[r.analysis.primary_pattern]?.name} · Attempt{" "}
                  {r.attempt}
                  {delta !== null && (
                    <span
                      className={
                        delta >= 0 ? "text-success" : "text-destructive"
                      }
                    >
                      {" "}
                      · {delta >= 0 ? "+" : ""}
                      {delta} vs attempt 1
                    </span>
                  )}
                </div>

                <div className="mt-4 flex gap-5 font-mono text-[12px]">
                  {(["structure", "clarity", "impact"] as const).map((d) => (
                    <span
                      key={d}
                      className={
                        skill === d ? "text-primary" : "text-muted-foreground"
                      }
                    >
                      {d.slice(0, 1).toUpperCase() + d.slice(1)}:{" "}
                      <b>{r.analysis.scores[d]}</b>
                    </span>
                  ))}
                  {!["structure", "clarity", "impact"].includes(skill) && (
                    <span className="text-primary">
                      {skill}:{" "}
                      <b>{r.analysis.scores[skill as "structure"]}</b>
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display text-[22px] font-bold">
                    {r.analysis.overall}
                  </span>
                  <Link
                    to="/responses/$responseId"
                    params={{ responseId: r.id }}
                    className="btn btn-ghost btn-sm"
                  >
                    View Analysis
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
