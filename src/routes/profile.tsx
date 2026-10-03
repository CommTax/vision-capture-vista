import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHead } from "@/components/app-shell";
import { setState, STORAGE_KEY, useStore } from "@/lib/store";
import { STATE_LABEL, setMarketingConsent, useEntitlement } from "@/lib/entitlements";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Unspoken" }, { name: "description", content: "Your goals, experience and plan." }, { property: "og:title", content: "Profile — Unspoken" }, { property: "og:description", content: "Manage your Unspoken profile." }] }),
  component: () => <AppShell><Profile /></AppShell>,
});

function Profile() {
  const p = useStore((s) => s.profile)!;
  const navigate = useNavigate();
  const { state } = useEntitlement();
  const mk = useStore((s) => s.marketing);
  const phone = p.phone ? `${p.phone_country_code ?? ""} ${p.phone}`.trim() : undefined;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHead eyebrow="Account" title={p.name} />
      <div className="glass divide-y divide-border">
        {[["Email", p.email || "—"], ["Preparing for", p.goal], ["Hardest for you", p.struggle], ["Experience", p.experience], ["Phone", phone || "—"], ["Plan", STATE_LABEL[state]]].map(([l, v]) => (
          <div key={l} className="flex justify-between gap-4 p-5 text-[14px]"><span className="text-muted-foreground">{l}</span><span className="text-right">{v}</span></div>
        ))}
      </div>
      <label className="glass mt-4 flex cursor-pointer items-center gap-3 p-5 text-[14px]"><input type="checkbox" checked={!!mk?.consent && !mk.unsubscribed} onChange={(e) => setMarketingConsent(e.target.checked)} />Send me Unspoken tips, product updates, and offers by email.</label>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn-ghost" onClick={() => { setState((s) => ({ ...s, profile: s.profile && { ...s.profile, onboarded: false } })); navigate({ to: "/onboarding" }); }}>Redo onboarding</button>
        <Link to="/plans" className="btn btn-ghost">Plans</Link>
        <button className="btn btn-ghost" onClick={() => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("cadence-state-v1"); setState(() => ({ profile: null, responses: [], drillsDone: [], practiceDays: [] })); navigate({ to: "/" }); }}>Sign out & clear data</button>
      </div>
    </div>
  );
}
