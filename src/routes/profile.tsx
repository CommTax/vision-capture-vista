import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHead } from "@/components/app-shell";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Cadence" }, { name: "description", content: "Your goals, experience and plan." }, { property: "og:title", content: "Profile — Cadence" }, { property: "og:description", content: "Manage your Cadence profile." }] }),
  component: () => <AppShell><Profile /></AppShell>,
});

function Profile() {
  const p = useStore((s) => s.profile)!;
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHead eyebrow="Account" title={p.name} />
      <div className="glass divide-y divide-border">
        {[["Email", p.email || "—"], ["Preparing for", p.goal], ["Hardest for you", p.struggle], ["Experience", p.experience], ["Plan", p.plan.toUpperCase()]].map(([l, v]) => (
          <div key={l} className="flex justify-between gap-4 p-5 text-[14px]"><span className="text-muted-foreground">{l}</span><span className="text-right">{v}</span></div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn-ghost" onClick={() => { setState((s) => ({ ...s, profile: s.profile && { ...s.profile, onboarded: false } })); navigate({ to: "/onboarding" }); }}>Redo onboarding</button>
        <Link to="/" hash="pricing" className="btn btn-ghost">Upgrade plan</Link>
        <button className="btn btn-ghost" onClick={() => { localStorage.removeItem("cadence-state-v1"); setState(() => ({ profile: null, responses: [], drillsDone: [], practiceDays: [] })); navigate({ to: "/" }); }}>Sign out & clear data</button>
      </div>
    </div>
  );
}
